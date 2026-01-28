// contracts/NbcMultiRewardStaking.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NbcMultiRewardStaking
 * @notice 支持质押 NBC 原生代币，获得多种奖励代币的质押合约
 * @dev 改进版本：包含安全性增强、批量操作、质押限制等功能
 */
contract NbcMultiRewardStaking is Ownable, ReentrancyGuard, Pausable {
    // ============ Constants ============
    
    /// @notice 最大奖励率（防止设置异常高的奖励率）
    uint256 public constant MAX_REWARD_RATE = 1e30; // 1e30 wei/秒
    
    /// @notice 最小奖励率（防止精度丢失导致 rewardRate 为 0）
    uint256 public constant MIN_REWARD_RATE = 1; // 1 wei/秒
    
    // ============ State Variables ============
    
    struct RewardPool {
        IERC20 rewardToken;
        uint256 totalStaked;
        uint256 rewardRate;
        uint256 periodFinish;
        uint256 rewardsDuration;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
        bool active;
    }
    
    struct UserStake {
        uint256 amount;
        uint256 rewardPerTokenPaid;
        uint256 rewards;
        uint256 stakedAt;  // 首次质押时间戳（全部提取后会重置）
    }
    
    mapping(uint256 => RewardPool) public pools;
    mapping(uint256 => mapping(address => UserStake)) public userStakes;
    mapping(uint256 => uint256) public minStakeAmount;  // 单次质押的最小值（0 = 无限制）
    mapping(uint256 => uint256) public maxStakeAmount;  // 单个用户的总质押量上限（0 = 无限制）
    mapping(uint256 => uint256) public maxTotalStaked;  // 整个池的 TVL 上限，所有用户的总和（0 = 无限制）
    
    uint256 public poolLength;
    
    // ============ Events ============
    
    event PoolAdded(uint256 indexed poolIndex, address indexed rewardToken, uint256 rewardRate, uint256 rewardsDuration);
    event Staked(uint256 indexed poolIndex, address indexed user, uint256 amount);
    event Withdrawn(uint256 indexed poolIndex, address indexed user, uint256 amount);
    event RewardPaid(uint256 indexed poolIndex, address indexed user, uint256 reward);
    event RewardAdded(uint256 indexed poolIndex, uint256 reward);
    event RewardsDurationUpdated(uint256 indexed poolIndex, uint256 newDuration);
    event PoolToggled(uint256 indexed poolIndex, bool active);
    event RewardRateUpdated(uint256 indexed poolIndex, uint256 newRewardRate);
    event StakeLimitsUpdated(uint256 indexed poolIndex, uint256 minAmount, uint256 maxAmount);
    event MaxTotalStakedUpdated(uint256 indexed poolIndex, uint256 maxTotalStaked);
    event EmergencyWithdrawStake(uint256 indexed poolIndex, address indexed user, uint256 amount);
    event ReceivedEther(address indexed sender, uint256 amount);
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ Internal Functions ============
    
    /**
     * @notice 更新奖励状态（内部函数，可被 modifier 和函数调用）
     * @param poolIndex 池索引
     * @param account 用户地址（address(0) 表示只更新池状态，不更新用户状态）
     */
    function _updateReward(uint256 poolIndex, address account) internal {
        pools[poolIndex].rewardPerTokenStored = rewardPerToken(poolIndex);
        pools[poolIndex].lastUpdateTime = lastTimeRewardApplicable(poolIndex);
        if (account != address(0)) {
            userStakes[poolIndex][account].rewards = earned(poolIndex, account);
            userStakes[poolIndex][account].rewardPerTokenPaid = pools[poolIndex].rewardPerTokenStored;
        }
    }
    
    // ============ Modifiers ============
    
    modifier updateReward(uint256 poolIndex, address account) {
        _updateReward(poolIndex, account);
        _;
    }
    
    modifier validPool(uint256 poolIndex) {
        require(poolIndex < poolLength, "Pool does not exist");
        require(pools[poolIndex].active, "Pool is not active");
        _;
    }
    
    // ============ View Functions ============
    
    function lastTimeRewardApplicable(uint256 poolIndex) public view returns (uint256) {
        uint256 finish = pools[poolIndex].periodFinish;
        return block.timestamp < finish ? block.timestamp : finish;
    }
    
    function rewardPerToken(uint256 poolIndex) public view returns (uint256) {
        if (pools[poolIndex].totalStaked == 0) {
            return pools[poolIndex].rewardPerTokenStored;
        }
        uint256 time = lastTimeRewardApplicable(poolIndex);
        uint256 timeDiff = time - pools[poolIndex].lastUpdateTime;
        return pools[poolIndex].rewardPerTokenStored + (timeDiff * pools[poolIndex].rewardRate * 1e18) / pools[poolIndex].totalStaked;
    }
    
    function earned(uint256 poolIndex, address account) public view returns (uint256) {
        uint256 userAmount = userStakes[poolIndex][account].amount;
        uint256 rewardPerTokenPaid = userStakes[poolIndex][account].rewardPerTokenPaid;
        uint256 newReward = (userAmount * (rewardPerToken(poolIndex) - rewardPerTokenPaid)) / 1e18;
        return newReward + userStakes[poolIndex][account].rewards;
    }
    
    function balanceOf(uint256 poolIndex, address account) external view returns (uint256) {
        return userStakes[poolIndex][account].amount;
    }
    
    /**
     * @notice 获取用户的质押开始时间戳
     * @param poolIndex 池索引
     * @param account 用户地址
     * @return 质押开始时间戳（0 表示未质押）
     */
    function getStakedAt(uint256 poolIndex, address account) external view returns (uint256) {
        return userStakes[poolIndex][account].stakedAt;
    }
    
    /**
     * @notice 获取用户已质押的时长（秒）
     * @param poolIndex 池索引
     * @param account 用户地址
     * @return 已质押时长（秒），如果未质押返回 0
     */
    function getStakedDuration(uint256 poolIndex, address account) external view returns (uint256) {
        uint256 stakedAt = userStakes[poolIndex][account].stakedAt;
        if (stakedAt == 0) {
            return 0;
        }
        return block.timestamp - stakedAt;
    }
    
    function totalStaked(uint256 poolIndex) external view returns (uint256) {
        return pools[poolIndex].totalStaked;
    }
    
    function getPoolInfo(uint256 poolIndex)
        external
        view
        returns (
            address rewardToken,
            uint256 totalStakedAmount,
            uint256 rewardRate,
            uint256 periodFinish,
            bool active
        )
    {
        return (
            address(pools[poolIndex].rewardToken),
            pools[poolIndex].totalStaked,
            pools[poolIndex].rewardRate,
            pools[poolIndex].periodFinish,
            pools[poolIndex].active
        );
    }
    
    /**
     * @notice 获取池的限制信息
     * @param poolIndex 池索引
     * @return minStake 最小质押量（单次）
     * @return maxStake 最大质押量（单个用户）
     * @return maxTVL 最大 TVL（池的总质押量上限）
     */
    function getPoolLimits(uint256 poolIndex)
        external
        view
        returns (
            uint256 minStake,
            uint256 maxStake,
            uint256 maxTVL
        )
    {
        return (
            minStakeAmount[poolIndex],
            maxStakeAmount[poolIndex],
            maxTotalStaked[poolIndex]
        );
    }
    
    /**
     * @notice 批量查询用户在所有池中的信息
     * @param user 用户地址
     * @param poolIndices 池索引数组
     * @return stakedAmounts 质押量数组
     * @return rewards 待领取奖励数组
     * @return earnedRewards 已赚取奖励数组（包括待领取）
     * @return stakedAtTimes 质押开始时间数组
     */
    function getUserPoolsInfo(address user, uint256[] calldata poolIndices)
        external
        view
        returns (
            uint256[] memory stakedAmounts,
            uint256[] memory rewards,
            uint256[] memory earnedRewards,
            uint256[] memory stakedAtTimes
        )
    {
        stakedAmounts = new uint256[](poolIndices.length);
        rewards = new uint256[](poolIndices.length);
        earnedRewards = new uint256[](poolIndices.length);
        stakedAtTimes = new uint256[](poolIndices.length);
        
        for (uint256 i = 0; i < poolIndices.length; i++) {
            uint256 poolIndex = poolIndices[i];
            require(poolIndex < poolLength, "Pool does not exist");
            stakedAmounts[i] = userStakes[poolIndex][user].amount;
            rewards[i] = userStakes[poolIndex][user].rewards;
            earnedRewards[i] = earned(poolIndex, user);
            stakedAtTimes[i] = userStakes[poolIndex][user].stakedAt;
        }
    }
    
    // ============ User Functions ============
    
    function stake(uint256 poolIndex)
        external
        payable
        nonReentrant
        whenNotPaused
        validPool(poolIndex)
        updateReward(poolIndex, msg.sender)
    {
        require(msg.value > 0, "Cannot stake 0");
        
        // 检查最小质押量
        if (minStakeAmount[poolIndex] > 0) {
            require(msg.value >= minStakeAmount[poolIndex], "Amount below minimum");
        }
        
        // 检查最大质押量（单个用户）
        if (maxStakeAmount[poolIndex] > 0) {
            require(
                userStakes[poolIndex][msg.sender].amount + msg.value <= maxStakeAmount[poolIndex],
                "Amount exceeds maximum"
            );
        }
        
        // 检查 TVL 上限（池的总质押量）
        if (maxTotalStaked[poolIndex] > 0) {
            require(
                pools[poolIndex].totalStaked + msg.value <= maxTotalStaked[poolIndex],
                "Pool TVL limit exceeded"
            );
        }
        
        pools[poolIndex].totalStaked += msg.value;
        
        // 只在首次质押（或全部提取后重新质押）时记录时间
        if (userStakes[poolIndex][msg.sender].stakedAt == 0) {
            userStakes[poolIndex][msg.sender].stakedAt = block.timestamp;
        }
        
        userStakes[poolIndex][msg.sender].amount += msg.value;
        emit Staked(poolIndex, msg.sender, msg.value);
    }
    
    function withdraw(uint256 poolIndex, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        validPool(poolIndex)
        updateReward(poolIndex, msg.sender)
    {
        require(amount > 0, "Cannot withdraw 0");
        require(userStakes[poolIndex][msg.sender].amount >= amount, "Insufficient balance");
        
        pools[poolIndex].totalStaked -= amount;
        userStakes[poolIndex][msg.sender].amount -= amount;
        
        // 如果全部提取，清零质押时间
        if (userStakes[poolIndex][msg.sender].amount == 0) {
            userStakes[poolIndex][msg.sender].stakedAt = 0;
        }
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(poolIndex, msg.sender, amount);
    }
    
    function getReward(uint256 poolIndex)
        external
        nonReentrant
        whenNotPaused
        validPool(poolIndex)
        updateReward(poolIndex, msg.sender)
    {
        uint256 reward = userStakes[poolIndex][msg.sender].rewards;
        if (reward > 0) {
            userStakes[poolIndex][msg.sender].rewards = 0;
            pools[poolIndex].rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(poolIndex, msg.sender, reward);
        }
    }
    
    /**
     * @notice 批量提取多个池的奖励
     * @param poolIndices 池索引数组
     */
    function getRewardBatch(uint256[] calldata poolIndices) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        for (uint256 i = 0; i < poolIndices.length; i++) {
            uint256 poolIndex = poolIndices[i];
            require(poolIndex < poolLength, "Pool does not exist");
            require(pools[poolIndex].active, "Pool is not active");
            
            // 使用内部函数更新奖励状态
            _updateReward(poolIndex, msg.sender);
            
            uint256 reward = userStakes[poolIndex][msg.sender].rewards;
            if (reward > 0) {
                userStakes[poolIndex][msg.sender].rewards = 0;
                pools[poolIndex].rewardToken.transfer(msg.sender, reward);
                emit RewardPaid(poolIndex, msg.sender, reward);
            }
        }
    }
    
    /**
     * @notice 退出部分质押并提取奖励
     * @param poolIndex 池索引
     * @param amount 提取的质押数量
     */
    function exit(uint256 poolIndex, uint256 amount) 
        external 
        nonReentrant
        whenNotPaused
        validPool(poolIndex)
        updateReward(poolIndex, msg.sender)
    {
        require(amount > 0, "Cannot withdraw 0");
        require(userStakes[poolIndex][msg.sender].amount >= amount, "Insufficient balance");
        
        pools[poolIndex].totalStaked -= amount;
        userStakes[poolIndex][msg.sender].amount -= amount;
        
        // 如果全部提取，清零质押时间
        if (userStakes[poolIndex][msg.sender].amount == 0) {
            userStakes[poolIndex][msg.sender].stakedAt = 0;
        }
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit Withdrawn(poolIndex, msg.sender, amount);
        
        uint256 reward = userStakes[poolIndex][msg.sender].rewards;
        if (reward > 0) {
            userStakes[poolIndex][msg.sender].rewards = 0;
            pools[poolIndex].rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(poolIndex, msg.sender, reward);
        }
    }
    
    /**
     * @notice 退出所有质押并提取所有奖励
     * @param poolIndex 池索引
     */
    function exitAll(uint256 poolIndex) 
        external 
        nonReentrant
        whenNotPaused
        validPool(poolIndex)
        updateReward(poolIndex, msg.sender)
    {
        uint256 amount = userStakes[poolIndex][msg.sender].amount;
        require(amount > 0, "No stake to exit");
        
        pools[poolIndex].totalStaked -= amount;
        userStakes[poolIndex][msg.sender].amount = 0;
        userStakes[poolIndex][msg.sender].stakedAt = 0;  // 全部提取，清零质押时间
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit Withdrawn(poolIndex, msg.sender, amount);
        
        uint256 reward = userStakes[poolIndex][msg.sender].rewards;
        if (reward > 0) {
            userStakes[poolIndex][msg.sender].rewards = 0;
            pools[poolIndex].rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(poolIndex, msg.sender, reward);
        }
    }
    
    // ============ Owner Functions ============
    
    function addPool(
        address rewardToken,
        uint256 rewardRate,
        uint256 rewardsDuration
    ) external onlyOwner {
        require(rewardToken != address(0), "Invalid reward token");
        require(rewardsDuration > 0, "Invalid duration");
        require(rewardRate <= MAX_REWARD_RATE, "Reward rate too high");
        
        uint256 index = poolLength;
        pools[index] = RewardPool({
            rewardToken: IERC20(rewardToken),
            totalStaked: 0,
            rewardRate: rewardRate,
            periodFinish: 0,
            rewardsDuration: rewardsDuration,
            lastUpdateTime: block.timestamp,
            rewardPerTokenStored: 0,
            active: true
        });
        poolLength++;
        emit PoolAdded(index, rewardToken, rewardRate, rewardsDuration);
    }
    
    function notifyRewardAmount(uint256 poolIndex, uint256 reward)
        external
        onlyOwner
        updateReward(poolIndex, address(0))
    {
        require(poolIndex < poolLength, "Pool does not exist");
        require(pools[poolIndex].rewardToken.transferFrom(msg.sender, address(this), reward), "Transfer failed");
        
        uint256 newRewardRate;
        if (block.timestamp >= pools[poolIndex].periodFinish) {
            newRewardRate = reward / pools[poolIndex].rewardsDuration;
        } else {
            uint256 remaining = pools[poolIndex].periodFinish - block.timestamp;
            uint256 leftover = remaining * pools[poolIndex].rewardRate;
            newRewardRate = (reward + leftover) / pools[poolIndex].rewardsDuration;
        }
        
        // 检查奖励率限制
        require(newRewardRate <= MAX_REWARD_RATE, "Reward rate too high");
        
        // 如果奖励大于 0 但计算出的 rewardRate 为 0，设置为最小值
        if (newRewardRate == 0 && reward > 0) {
            newRewardRate = MIN_REWARD_RATE;
        }
        
        pools[poolIndex].rewardRate = newRewardRate;
        pools[poolIndex].lastUpdateTime = block.timestamp;
        pools[poolIndex].periodFinish = block.timestamp + pools[poolIndex].rewardsDuration;
        
        emit RewardAdded(poolIndex, reward);
    }
    
    /**
     * @notice 设置奖励率（不重置奖励期）
     * @param poolIndex 池索引
     * @param newRewardRate 新的奖励率（wei/秒）
     */
    function setRewardRate(uint256 poolIndex, uint256 newRewardRate) 
        external 
        onlyOwner 
        updateReward(poolIndex, address(0))
    {
        require(poolIndex < poolLength, "Pool does not exist");
        require(newRewardRate <= MAX_REWARD_RATE, "Reward rate too high");
        
        pools[poolIndex].rewardRate = newRewardRate;
        // 不修改 periodFinish，保持奖励期不变
        
        emit RewardRateUpdated(poolIndex, newRewardRate);
    }
    
    function setRewardsDuration(uint256 poolIndex, uint256 rewardsDuration)
        external
        onlyOwner
        updateReward(poolIndex, address(0))
    {
        require(poolIndex < poolLength, "Pool does not exist");
        require(block.timestamp > pools[poolIndex].periodFinish, "Previous period not complete");
        require(rewardsDuration > 0, "Invalid duration");
        
        pools[poolIndex].rewardsDuration = rewardsDuration;
        emit RewardsDurationUpdated(poolIndex, rewardsDuration);
    }
    
    function setPoolActive(uint256 poolIndex, bool active) external onlyOwner {
        require(poolIndex < poolLength, "Pool does not exist");
        pools[poolIndex].active = active;
        emit PoolToggled(poolIndex, active);
    }
    
    /**
     * @notice 设置池的质押限制
     * @param poolIndex 池索引
     * @param minAmount 最小质押量（0 = 无限制）
     * @param maxAmount 最大质押量（0 = 无限制）
     */
    function setStakeLimits(
        uint256 poolIndex, 
        uint256 minAmount, 
        uint256 maxAmount
    ) external onlyOwner {
        require(poolIndex < poolLength, "Pool does not exist");
        if (maxAmount > 0) {
            require(maxAmount >= minAmount, "Max must be >= min");
        }
        
        minStakeAmount[poolIndex] = minAmount;
        maxStakeAmount[poolIndex] = maxAmount;
        
        emit StakeLimitsUpdated(poolIndex, minAmount, maxAmount);
    }
    
    /**
     * @notice 设置池的 TVL 上限（总锁定价值上限）
     * @param poolIndex 池索引
     * @param maxTVL 最大 TVL（0 = 无限制）
     * @dev 当池的总质押量达到上限时，新用户无法继续质押
     * @dev 已质押的用户可以继续提取，但无法增加质押量
     */
    function setMaxTotalStaked(uint256 poolIndex, uint256 maxTVL) external onlyOwner {
        require(poolIndex < poolLength, "Pool does not exist");
        
        // 如果设置新的上限，必须大于等于当前总质押量
        if (maxTVL > 0) {
            require(
                pools[poolIndex].totalStaked <= maxTVL,
                "Current TVL exceeds new limit"
            );
        }
        
        maxTotalStaked[poolIndex] = maxTVL;
        emit MaxTotalStakedUpdated(poolIndex, maxTVL);
    }
    
    /**
     * @notice 紧急提取奖励代币（Owner 专用）
     * @param poolIndex 池索引
     * @param amount 提取数量
     */
    function emergencyWithdrawReward(uint256 poolIndex, uint256 amount) external onlyOwner {
        require(poolIndex < poolLength, "Pool does not exist");
        
        uint256 balance = pools[poolIndex].rewardToken.balanceOf(address(this));
        require(balance >= amount, "Insufficient contract balance");
        
        pools[poolIndex].rewardToken.transfer(owner(), amount);
    }
    
    /**
     * @notice 紧急提取用户质押的 NBC（Owner 专用，需谨慎使用）
     * @dev 用于处理用户丢失私钥等极端情况
     * @param poolIndex 池索引
     * @param user 用户地址
     * @param amount 提取数量
     */
    function emergencyWithdrawStake(
        uint256 poolIndex, 
        address user, 
        uint256 amount
    ) external onlyOwner {
        require(poolIndex < poolLength, "Pool does not exist");
        require(userStakes[poolIndex][user].amount >= amount, "Insufficient balance");
        
        pools[poolIndex].totalStaked -= amount;
        userStakes[poolIndex][user].amount -= amount;
        // 清除奖励，防止滥用
        userStakes[poolIndex][user].rewards = 0;
        
        // 如果全部提取，清零质押时间
        if (userStakes[poolIndex][user].amount == 0) {
            userStakes[poolIndex][user].stakedAt = 0;
        }
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit EmergencyWithdrawStake(poolIndex, user, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Receive Functions ============
    
    /**
     * @notice 接收 ETH/NBC（记录事件，防止误操作）
     */
    receive() external payable {
        emit ReceivedEther(msg.sender, msg.value);
        // 注意：直接发送到合约的 ETH 不会自动质押到任何池
        // 用户必须使用 stake() 函数指定池索引
    }
    
    fallback() external payable {
        revert("Use stake() function to deposit");
    }
}

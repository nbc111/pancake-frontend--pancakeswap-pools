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
 */
contract NbcMultiRewardStaking is Ownable, ReentrancyGuard, Pausable {
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
    }
    
    mapping(uint256 => RewardPool) public pools;
    mapping(uint256 => mapping(address => UserStake)) public userStakes;
    uint256 public poolLength;
    
    event PoolAdded(uint256 indexed poolIndex, address indexed rewardToken, uint256 rewardRate, uint256 rewardsDuration);
    event Staked(uint256 indexed poolIndex, address indexed user, uint256 amount);
    event Withdrawn(uint256 indexed poolIndex, address indexed user, uint256 amount);
    event RewardPaid(uint256 indexed poolIndex, address indexed user, uint256 reward);
    event RewardAdded(uint256 indexed poolIndex, uint256 reward);
    event RewardsDurationUpdated(uint256 indexed poolIndex, uint256 newDuration);
    event PoolToggled(uint256 indexed poolIndex, bool active);
    
    constructor() Ownable(msg.sender) {}
    
    modifier updateReward(uint256 poolIndex, address account) {
        pools[poolIndex].rewardPerTokenStored = rewardPerToken(poolIndex);
        pools[poolIndex].lastUpdateTime = lastTimeRewardApplicable(poolIndex);
        if (account != address(0)) {
            userStakes[poolIndex][account].rewards = earned(poolIndex, account);
            userStakes[poolIndex][account].rewardPerTokenPaid = pools[poolIndex].rewardPerTokenStored;
        }
        _;
    }
    
    modifier validPool(uint256 poolIndex) {
        require(poolIndex < poolLength, "Pool does not exist");
        require(pools[poolIndex].active, "Pool is not active");
        _;
    }
    
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
    
    function stake(uint256 poolIndex)
        external
        payable
        nonReentrant
        whenNotPaused
        validPool(poolIndex)
        updateReward(poolIndex, msg.sender)
    {
        require(msg.value > 0, "Cannot stake 0");
        pools[poolIndex].totalStaked += msg.value;
        userStakes[poolIndex][msg.sender].amount += msg.value;
        emit Staked(poolIndex, msg.sender, msg.value);
    }
    
    function withdraw(uint256 poolIndex, uint256 amount)
        external
        nonReentrant
        validPool(poolIndex)
        updateReward(poolIndex, msg.sender)
    {
        require(amount > 0, "Cannot withdraw 0");
        require(userStakes[poolIndex][msg.sender].amount >= amount, "Insufficient balance");
        pools[poolIndex].totalStaked -= amount;
        userStakes[poolIndex][msg.sender].amount -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit Withdrawn(poolIndex, msg.sender, amount);
    }
    
    function getReward(uint256 poolIndex)
        external
        nonReentrant
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
    
    function exit(uint256 poolIndex, uint256 amount) 
        external 
        nonReentrant
        validPool(poolIndex)
        updateReward(poolIndex, msg.sender)
    {
        require(amount > 0, "Cannot withdraw 0");
        require(userStakes[poolIndex][msg.sender].amount >= amount, "Insufficient balance");
        pools[poolIndex].totalStaked -= amount;
        userStakes[poolIndex][msg.sender].amount -= amount;
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
        if (block.timestamp >= pools[poolIndex].periodFinish) {
            pools[poolIndex].rewardRate = reward / pools[poolIndex].rewardsDuration;
        } else {
            uint256 remaining = pools[poolIndex].periodFinish - block.timestamp;
            uint256 leftover = remaining * pools[poolIndex].rewardRate;
            pools[poolIndex].rewardRate = (reward + leftover) / pools[poolIndex].rewardsDuration;
        }
        pools[poolIndex].lastUpdateTime = block.timestamp;
        pools[poolIndex].periodFinish = block.timestamp + pools[poolIndex].rewardsDuration;
        emit RewardAdded(poolIndex, reward);
    }
    
    function setRewardsDuration(uint256 poolIndex, uint256 rewardsDuration)
        external
        onlyOwner
        updateReward(poolIndex, address(0))
    {
        require(poolIndex < poolLength, "Pool does not exist");
        require(block.timestamp > pools[poolIndex].periodFinish, "Previous period not complete");
        pools[poolIndex].rewardsDuration = rewardsDuration;
        emit RewardsDurationUpdated(poolIndex, rewardsDuration);
    }
    
    function setPoolActive(uint256 poolIndex, bool active) external onlyOwner {
        require(poolIndex < poolLength, "Pool does not exist");
        pools[poolIndex].active = active;
        emit PoolToggled(poolIndex, active);
    }
    
    function emergencyWithdrawReward(uint256 poolIndex, uint256 amount) external onlyOwner {
        require(poolIndex < poolLength, "Pool does not exist");
        pools[poolIndex].rewardToken.transfer(owner(), amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    receive() external payable {}
    
    fallback() external payable {
        revert("Use stake() function to deposit");
    }
}


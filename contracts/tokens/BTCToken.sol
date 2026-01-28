// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BTCToken
 * @notice Bitcoin Token - Wrapped Bitcoin on NBC Chain
 * @dev ERC20 token with 8 decimals (matching Bitcoin's native precision)
 * @notice 已部署实例地址（仅供参考）: 0xb225C29Da2CaB86991b7e0651c63f0fD5C16613C
 * @notice 此合约可用于部署新的 BTC 代币实例，每次部署会生成新的合约地址
 */
contract BTCToken is ERC20, Ownable {
    uint8 private constant _decimals = 8;

    /**
     * @param initialSupply 初始供应量（satoshi 单位，8 位精度）
     * @param owner 合约所有者地址
     */
    constructor(
        uint256 initialSupply,
        address owner
    ) ERC20("Bitcoin", "BTC") Ownable(owner) {
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
    }

    /**
     * @dev 返回代币精度
     */
    function decimals() public pure virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev 铸造代币（仅所有者）
     * @param to 接收地址
     * @param amount 数量（satoshi 单位，8 位精度）
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev 销毁代币（仅所有者）
     * @param from 销毁地址
     * @param amount 数量（satoshi 单位，8 位精度）
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

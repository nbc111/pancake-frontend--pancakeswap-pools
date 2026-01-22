// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title USDTToken
 * @notice Tether USD Token - Stablecoin on NBC Chain
 * @dev ERC20 token with 6 decimals (matching USDT's native precision)
 * @notice Contract Address: 0xfd1508502696d0E1910eD850c6236d965cc4db11
 */
contract USDTToken is ERC20, Ownable {
    uint8 private constant _decimals = 6;

    /**
     * @param initialSupply 初始供应量（micro 单位，6 位精度）
     * @param owner 合约所有者地址
     */
    constructor(
        uint256 initialSupply,
        address owner
    ) ERC20("Tether USD", "USDT") Ownable(owner) {
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
     * @param amount 数量（micro 单位，6 位精度）
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev 销毁代币（仅所有者）
     * @param from 销毁地址
     * @param amount 数量（micro 单位，6 位精度）
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

// contracts/tokens/ERC20Token.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC20Token
 * @notice 标准 ERC20 代币合约
 * @dev 可用于创建各种奖励代币（BTC、ETH、SOL 等）
 */
contract ERC20Token is ERC20, Ownable {
    uint8 private _decimals;

    /**
     * @param name 代币名称
     * @param symbol 代币符号
     * @param decimals 代币精度（例如：18 或 8）
     * @param initialSupply 初始供应量（wei 单位）
     * @param owner 合约所有者地址
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) Ownable(owner) {
        _decimals = decimals;
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
    }

    /**
     * @dev 返回代币精度
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev 铸造代币（仅所有者）
     * @param to 接收地址
     * @param amount 数量（wei 单位）
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev 销毁代币（仅所有者）
     * @param from 销毁地址
     * @param amount 数量（wei 单位）
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}


// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {

    address payable public owner;
    address public creator; //state variable

    constructor(
        address _creator,
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) ERC20(_name, _symbol) {
        owner = payable(msg.sender); // the owner is going to be the launchpad memecoin(Factory) since the factory will deploy the token of that smart contract
        creator = _creator;

        // mint functions create new tokens, and we're using the function of ERC20 contract
        _mint(msg.sender, _totalSupply);
    }

}

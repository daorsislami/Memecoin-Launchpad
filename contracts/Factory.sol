// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import { Token } from "./Token.sol";

/// @title This is a factory smart contract, it is used to create new smart contracts
/// @author 
/// @notice 
contract Factory {

    // State variables are a variable inside of a smart contract, it's a placeholder for information that can change but it's a variable
    // inside the contract that you can assign a value to and that value is gonna get stored in the blockchain
    uint256 public immutable fee;
    uint256 immutable totalSupply = 1_000_000 ether;
    uint256 public totalTokens;
    address public owner;

    // We store the address of token and the token object itself here
    mapping(address => TokenSale) public tokenToSale;

    address[] public tokens;

    struct TokenSale {
        address token;
        address creator;
        uint256 sold;
        uint256 raised;
        bool isOpen;
    }

    // indexed mean that we can look it up by the token
    event Created(address indexed token);
    event Buy(address indexed token, uint256 amount);

    constructor(uint256 _fee) {
        fee = _fee;
        owner = msg.sender;
    }

    // Create a new token
    function create(string memory _name, string memory _symbol) external payable {
        // Make sure that the fee is correct amount
        require(msg.value >= fee, "Factory: Creator fee not met.");

        // This is how we deploy a smart contract from another contract(this smart contract Factory)
        // I want to mint 1,000,000 tokens so in order to say I want 1 million tokens instead to type 18 decimals after 1_000_000 I can just say ethers
        Token token = new Token(msg.sender, _name, _symbol, totalSupply); 
        
        // Save the token for later use, so we can fetch it later inside this contract
        tokens.push(address(token));
        totalTokens++;

        // List the token for sale
        TokenSale memory sale = TokenSale(address(token), msg.sender, 0, 0, true);

        // Here we write to the mapping and store to the blockchain by adding data to the mapping
        tokenToSale[address(token)] = sale; 

        // Tell people it's live, we can do that through events
        // Events are basically just a way of finding out that certain thing happened on a block
        emit Created(address(token));
    }


    function buy(address _token, uint256 _amount) external payable {
        TokenSale storage sale = tokenToSale[_token];
        // Check conditions

        // Calculate the price of 1 token based upon total bought
        uint256 cost = getCost(sale.sold);

        uint256 price = cost * (_amount / 10**18);

        // Make sure enough ETH is sent


        // Update the sale
        sale.sold += _amount;
        sale.raised += price; // how much ETH has been raised 

        // Make sure fund raising goal isn't met

        Token(_token).transfer(msg.sender, _amount);

        // Emit an event
        emit Buy(_token, _amount);
    }


    function getTokenSale(uint256 _index) public view returns(TokenSale memory) {
        return tokenToSale[tokens[_index]];
    }


    /// The whole idea of Launchpad is that after a coin gets listed and people start buying it the price actually goes up
    /// that's how pump.fun works that's how this platform works. So whenever someone buys, they're the first person to buy 
    /// they get the cheapest cost, but as more people buy it's going to increase the cost overtime so the second person who buys
    /// is gonna pay more, the third person that buys is gonna pay more, the 4th, the 5th and so on so is going to increase the cost
    /// so this function implements this logic to increase the cost whenever somebody buys the tokens.
    /// This function implements a way to get the new cost of the next tokens
    function getCost(uint256 _sold) public pure returns (uint256) {
        uint256 floor = 0.0001 ether;
        uint256 step = 0.0001 ether;
        uint256 increment = 10000 ether;

        // get the new cost after somebody else buys the tokens 
        uint256 cost = (step * (_sold / increment)) + floor; 
        return cost;
    }
}

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

const FEE = ethers.parseUnits("0.01", 18);

// Hardhat knows magically how to deploy the smart contracts based on these information
module.exports = buildModule("FactoryModule", (m) => {
    // Get parameters
    const fee = m.getParameter("fee", FEE);

    // Define Factory
    const factory = m.contract("Factory", [fee]);
    
    // Return factory
    return { factory };
})

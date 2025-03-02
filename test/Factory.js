
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")
const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("Factory", function () {

    // What FEE does is that its gonna take 0.01 ETH and convert it to the nondecimal value and specify that we want 18 decimal places
    // We're setting FEE for users for 0.01 ETH
    const FEE = ethers.parseUnits("0.01", 18);

    // In order to reduce the duplications and not redeploy the contract for every test case we use the fixture that handles the deployment of the contract
    // and then we return the deployed contract so that we can use it in our tests
    async function deployFactoryFixture() {

        // Fetch accounts
        const [deployer, creator, buyer] = await ethers.getSigners();

        // Fetch the contract
        const FactoryContract = await ethers.getContractFactory("Factory");
        
        // Deploy the contract, deploy is gonna run the contructor function, so we have to pass in the value that we want for fee
        const factory = await FactoryContract.deploy(FEE);

        // Setting up creator, so a creator will connect to our launchped via his account using MM or another wallet and create token
        const transaction = await factory.connect(creator).create("DApp Uni", "DAP", { value: FEE });
        await transaction.wait();

        // Get token address
        const tokenAddress = await factory.tokens(0);
        const token = await ethers.getContractAt("Token", tokenAddress);

        return { factory, token, deployer, creator, buyer};
    }

    async function buyTokenFixture() {
        const { factory, token, creator, buyer } = await deployFactoryFixture();

        const AMOUNT = ethers.parseUnits("10000", 18);
        const COST = ethers.parseUnits("1", 18); // 1 ETH

        // Buy tokens
        const transaction = await factory.connect(buyer).buy(await token.getAddress(), AMOUNT, { value: COST });
        await transaction.wait();

        return { factory, token, creator, buyer };
    }
 
    // We nests the tests by using describe
    describe("Deployment", function() {
        it("Should set the fee", async function() {
            const { factory } = await deployFactoryFixture();
            expect(await factory.fee()).to.equal(FEE)
        });

        it("Should set the owner", async function() {
            const { factory, deployer } = await loadFixture(deployFactoryFixture);
            expect(await factory.owner()).to.equal(deployer.address);
        });
    })


    describe("Creating token", function() {
        it("Should set the owner of the token", async function() {
            const { factory, token } = await loadFixture(deployFactoryFixture);
            expect(await token.owner()).to.equal(await factory.getAddress());
        });

        it("Should set the creator", async function() {
            const { token, creator } = await loadFixture(deployFactoryFixture);
            expect(await token.creator()).to.equal(await creator.getAddress());
        });
        
        it("Should set the supply", async function() {
            const { factory, token } = await loadFixture(deployFactoryFixture);

            const totalSupply = ethers.parseUnits("1000000", 18);

            expect(await token.balanceOf(await factory.getAddress())).to.equal(totalSupply);
        });

        it("Should update the ETH balance", async function() {
            const { factory } = await loadFixture(deployFactoryFixture);
            const balance = await ethers.provider.getBalance(factory.getAddress());
            expect(balance).to.equal(FEE);
        });

        it("Should create the sale", async function() {
            const { factory, token, creator } = await loadFixture(deployFactoryFixture);

            const count = await factory.totalTokens();
            expect(count).to.equal(1);

            const sale = await factory.getTokenSale(0);

            expect(sale.token).to.equal(await token.getAddress());
            expect(sale.creator).to.equal(await creator.address);
            expect(sale.sold).to.equal(0);
            expect(sale.raised).to.equal(0);
            expect(sale.isOpen).to.equal(true);
        });
    })


    describe("Buying", async function() {
        const AMOUNT = ethers.parseUnits("10000", 18);
        const COST = ethers.parseUnits("1", 18); // 1 ETH

        // Check contract received ETH
        it("Should update ETH balance", async function() {
            const { factory } = await loadFixture(buyTokenFixture);
            
            const balance = await ethers.provider.getBalance(await factory.getAddress());

            expect(balance).to.equal(FEE + COST);
        });

        // Check that buyer received tokens
        it("Should update token balances", async function() {
            const { token, buyer } = await loadFixture(buyTokenFixture);

            const balance = await token.balanceOf(buyer.address);

            expect(balance).to.equal(AMOUNT);
        });

        it("Should update token sale", async function() {
            const { factory, token } = await loadFixture(buyTokenFixture);

            const sale = await factory.tokenToSale(await token.getAddress());
            
            expect(sale.sold).to.equal(AMOUNT);
            expect(sale.raised).to.equal(COST);
            expect(sale.isOpen).to.equal(true);
        });
    })
})

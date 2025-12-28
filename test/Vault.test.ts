import { expect } from "chai";
import { ethers } from "hardhat";
import { NexusVault, MockAdapter, ReactiveNexus, MockToken, MLModel, ZKMLVerifier } from "../typechain-types";

describe("Nexus Galaxy Vault Automation", function () {
    let vault: NexusVault;
    let adapterA: MockAdapter;
    let adapterB: MockAdapter;
    let reactiveNexus: ReactiveNexus;
    let mlModel: MLModel;
    let verifier: ZKMLVerifier;
    let token: MockToken;
    let owner: any;
    let user: any;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        // 1. Deploy Mock Token
        const TokenFactory = await ethers.getContractFactory("MockToken");
        token = await TokenFactory.deploy();
        await token.waitForDeployment();

        // 2. Deploy AI & Reactive Components
        const MLFactory = await ethers.getContractFactory("MLModel");
        mlModel = await MLFactory.deploy("model", ethers.ZeroHash);

        const VerifierFactory = await ethers.getContractFactory("ZKMLVerifier");
        verifier = await VerifierFactory.deploy();

        const PriceFeedFactory = await ethers.getContractFactory("MockV3Aggregator");
        const priceFeed = await PriceFeedFactory.deploy(8, 200000000000); // $2000

        const NexusFactory = await ethers.getContractFactory("ReactiveNexus");
        reactiveNexus = await NexusFactory.deploy();
        await reactiveNexus.waitForDeployment();

        // 3. Deploy Vault
        const VaultFactory = await ethers.getContractFactory("NexusVault");
        vault = await VaultFactory.deploy(await token.getAddress());
        await vault.waitForDeployment();

        // Register Vault in ReactiveNexus
        await reactiveNexus.setVault(await vault.getAddress());

        // 4. Deploy Adapters
        const AdapterFactory = await ethers.getContractFactory("MockAdapter");
        adapterA = await AdapterFactory.deploy(await token.getAddress(), 500); // 5% APY
        adapterB = await AdapterFactory.deploy(await token.getAddress(), 1000); // 10% APY
        await adapterA.waitForDeployment();
        await adapterB.waitForDeployment();

        // 5. Add Adapters to Vault
        await vault.addAdapter(await adapterA.getAddress()); // Index 0
        await vault.addAdapter(await adapterB.getAddress()); // Index 1

        // 6. Set Authorization
        await vault.setAuthorization(await reactiveNexus.getAddress(), true);
    });

    it("should allow user deposits", async function () {
        const amount = ethers.parseEther("100");
        await token.mint(user.address, amount);
        await token.connect(user).approve(await vault.getAddress(), amount);

        await vault.connect(user).deposit(amount);

        expect(await vault.totalAssets()).to.equal(amount);
        // Funds should be in the first adapter (adapterA)
        expect(await adapterA.totalAssets()).to.equal(amount);
    });

    it("should allow rebalancing via ReactiveNexus", async function () {
        // Setup: User deposits 100
        const amount = ethers.parseEther("100");
        await token.mint(user.address, amount);
        await token.connect(user).approve(await vault.getAddress(), amount);
        await vault.connect(user).deposit(amount);

        expect(await adapterA.totalAssets()).to.equal(amount);
        expect(await adapterB.totalAssets()).to.equal(0n);

        // Update adapterB yield to be higher than adapterA + threshold
        // adapterA is 500 (5%), threshold is 100 (1%)
        await adapterB.setSupplyRate(1000); // 10%

        // Trigger ReactiveNexus rebalance
        await expect(reactiveNexus.checkYieldAndRebalance(amount))
            .to.emit(reactiveNexus, "ActionExecuted")
            .withArgs("Rebalance Success");

        // Verify funds moved A -> B
        expect(await adapterA.totalAssets()).to.equal(0n);
        expect(await adapterB.totalAssets()).to.equal(amount);
    });
});

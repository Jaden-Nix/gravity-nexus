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
        reactiveNexus = await NexusFactory.deploy(
            await mlModel.getAddress(),
            await verifier.getAddress(),
            await priceFeed.getAddress()
        );
        await reactiveNexus.waitForDeployment();

        // 3. Deploy Vault
        const VaultFactory = await ethers.getContractFactory("NexusVault");
        vault = await VaultFactory.deploy(await token.getAddress(), await reactiveNexus.getAddress());
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
    });

    it("should allow user deposits", async function () {
        const amount = ethers.parseEther("100");
        await token.mint(user.address, amount);
        await token.connect(user).approve(await vault.getAddress(), amount);

        await vault.connect(user).deposit(amount, user.address);

        expect(await vault.totalAssets()).to.equal(amount);
        expect(await vault.balanceOf(user.address)).to.equal(amount);
    });

    it("should rebalance funds when manually triggered by Nexus", async function () {
        // Setup: User deposits 100
        const amount = ethers.parseEther("100");
        await token.mint(user.address, amount);
        await token.connect(user).approve(await vault.getAddress(), amount);
        await vault.connect(user).deposit(amount, user.address);

        // Move funds to Adapter A (Safe) manually first (simulating initial deployment)
        await vault.depositToAdapter(0, amount);

        expect(await adapterA.totalAssets()).to.equal(amount);
        expect(await adapterB.totalAssets()).to.equal(0);

        // Trigger AI Rebalance
        // We simulate a high yield prediction (600 > 500 threshold)
        const proof = ethers.randomBytes(32);
        const input = ethers.toUtf8Bytes("input");
        const output = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [600]);

        // Call submitPrediction
        // The contract hardcodes: rebalance(0, 1, 100 units)
        // 100 * 10**18

        await expect(reactiveNexus.submitPrediction(proof, input, output))
            .to.emit(reactiveNexus, "ActionExecuted")
            .withArgs("Rebalance Success");

        // Verify funds moved A -> B
        // The contract tries to move 100 * 10**18 (full amount in this test case)
        expect(await adapterA.totalAssets()).to.equal(0);
        expect(await adapterB.totalAssets()).to.equal(amount);
    });
});

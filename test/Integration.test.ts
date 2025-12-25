import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";

describe("Nexus Galaxy Integration", function () {
    let remoteHub: any;
    let reactiveNexus: any;
    let mlModel: any;
    let verifier: any;
    let nexusVault: any;
    let adapterA: any;
    let adapterB: any;
    let mockToken: any;
    let owner: any;

    before(async function () {
        [owner] = await ethers.getSigners();

        // 1. Deploy Mock Token
        const MockToken = await ethers.getContractFactory("MockToken");
        mockToken = await MockToken.deploy();
        await mockToken.waitForDeployment();

        // 2. Deploy RemoteHub
        const RemoteHubFactory = await ethers.getContractFactory("RemoteHub");
        remoteHub = await RemoteHubFactory.deploy();
        await remoteHub.waitForDeployment();

        // 3. Deploy AI Components
        const MLModelFactory = await ethers.getContractFactory("MLModel");
        mlModel = await MLModelFactory.deploy("yield-lstm-v1", ethers.keccak256(ethers.toUtf8Bytes("model-weights")));
        await mlModel.waitForDeployment();

        const ZKMLVerifierFactory = await ethers.getContractFactory("ZKMLVerifier");
        verifier = await ZKMLVerifierFactory.deploy();
        await verifier.waitForDeployment();

        // 4. Deploy ReactiveNexus (no constructor args - matches deployed contract)
        const ReactiveNexusFactory = await ethers.getContractFactory("ReactiveNexus");
        reactiveNexus = await ReactiveNexusFactory.deploy();
        await reactiveNexus.waitForDeployment();

        // 5. Deploy NexusVault with mock token as asset
        const NexusVaultFactory = await ethers.getContractFactory("NexusVault");
        nexusVault = await NexusVaultFactory.deploy(await mockToken.getAddress());
        await nexusVault.waitForDeployment();

        // 6. Deploy Mock Adapters
        const AdapterFactory = await ethers.getContractFactory("MockAdapter");
        adapterA = await AdapterFactory.deploy(await mockToken.getAddress(), 500); // 5% APY
        adapterB = await AdapterFactory.deploy(await mockToken.getAddress(), 1000); // 10% APY
        await adapterA.waitForDeployment();
        await adapterB.waitForDeployment();

        // 7. Wire everything together
        await nexusVault.addAdapter(await adapterA.getAddress());
        await nexusVault.addAdapter(await adapterB.getAddress());
        await reactiveNexus.setVault(await nexusVault.getAddress());
        await nexusVault.transferOwnership(await reactiveNexus.getAddress());
    });

    describe("Contract Deployment", function () {
        it("should deploy all contracts successfully", async function () {
            // Check addresses are valid (non-zero)
            expect(await remoteHub.getAddress()).to.not.equal(ethers.ZeroAddress);
            expect(await reactiveNexus.getAddress()).to.not.equal(ethers.ZeroAddress);
            expect(await nexusVault.getAddress()).to.not.equal(ethers.ZeroAddress);
            expect(await mlModel.getAddress()).to.not.equal(ethers.ZeroAddress);
            expect(await verifier.getAddress()).to.not.equal(ethers.ZeroAddress);
        });

        it("should have correct contract relationships", async function () {
            expect(await reactiveNexus.nexusVault()).to.equal(await nexusVault.getAddress());
            // Use BigInt comparison
            expect(await nexusVault.getAdaptersCount()).to.equal(2n);
        });
    });

    describe("RemoteHub Actions", function () {
        it("should revert LEND action when pool is not set", async function () {
            const params = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "uint256"],
                [await mockToken.getAddress(), ethers.parseUnits("100", 18)]
            );

            // Should revert since lending pool is not set
            await expect(remoteHub.executeAction("LEND", params))
                .to.be.revertedWith("RemoteHub: Lending pool not set");
        });

        it("should emit event for unknown actions", async function () {
            await expect(remoteHub.executeAction("UNKNOWN", "0x"))
                .to.emit(remoteHub, "ActionExecuted")
                .withArgs("UNKNOWN", false, "0x");
        });

        it("should recover ERC20 tokens", async function () {
            // Send some tokens to RemoteHub
            const amount = ethers.parseUnits("100", 18);
            await mockToken.mint(await remoteHub.getAddress(), amount);

            const balanceBefore = await mockToken.balanceOf(owner.address);
            await remoteHub.recoverFunds(await mockToken.getAddress(), owner.address);
            const balanceAfter = await mockToken.balanceOf(owner.address);

            expect(balanceAfter - balanceBefore).to.equal(amount);
        });
    });

    describe("ReactiveNexus Yield Monitoring", function () {
        it("should have correct yield threshold", async function () {
            expect(await reactiveNexus.yieldThreshold()).to.equal(100n); // 1% in basis points
        });

        it("should allow owner to update yield threshold", async function () {
            await reactiveNexus.setYieldThreshold(200); // 2%
            expect(await reactiveNexus.yieldThreshold()).to.equal(200n);

            // Reset for other tests
            await reactiveNexus.setYieldThreshold(100);
        });

        it("should trigger rebalance evaluation", async function () {
            // Pool A has 5% (500), Pool B has 10% (1000) - difference is 5% > 1% threshold
            const moveAmount = ethers.parseUnits("10", 18);

            // Will emit "No Rebalance Needed" because there are no assets in adapters yet
            await expect(reactiveNexus.checkYieldAndRebalance(moveAmount))
                .to.emit(reactiveNexus, "ActionExecuted")
                .withArgs("No Rebalance Needed");
        });
    });

    describe("AI Components", function () {
        it("should have correct model info", async function () {
            expect(await mlModel.modelId()).to.equal("yield-lstm-v1");
            expect(await mlModel.modelHash()).to.equal(
                ethers.keccak256(ethers.toUtf8Bytes("model-weights"))
            );
        });

        it("should verify valid proofs", async function () {
            const proof = ethers.randomBytes(32);
            const instances = ethers.toUtf8Bytes("instances");
            const output = ethers.toUtf8Bytes("output");

            expect(await verifier.verify(proof, instances, output)).to.be.true;
        });

        it("should reject proofs that are too short", async function () {
            const shortProof = ethers.randomBytes(16); // < 32 bytes
            const instances = ethers.toUtf8Bytes("instances");
            const output = ethers.toUtf8Bytes("output");

            await expect(verifier.verify(shortProof, instances, output))
                .to.be.revertedWith("Invalid proof length");
        });
    });
});

import pkg from "hardhat";
const { ethers, network } = pkg;
import fs from "fs";

/**
 * Script de déploiement — Architecture modulaire 3 contrats
 *
 * Ordre de déploiement :
 *   1. RoleRegistry    — Gestion des rôles (indépendant)
 *   2. AccidentStorage — Stockage des données (indépendant)
 *   3. AccidentDApp    — Logique métier (dépend des deux précédents)
 *   4. setController   — Autorise AccidentDApp à écrire dans AccidentStorage
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n🚀 Déploiement AcciChain (architecture modulaire) sur : ${network.name}`);
  console.log(`📬 Déployeur : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Solde     : ${ethers.formatEther(balance)} ETH\n`);

  // ── 1. Déploiement de RoleRegistry ────────────────────────────────────────
  console.log("📦 [1/4] Déploiement de RoleRegistry...");
  const RoleRegistry = await ethers.getContractFactory("RoleRegistry");
  const roleRegistry = await RoleRegistry.deploy();
  await roleRegistry.waitForDeployment();
  const roleRegistryAddress = await roleRegistry.getAddress();
  console.log(`   ✅ RoleRegistry    : ${roleRegistryAddress}`);

  // ── 2. Déploiement de AccidentStorage ─────────────────────────────────────
  console.log("📦 [2/4] Déploiement de AccidentStorage...");
  const AccidentStorage = await ethers.getContractFactory("AccidentStorage");
  const accidentStorage = await AccidentStorage.deploy();
  await accidentStorage.waitForDeployment();
  const accidentStorageAddress = await accidentStorage.getAddress();
  console.log(`   ✅ AccidentStorage  : ${accidentStorageAddress}`);

  // ── 3. Déploiement de AccidentDApp ────────────────────────────────────────
  console.log("📦 [3/4] Déploiement de AccidentDApp...");
  const AccidentDApp = await ethers.getContractFactory("AccidentDApp");
  const accidentDApp = await AccidentDApp.deploy(roleRegistryAddress, accidentStorageAddress);
  await accidentDApp.waitForDeployment();
  const accidentDAppAddress = await accidentDApp.getAddress();
  const deployTx = accidentDApp.deploymentTransaction();
  console.log(`   ✅ AccidentDApp     : ${accidentDAppAddress}`);
  console.log(`   📋 TX hash          : ${deployTx?.hash}`);

  // ── 4. Autorisation du contrôleur ─────────────────────────────────────────
  console.log("🔐 [4/4] Autorisation AccidentDApp comme contrôleur de AccidentStorage...");
  const setControllerTx = await accidentStorage.setController(accidentDAppAddress);
  await setControllerTx.wait();
  console.log(`   ✅ Contrôleur défini : ${accidentDAppAddress}\n`);

  // ── Sauvegarde des adresses ────────────────────────────────────────────────
  const deployInfo = {
    network:   network.name,
    chainId:   network.config.chainId ?? 31337,
    deployer:  deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      RoleRegistry:    roleRegistryAddress,
      AccidentStorage: accidentStorageAddress,
      AccidentDApp:    accidentDAppAddress,
    },
    deployTxHash: deployTx?.hash,
  };

  fs.writeFileSync("./deployed-address.json", JSON.stringify(deployInfo, null, 2));
  console.log("📝 Adresses sauvegardées dans deployed-address.json");

  // ── Mise à jour de blockchain.ts ──────────────────────────────────────────
  const blockchainTsPath = "./artifacts/accichain/services/blockchain.ts";
  if (fs.existsSync(blockchainTsPath)) {
    let content = fs.readFileSync(blockchainTsPath, "utf8");

    content = content.replace(
      /export const ROLE_REGISTRY_ADDRESS\s*=\s*"0x[0-9a-fA-F]+";/,
      `export const ROLE_REGISTRY_ADDRESS = "${roleRegistryAddress}";`
    );
    content = content.replace(
      /export const CONTRACT_ADDRESS\s*=\s*"0x[0-9a-fA-F]+";/,
      `export const CONTRACT_ADDRESS = "${accidentDAppAddress}";`
    );

    fs.writeFileSync(blockchainTsPath, content);
    console.log("🔄 Adresses mises à jour dans services/blockchain.ts");
  }

  // ── Sur localhost : enregistrement d'acteurs de test ──────────────────────
  if (network.name === "localhost") {
    console.log("\n🧪 Enregistrement des acteurs de test (localhost)...");
    const signers = await ethers.getSigners();
    const [, driverAcc, expertAcc, insurerAcc] = signers;

    const ROLE_DRIVER  = ethers.keccak256(ethers.toUtf8Bytes("DRIVER"));
    const ROLE_EXPERT  = ethers.keccak256(ethers.toUtf8Bytes("EXPERT"));
    const ROLE_INSURER = ethers.keccak256(ethers.toUtf8Bytes("INSURER"));

    // Chaque compte s'enregistre lui-même dans RoleRegistry (comme MetaMask le ferait)
    await roleRegistry.connect(driverAcc).register(ROLE_DRIVER);
    console.log(`   🧑‍💼 Conducteur enregistré  : ${driverAcc.address}`);

    await roleRegistry.connect(expertAcc).register(ROLE_EXPERT);
    console.log(`   🔬 Expert enregistré      : ${expertAcc.address}`);

    await roleRegistry.connect(insurerAcc).register(ROLE_INSURER);
    console.log(`   🏢 Assureur enregistré    : ${insurerAcc.address}`);

    console.log("\n📋 Comptes Hardhat de test :");
    console.log(`   Conducteur  (compte #1) : ${driverAcc.address}`);
    console.log(`   Expert      (compte #2) : ${expertAcc.address}`);
    console.log(`   Assureur    (compte #3) : ${insurerAcc.address}`);
    console.log("\n   Importez ces clés privées dans MetaMask :");
    console.log("   Voir : npx hardhat node (les clés s'affichent au démarrage)");
  }

  if (network.name === "sepolia") {
    console.log(`\n🔍 Vérifier sur Etherscan Sepolia :`);
    console.log(`   npx hardhat verify --network sepolia ${roleRegistryAddress}`);
    console.log(`   npx hardhat verify --network sepolia ${accidentStorageAddress}`);
    console.log(`   npx hardhat verify --network sepolia ${accidentDAppAddress} "${roleRegistryAddress}" "${accidentStorageAddress}"`);
  }

  console.log("\n✅ Déploiement modulaire terminé.\n");
  console.log("📌 Résumé des adresses :");
  console.log(`   RoleRegistry    : ${roleRegistryAddress}`);
  console.log(`   AccidentStorage : ${accidentStorageAddress}`);
  console.log(`   AccidentDApp    : ${accidentDAppAddress}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/**
 * Script : Pré-enregistrer des adresses MetaMask avec un rôle (pour les tests)
 *
 * Dans la DApp, chaque utilisateur s'enregistre lui-même via MetaMask (register()).
 * Ce script permet à l'owner du contrat d'enregistrer des adresses de test depuis Hardhat.
 *
 * Usage :
 *   pnpm exec hardhat run scripts/assign-roles.js --network localhost
 *
 * Modifiez les adresses ci-dessous avec vos vrais comptes MetaMask.
 */

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";

// ─── CONFIGUREZ ICI VOS ADRESSES METAMASK ────────────────────────────────────
const ROLES = {
  drivers: [
    // "0xED89E14ff40c4352D0e75Ae4C944c5BC168975b5", // Conducteur
  ],
  experts: [
    // "0x5532F69D15A1b15d3BEC02D29c8cE32E3DFe142f", // Expert
  ],
  insurers: [
    // "0xd5F6a6802B9F005Cbc6bba9522876a9cf512435D", // Assureur
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const [owner] = await ethers.getSigners();
  console.log(`\n👤 Owner (deployer): ${owner.address}`);

  // Charger l'adresse du contrat déployé depuis la racine du projet
  const deployedFile = "./deployed-address.json";
  if (!fs.existsSync(deployedFile)) {
    throw new Error(
      "Contrat non déployé. Lancez d'abord :\n  pnpm exec hardhat run scripts/deploy-accident.js --network localhost"
    );
  }

  const { address: contractAddress } = JSON.parse(fs.readFileSync(deployedFile, "utf8"));
  console.log(`📋 Contrat : ${contractAddress}\n`);

  // ABI minimal — uniquement register() et les lectures de rôle
  const abi = [
    "function register(bytes32 role)",
    "function getRole(address actor) view returns (bytes32)",
    "function isActive(address actor) view returns (bool)",
  ];

  const ROLE_DRIVER  = ethers.keccak256(ethers.toUtf8Bytes("DRIVER"));
  const ROLE_EXPERT  = ethers.keccak256(ethers.toUtf8Bytes("EXPERT"));
  const ROLE_INSURER = ethers.keccak256(ethers.toUtf8Bytes("INSURER"));

  // L'owner enregistre chaque adresse en signant avec son propre compte
  // (en production, les utilisateurs s'enregistrent eux-mêmes via MetaMask)
  for (const addr of ROLES.drivers) {
    try {
      const signer   = await ethers.getImpersonatedSigner(addr);
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await contract.register(ROLE_DRIVER);
      await tx.wait();
      console.log(`✅ DRIVER   : ${addr}`);
    } catch (e) {
      console.log(`⚠️  DRIVER   : ${addr} — ${e.message.split("(")[0].trim()}`);
    }
  }

  for (const addr of ROLES.experts) {
    try {
      const signer   = await ethers.getImpersonatedSigner(addr);
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await contract.register(ROLE_EXPERT);
      await tx.wait();
      console.log(`✅ EXPERT   : ${addr}`);
    } catch (e) {
      console.log(`⚠️  EXPERT   : ${addr} — ${e.message.split("(")[0].trim()}`);
    }
  }

  for (const addr of ROLES.insurers) {
    try {
      const signer   = await ethers.getImpersonatedSigner(addr);
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await contract.register(ROLE_INSURER);
      await tx.wait();
      console.log(`✅ INSURER  : ${addr}`);
    } catch (e) {
      console.log(`⚠️  INSURER  : ${addr} — ${e.message.split("(")[0].trim()}`);
    }
  }

  console.log("\n✅ Enregistrement terminé.\n");
  console.log("Note : en production, chaque utilisateur s'enregistre lui-même");
  console.log("       en se connectant via MetaMask dans l'application.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });

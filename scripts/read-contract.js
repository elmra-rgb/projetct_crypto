/**
 * Lit l'état complet des contrats AcciChain depuis la blockchain.
 * Compatible avec l'architecture modulaire : RoleRegistry + AccidentStorage + AccidentDApp
 *
 * Usage :
 *   npx hardhat run scripts/read-contract.js --network localhost
 */

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";

const STATUS_LABELS = {
  0: "Declared     🟡",
  1: "Verification 🔵",
  2: "Expertise    🟠",
  3: "Validated    ✅",
  4: "Rejected     ❌",
  5: "Closed       🔒",
};

const ROLE_NAMES = {
  [ethers.keccak256(ethers.toUtf8Bytes("DRIVER"))]:  "CONDUCTEUR",
  [ethers.keccak256(ethers.toUtf8Bytes("EXPERT"))]:  "EXPERT",
  [ethers.keccak256(ethers.toUtf8Bytes("INSURER"))]: "ASSUREUR",
};

async function main() {
  // ── Charger les adresses depuis deployed-address.json ────────────────────
  const deployedFile = "./deployed-address.json";
  if (!fs.existsSync(deployedFile)) {
    throw new Error("deployed-address.json introuvable. Déployez d'abord les contrats.");
  }

  const deployed = JSON.parse(fs.readFileSync(deployedFile, "utf8"));
  const dappAddress     = deployed.contracts?.AccidentDApp  ?? deployed.address;
  const registryAddress = deployed.contracts?.RoleRegistry  ?? deployed.address;
  const storageAddress  = deployed.contracts?.AccidentStorage;

  const dapp     = await ethers.getContractAt("AccidentDApp",     dappAddress);
  const registry = await ethers.getContractAt("RoleRegistry",     registryAddress);

  const signers = await ethers.getSigners();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  AcciChain — Lecture de la blockchain");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Réseau          : ${deployed.network} (chainId ${deployed.chainId})`);
  console.log(`  RoleRegistry    : ${registryAddress}`);
  if (storageAddress) console.log(`  AccidentStorage : ${storageAddress}`);
  console.log(`  AccidentDApp    : ${dappAddress}`);
  console.log(`  Déployé le      : ${new Date(deployed.timestamp).toLocaleString("fr-FR")}\n`);

  // ── Rôles des comptes Hardhat ─────────────────────────────────────────────
  console.log("👤 RÔLES ENREGISTRÉS (5 premiers comptes Hardhat)");
  console.log("─────────────────────────────────────────────────");
  for (let i = 0; i < Math.min(signers.length, 5); i++) {
    const addr   = signers[i].address;
    const role   = await registry.getRole(addr);
    const active = await registry.isActive(addr);
    const name   = ROLE_NAMES[role] ?? "aucun rôle";
    const status = active ? "✅ actif" : "⛔ révoqué";
    console.log(`  [${i}] ${addr.slice(0,10)}...${addr.slice(-6)}  →  ${name.padEnd(12)} ${active ? status : status}`);
  }

  // ── Dossiers d'accidents ──────────────────────────────────────────────────
  const total = await dapp.getAccidentCount();
  console.log(`\n🚗 DOSSIERS D'ACCIDENT ON-CHAIN : ${total.toString()}`);
  console.log("─────────────────────────────────────────────────");

  if (Number(total) === 0) {
    console.log("  (aucun accident déclaré)\n");
    return;
  }

  for (let i = 1; i <= Number(total); i++) {
    const a      = await dapp.getAccident(i);
    const status = Number(a.status);
    const date   = new Date(Number(a.timestamp) * 1000).toLocaleString("fr-FR");

    console.log(`\n  ── ACC-00${i} (ID ${i}) ────────────────────────────`);
    console.log(`  Statut        : ${STATUS_LABELS[status] ?? status}`);
    console.log(`  Lieu          : ${a.location}`);
    console.log(`  Date          : ${date}`);
    console.log(`  Conducteur    : ${a.driver}`);
    console.log(`  Expert        : ${a.expert  === ethers.ZeroAddress ? "(non assigné)" : a.expert}`);
    console.log(`  Assureur      : ${a.insurer === ethers.ZeroAddress ? "(non impliqué)" : a.insurer}`);
    console.log(`  evidenceHash  : ${a.evidenceHash ? a.evidenceHash.slice(0, 16) + "..." : "(vide)"}`);
    console.log(`  evidenceCID   : ${a.evidenceCID  || "(vide)"}`);
    console.log(`  reportHash    : ${a.reportHash   ? a.reportHash.slice(0, 16)   + "..." : "(vide)"}`);
    console.log(`  reportCID     : ${a.reportCID    || "(vide)"}`);
    console.log(`  Signé (cond.) : ${a.driverSigned ? "✅" : "❌"}   Signé (expert) : ${a.expertSigned ? "✅" : "❌"}`);

    // Alerte sur les dossiers bloqués
    if (status === 0 && a.expert === ethers.ZeroAddress) {
      console.log(`  ⚠️  BLOQUÉ — Aucun expert assigné. Lancez : fix-assign-expert.js`);
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((e) => {
  console.error("\n❌ Erreur :", e.message ?? e);
  process.exit(1);
});

/**
 * Script de déblocage — Assigne un expert à un dossier bloqué en statut Declared
 *
 * Cas d'usage : un dossier est resté en Declared sans passer à Verification
 *               car aucun expert n'a été assigné (ni par l'assureur, ni en auto-assign).
 *
 * Ce script joue le rôle de l'expert qui s'auto-assigne (assignSelf).
 * Il utilise le compte Hardhat #2 (expert enregistré lors du déploiement).
 *
 * Usage :
 *   npx hardhat run scripts/fix-assign-expert.js --network localhost
 *
 * Pour cibler un dossier précis, modifiez ACCIDENT_ID ci-dessous.
 */

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";

// ─── CONFIGURER ICI ────────────────────────────────────────────────────────────
const ACCIDENT_ID = 1; // ID du dossier bloqué (ACC-001 → ID 1)
// ──────────────────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  0: "Declared",
  1: "Verification",
  2: "Expertise",
  3: "Validated",
  4: "Rejected",
  5: "Closed",
};

async function main() {
  // ── Charger les adresses des contrats ────────────────────────────────────
  const deployedFile = "./deployed-address.json";
  if (!fs.existsSync(deployedFile)) {
    throw new Error("deployed-address.json introuvable. Déployez d'abord les contrats.");
  }

  const deployed = JSON.parse(fs.readFileSync(deployedFile, "utf8"));

  // Support des deux formats : ancien (address) et nouveau (contracts.AccidentDApp)
  const dappAddress     = deployed.contracts?.AccidentDApp  ?? deployed.address;
  const registryAddress = deployed.contracts?.RoleRegistry  ?? deployed.address;

  if (!dappAddress) throw new Error("Adresse AccidentDApp introuvable dans deployed-address.json");

  const signers = await ethers.getSigners();
  const [owner, driverAcc, expertAcc, insurerAcc] = signers;

  const ROLE_EXPERT  = ethers.keccak256(ethers.toUtf8Bytes("EXPERT"));
  const ROLE_INSURER = ethers.keccak256(ethers.toUtf8Bytes("INSURER"));

  // ── Contrats ──────────────────────────────────────────────────────────────
  const dapp     = await ethers.getContractAt("AccidentDApp",  dappAddress);
  const registry = await ethers.getContractAt("RoleRegistry",  registryAddress);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  AcciChain — Déblocage dossier bloqué");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`  AccidentDApp  : ${dappAddress}`);
  console.log(`  RoleRegistry  : ${registryAddress}`);
  console.log(`  Dossier ciblé : ACC-00${ACCIDENT_ID} (ID ${ACCIDENT_ID})\n`);

  // ── 1. Vérifier l'état actuel du dossier ─────────────────────────────────
  const total = await dapp.getAccidentCount();
  if (ACCIDENT_ID > Number(total)) {
    throw new Error(`Le dossier #${ACCIDENT_ID} n'existe pas. Total : ${total}`);
  }

  const accident = await dapp.getAccident(ACCIDENT_ID);
  const statusNum = Number(accident.status);
  console.log(`📋 État actuel :`);
  console.log(`   Statut     : ${STATUS_LABELS[statusNum]} (${statusNum})`);
  console.log(`   Conducteur : ${accident.driver}`);
  console.log(`   Expert     : ${accident.expert === ethers.ZeroAddress ? "(aucun)" : accident.expert}`);
  console.log(`   Lieu       : ${accident.location}\n`);

  // ── 2. Vérifier que le dossier est bien bloqué en Declared ───────────────
  if (statusNum !== 0) {
    console.log(`⚠️  Le dossier est en statut "${STATUS_LABELS[statusNum]}" — pas bloqué en Declared.`);
    console.log(`   Aucune action nécessaire.\n`);
    return;
  }

  // ── 3. Vérifier si l'expert (compte #2) est enregistré ───────────────────
  const expertIsRegistered = await registry.hasRole(expertAcc.address, ROLE_EXPERT);
  const insurerIsRegistered = await registry.hasRole(insurerAcc.address, ROLE_INSURER);

  console.log(`🔍 Vérification des rôles :`);
  console.log(`   Expert  (compte #2) : ${expertAcc.address}`);
  console.log(`   Enregistré comme EXPERT : ${expertIsRegistered ? "✅ oui" : "❌ non"}`);
  console.log(`   Assureur (compte #3) : ${insurerAcc.address}`);
  console.log(`   Enregistré comme INSURER : ${insurerIsRegistered ? "✅ oui" : "❌ non"}\n`);

  // ── 4. Enregistrer l'expert s'il ne l'est pas encore ─────────────────────
  if (!expertIsRegistered) {
    console.log(`📝 Enregistrement du compte #2 comme EXPERT...`);
    const regTx = await registry.connect(expertAcc).register(ROLE_EXPERT);
    await regTx.wait();
    console.log(`   ✅ Expert enregistré : ${expertAcc.address}\n`);
  }

  // ── 5. Débloquer via assignSelf (l'expert se prend le dossier) ───────────
  console.log(`🔧 Déblocage : assignSelf(${ACCIDENT_ID}) depuis le compte expert...`);
  const tx = await dapp.connect(expertAcc).assignSelf(ACCIDENT_ID);
  const receipt = await tx.wait();
  console.log(`   ✅ Transaction confirmée : ${tx.hash}`);
  console.log(`   ⛽ Gas utilisé           : ${receipt.gasUsed.toString()}\n`);

  // ── 6. Vérifier le nouvel état ────────────────────────────────────────────
  const updated = await dapp.getAccident(ACCIDENT_ID);
  const newStatus = Number(updated.status);
  console.log(`📋 Nouvel état du dossier ACC-00${ACCIDENT_ID} :`);
  console.log(`   Statut  : ${STATUS_LABELS[newStatus]} (${newStatus})`);
  console.log(`   Expert  : ${updated.expert}`);

  if (newStatus === 1) {
    console.log(`\n✅ Dossier débloqué avec succès !`);
    console.log(`   L'expert peut maintenant soumettre son rapport via submitReport(${ACCIDENT_ID}, ...).\n`);
  } else {
    console.log(`\n⚠️  Le statut n'a pas changé — vérifiez les erreurs ci-dessus.\n`);
  }
}

main().catch((e) => {
  console.error("\n❌ Erreur :", e.message ?? e);
  process.exit(1);
});

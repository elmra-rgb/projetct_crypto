/**
 * Script de nettoyage complet — à exécuter APRÈS chaque redémarrage de Hardhat
 *
 * Ce script :
 *   1. Vérifie combien d'accidents existent réellement on-chain
 *   2. Affiche les adresses des contrats déployés
 *   3. Rappelle les étapes de reset côté navigateur
 *
 * Usage :
 *   npx hardhat run scripts/reset-local-state.js --network localhost
 */

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";

async function main() {
  const deployedFile = "./deployed-address.json";
  if (!fs.existsSync(deployedFile)) {
    console.log("❌ Pas de deployed-address.json — relancez deploy-accident.js d'abord.");
    return;
  }

  const deployed = JSON.parse(fs.readFileSync(deployedFile, "utf8"));
  const dappAddr     = deployed.contracts?.AccidentDApp  ?? deployed.address;
  const registryAddr = deployed.contracts?.RoleRegistry  ?? deployed.address;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  AcciChain — Diagnostic état blockchain");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`  Réseau          : ${deployed.network}`);
  console.log(`  RoleRegistry    : ${registryAddr}`);
  console.log(`  AccidentDApp    : ${dappAddr}`);
  console.log(`  Déployé le      : ${new Date(deployed.timestamp).toLocaleString("fr-FR")}\n`);

  try {
    const dapp = await ethers.getContractAt("AccidentDApp", dappAddr);
    const total = await dapp.getAccidentCount();
    console.log(`  Accidents on-chain : ${total.toString()}`);

    if (Number(total) === 0) {
      console.log(`\n  ⚠️  BLOCKCHAIN VIDE — aucun accident enregistré.`);
      console.log(`  Les dossiers dans l'app sont des données locales orphelines.`);
    } else {
      console.log(`  ✅ ${total} accident(s) trouvé(s) on-chain.\n`);
      for (let i = 1; i <= Number(total); i++) {
        const a = await dapp.getAccident(i);
        console.log(`  #${i} → statut: ${a.status}, driver: ${a.driver.slice(0,10)}..., expert: ${a.expert.slice(0,10)}...`);
      }
    }
  } catch (e) {
    console.log(`  ❌ Impossible de lire le contrat : ${e.message}`);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ÉTAPES DE RESET APRÈS REDÉMARRAGE HARDHAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. npx hardhat run scripts/deploy-accident.js --network localhost

  2. MetaMask → Paramètres → Avancé → Réinitialiser le compte

  3. Dans le navigateur (F12 → Console) :
       localStorage.clear(); location.reload();

  4. Reconnectez-vous avec votre rôle dans l'app

  5. Re-déclarez l'accident depuis l'écran conducteur
`);
}

main().catch((e) => { console.error(e); process.exit(1); });

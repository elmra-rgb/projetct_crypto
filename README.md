# AcciChain - Application de Gestion des Accidents Automobiles au Maroc

Ce dépôt contient l'intégralité du projet AcciChain, une solution de gestion de constats d'accidents sécurisée par la blockchain Ethereum.

## 📋 Prérequis

- **Node.js** (v18+)
- **pnpm** (installable via `npm install -g pnpm`)
- **MetaMask** (pour l'authentification Web3 sur l'application mobile)

## 🚀 Installation

Dans le dossier racine du projet :
```bash
pnpm install
```

## 🛠️ Lancer l'Application (4 Étapes)

Pour que l'écosystème complet fonctionne (Blockchain + API + Mobile), suivez ces étapes dans des terminaux séparés :

### 1. Démarrer la Blockchain Locale (Hardhat)
```bash
pnpm exec hardhat node
```

### 2. Déployer le Smart Contract
Dans un nouveau terminal :
```bash
pnpm exec hardhat run scripts/deploy-accident.js --network localhost
```

### 3. Lancer le Serveur Backend (API Bridge)
Dans un nouveau terminal :
```bash
cd backend
node server.js
```

### 4. Lancer l'Application Mobile (Expo)
Dans un nouveau terminal :
```bash
cd artifacts/accichain
pnpm exec expo start
```
*Appuyez sur **`w`** pour lancer la version Web, ou scannez le QR code avec l'application **Expo Go** (Android/iOS).*


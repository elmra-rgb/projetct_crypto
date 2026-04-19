# AcciChain — Gestion des Accidents Automobiles sur Blockchain

AcciChain est une DApp de gestion de constats d'accidents automobiles sécurisée par la blockchain Ethereum. Chaque étape du cycle de vie d'un dossier (déclaration, expertise, validation) est ancrée on-chain via MetaMask.

> **Architecture DApp pure** — aucun backend centralisé. Toutes les transactions sont signées directement par l'utilisateur via MetaMask. Les photos et rapports sont stockés sur IPFS via Pinata.

## Prérequis

- **Node.js** v18+
- **pnpm** — `npm install -g pnpm`
- **MetaMask** — extension navigateur pour l'authentification Web3

## Installation

```bash
pnpm install
```

## Configuration IPFS (optionnel)

Pour activer l'upload des photos sur IPFS, créez `artifacts/accichain/.env` :

```env
EXPO_PUBLIC_PINATA_JWT=votre_clé_jwt_pinata
```

Sans cette clé, les déclarations blockchain fonctionnent normalement, sans upload IPFS.

## Lancer l'application

Trois terminaux sont nécessaires.

### 1. Blockchain locale (Hardhat)

```bash
pnpm exec hardhat node
```

Les clés privées des comptes de test s'affichent au démarrage — importez-les dans MetaMask.

### 2. Déployer les smart contracts

```bash
pnpm exec hardhat run scripts/deploy-accident.js --network localhost
```

Les adresses sont sauvegardées dans `deployed-address.json` et mises à jour automatiquement dans `artifacts/accichain/services/blockchain.ts`.

### 3. Lancer l'application Expo

```bash
cd artifacts/accichain
pnpm exec expo start
```

Appuyez sur **`w`** pour la version web, ou scannez le QR code avec **Expo Go** (Android/iOS).

## Rôles et actions

| Rôle | Actions |
|---|---|
| **Conducteur** | Déclarer un accident, signer le constat, suivre son dossier |
| **Expert** | Prendre en charge un dossier, soumettre un rapport d'expertise |
| **Assureur** | Assigner des experts, valider ou rejeter les dossiers |

Chaque utilisateur s'enregistre lui-même sur la blockchain au premier login via MetaMask.

## Cycle de vie d'un dossier

```
declare → en_expertise → rapport_soumis → valide / refuse
```

1. **Conducteur** déclare l'accident → photos hashées SHA-256 + ancrage on-chain
2. **Assureur** assigne un expert (ou l'expert se prend en charge lui-même) → transaction MetaMask
3. **Expert** soumet son rapport → hash + CID IPFS ancré on-chain
4. **Assureur** valide ou rejette → transaction MetaMask

## Comptes de test (Hardhat localhost)

Trois comptes sont pré-enregistrés automatiquement au déploiement :

| Compte | Rôle |
|---|---|
| Compte #1 | Conducteur |
| Compte #2 | Expert |
| Compte #3 | Assureur |

Importez leurs clés privées dans MetaMask (affichées par `pnpm exec hardhat node`).

## Reset complet

Pour repartir de zéro (effacer tous les dossiers) :

```bash
# 1. Redéployer les contrats
pnpm exec hardhat run scripts/deploy-accident.js --network localhost

# 2. Vider le cache navigateur (console F12)
localStorage.clear(); location.reload();

# 3. Réinitialiser MetaMask
# Paramètres → Avancé → Réinitialiser le compte (pour chaque compte)
```

## Structure du projet

```
projetct_crypto/
├── contracts/
│   ├── AccidentDApp.sol        # Logique métier + orchestration
│   ├── AccidentStorage.sol     # Stockage des dossiers
│   └── RoleRegistry.sol        # Gestion des rôles
├── scripts/
│   ├── deploy-accident.js      # Déploiement + pré-enregistrement des comptes
│   └── assign-roles.js         # Assignation manuelle de rôles
├── artifacts/
│   └── accichain/              # Application Expo (React Native Web)
│       ├── app/
│       │   ├── (conducteur)/   # Écrans conducteur
│       │   ├── (expert)/       # Écrans expert
│       │   └── (assureur)/     # Écrans assureur
│       ├── context/AppContext.tsx
│       └── services/blockchain.ts  # ethers.js + Pinata IPFS
├── deployed-address.json       # Adresses des contrats déployés
└── hardhat.config.js
```

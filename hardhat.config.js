import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Réseau local pour le développement
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Sepolia Testnet — réseau public Ethereum de test
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
  },
  paths: {
    contracts: "./contracts",
    scripts:   "./scripts",
    artifacts: "./blockchain-artifacts",
  },
  etherscan: {
    // Pour vérifier le contrat sur Etherscan Sepolia
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

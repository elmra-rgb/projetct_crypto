/**
 * AcciChain — Service Blockchain + IPFS
 *
 * Architecture modulaire : 2 contrats exposés au frontend
 *   - RoleRegistry  → register(), getRole(), isActive()
 *   - AccidentDApp  → toutes les fonctions métier + lectures
 *
 * DApp pure — aucun backend.
 * - Blockchain : ethers.js BrowserProvider → MetaMask → Smart Contracts
 * - IPFS       : Pinata API appelée directement depuis le frontend
 */

import { ethers } from "ethers";

// ─── Adresses des contrats déployés ──────────────────────────────────────────
// Mises à jour automatiquement par deploy-accident.js après chaque déploiement

export const ROLE_REGISTRY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// ─── ABI : RoleRegistry ──────────────────────────────────────────────────────
const ROLE_REGISTRY_ABI = [
  // Auto-enregistrement (msg.sender = wallet MetaMask connecté)
  "function register(bytes32 role)",

  // Lecture des rôles
  "function getRole(address actor) view returns (bytes32)",
  "function isActive(address actor) view returns (bool)",
  "function hasRole(address actor, bytes32 role) view returns (bool)",

  // Administration
  "function revokeRole(address actor)",

  // Constantes de rôles
  "function ROLE_DRIVER() view returns (bytes32)",
  "function ROLE_EXPERT() view returns (bytes32)",
  "function ROLE_INSURER() view returns (bytes32)",

  // Événements
  "event RoleRegistered(address indexed actor, bytes32 indexed role)",
  "event RoleRevoked(address indexed actor)",
];

// ─── ABI : AccidentDApp (logique métier + lectures déléguées) ─────────────────
const ACCIDENT_DAPP_ABI = [
  // Déclaration d'accident
  "function declareAccident(string evidenceHash, string evidenceCID, string location) returns(uint256)",

  // Gestion de l'expert
  "function assignExpert(uint256 id, address expert)",
  "function assignSelf(uint256 id)",

  // Rapport d'expertise
  "function submitReport(uint256 id, string reportHash, string reportCID)",

  // Validation / Rejet
  "function validateAccident(uint256 id)",
  "function rejectAccident(uint256 id, string reason)",

  // Lecture (délégation vers AccidentStorage)
  "function getAccident(uint256 id) view returns(tuple(uint256 id, address driver, address expert, address insurer, string evidenceHash, string evidenceCID, string reportHash, string reportCID, string location, uint256 timestamp, uint8 status, bool driverSigned, bool expertSigned))",
  "function getAccidentStatus(uint256 id) view returns(uint8)",
  "function getAccidentCount() view returns(uint256)",

  // Références aux sous-contrats
  "function roleRegistry() view returns (address)",
  "function accidentStorage() view returns (address)",

  // Événements
  "event AccidentDeclared(uint256 indexed id, address indexed driver, string evidenceHash, string evidenceCID, uint256 timestamp)",
  "event ExpertAssigned(uint256 indexed id, address indexed expert, address indexed insurer)",
  "event ReportSubmitted(uint256 indexed id, address indexed expert, string reportHash, string reportCID)",
  "event AccidentValidated(uint256 indexed id, address indexed insurer)",
  "event AccidentRejected(uint256 indexed id, address indexed insurer, string reason)",
];

// ─── Constantes de rôles (keccak256 côté frontend — miroir des constantes Solidity) ──
export const ROLE_DRIVER  = ethers.keccak256(ethers.toUtf8Bytes("DRIVER"));
export const ROLE_EXPERT  = ethers.keccak256(ethers.toUtf8Bytes("EXPERT"));
export const ROLE_INSURER = ethers.keccak256(ethers.toUtf8Bytes("INSURER"));

// ─── Normalisation des erreurs blockchain ────────────────────────────────────

/**
 * Transforme une erreur ethers/MetaMask en message lisible.
 * Détecte les reverts Solidity courants et les traduit en français.
 *
 * Les erreurs "accident not found" indiquent un désync AsyncStorage/blockchain
 * (ex: Hardhat redémarré). Le message suggère de rafraîchir les données.
 */
export function parseBlockchainError(e: any): string {
  const raw: string =
    e?.reason ??
    e?.data?.message ??
    e?.error?.data?.message ??
    e?.message ??
    String(e);

  // Reverts Solidity — messages lisibles
  if (raw.includes("accident not found"))
    return "Dossier introuvable sur la blockchain. Les données locales sont désynchronisées — rafraîchissez la liste.";
  if (raw.includes("unauthorized role") || raw.includes("not owner"))
    return "Vous n'avez pas les droits nécessaires pour cette action.";
  if (raw.includes("invalid status"))
    return "Action impossible : le statut du dossier ne permet pas cette opération.";
  if (raw.includes("not the assigned expert"))
    return "Vous n'êtes pas l'expert assigné à ce dossier.";
  if (raw.includes("deja enregistre"))
    return "Ce wallet est déjà enregistré avec un rôle.";
  if (raw.includes("already assigned") || raw.includes("deja assigne"))
    return "Un expert est déjà assigné à ce dossier.";

  // Erreurs réseau MetaMask
  if (raw.includes("user rejected") || raw.includes("User denied"))
    return "Transaction annulée par l'utilisateur.";
  if (raw.includes("insufficient funds"))
    return "Fonds insuffisants pour payer les frais de transaction.";
  if (raw.includes("too many errors") || raw.includes("could not detect network"))
    return "Nœud blockchain inaccessible. Vérifiez que Hardhat tourne sur le port 8545.";

  // Fallback
  return raw.length > 120 ? raw.slice(0, 120) + "…" : raw;
}

// ─── Provider / Signer MetaMask ──────────────────────────────────────────────

function requireEthereum(): any {
  const ethereum = (window as any).ethereum;
  if (!ethereum?.isMetaMask) {
    throw new Error("MetaMask non installé. Installez l'extension MetaMask pour utiliser AcciChain.");
  }
  return ethereum;
}

/** Retourne un signer MetaMask (ouvre popup si pas encore connecté) */
export async function getMetaMaskSigner(): Promise<ethers.Signer> {
  const ethereum = requireEthereum();
  await ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(ethereum);
  return provider.getSigner();
}

// ─── Factories de contrats ───────────────────────────────────────────────────

/** RoleRegistry en écriture — signé par MetaMask */
async function getRoleRegistryWrite(): Promise<ethers.Contract> {
  const signer = await getMetaMaskSigner();
  return new ethers.Contract(ROLE_REGISTRY_ADDRESS, ROLE_REGISTRY_ABI, signer);
}

/** RoleRegistry en lecture seule */
async function getRoleRegistryRead(): Promise<ethers.Contract> {
  const ethereum = requireEthereum();
  const provider = new ethers.BrowserProvider(ethereum);
  return new ethers.Contract(ROLE_REGISTRY_ADDRESS, ROLE_REGISTRY_ABI, provider);
}

/** AccidentDApp en écriture — signé par MetaMask */
async function getAccidentDAppWrite(): Promise<ethers.Contract> {
  const signer = await getMetaMaskSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, ACCIDENT_DAPP_ABI, signer);
}

/** AccidentDApp en lecture seule */
async function getAccidentDAppRead(): Promise<ethers.Contract> {
  const ethereum = requireEthereum();
  const provider = new ethers.BrowserProvider(ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, ACCIDENT_DAPP_ABI, provider);
}

// ─── IPFS via Pinata (appel direct depuis le frontend) ───────────────────────

/**
 * Upload un fichier vers IPFS via Pinata directement depuis le frontend.
 * La clé JWT est stockée dans EXPO_PUBLIC_PINATA_JWT (.env).
 * Si la clé n'est pas définie, retourne null (IPFS désactivé).
 */
export async function uploadToIPFS(
  fileUri: string,
  filename: string,
  mimeType: string
): Promise<{ cid: string; sha256: string } | null> {
  const PINATA_JWT = process.env.EXPO_PUBLIC_PINATA_JWT;
  console.log("[IPFS] JWT présent :", !!PINATA_JWT, "| longueur :", PINATA_JWT?.length ?? 0);
  if (!PINATA_JWT) {
    console.warn("[IPFS] EXPO_PUBLIC_PINATA_JWT non défini — IPFS désactivé");
    return null;
  }

  // 1. Convertir l'URI en blob
  let blob: Blob;
  if (fileUri.startsWith("data:")) {
    const [header, base64] = fileUri.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || mimeType;
    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    blob = new Blob([bytes], { type: mime });
  } else {
    const response = await fetch(fileUri);
    blob = await response.blob();
  }

  // 2. Calculer le hash SHA-256 du fichier
  const buffer  = await blob.arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buffer);
  const sha256  = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 3. Upload vers Pinata
  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("pinataMetadata", JSON.stringify({ name: `accichain-${filename}` }));

  const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method:  "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body:    formData,
  });

  console.log("[IPFS] Réponse Pinata :", pinataRes.status, pinataRes.statusText);
  if (!pinataRes.ok) {
    const errBody = await pinataRes.text();
    console.error("[IPFS] Erreur Pinata :", errBody);
    throw new Error(`Pinata ${pinataRes.status}: ${errBody}`);
  }

  const data = await pinataRes.json();
  return { cid: data.IpfsHash, sha256 };
}

/**
 * Calcule uniquement le hash SHA-256 d'un texte (pour les rapports sans photo).
 */
export async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer  = encoder.encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Auto-enregistrement via RoleRegistry ────────────────────────────────────

/**
 * L'utilisateur s'enregistre lui-même avec son wallet MetaMask dans RoleRegistry.
 * msg.sender dans le contrat = l'adresse MetaMask connectée.
 *
 * @param role "conducteur" | "expert" | "assureur"
 */
export async function registerSelf(
  role: "conducteur" | "expert" | "assureur"
): Promise<string> {
  const roleHash =
    role === "conducteur" ? ROLE_DRIVER  :
    role === "expert"     ? ROLE_EXPERT  :
                            ROLE_INSURER;

  const contract = await getRoleRegistryWrite();
  const tx = await contract.register(roleHash);
  await tx.wait();
  return tx.hash;
}

// ─── Signature du message (étape "Signature" du formulaire) ──────────────────

/**
 * Signature ECDSA réelle via MetaMask.
 * Prouve que le conducteur a lu et approuvé la déclaration.
 * @returns Signature hexadécimale (132 chars)
 */
export async function signDeclarationData(
  location: string,
  description: string
): Promise<string> {
  const signer    = await getMetaMaskSigner();
  const address   = await signer.getAddress();
  const timestamp = Math.floor(Date.now() / 1000);

  const message =
    `AcciChain — Déclaration d'accident\n` +
    `Signataire : ${address}\n` +
    `Lieu : ${location}\n` +
    `Description : ${description.slice(0, 100)}\n` +
    `Timestamp : ${timestamp}`;

  return signer.signMessage(message);
}

// ─── Déclaration d'accident ──────────────────────────────────────────────────

/**
 * Le conducteur déclare un accident directement sur AccidentDApp.
 * MetaMask ouvre une popup — le conducteur signe avec sa propre clé privée.
 */
export async function declareAccident(
  evidenceHash: string,
  evidenceCID: string,
  location: string
): Promise<{ tx: string; accidentId: string }> {
  const contract = await getAccidentDAppWrite();
  const tx       = await contract.declareAccident(evidenceHash, evidenceCID, location);
  const receipt  = await tx.wait();

  // Extraire l'ID depuis l'événement AccidentDeclared
  let accidentId = "0";
  for (const log of (receipt?.logs ?? [])) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "AccidentDeclared") {
        accidentId = parsed.args.id.toString();
        break;
      }
    } catch {}
  }

  return { tx: tx.hash, accidentId };
}

// ─── Assignation de l'expert ─────────────────────────────────────────────────

/**
 * L'assureur assigne un expert depuis son wallet MetaMask.
 * La vérification de rôle se fait on-chain dans AccidentDApp.
 */
export async function assignExpert(
  accidentId: number | string,
  expertAddress: string
): Promise<string> {
  const contract = await getAccidentDAppWrite();
  const tx       = await contract.assignExpert(accidentId, expertAddress);
  await tx.wait();
  return tx.hash;
}

/**
 * Un expert s'auto-assigne sur un dossier déclaré.
 */
export async function assignSelf(accidentId: number | string): Promise<string> {
  const contract = await getAccidentDAppWrite();
  const tx       = await contract.assignSelf(accidentId);
  await tx.wait();
  return tx.hash;
}

// ─── Rapport de l'expert ─────────────────────────────────────────────────────

/**
 * L'expert soumet son rapport directement via MetaMask.
 */
export async function submitReport(
  accidentId: number,
  reportHash: string,
  reportCID: string
): Promise<string> {
  const contract = await getAccidentDAppWrite();
  const tx       = await contract.submitReport(accidentId, reportHash, reportCID);
  await tx.wait();
  return tx.hash;
}

// ─── Validation / Rejet (assureur) ───────────────────────────────────────────

/**
 * L'assureur valide un dossier directement via MetaMask.
 */
export async function validateAccident(accidentId: number | string): Promise<string> {
  const contract = await getAccidentDAppWrite();
  const tx       = await contract.validateAccident(accidentId);
  await tx.wait();
  return tx.hash;
}

/**
 * L'assureur rejette un dossier directement via MetaMask.
 */
export async function rejectAccident(
  accidentId: number | string,
  reason: string
): Promise<string> {
  const contract = await getAccidentDAppWrite();
  const tx       = await contract.rejectAccident(accidentId, reason);
  await tx.wait();
  return tx.hash;
}

// ─── Lecture directe blockchain ───────────────────────────────────────────────

/**
 * Lit tous les accidents depuis AccidentDApp (qui délègue à AccidentStorage).
 * Aucun backend — lecture directe blockchain.
 */
export async function getAllAccidents(): Promise<any[]> {
  const contract = await getAccidentDAppRead();
  const total    = await contract.getAccidentCount();
  const accidents: any[] = [];

  for (let i = 1; i <= Number(total); i++) {
    try {
      const a = await contract.getAccident(i);
      accidents.push({
        id:           a.id.toString(),
        location:     a.location,
        timestamp:    a.timestamp.toString(),
        evidenceHash: a.evidenceHash,
        evidenceCID:  a.evidenceCID,
        reportHash:   a.reportHash,
        reportCID:    a.reportCID,
        driver:       a.driver,
        expert:       a.expert,
        insurer:      a.insurer,
        status:       a.status.toString(),
        driverSigned: a.driverSigned,
        expertSigned: a.expertSigned,
      });
    } catch {}
  }

  return accidents;
}

/**
 * Vérifie le rôle d'une adresse directement sur RoleRegistry.
 */
export async function getRoleFromBlockchain(
  address: string
): Promise<{ role: string; isActive: boolean }> {
  const contract = await getRoleRegistryRead();
  const [role, active] = await Promise.all([
    contract.getRole(address),
    contract.isActive(address),
  ]);

  let roleName = "none";
  if (role === ROLE_DRIVER)  roleName = "driver";
  if (role === ROLE_EXPERT)  roleName = "expert";
  if (role === ROLE_INSURER) roleName = "insurer";

  return { role: roleName, isActive: active };
}

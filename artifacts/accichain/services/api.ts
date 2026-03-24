/**
 * AcciChain ↔ Backend API Service
 *
 * Connects to the backend created by the colleague (youness-lahdiri01/accident-dapp).
 * The backend is a Node.js/Express server that hashes photos via SHA-256
 * and stores the evidence on-chain via the AccidentContract Solidity contract.
 *
 * Default base URL: http://localhost:3000  (can override via BASE_URL env var)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Change this to your machine's LAN IP when running on a real device
// e.g. "http://192.168.1.14:3000"
export const BACKEND_URL = "http://localhost:3001";

/** Generic fetch wrapper with timeout and error handling */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Délai d'attente dépassé — vérifiez que le backend est démarré.");
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterResponse {
  message: string;
  tx: string;
}

export interface DeclareResponse {
  message: string;
  tx: string;
}

export interface UploadResponse {
  message: string;
  /** SHA-256 hash of the uploaded photo */
  hash: string;
  /** Ethereum transaction hash */
  tx: string;
}

export interface BlockchainAccident {
  id: string;
  location: string;
  timestamp: string;
  evidenceHash: string;
  driver: string;
  expert: string;
  status: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Registration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registers a wallet address as a Conductor (Driver) on the smart contract.
 * Calls: POST /register-driver
 */
export async function registerDriver(address: string): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/register-driver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
}

/**
 * Registers a wallet address as an Expert on the smart contract.
 * Calls: POST /register-expert
 */
export async function registerExpert(address: string): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/register-expert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Accident Declaration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Uploads a photo to the backend which:
 *   1. Hashes the image with SHA-256
 *   2. Calls AccidentContract.declareAccident(location, hash) on-chain
 *   3. Returns the hash and the Ethereum TX hash
 *
 * Calls: POST /upload-accident  (multipart/form-data)
 */
export async function uploadAccidentPhoto(
  photoUri: string,
  location: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("location", location);

  // React Native / Expo: append file from local URI
  const filename = photoUri.split("/").pop() || "photo.jpg";
  const extension = filename.split(".").pop()?.toLowerCase() || "jpg";
  const mimeType = extension === "png" ? "image/png" : "image/jpeg";

  formData.append("photo", {
    uri: photoUri,
    name: filename,
    type: mimeType,
  } as any);

  return apiFetch<UploadResponse>("/upload-accident", {
    method: "POST",
    body: formData,
    // Note: do NOT set Content-Type header — fetch sets it automatically with boundary for FormData
  });
}

/**
 * Declares an accident manually with a pre-computed evidence hash.
 * Useful when the hash was computed locally or no photo is available.
 *
 * Calls: POST /declare-accident
 */
export async function declareAccident(
  location: string,
  hash: string
): Promise<DeclareResponse> {
  return apiFetch<DeclareResponse>("/declare-accident", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location, hash }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Read from Blockchain
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches accident data directly from the blockchain via the backend.
 * Calls: GET /accident/:id
 */
export async function getAccidentFromChain(id: string | number): Promise<BlockchainAccident> {
  return apiFetch<BlockchainAccident>(`/accident/${id}`);
}

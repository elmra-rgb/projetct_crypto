/**
 * Utilitaires IPFS — résolution de CID + persistance d'URI
 *
 * Gateways publics utilisés par ordre de priorité :
 *   1. cloudflare-ipfs.com  — CDN mondial, très rapide, fiable
 *   2. dweb.link            — Protocol Labs (créateurs d'IPFS), stable
 *   3. ipfs.io              — Gateway de référence, parfois lent
 *   4. gateway.pinata.cloud — Dernier recours (rate-limit sur comptes gratuits)
 */

/** Liste ordonnée des gateways publics IPFS */
const IPFS_GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs",
  "https://dweb.link/ipfs",
  "https://ipfs.io/ipfs",
  "https://gateway.pinata.cloud/ipfs",
] as const;

/** Gateway par défaut pour la résolution synchrone */
const DEFAULT_GATEWAY = IPFS_GATEWAYS[0];

/**
 * Convertit un CID ou une URI IPFS en URL HTTP affichable.
 *
 * Cas traités :
 *  - "ipfs://QmXxx..."     → https://cloudflare-ipfs.com/ipfs/QmXxx...
 *  - "Qm..."  (CID v0)     → https://cloudflare-ipfs.com/ipfs/Qm...
 *  - "bafy..." (CID v1)    → https://cloudflare-ipfs.com/ipfs/bafy...
 *  - "https://..."         → inchangé
 *  - "file://", "data:"    → inchangé
 *  - "blob:..."            → inchangé (utiliser persistUri() pour persister)
 */
export function resolveImageUri(uri: string | undefined | null): string | undefined {
  if (!uri) return undefined;

  if (uri.startsWith("https://") || uri.startsWith("http://")) return uri;
  if (uri.startsWith("file://") || uri.startsWith("blob:") || uri.startsWith("data:")) return uri;

  const cid = uri.startsWith("ipfs://") ? uri.replace("ipfs://", "") : uri;

  if (cid.startsWith("Qm") || cid.startsWith("bafy") || cid.startsWith("bafk")) {
    return `${DEFAULT_GATEWAY}/${cid}`;
  }

  return uri;
}

/**
 * Résout un CID en testant les gateways dans l'ordre jusqu'à trouver une
 * qui répond. Utilisé pour l'affichage des preuves et rapports.
 *
 * @param cid  CID IPFS (ex: "QmXxx..." ou "bafy...")
 * @returns    URL HTTP accessible, ou undefined si toutes les gateways échouent
 */
export async function resolveWithFallback(cid: string): Promise<string | undefined> {
  if (!cid) return undefined;

  // URI déjà HTTP → pas besoin de résolution
  if (cid.startsWith("https://") || cid.startsWith("http://")) return cid;

  const cleanCid = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;

  for (const gateway of IPFS_GATEWAYS) {
    const url = `${gateway}/${cleanCid}`;
    try {
      const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(4000) });
      if (res.ok) return url;
    } catch {
      // Gateway inaccessible → essayer le suivant
    }
  }

  // Toutes les gateways ont échoué — retourner la première quand même
  // (le navigateur peut réessayer de son côté)
  return `${DEFAULT_GATEWAY}/${cleanCid}`;
}

/**
 * Convertit une URI blob: en data URL base64 persistante.
 *
 * Sur Expo Web, ImagePicker retourne des blob: URLs qui sont détruites
 * au rechargement de la page. Cette fonction les convertit en data: URLs
 * (base64) qui persistent dans AsyncStorage.
 *
 * Sur mobile (file://), retourne l'URI telle quelle.
 */
export async function persistUri(uri: string): Promise<string> {
  if (!uri.startsWith("blob:")) return uri;

  try {
    const response = await fetch(uri);
    const blob     = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror   = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return uri;
  }
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAllAccidents, getRoleFromBlockchain, registerSelf } from "@/services/blockchain";
import { resolveImageUri } from "@/utils/ipfs";

export type UserRole = "conducteur" | "expert" | "assureur" | null;

export interface User {
  address:  string;
  role:     UserRole;
  name:     string;
  avatar?:  string;
}

export interface Dossier {
  id: string;
  numero: string;
  date: string;
  lieu: string;
  statut:
    | "declare"
    | "en_expertise"
    | "rapport_soumis"
    | "valide"
    | "refuse";
  conducteurId: string;
  conducteurName: string;
  expertId?: string;
  assureurId?: string;
  description: string;
  montantEstime?: number;
  photos: string[];
  signe: boolean;
  vehicule: string;
  immatriculation: string;
  temoins?: string;
  gpsCoords?: { latitude: number; longitude: number };
  /** SHA-256 hash of the evidence photos, stored on-chain via AccidentContract */
  evidenceHash?: string;
  /** CID IPFS des preuves conducteur */
  evidenceCID?: string;
  /** Ethereum transaction hash from the blockchain declaration */
  blockchainTx?: string;
  /** IPFS Content Identifier (CID) of the uploaded photo */
  ipfsCid?: string;
  /** CID IPFS du rapport expert */
  rapportCID?: string;
  /** Expert's written report */
  rapportExpert?: string;
  /** Expert's damage severity assessment */
  gravite?: "leger" | "moyen" | "grave";
  /** Expert's corrected/completed circumstances description */
  circonstancesExpert?: string;
  /** Expert's corrected/completed damage description */
  dommagesExpert?: string;
  /** Additional photos taken by the expert on site */
  photosExpert?: string[];
}

// Statuts blockchain (uint8) → statut UI
const BLOCKCHAIN_STATUS_MAP: Record<string, Dossier["statut"]> = {
  "0": "declare",
  "1": "en_expertise",   // Verification
  "2": "rapport_soumis", // Expertise (rapport soumis, en attente de décision assureur)
  "3": "valide",
  "4": "refuse",
};

interface AppContextValue {
  user: User | null;
  isConnected: boolean;
  dossiers: Dossier[];
  isLoading: boolean;
  connectMetaMask: (role: UserRole) => Promise<void>;
  disconnect: () => void;
  addDossier: (dossier: Omit<Dossier, "id" | "numero"> & { id?: string }) => void;
  updateDossier: (id: string, updates: Partial<Dossier>) => void;
  refreshDossiers: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const MOCK_DOSSIERS: Dossier[] = [
  {
    id: "d001",
    numero: "ACC-2026-001",
    date: "15/03/2026",
    lieu: "Boulevard Mohammed V, Casablanca",
    statut: "en_expertise",
    conducteurId: "0xCOND1",
    conducteurName: "Ahmed Benali",
    expertId: "0xB2C3D4E5F6A1...8901",
    description: "Collision frontale au carrefour. Dommages au pare-choc avant et capot.",
    montantEstime: 12500,
    photos: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400",
    ],
    signe: true,
    vehicule: "Dacia Logan 2022",
    immatriculation: "12345-A-1",
  },
  {
    id: "d002",
    numero: "ACC-2026-002",
    date: "14/03/2026",
    lieu: "Rue Ibn Battuta, Rabat",
    statut: "rapport_soumis",
    conducteurId: "0xCOND2",
    conducteurName: "Fatima Zahra",
    expertId: "0xB2C3D4E5F6A1...8901",
    assureurId: "0xC3D4E5F6A1B2...9012",
    description: "Accrochage en stationnement. Rétroviseur cassé, portière enfoncée.",
    montantEstime: 4800,
    photos: [
      "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400",
    ],
    signe: true,
    vehicule: "Renault Clio 2021",
    immatriculation: "67890-B-2",
  },
  {
    id: "d003",
    numero: "ACC-2026-003",
    date: "13/03/2026",
    lieu: "Autoroute A1, Km 45",
    statut: "valide",
    conducteurId: "0xCOND3",
    conducteurName: "Youssef Alami",
    expertId: "0xB2C3D4E5F6A1...8901",
    assureurId: "0xC3D4E5F6A1B2...9012",
    description: "Carambolage sur autoroute. Dommages multiples sur la carrosserie arrière.",
    montantEstime: 32000,
    photos: [
      "https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=400",
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400",
    ],
    signe: true,
    vehicule: "Volkswagen Golf 2023",
    immatriculation: "24680-C-3",
  },
  {
    id: "d004",
    numero: "ACC-2026-004",
    date: "12/03/2026",
    lieu: "Avenue Hassan II, Fès",
    statut: "declare",
    conducteurId: "0xA1B2C3D4E5F6...7890",
    conducteurName: "Ahmed Benali",
    description: "Choc latéral à une intersection. Airbags déclenchés.",
    photos: [],
    signe: false,
    vehicule: "Peugeot 208 2020",
    immatriculation: "13579-D-4",
  },
];

/**
 * Convertit un accident blockchain en Dossier UI.
 */
function blockchainToDossier(a: any): Dossier {
  const ts = Number(a.timestamp) * 1000;
  const date = ts ? new Date(ts).toLocaleDateString("fr-MA") : new Date().toLocaleDateString("fr-MA");
  return {
    id:              a.id.toString(),
    numero:          `ACC-${a.id.toString().padStart(3, "0")}`,
    date,
    lieu:            a.location || "—",
    statut:          BLOCKCHAIN_STATUS_MAP[a.status] ?? "declare",
    conducteurId:    a.driver,
    conducteurName:  a.driver ? `${a.driver.slice(0, 6)}...${a.driver.slice(-4)}` : "—",
    expertId:        a.expert !== "0x0000000000000000000000000000000000000000" ? a.expert : undefined,
    assureurId:      a.insurer !== "0x0000000000000000000000000000000000000000" ? a.insurer : undefined,
    description:     "—",
    photos:          [],
    signe:           a.driverSigned ?? false,
    vehicule:        "—",
    immatriculation: "—",
    evidenceHash:    a.evidenceHash || undefined,
    evidenceCID:     a.evidenceCID || undefined,
    ipfsCid:         a.evidenceCID || undefined,
    rapportCID:      a.reportCID || undefined,
    // Convertir les CIDs IPFS en URLs HTTP pour l'affichage
    photos: a.evidenceCID ? [resolveImageUri(a.evidenceCID)!] : [],
  };
}

const DOSSIERS_STORAGE_KEY = "accichain_dossiers";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Sauvegarder les dossiers dans AsyncStorage à chaque changement ───────
  const saveDossiers = useCallback(async (list: Dossier[]) => {
    try {
      if (list.length > 0) {
        await AsyncStorage.setItem(DOSSIERS_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {}
  }, []);

  // ── Charger les dossiers directement depuis la blockchain ────────────────
  const refreshDossiers = useCallback(async () => {
    try {
      const accidents = await getAllAccidents();
      const fromChain = accidents.map(blockchainToDossier);

      setDossiers((prev) => {
        // IDs qui existent réellement on-chain
        const chainIds = new Set(fromChain.map((c) => c.id));

        // Dossiers locaux à conserver :
        //   - ceux qui ont un équivalent on-chain (seront mergés ci-dessous)
        //   - ceux qui sont purement locaux ET en attente de déclaration
        //     (id numérique non présent on-chain → probablement TX en cours)
        // On SUPPRIME les dossiers locaux dont l'ID numérique n'existe plus
        // on-chain (Hardhat redémarré, contrats redéployés, etc.)
        const localOnly = prev.filter((d) => {
          if (d.id.startsWith("d00")) return false; // mock data → toujours supprimer
          const numId = Number(d.id);
          if (!isNaN(numId) && numId > 0 && !chainIds.has(d.id)) return false; // stale
          return !chainIds.has(d.id); // local pur non encore on-chain → garder
        });

        if (fromChain.length === 0) {
          // Blockchain vide → ne garder que les dossiers locaux purement non-blockchain
          return localOnly;
        }

        const merged = fromChain.map((chainDossier) => {
          const local = prev.find((d) => d.id === chainDossier.id);
          if (!local) return chainDossier;
          return {
            // 1. Base locale (données enrichies : description, photos, véhicule…)
            ...local,
            // 2. Champs on-chain — la blockchain est TOUJOURS source de vérité absolue
            // Le timing est géré côté appelant (handleTakeCharge fait tx.wait()
            // PUIS refreshDossiers(), donc la lecture est toujours post-confirmation)
            statut:       chainDossier.statut,
            expertId:     chainDossier.expertId,
            assureurId:   chainDossier.assureurId,
            evidenceHash: chainDossier.evidenceHash ?? local.evidenceHash,
            evidenceCID:  chainDossier.evidenceCID  ?? local.evidenceCID,
            rapportCID:   chainDossier.rapportCID   ?? local.rapportCID,
          };
        });

        return [...merged, ...localOnly];
      });
    } catch {
      // MetaMask non disponible ou réseau local éteint → garder les données locales
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        // Charger la session utilisateur
        const stored = await AsyncStorage.getItem("accichain_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user);
          setIsConnected(true);
        }
        // Charger les dossiers persistés
        const storedDossiers = await AsyncStorage.getItem(DOSSIERS_STORAGE_KEY);
        if (storedDossiers) {
          const parsed: Dossier[] = JSON.parse(storedDossiers);
          if (parsed.length > 0) {
            setDossiers(parsed);
          }
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  // Charger les dossiers blockchain au démarrage puis toutes les 60 secondes.
  // Intervalle plus long pour éviter d'inonder le nœud RPC et déclencher
  // l'erreur MetaMask "RPC endpoint returned too many errors".
  useEffect(() => {
    refreshDossiers();
    const interval = setInterval(refreshDossiers, 60000);
    return () => clearInterval(interval);
  }, [refreshDossiers]);

  // Sauvegarder dans AsyncStorage à chaque changement de dossiers
  useEffect(() => {
    if (!isLoading) saveDossiers(dossiers);
  }, [dossiers, isLoading, saveDossiers]);

  // Mapping rôle blockchain → rôle UI
  const CHAIN_ROLE_MAP: Record<string, UserRole> = {
    driver:  "conducteur",
    expert:  "expert",
    insurer: "assureur",
  };

  const connectMetaMask = useCallback(async (selectedRole: UserRole) => {
    setIsLoading(true);

    try {
      const ethereum = (window as any).ethereum;

      if (ethereum?.isMetaMask) {
        // 1. Révoquer les permissions existantes puis forcer le sélecteur de compte
        try {
          await ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch {
          // wallet_revokePermissions non supporté sur les vieilles versions → continuer
        }
        await ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
        const accounts: string[] = await ethereum.request({ method: "eth_accounts" });
        const address = accounts[0]?.toLowerCase() ?? "";
        if (!address) throw new Error("Aucun compte MetaMask disponible");

        // 2. Vérifier le rôle existant directement sur la blockchain (lecture directe, pas de backend)
        let finalRole: UserRole = selectedRole;
        try {
          const { role: chainRole, isActive } = await getRoleFromBlockchain(address);
          if (isActive && chainRole !== "none") {
            // L'adresse a déjà un rôle on-chain → l'utiliser
            finalRole = CHAIN_ROLE_MAP[chainRole] ?? selectedRole;
          } else {
            // Pas de rôle → auto-enregistrement via MetaMask (register() dans le contrat)
            await registerSelf(selectedRole as "conducteur" | "expert" | "assureur");
            finalRole = selectedRole;
          }
        } catch {
          // Réseau local éteint → utiliser le rôle sélectionné
          finalRole = selectedRole;
        }

        const newUser: User = {
          address,
          role:  finalRole,
          name:  `${address.slice(0, 6)}...${address.slice(-4)}`,
        };

        setUser(newUser);
        setIsConnected(true);
        await AsyncStorage.setItem("accichain_session", JSON.stringify({ user: newUser }));
        await refreshDossiers();

      } else {
        // ── Fallback simulation (MetaMask non installé) ───────────────────────
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const addresses: Record<string, string> = {
          conducteur: "0xa1b2c3d4e5f6789012345678901234567890abcd",
          expert:     "0xb2c3d4e5f6789012345678901234567890abcde",
          assureur:   "0xc3d4e5f6789012345678901234567890abcdef1",
        };
        const names: Record<string, string> = {
          conducteur: "Ahmed Benali",
          expert:     "Dr. Karim Mansouri",
          assureur:   "Wafa Assurance",
        };
        const simAddress = addresses[selectedRole as string] || "0x0000000000000000000000000000000000000000";

        try { await registerSelf(selectedRole as "conducteur" | "expert" | "assureur"); } catch {}

        const newUser: User = {
          address: simAddress,
          role:    selectedRole,
          name:    names[selectedRole as string] || "Utilisateur",
        };
        setUser(newUser);
        setIsConnected(true);
        await AsyncStorage.setItem("accichain_session", JSON.stringify({ user: newUser }));
        await refreshDossiers();
      }
    } catch (err: any) {
      console.warn("Connexion MetaMask annulée:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [refreshDossiers]);

  const disconnect = useCallback(async () => {
    setUser(null);
    setIsConnected(false);
    await AsyncStorage.removeItem("accichain_session");
  }, []);

  const addDossier = useCallback((dossier: Omit<Dossier, "id" | "numero"> & { id?: string }) => {
    const id = dossier.id || (Date.now().toString() + Math.random().toString(36).substr(2, 5));
    setDossiers((prev) => {
      const existing = prev.find((d) => d.id === id);
      if (existing) {
        // Mettre à jour le dossier existant avec les nouvelles données locales
        // (ex: evidenceCID après upload IPFS, blockchainTx après confirmation on-chain)
        return prev.map((d) =>
          d.id === id ? { ...d, ...dossier, id, statut: d.statut } : d
        );
      }
      const numero = `ACC-2026-${String(prev.length + 1).padStart(3, "0")}`;
      return [{ ...dossier, id, numero }, ...prev];
    });
  }, []);

  const updateDossier = useCallback((id: string, updates: Partial<Dossier>) => {
    setDossiers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  }, []);

  const value = useMemo(
    () => ({
      user,
      isConnected,
      dossiers,
      isLoading,
      connectMetaMask,
      disconnect,
      addDossier,
      updateDossier,
      refreshDossiers,
    }),
    [user, isConnected, dossiers, isLoading, connectMetaMask, disconnect, addDossier, updateDossier, refreshDossiers]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

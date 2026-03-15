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

export type UserRole = "conducteur" | "expert" | "assureur" | null;

export interface User {
  address: string;
  role: UserRole;
  name: string;
  avatar?: string;
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
    | "refuse"
    | "paye";
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
}

interface AppContextValue {
  user: User | null;
  isConnected: boolean;
  dossiers: Dossier[];
  isLoading: boolean;
  connectMetaMask: (role: UserRole) => Promise<void>;
  disconnect: () => void;
  addDossier: (dossier: Omit<Dossier, "id" | "numero">) => void;
  updateDossier: (id: string, updates: Partial<Dossier>) => void;
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
    expertId: "0xEXP1",
    description: "Collision frontale au carrefour. Dommages au pare-choc avant et capot.",
    montantEstime: 12500,
    photos: [],
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
    expertId: "0xEXP1",
    assureurId: "0xASS1",
    description: "Accrochage en stationnement. Rétroviseur cassé, portière enfoncée.",
    montantEstime: 4800,
    photos: [],
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
    expertId: "0xEXP1",
    assureurId: "0xASS1",
    description: "Carambolage sur autoroute. Dommages multiples sur la carrosserie arrière.",
    montantEstime: 32000,
    photos: [],
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
    conducteurId: "0xCOND1",
    conducteurName: "Ahmed Benali",
    description: "Choc latéral à une intersection. Airbags déclenchés.",
    photos: [],
    signe: false,
    vehicule: "Peugeot 208 2020",
    immatriculation: "13579-D-4",
  },
  {
    id: "d005",
    numero: "ACC-2026-005",
    date: "10/03/2026",
    lieu: "Bd Zerktouni, Marrakech",
    statut: "paye",
    conducteurId: "0xCOND4",
    conducteurName: "Sara Idrissi",
    expertId: "0xEXP1",
    assureurId: "0xASS1",
    description: "Collision avec piéton. Dommages avant majeurs, véhicule immobilisé.",
    montantEstime: 48000,
    photos: [],
    signe: true,
    vehicule: "Toyota Yaris 2019",
    immatriculation: "11111-E-5",
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dossiers, setDossiers] = useState<Dossier[]>(MOCK_DOSSIERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = await AsyncStorage.getItem("hotgamme_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user);
          setIsConnected(true);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const connectMetaMask = useCallback(async (role: UserRole) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    const addresses: Record<string, string> = {
      conducteur: "0xA1B2C3D4E5F6...7890",
      expert: "0xB2C3D4E5F6A1...8901",
      assureur: "0xC3D4E5F6A1B2...9012",
    };
    const names: Record<string, string> = {
      conducteur: "Ahmed Benali",
      expert: "Dr. Karim Mansouri",
      assureur: "Wafa Assurance",
    };
    const newUser: User = {
      address: addresses[role as string] || "0x0000",
      role,
      name: names[role as string] || "Utilisateur",
    };
    setUser(newUser);
    setIsConnected(true);
    setIsLoading(false);
    await AsyncStorage.setItem("hotgamme_session", JSON.stringify({ user: newUser }));
  }, []);

  const disconnect = useCallback(async () => {
    setUser(null);
    setIsConnected(false);
    await AsyncStorage.removeItem("hotgamme_session");
  }, []);

  const addDossier = useCallback((dossier: Omit<Dossier, "id" | "numero">) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const numero = `ACC-2026-${String(dossiers.length + 10).padStart(3, "0")}`;
    setDossiers((prev) => [{ ...dossier, id, numero }, ...prev]);
  }, [dossiers.length]);

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
    }),
    [user, isConnected, dossiers, isLoading, connectMetaMask, disconnect, addDossier, updateDossier]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

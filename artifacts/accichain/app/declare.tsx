import { Redirect } from "expo-router";

// Cette route est conservée pour la compatibilité des anciens liens,
// mais la vraie page de déclaration (avec blockchain) est dans (conducteur)/declarer.tsx
export default function DeclareRedirect() {
  return <Redirect href="/(conducteur)/declarer" />;
}

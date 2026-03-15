import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Tableau</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dossiers">
        <Icon sf={{ default: "folder", selected: "folder.fill" }} />
        <Label>Dossiers</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="paiement">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Paiement</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profil">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function TabBar({ state, navigation }: any) {
  const tabs = [
    { name: "index", label: "Tableau", icon: "home" },
    { name: "dossiers", label: "Dossiers", icon: "folder" },
    { name: "paiement", label: "Paiement", icon: "credit-card" },
    { name: "profil", label: "Profil", icon: "user" },
  ];

  return (
    <View style={tabBarStyles.wrapper}>
      <BlurView intensity={30} tint="light" style={tabBarStyles.bar}>
        {tabs.map((tab, i) => {
          const isActive = state.index === i;
          return (
            <Pressable key={tab.name} style={tabBarStyles.item} onPress={() => navigation.navigate(tab.name)}>
              {isActive ? (
                <LinearGradient
                  colors={[Colors.light.blue, Colors.light.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={tabBarStyles.activeItem}
                >
                  <Feather name={tab.icon as any} size={18} color="#fff" />
                  <Text style={tabBarStyles.activeLabel}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={tabBarStyles.inactiveItem}>
                  <Feather name={tab.icon as any} size={18} color={Colors.light.textMuted} />
                  <Text style={tabBarStyles.inactiveLabel}>{tab.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

function ClassicTabLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Tableau" }} />
      <Tabs.Screen name="dossiers" options={{ title: "Dossiers" }} />
      <Tabs.Screen name="paiement" options={{ title: "Paiement" }} />
      <Tabs.Screen name="profil" options={{ title: "Profil" }} />
    </Tabs>
  );
}

const tabBarStyles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "web" ? 14 : 28,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "rgba(73,109,171,0.22)",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  item: { flex: 1 },
  activeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  inactiveItem: { alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10 },
  activeLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  inactiveLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.light.textMuted },
});

export default function AssureurLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}

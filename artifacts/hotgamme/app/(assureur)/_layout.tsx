import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
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

function ClassicTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.assureur,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.light.surfaceStrong,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: Colors.light.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.light.surfaceStrong }]} />
          ) : null,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Tableau", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="house" tintColor={color} size={24} /> : <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="dossiers" options={{ title: "Dossiers", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="folder" tintColor={color} size={24} /> : <Feather name="folder" size={22} color={color} /> }} />
      <Tabs.Screen name="paiement" options={{ title: "Paiement", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="creditcard" tintColor={color} size={24} /> : <Feather name="credit-card" size={22} color={color} /> }} />
      <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.circle" tintColor={color} size={24} /> : <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}

export default function AssureurLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}

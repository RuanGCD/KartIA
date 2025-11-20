import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFD700",
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopColor: "#333",
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false,
      }}
    >

      {/* ---------------- TABS VISÍVEIS ---------------- */}
      <Tabs.Screen
        name="campeonatos"
        options={{
          title: "Campeonatos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="armazem"
        options={{
          title: "Armazém",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* ----------- TELAS QUE NÃO DEVEM VIRAR TAB ----------- */}
      <Tabs.Screen
        name="campeonato/[id]"
        options={{
          href: null,
        }}
      />

    </Tabs>
  );
}

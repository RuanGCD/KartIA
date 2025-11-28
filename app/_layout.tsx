import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Toast from "react-native-toast-message";

import { AuthProvider } from "../Contexts/authContext";
import { useAuth } from "../hooks/useAuth";

function LayoutContent() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/profile");
    }
  }, [user, segments, loading]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#FFD700" size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>

      {/* ‼️ ATENÇÃO — TOAST PRECISA FICAR AQUI NO ROOT */}
      <Toast />
    </GestureHandlerRootView>
  );
}

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { databases, DB_ID, USERS_COLLECTION_ID } from "../../utils/appwrite";
import { Models } from "appwrite";
import { useAuth } from "../../hooks/useAuth"; //  importa o contexto

interface UserData extends Models.Document {
  nome: string;
  idade: number;
  corridas: number;
  vitorias: number;
}

export default function Profile() {
  const { user, logout } = useAuth(); //  vem do AuthProvider
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        const document = await databases.getDocument<UserData>(
          DB_ID,
          USERS_COLLECTION_ID,
          user.$id
        );
        setUserData(document);
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleLogout = async () => {
    await logout(); // usa o contexto
    router.replace("/(auth)/login"); //  volta ao login
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#FFD700" size="large" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Erro ao carregar perfil.</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Voltar ao Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>KartIA</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nome:</Text>
        <Text style={styles.value}>{userData.nome}</Text>

        <Text style={styles.label}>Idade:</Text>
        <Text style={styles.value}>{userData.idade}</Text>

        <Text style={styles.label}>Corridas:</Text>
        <Text style={styles.value}>{userData.corridas}</Text>

        <Text style={styles.label}>Vitórias:</Text>
        <Text style={styles.value}>{userData.vitorias}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    fontSize: 32,
    color: "#FFD700",
    fontWeight: "bold",
    marginBottom: 30,
  },
  card: {
    width: "100%",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  label: {
    color: "#FFD700",
    fontSize: 16,
    marginTop: 5,
  },
  value: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
});

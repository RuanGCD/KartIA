import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { account } from "@/utils/appwrite";

export default function ResetPassword() {
  const { userId, secret } = useLocalSearchParams();
  const [password, setPassword] = useState("");

  const handleReset = async () => {
    if (!password) {
      Alert.alert("Atenção", "Digite a nova senha.");
      return;
    }

    try {
      await account.updateRecovery(
        String(userId),
        String(secret),
        password
      );

      Alert.alert("Sucesso", "Sua senha foi redefinida!");
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível redefinir a senha.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova Senha</Text>

      <TextInput
        placeholder="Digite a nova senha"
        placeholderTextColor="#888"
        secureTextEntry
        style={styles.input}
        onChangeText={setPassword}
        value={password}
      />

      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Confirmar</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        {/* 🔥 Caminho correto dentro de (auth) */}
        <Link href="/(auth)/login" style={styles.link}>
          Voltar ao login
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    borderColor: "#FFD700",
    borderWidth: 1,
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    textAlign: "center",
    color: "#000",
    fontWeight: "bold",
  },
  link: {
    color: "#FFD700",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "bold",
  },
});

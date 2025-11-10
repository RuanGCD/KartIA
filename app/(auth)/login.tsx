import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useAuth } from "../../Contexts/authContext";

export default function Login() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleLogin = async () => {
    if (!email || !senha) {
      setErro("Preencha todos os campos");
      return;
    }

    setErro("");

    try {
      await login(email, senha);
      router.replace("/(tabs)/profile");
    } catch (e: any) {
      console.error("Erro ao logar:", e);
      setErro("Email ou senha incorretos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>KartIA</Text>

      {erro ? <Text style={styles.error}>{erro}</Text> : null}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Senha"
        placeholderTextColor="#888"
        style={styles.input}
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      {/* 🔹 Link para registro */}
      <Text style={styles.registerText}>
        Não tem conta?{" "}
        <Link href="/(auth)/register" style={styles.link}>
          Registre-se
        </Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 32,
    color: "#FFD700",
    fontWeight: "bold",
    marginBottom: 40,
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
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
  registerText: {
    color: "#fff",
    marginTop: 20,
  },
  link: {
    color: "#FFD700",
    fontWeight: "bold",
  },
});

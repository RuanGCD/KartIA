import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useAuth } from "../../Contexts/authContext";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
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

      {/* LOGO EMBAIXO DO TÍTULO */}
      <Image
        source={require("../../assets/logo.png")}
        style={styles.logoImage}
        resizeMode="contain"
      />

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

      {/* CAMPO DE SENHA COM ÍCONE */}
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Senha"
          placeholderTextColor="#888"
          style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
          secureTextEntry={!mostrarSenha}
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity
          onPress={() => setMostrarSenha(!mostrarSenha)}
          style={styles.eyeButton}
        >
          <Ionicons
            name={mostrarSenha ? "eye-off" : "eye"}
            size={24}
            color="#FFD700"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

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
    marginBottom: 10,
  },
  logoImage: {
    width: 140,
    height: 140,
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
  passwordContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    borderColor: "#FFD700",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingRight: 8,
  },
  eyeButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
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

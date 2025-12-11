import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
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
    if (!email) {
      setErro("Digite seu email.");
      return;
    }

    if (!senha) {
      setErro("Digite sua senha.");
      return;
    }

    setErro("");

    try {
      await login(email, senha);
      router.replace("/(tabs)/profile");
    } catch (e: any) {
      const msg = e?.message?.toString() || "";

      if (msg.includes("between 8 and 256")) {
        Alert.alert("Senha inválida", "A senha deve conter pelo menos 8 caracteres.");
      } else if (msg.includes("Invalid credentials")) {
        Alert.alert("Erro ao entrar", "Email ou senha incorretos.");
      } else if (msg.includes("User not found")) {
        Alert.alert("Conta não encontrada", "Nenhuma conta foi encontrada com este email.");
      } else {
        Alert.alert("Erro", "Não foi possível fazer login. Tente novamente.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>KartIA</Text>

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

      {/* ✔ Caminho atualizado conforme sua pasta (auth) com parênteses */}
      <Link href="/(auth)/forgot-password" style={styles.forgotPassword}>
        Esqueci minha senha
      </Link>

      <TouchableOpacity
        style={[styles.button, (!email || !senha) && styles.buttonDisabled]}
        disabled={!email || !senha}
        onPress={handleLogin}
      >
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
  forgotPassword: {
    width: "100%",
    textAlign: "right",
    color: "#FFD700",
    marginBottom: 10,
    marginTop: -5,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#FFD700",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },
  error: {
    backgroundColor: "#330000",
    borderColor: "#FF4C4C",
    borderWidth: 1,
    color: "#FF6B6B",
    padding: 10,
    width: "100%",
    borderRadius: 8,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "500",
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

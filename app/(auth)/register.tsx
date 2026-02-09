import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { account, databases } from "../../utils/appwrite";
import { ID } from "appwrite";
import { useAuth } from "../../Contexts/authContext";
import { Ionicons } from "@expo/vector-icons";

const DATABASE_ID = "68f65dd60011cc69ba07";
const COLLECTION_ID = "users";

export default function Register() {
  const { refreshUser, loading } = useAuth();

  const [nome, setNome] = useState("");
  const [birthdate, setBirthDate] = useState(""); // DD/MM/AAAA
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Função para calcular idade
  const calcularIdade = (data: string) => {
    const [dia, mes, ano] = data.split("/").map(Number);
    const nascimento = new Date(ano, mes - 1, dia);
    const hoje = new Date();

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();

    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
  };

  const handleRegister = async () => {
    if (!nome || !birthdate || !email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    // Validação simples do formato
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthdate)) {
      Alert.alert("Erro", "Data inválida. Use DD/MM/AAAA");
      return;
    }

    const idade = calcularIdade(birthdate);

    if (isNaN(idade)) {
      Alert.alert("Erro", "Data de nascimento inválida");
      return;
    }

    if (idade < 14) {
      Alert.alert(
        "Idade mínima",
        "Você precisa ter pelo menos 14 anos para criar uma conta."
      );
      return;
    }

    try {
      // Cria o usuário no Auth
      const user = await account.create(ID.unique(), email, senha, nome);
      await account.createEmailPasswordSession(email, senha);

      // Cria o documento no banco
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        user.$id,
        {
          nome,
          birthdate, // salva a data real
          idade,     // salva idade calculada
          corridas: 0,
          vitorias: 0,
        }
      );

      await refreshUser();
      Alert.alert("Sucesso", "Conta criada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao registrar:", err);
      Alert.alert(
        "Erro ao registrar",
        err.message || "Tente novamente mais tarde."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>KartIA</Text>

      <TextInput
        placeholder="Nome"
        placeholderTextColor="#888"
        style={styles.input}
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        placeholder="Data de nascimento (DD/MM/AAAA)"
        placeholderTextColor="#888"
        style={styles.input}
        keyboardType="numeric"
        value={birthdate}
        onChangeText={setBirthDate}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        style={styles.input}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* CAMPO SENHA COM ÍCONE */}
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

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Cadastrar</Text>
        )}
      </TouchableOpacity>

      <Text style={{ color: "#fff", marginTop: 15 }}>
        Já tem conta?{" "}
        <Link
          href="/(auth)/login"
          style={{ color: "#FFD700", fontWeight: "bold" }}
        >
          Entrar
        </Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  logo: { fontSize: 32, color: "#FFD700", fontWeight: "bold", marginBottom: 40 },
  input: {
    width: "80%",
    borderColor: "#FFD700",
    borderWidth: 1,
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    width: "80%",
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
  buttonText: { color: "#000", fontWeight: "bold" },
});

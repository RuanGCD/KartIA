import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { account } from "../../utils/appwrite"; // ajuste o caminho se necessário

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecovery = async () => {
    if (!email.trim()) {
      Alert.alert("Aviso", "Digite seu email.");
      return;
    }

    setLoading(true);

    try {
      await account.createRecovery(
        email.trim(),
        "https://kart-ia-reset-password.vercel.app/" // 🔥 link correto da Vercel
      );

      Alert.alert(
        "Email enviado!",
        "Se o email estiver cadastrado, você receberá um link para redefinir sua senha."
      );
    } catch (e: any) {
      console.log(e);
      Alert.alert("Erro", "Não foi possível enviar o email de recuperação.");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>

      <Text style={styles.label}>Digite seu email</Text>

      <TextInput
        style={styles.input}
        placeholder="email@exemplo.com"
        placeholderTextColor="#777"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleRecovery}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Enviar link</Text>
        )}
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
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 30,
  },
  label: {
    width: "100%",
    color: "#fff",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 8,
    color: "#fff",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FFD700",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },
});

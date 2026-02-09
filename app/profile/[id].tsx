import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { databases } from "../../utils/appwrite";

const DATABASE_ID = "68f65dd60011cc69ba07";
const USER_COLLECTION = "users";

export default function PublicProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const doc = await databases.getDocument(
          DATABASE_ID,
          USER_COLLECTION,
          String(id)
        );
        setUserData(doc);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const calcularIdade = (data?: string) => {
    if (!data) return "Não informada";
    const [d, m, a] = data.split("/").map(Number);
    const nasc = new Date(a, m - 1, d);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    if (
      hoje.getMonth() < nasc.getMonth() ||
      (hoje.getMonth() === nasc.getMonth() &&
        hoje.getDate() < nasc.getDate())
    ) {
      idade--;
    }
    return idade;
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
        <Text style={{ color: "red" }}>Piloto não encontrado</Text>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BOTÃO VOLTAR */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Perfil do Piloto</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nome:</Text>
        <Text style={styles.value}>{userData.nome}</Text>

        {userData.apelido && (
          <>
            <Text style={styles.label}>Apelido:</Text>
            <Text style={styles.value}>{userData.apelido}</Text>
          </>
        )}

        <Text style={styles.label}>Idade:</Text>
        <Text style={styles.value}>
          {calcularIdade(userData.birthdate)} anos
        </Text>

        <Text style={styles.label}>Corridas:</Text>
        <Text style={styles.value}>{userData.corridas}</Text>

        <Text style={styles.label}>Vitórias:</Text>
        <Text style={styles.value}>{userData.vitorias}</Text>
      </View>
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
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  label: { color: "#FFD700", marginTop: 8 },
  value: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    padding: 10,
  },
  backText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
});

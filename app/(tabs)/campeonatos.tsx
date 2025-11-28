import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../Contexts/authContext";
import { createChampionship, getChampionshipsByUser, joinChampionship } from "../../utils/championships";

export default function Campeonatos() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [championships, setChampionships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadChampionships = async () => {
    if (!user) return;
    try {
      const res = await getChampionshipsByUser(user.$id);
      setChampionships(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadChampionships();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      loadChampionships();
    }, [])
  );

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      await createChampionship(name, user.$id);
      setName("");
      await loadChampionships();
    } catch (err) {
      Alert.alert("Erro", "Falha ao criar campeonato");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!code.trim() || !user) return;
    setLoading(true);
    try {
      await joinChampionship(code, user.$id);
      setCode("");
      await loadChampionships();
      Alert.alert("Sucesso", "Você entrou no campeonato!");
    } catch (err) {
      Alert.alert("Erro", "Código inválido ou falha ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏁 Meus Campeonatos</Text>

      <View style={{ marginBottom: 15 }}>
        <TextInput
          placeholder="Nome do Campeonato"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Criando..." : "Criar Campeonato"}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 25 }}>
        <TextInput
          placeholder="Código do Campeonato"
          placeholderTextColor="#aaa"
          value={code}
          onChangeText={setCode}
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#222" }]}
          onPress={handleJoin}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: "#FFD700" }]}>
            {loading ? "Entrando..." : "Entrar por Código"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={championships}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.champCard}
            onPress={() => router.push(`/(tabs)/campeonato/${item.$id}` as any)}
          >
            <Text style={styles.champName}>{item.nome}</Text>
            <Text style={styles.champCode}>Código: {item.code}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b", padding: 20 },
  title: { color: "#FFD700", fontSize: 22, fontWeight: "bold", marginBottom: 15, marginTop: 30 },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#FFD700",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 5,
  },
  buttonText: { color: "#000", fontWeight: "bold" },
  champCard: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  champName: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  champCode: { color: "#aaa", marginTop: 5 },
});

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { databases } from "../../../utils/appwrite";
import { useAuth } from "../../../Contexts/authContext";
import { Picker } from "@react-native-picker/picker";
import { leaveChampionship, deleteChampionship } from "../../../utils/championships";
import { useFocusEffect } from "@react-navigation/native";

const DATABASE_ID = "68f65dd60011cc69ba07";
const CHAMP_COLLECTION = "championships";
const USER_COLLECTION = "users";

export default function CampeonatoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [campeonato, setCampeonato] = useState<any>(null);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [nomes, setNomes] = useState<{ [key: string]: string }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [resultados, setResultados] = useState<{ [key: string]: string }>({});

  // 🔹 Carregar dados do campeonato
  const carregar = async () => {
    setCampeonato(null);
    setScores({});
    setNomes({});

    try {
      const doc = await databases.getDocument(DATABASE_ID, CHAMP_COLLECTION, String(id));
      setCampeonato(doc);

      const parsedScores = doc.scores ? JSON.parse(doc.scores) : {};
      setScores(parsedScores);

      const ids = Object.keys(parsedScores);

      if (ids.length > 0) {
        const promises = ids.map(async (uid) => {
          try {
            const userDoc = await databases.getDocument(DATABASE_ID, USER_COLLECTION, uid);

            const nomeOuApelido = userDoc.apelido?.trim()
              ? userDoc.apelido
              : userDoc.nome || "Jogador";

            return { id: uid, nome: nomeOuApelido };
          } catch {
            return { id: uid, nome: "Jogador desconhecido" };
          }
        });

        const results = await Promise.all(promises);
        const map: { [key: string]: string } = {};
        results.forEach((r) => (map[r.id] = r.nome));

        setNomes(map);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Falha ao carregar campeonato");
    }
  };

  // 🔄 RECARREGAR TODA VEZ QUE A TELA ABRIR
  useFocusEffect(
    React.useCallback(() => {
      if (id) carregar();
    }, [id])
  );

  // 🔹 Abrir modal da corrida
  const abrirCorrida = () => {
    if (!campeonato) return;

    const inicial: { [key: string]: string } = {};
    Object.keys(scores).forEach((id) => (inicial[id] = "naoCorreu"));
    setResultados(inicial);

    setModalVisible(true);
  };

  // 🔹 Salvar corrida
  const salvarCorrida = async () => {
    if (!campeonato) return;

    try {
      const newScores = { ...scores };
      const atualizacoesUsuarios: Promise<void>[] = [];

      const classificados = Object.entries(resultados)
        .filter(([_, pos]) => pos !== "naoCorreu" && pos !== "naoTerminou")
        .sort((a, b) => parseInt(a[1]) - parseInt(b[1]));

      classificados.forEach(([id, pos], i) => {
        const pontos = 10 - i * 2;
        newScores[id] = (newScores[id] || 0) + Math.max(pontos, 0);

        atualizacoesUsuarios.push(
          (async () => {
            const userDoc = await databases.getDocument(DATABASE_ID, USER_COLLECTION, id);

            const novasCorridas = (userDoc.corridas || 0) + 1;
            const novasVitorias = i === 0 ? (userDoc.vitorias || 0) + 1 : userDoc.vitorias || 0;

            await databases.updateDocument(DATABASE_ID, USER_COLLECTION, id, {
              corridas: novasCorridas,
              vitorias: novasVitorias,
            });
          })()
        );
      });

      Object.entries(resultados)
        .filter(([_, pos]) => pos === "naoCorreu" || pos === "naoTerminou")
        .forEach(([id]) => {
          atualizacoesUsuarios.push(
            (async () => {
              const userDoc = await databases.getDocument(DATABASE_ID, USER_COLLECTION, id);
              await databases.updateDocument(DATABASE_ID, USER_COLLECTION, id, {
                corridas: (userDoc.corridas || 0) + 1,
              });
            })()
          );
        });

      await Promise.all(atualizacoesUsuarios);

      await databases.updateDocument(DATABASE_ID, CHAMP_COLLECTION, campeonato.$id, {
        scores: JSON.stringify(newScores),
      });

      setScores(newScores);
      setModalVisible(false);

      Alert.alert("Sucesso", "Resultados da corrida registrados!");
      carregar();
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Falha ao registrar corrida.");
    }
  };

  // 🚪 Sair
  const sairDoCampeonato = async () => {
    if (!campeonato || !user) return;

    Alert.alert(
      "Sair do Campeonato",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveChampionship(campeonato.$id, user.$id);
              Alert.alert("Você saiu do campeonato.");
              router.back();
            } catch (err: any) {
              Alert.alert("Erro", err.message || "Falha ao sair.");
            }
          },
        },
      ]
    );
  };

  // ❌ Excluir campeonato
  const excluirCampeonato = async () => {
    if (!campeonato || !user) return;

    Alert.alert(
      "Excluir Campeonato",
      "Tem certeza? Não pode ser desfeito.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChampionship(campeonato.$id, user.$id);
              Alert.alert("Campeonato excluído.");
              router.back();
            } catch (err: any) {
              Alert.alert("Erro", err.message || "Falha ao excluir.");
            }
          },
        },
      ]
    );
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{campeonato?.nome || "Carregando..."}</Text>

      <FlatList
        data={sorted}
        keyExtractor={([id]) => id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.pos}>{index + 1}º</Text>
            <Text style={styles.user}>{nomes[item[0]] || item[0]}</Text>
            <Text style={styles.points}>{item[1]} pts</Text>
          </View>
        )}
      />

      {user?.$id === campeonato?.ownerId && (
        <TouchableOpacity style={styles.button} onPress={abrirCorrida}>
          <Text style={styles.buttonText}>Corrida Feita</Text>
        </TouchableOpacity>
      )}

      {user?.$id === campeonato?.ownerId && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#aa0000", marginTop: 10 }]}
          onPress={excluirCampeonato}
        >
          <Text style={[styles.buttonText, { color: "#fff" }]}>Excluir Campeonato</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#333", marginTop: 10 }]}
        onPress={() => router.back()}
      >
        <Text style={[styles.buttonText, { color: "#FFD700" }]}>Voltar</Text>
      </TouchableOpacity>

      {user?.$id !== campeonato?.ownerId && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#aa0000", marginTop: 10 }]}
          onPress={sairDoCampeonato}
        >
          <Text style={[styles.buttonText, { color: "#fff" }]}>Sair do Campeonato</Text>
        </TouchableOpacity>
      )}

      {/* Modal corrida */}
      {campeonato && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Registrar Corrida</Text>

              <FlatList
                data={Object.keys(nomes)}
                keyExtractor={(id) => id}
                renderItem={({ item }) => (
                  <View style={styles.pickerRow}>
                    <Text style={styles.pickerLabel}>{nomes[item]}</Text>

                    <Picker
                      selectedValue={resultados[item]}
                      style={styles.picker}
                      dropdownIconColor="#FFD700"
                      onValueChange={(val) =>
                        setResultados((prev) => ({ ...prev, [item]: val }))
                      }
                    >
                      <Picker.Item label="Não correu" value="naoCorreu" />
                      <Picker.Item label="Não terminou" value="naoTerminou" />

                      {[...Array(Object.keys(nomes).length)].map((_, i) => (
                        <Picker.Item key={i} label={`${i + 1}º Lugar`} value={`${i + 1}`} />
                      ))}
                    </Picker>
                  </View>
                )}
              />

              <TouchableOpacity style={styles.button} onPress={salvarCorrida}>
                <Text style={styles.buttonText}>Salvar Corrida</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#333", marginTop: 10 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: "#FFD700" }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  title: {
    color: "#FFD700",
    fontSize: 22,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  pos: { color: "#FFD700", fontWeight: "bold", width: 40 },
  user: { color: "#fff", flex: 1 },
  points: { color: "#FFD700", fontWeight: "bold" },
  button: {
    backgroundColor: "#FFD700",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#000", fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#111",
    width: "90%",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    color: "#FFD700",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 15,
  },
  pickerRow: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  pickerLabel: { color: "#fff", flex: 1 },
  picker: {
    width: 160,
    color: "#FFD700",
    backgroundColor: "#222",
    borderRadius: 6,
  },
});

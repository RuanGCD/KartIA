import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { ID, Query } from "appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

import { databases, DB_ID } from "../../utils/appwrite";
import { useAuth } from "../../Contexts/authContext";

const COLLECTION_ID = "teams";
const USER_COLLECTION = "users";

export default function Equipe() {
  const { user } = useAuth();

  const [team, setTeam] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [nomes, setNomes] = useState<{ [key: string]: string }>({});

  /*  CARREGAR EQUIPE */
  const loadTeam = async () => {
  if (!user) return;

  try {
    setLoading(true);

    const res = await databases.listDocuments(
      DB_ID,
      COLLECTION_ID,
      [
        Query.or([
          Query.equal("OwnerId", user.$id),
          Query.contains("pilotos", user.$id),
        ])
      ]
    );

    if (res.documents.length > 0) {
      const t = res.documents[0];
      setTeam(t);
      carregarNomes([...t.pilotos, ...(t.joinRequests || [])]);
    } else {
      setTeam(null);
      loadAllTeams();
    }
  } catch (err) {
    console.log(err);
    Alert.alert("Erro", "Não foi possível carregar a equipe.");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadTeam();
  }, [user]);

  /*  TODAS AS EQUIPES */
  const loadAllTeams = async () => {
    const res = await databases.listDocuments(DB_ID, COLLECTION_ID);
    setAllTeams(res.documents);
  };

  /*  CARREGAR NOMES DOS USUÁRIOS */
  const carregarNomes = async (ids: string[]) => {
    const map: any = {};

    await Promise.all(
      ids.map(async (uid) => {
        try {
          const u = await databases.getDocument(DB_ID, USER_COLLECTION, uid);
          map[uid] = u.apelido?.trim() ? u.apelido : u.nome || "Piloto";
        } catch {
          map[uid] = "Piloto";
        }
      })
    );

    setNomes(map);
  };

  /*  SOLICITAR ENTRADA */
  const solicitarEntrada = async (teamItem: any) => {
    if (!user) return;

    const requests = teamItem.joinRequests || [];

    if (requests.includes(user.$id)) {
      Alert.alert("Aviso", "Sua solicitação já está pendente.");
      return;
    }

    try {
      await databases.updateDocument(DB_ID, COLLECTION_ID, teamItem.$id, {
        joinRequests: [...requests, user.$id],
      });

      Alert.alert(
        "Solicitação enviada",
        "Aguardando aprovação do dono da equipe."
      );

      loadAllTeams();
    } catch (err) {
      console.log(err);
      Alert.alert("Erro", "Não foi possível enviar a solicitação.");
    }
  };

  /*  ACEITAR SOLICITAÇÃO */
  const aceitarSolicitacao = async (userId: string) => {
    try {
      const novosPilotos = [...team.pilotos, userId];
      const novasRequests = team.joinRequests.filter(
        (id: string) => id !== userId
      );

      await databases.updateDocument(DB_ID, COLLECTION_ID, team.$id, {
        pilotos: novosPilotos,
        joinRequests: novasRequests,
      });

      setTeam({
        ...team,
        pilotos: novosPilotos,
        joinRequests: novasRequests,
      });

      carregarNomes(novosPilotos);
    } catch {
      Alert.alert("Erro", "Não foi possível aceitar a solicitação.");
    }
  };

  /*  RECUSAR SOLICITAÇÃO */
  const recusarSolicitacao = async (userId: string) => {
    try {
      const novasRequests = team.joinRequests.filter(
        (id: string) => id !== userId
      );

      await databases.updateDocument(DB_ID, COLLECTION_ID, team.$id, {
        joinRequests: novasRequests,
      });

      setTeam({ ...team, joinRequests: novasRequests });
    } catch {
      Alert.alert("Erro", "Não foi possível recusar a solicitação.");
    }
  };

  /*  CRIAR EQUIPE */
  const handleCreateTeam = async () => {
    if (!user) return;

    const newTeam = await databases.createDocument(
      DB_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        nome: "Minha Equipe",
        OwnerId: user.$id,
        icon: "",
        pilotos: [],
        joinRequests: [],
      }
    );

    setTeam(newTeam);
  };

  /*  ALTERAR ÍCONE */
  const handleChangeIcon = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled) return;

    await databases.updateDocument(DB_ID, COLLECTION_ID, team.$id, {
      icon: result.assets[0].uri,
    });

    setTeam({ ...team, icon: result.assets[0].uri });
  };

  /*  EXCLUIR EQUIPE */
  const handleDeleteTeam = async () => {
    Alert.alert(
      "Excluir Equipe",
      "Essa ação é irreversível. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await databases.deleteDocument(DB_ID, COLLECTION_ID, team.$id);
            setTeam(null);
            loadAllTeams();
          },
        },
      ]
    );
  };
  /*  SAIR DA EQUIPE */
const sairDaEquipe = async () => {
  if (!user || !team) return;

  Alert.alert(
    "Sair da equipe",
    "Você tem certeza que deseja sair da equipe?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            const novosPilotos = team.pilotos.filter(
              (id: string) => id !== user.$id
            );

            await databases.updateDocument(
              DB_ID,
              COLLECTION_ID,
              team.$id,
              {
                pilotos: novosPilotos,
              }
            );

            // Limpa estado local
            setTeam(null);
            loadAllTeams();
          } catch (err) {
            console.log(err);
            Alert.alert("Erro", "Não foi possível sair da equipe.");
          }
        },
      },
    ]
  );
};


  /*  LOADING */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  /*  SEM EQUIPE */
  if (!team) {
    const filtered = allTeams.filter((t) =>
      t.nome.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Escolha uma Equipe</Text>

          <TextInput
            placeholder="Buscar equipe..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
              <View style={styles.teamCard}>
                <View style={styles.teamRow}>
                  <View style={styles.teamIconSmall}>
                    {item.icon ? (
                      <Image
                        source={{ uri: item.icon }}
                        style={styles.teamIconImage}
                      />
                    ) : (
                      <Ionicons name="people" size={26} color="#FFD700" />
                    )}
                  </View>

                  <Text style={styles.teamCardTitle}>{item.nome}</Text>
                </View>

                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => solicitarEntrada(item)}
                >
                  <Text style={styles.joinText}>Solicitar entrada</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <TouchableOpacity style={styles.button} onPress={handleCreateTeam}>
            <Text style={styles.buttonText}>Criar Equipe</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /*  COM EQUIPE */
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ alignItems: "center", paddingTop: 30 }}
    >
      <TouchableOpacity onPress={handleChangeIcon}>
        <View style={styles.iconWrapper}>
          {team.icon ? (
            <Image source={{ uri: team.icon }} style={styles.icon} />
          ) : (
            <Ionicons name="image" size={48} color="#FFD700" />
          )}
        </View>
      </TouchableOpacity>

      <Text style={styles.teamName}>{team.nome}</Text>

      <Text style={styles.section}>Pilotos</Text>

      {team.pilotos.length === 0 ? (
        <Text style={styles.empty}>Nenhum piloto na equipe</Text>
      ) : (
        team.pilotos.map((id: string) => (
          <View key={id} style={styles.pilotItem}>
            <Text style={{ color: "#fff" }}>
              {nomes[id] || "Piloto"}
            </Text>
          </View>
        ))
      )}
      {team.OwnerId !== user?.$id && (
  <TouchableOpacity
    style={styles.leaveButton}
    onPress={sairDaEquipe}
  >
    <Text style={styles.leaveText}>Sair da Equipe</Text>
  </TouchableOpacity>
)}


      {team.OwnerId === user?.$id && team.joinRequests?.length > 0 && (
        <>
          <Text style={styles.section}>Solicitações</Text>

          {team.joinRequests.map((id: string) => (
            <View key={id} style={styles.requestRow}>
              <Text style={{ color: "#fff" }}>
                {nomes[id] || id}
              </Text>

              <View style={{ flexDirection: "row", gap: 15 }}>
                <TouchableOpacity onPress={() => aceitarSolicitacao(id)}>
                  <Ionicons
                    name="checkmark-circle"
                    size={28}
                    color="green"
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => recusarSolicitacao(id)}>
                  <Ionicons name="close-circle" size={28} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {team.OwnerId === user?.$id && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteTeam}
        >
          <Text style={styles.deleteText}>Excluir Equipe</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
  
}

/*  STYLES */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#FFD700",
    fontSize: 20,
    marginBottom: 15,
  },
  search: {
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 8,
    padding: 10,
    color: "#fff",
    marginBottom: 15,
  },
  teamCard: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  teamIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  teamIconImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  teamCardTitle: {
    color: "#FFD700",
    fontSize: 16,
  },
  joinButton: {
    backgroundColor: "#FFD700",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  joinText: {
    color: "#000",
    fontWeight: "bold",
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  teamName: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  section: {
    color: "#FFD700",
    fontSize: 18,
    marginBottom: 10,
  },
  empty: {
    color: "#aaa",
    fontStyle: "italic",
  },
  pilotItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#333",
    width: 260,
  },
  requestRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 260,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#FFD700",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },
  deleteButton: {
    marginTop: 30,
    backgroundColor: "#8B0000",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
  },
  leaveButton: {
  marginTop: 30,
  backgroundColor: "#444",
  paddingHorizontal: 30,
  paddingVertical: 12,
  borderRadius: 8,
},
leaveText: {
  color: "#fff",
  fontWeight: "bold",
},
});

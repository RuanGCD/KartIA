import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { databases, DB_ID, USERS_COLLECTION_ID } from "../../utils/appwrite";
import { Models } from "appwrite";
import { useAuth } from "../../hooks/useAuth";

interface UserData extends Models.Document {
  nome: string;
  apelido?: string;
  idade: number;
  corridas: number;
  vitorias: number;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [novoApelido, setNovoApelido] = useState("");
  const router = useRouter();

  // Carrega imagem salva
  useEffect(() => {
    (async () => {
      const storedImage = await AsyncStorage.getItem("profile_image");
      if (storedImage) setProfileImage(storedImage);
    })();
  }, []);

  // Carrega dados ao focar a tela
  useFocusEffect(
    React.useCallback(() => {
      const loadUserData = async () => {
        if (!user) return;
        try {
          setLoading(true);
          const document = await databases.getDocument<UserData>(
            DB_ID,
            USERS_COLLECTION_ID,
            user.$id
          );
          setUserData(document);
          setNovoApelido(document.apelido ?? "");
        } catch (err) {
          console.error("Erro ao carregar dados:", err);
        } finally {
          setLoading(false);
        }
      };

      loadUserData();
    }, [user])
  );

  // Selecionar imagem
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem("profile_image", uri);
    }
  };

  // Atualizar idade
  const alterarIdade = async (valor: number) => {
    if (!userData) return;

    try {
      const novaIdade = Math.max(0, userData.idade + valor);

      const updated = await databases.updateDocument<UserData>(
        DB_ID,
        USERS_COLLECTION_ID,
        user!.$id,
        { idade: novaIdade }
      );

      setUserData(updated);
    } catch (err) {
      console.error("Erro ao atualizar idade:", err);
    }
  };

  // Atualizar apelido
  const salvarApelido = async () => {
    if (!userData) return;

    try {
      const updated = await databases.updateDocument<UserData>(
        DB_ID,
        USERS_COLLECTION_ID,
        user!.$id,
        { apelido: novoApelido }
      );

      setUserData(updated);
    } catch (err) {
      console.error("Erro ao salvar apelido:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  // 🔥 EXCLUIR CONTA
  const handleDeleteAccount = () => {
    if (!user) return;

    Alert.alert(
      "Excluir conta",
      "Tem certeza que deseja excluir sua conta?\nEssa ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await databases.deleteDocument(
                DB_ID,
                USERS_COLLECTION_ID,
                user.$id
              );

              await AsyncStorage.removeItem("profile_image");
              await logout();
              router.replace("/(auth)/login");
            } catch (err) {
              console.error("Erro ao excluir conta:", err);
              Alert.alert(
                "Erro",
                "Não foi possível excluir sua conta. Tente novamente."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#FFD700" size="large" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>Erro ao carregar perfil.</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Voltar ao Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.logo}>KartIA</Text>

      <TouchableOpacity style={styles.imageWrapper} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <Text style={styles.addPhotoText}>Adicionar Foto</Text>
        )}
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>Nome:</Text>
        <Text style={styles.value}>{userData.nome}</Text>

        <Text style={styles.label}>Apelido:</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite um apelido opcional"
          placeholderTextColor="#777"
          value={novoApelido}
          onChangeText={setNovoApelido}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={salvarApelido}>
          <Text style={styles.saveBtnText}>Salvar Apelido</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Idade:</Text>
        <View style={styles.row}>
          <Text style={styles.value}>{userData.idade}</Text>
          <TouchableOpacity
            style={[styles.editButton, styles.minusButton]}
            onPress={() => alterarIdade(-1)}
          >
            <Text style={styles.editButtonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => alterarIdade(1)}
          >
            <Text style={styles.editButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Corridas:</Text>
        <Text style={styles.value}>{userData.corridas}</Text>

        <Text style={styles.label}>Vitórias:</Text>
        <Text style={styles.value}>{userData.vitorias}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.deleteButtonText}>Excluir Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#000",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    fontSize: 32,
    color: "#FFD700",
    fontWeight: "bold",
    marginBottom: 15,
  },

  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#222",
    borderWidth: 2,
    borderColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },

  addPhotoText: {
    color: "#FFD700",
    fontSize: 14,
  },

  card: {
    width: "100%",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#FFD700",
  },

  label: {
    color: "#FFD700",
    fontSize: 16,
    marginTop: 5,
  },

  value: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  input: {
    backgroundColor: "#222",
    color: "#FFF",
    fontSize: 16,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFD700",
    marginTop: 5,
    marginBottom: 10,
  },

  saveBtn: {
    backgroundColor: "#FFD700",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10,
  },

  saveBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },

  editButton: {
    backgroundColor: "#FFD700",
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },

  minusButton: {
    backgroundColor: "#FF4444",
  },

  editButtonText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "bold",
  },

  button: {
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginBottom: 10,
  },

  deleteButton: {
    backgroundColor: "#FF3333",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },

  deleteButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },

  error: {
    color: "red",
    marginBottom: 10,
  },
});

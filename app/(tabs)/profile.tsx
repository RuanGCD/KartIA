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
  birthdate?: string; // DD/MM/AAAA (opcional para usuários antigos)
  corridas: number;
  vitorias: number;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [novoApelido, setNovoApelido] = useState("");
  const [birthInput, setBirthInput] = useState("");
  const router = useRouter();

  const profileImageKey = user ? `profile_image_${user.$id}` : null;

  // ===== CALCULAR IDADE =====
  const calcularIdade = (data?: string) => {
    if (!data) return null;

    const [dia, mes, ano] = data.split("/").map(Number);
    if (!dia || !mes || !ano) return null;

    const nascimento = new Date(ano, mes - 1, dia);
    const hoje = new Date();

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();

    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
  };

  // ===== CARREGAR IMAGEM =====
  useEffect(() => {
    if (!profileImageKey) return;

    (async () => {
      const storedImage = await AsyncStorage.getItem(profileImageKey);
      setProfileImage(storedImage);
    })();
  }, [profileImageKey]);

  // ===== CARREGAR DADOS =====
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
          setBirthInput(document.birthdate ?? "");
        } catch (err) {
          console.error("Erro ao carregar dados:", err);
        } finally {
          setLoading(false);
        }
      };

      loadUserData();
    }, [user])
  );

  // ===== SELECIONAR IMAGEM =====
  const pickImage = async () => {
    if (!profileImageKey) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem(profileImageKey, uri);
    }
  };

  // ===== SALVAR APELIDO =====
  const salvarApelido = async () => {
    if (!userData || !user) return;

    try {
      const updated = await databases.updateDocument<UserData>(
        DB_ID,
        USERS_COLLECTION_ID,
        user.$id,
        { apelido: novoApelido }
      );

      setUserData(updated);
      Alert.alert("Sucesso", "Apelido atualizado!");
    } catch (err) {
      console.error("Erro ao salvar apelido:", err);
      Alert.alert("Erro", "Não foi possível salvar.");
    }
  };

  // ===== SALVAR BIRTHDATE =====
  const salvarBirthdate = async () => {
    if (!user || !birthInput) {
      Alert.alert("Erro", "Preencha a data.");
      return;
    }

    // validação simples DD/MM/AAAA
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(birthInput)) {
      Alert.alert("Erro", "Formato inválido. Use DD/MM/AAAA");
      return;
    }

    try {
      const updated = await databases.updateDocument<UserData>(
        DB_ID,
        USERS_COLLECTION_ID,
        user.$id,
        { birthdate: birthInput }
      );

      setUserData(updated);
      Alert.alert("Sucesso", "Data de nascimento salva!");
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível salvar.");
    }
  };

  // ===== LOGOUT =====
  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  // ===== EXCLUIR CONTA =====
  const handleDeleteAccount = () => {
    if (!user || !profileImageKey) return;

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

              await AsyncStorage.removeItem(profileImageKey);
              await logout();
              router.replace("/(auth)/login");
            } catch (err) {
              console.error(err);
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          },
        },
      ]
    );
  };

  // ===== LOADING =====
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

  const idadeCalculada = calcularIdade(userData.birthdate);

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
          placeholder="Opcional"
          placeholderTextColor="#777"
          value={novoApelido}
          onChangeText={setNovoApelido}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={salvarApelido}>
          <Text style={styles.saveBtnText}>Salvar Apelido</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Data de nascimento:</Text>
        {userData.birthdate ? (
          <Text style={styles.value}>{userData.birthdate}</Text>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#777"
              value={birthInput}
              onChangeText={setBirthInput}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={salvarBirthdate}>
              <Text style={styles.saveBtnText}>Salvar Data</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>Idade:</Text>
        <Text style={styles.value}>
          {idadeCalculada ? `${idadeCalculada} anos` : "Não informada"}
        </Text>

        <Text style={styles.label}>Corridas:</Text>
        <Text style={styles.value}>{userData.corridas}</Text>

        <Text style={styles.label}>Vitórias:</Text>
        <Text style={styles.value}>{userData.vitorias}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
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

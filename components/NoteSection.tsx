import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function NoteSection() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const saved = await AsyncStorage.getItem("@NOTES");
      if (saved) setNotes(JSON.parse(saved));
    } catch (error) {
      console.log("Erro ao carregar notas", error);
    }
  };

  const saveNotes = async (newNotes: string[]) => {
    try {
      await AsyncStorage.setItem("@NOTES", JSON.stringify(newNotes));
    } catch (error) {
      console.log("Erro ao salvar notas", error);
    }
  };

  const addNote = () => {
    if (note.trim() === "") return;

    const newNotes = [...notes, note];
    setNotes(newNotes);
    saveNotes(newNotes);
    setNote("");
  };

  const removeNote = (index: number) => {
    const newNotes = notes.filter((_, i) => i !== index);
    setNotes(newNotes);
    saveNotes(newNotes);
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Anotações</Text>

        <TextInput
          style={styles.input}
          placeholder="Digite uma anotação..."
          placeholderTextColor="#555"
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={styles.addButton} onPress={addNote}>
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>

        <FlatList
          style={{ marginTop: 20 }}
          data={notes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.noteItem}>
              <Text style={styles.noteText}>{item}</Text>

              <TouchableOpacity onPress={() => removeNote(index)}>
                <Text style={styles.remove}>X</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* 🔥 NÃO usa flex: 1 aqui — isso quebrava o layout no carrossel */
  container: {
    width: "100%",
    alignItems: "center",
  },

  /* 🔥 CAIXA IGUAL A ANTERIOR + minHeight evita colapso dentro do ScrollView horizontal */
  box: {
    width: "90%",
    minHeight: 200,
    backgroundColor: "black",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 18,
    padding: 20,
    alignSelf: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#111",
    color: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#FFD700",
  },

  addButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  addButtonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },

  noteItem: {
    backgroundColor: "#1A1A1A",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#333",
  },

  noteText: {
    color: "#fff",
    flex: 1,
    marginRight: 10,
  },

  remove: {
    color: "#FFD700",
    fontWeight: "900",
    fontSize: 18,
  },
});

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { ResizeMode, Video } from "expo-av";

export default function VideoSection() {
  const [videos, setVideos] = useState<string[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const hiddenVideoRef = useRef<Video>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    const folder = FileSystem.documentDirectory!;
    const files = await FileSystem.readDirectoryAsync(folder);

    const mp4 = files.filter((f) => f.endsWith(".mp4"));
    const fullPaths = mp4.map((f) => folder + f);

    setVideos(fullPaths);

    for (const path of fullPaths) {
      if (!thumbnails[path]) {
        try {
          const thumb = await VideoThumbnails.getThumbnailAsync(path, {
            time: 1000,
          });
          setThumbnails((prev) => ({ ...prev, [path]: thumb.uri }));
        } catch {
          console.log("Falha ao gerar miniatura:", path);
        }
      }
    }
  }

  async function getVideoDuration(uri: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      const video = hiddenVideoRef.current;
      if (!video) return reject("VideoRef não disponível");

      try {
        await video.loadAsync({ uri }, {}, false);
        const status = await video.getStatusAsync();
        await video.unloadAsync();

        if (status.isLoaded) {
          resolve(status.durationMillis ?? 0);
        } else {
          reject("Erro ao carregar status");
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  async function pickVideo() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "video/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets[0];

    let duration = 0;
    try {
      duration = await getVideoDuration(file.uri);
    } catch {
      Alert.alert("Erro", "Não foi possível verificar a duração do vídeo.");
      return;
    }

    const maxDuration = 30 * 60 * 1000;

    if (duration > maxDuration) {
      Alert.alert(
        "Vídeo muito longo",
        "O limite é 30 minutos. Envie um vídeo menor."
      );
      return;
    }

    const DIR = FileSystem.documentDirectory!;
    const newName = `video_${Date.now()}.mp4`;

    await FileSystem.copyAsync({
      from: file.uri,
      to: DIR + newName,
    });

    loadVideos();
  }

  async function deleteVideo(path: string) {
    Alert.alert("Excluir vídeo", "Deseja realmente remover este vídeo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await FileSystem.deleteAsync(path, { idempotent: true });
          loadVideos();
        },
      },
    ]);
  }

  function playVideo(uri: string) {
    setPlayingVideo(uri);
  }

  const renderVideoCard = ({ item }: { item: string }) => {
    const thumb = thumbnails[item];

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => playVideo(item)}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Text style={{ color: "#888" }}>Carregando...</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteVideo(item)}
          >
            <Text style={styles.deleteText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Vídeos</Text>

      {playingVideo && (
        <Video
          source={{ uri: playingVideo }}
          style={{ width: 320, height: 200, backgroundColor: "black" }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
        />
      )}

      <Video
        ref={hiddenVideoRef}
        style={{ width: 0, height: 0, opacity: 0 }}
        shouldPlay={false}
        resizeMode={ResizeMode.CONTAIN}
      />

      <View style={styles.box}>
        <Button title="Enviar vídeo" onPress={pickVideo} />

        {videos.length === 0 && (
          <Text style={styles.placeholder}>
            Nenhum vídeo enviado ainda.
          </Text>
        )}

        <FlatList
          data={videos}
          numColumns={2}
          keyExtractor={(item) => item}
          renderItem={renderVideoCard}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 80 }}
          style={{ maxHeight: 450, marginTop: 20 }} // ✅ correção aqui
          showsVerticalScrollIndicator
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 15,
    textAlign: "center",
  },
  box: {
    width: "90%",
    backgroundColor: "black",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 18,
    padding: 15,
  },
  placeholder: {
    color: "#777",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 12,
    width: "48%",
    overflow: "hidden",
    marginBottom: 15,
  },
  thumbnail: {
    width: "100%",
    height: 120,
    backgroundColor: "#333",
  },
  thumbnailPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardFooter: {
    padding: 8,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
});

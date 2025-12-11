// components/LapTimeSection.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Alert,
  Keyboard,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Rect, G, Text as SvgText } from "react-native-svg";

type Lap = {
  id: string;
  ms: number; 
  label: string; 
  createdAt: number;
};

const STORAGE_KEY = "@LAP_TIMES";
const { width } = Dimensions.get("window");

function parseTimeToMs(input: string): number | null {
  
  const trimmed = input.trim();
  if (!trimmed) return null;

  // mm:ss.SSS or m:ss.SSS
  const mmssRegex = /^(\d{1,2}):([0-5]?\d)(?:[.,](\d{1,3}))?$/;
  const ssRegex = /^([0-5]?\d)(?:[.,](\d{1,3}))?$/;

  let match = mmssRegex.exec(trimmed);
  if (match) {
    const mm = parseInt(match[1], 10);
    const ss = parseInt(match[2], 10);
    const ms = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0;
    return mm * 60 * 1000 + ss * 1000 + ms;
  }

  match = ssRegex.exec(trimmed);
  if (match) {
    const ss = parseInt(match[1], 10);
    const ms = match[2] ? parseInt(match[2].padEnd(3, "0"), 10) : 0;
    return ss * 1000 + ms;
  }

  return null;
}

function msToLabel(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(
    milliseconds
  ).padStart(3, "0")}`;
}

export default function LapTimeSection() {
  const [input, setInput] = useState("");
  const [laps, setLaps] = useState<Lap[]>([]);
  const [refresh, setRefresh] = useState(0); 

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Lap[] = JSON.parse(raw);
        setLaps(parsed);
      }
    } catch (e) {
      console.log("Erro ao carregar laps", e);
    }
  };

  const save = async (newLaps: Lap[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLaps));
    } catch (e) {
      console.log("Erro ao salvar laps", e);
    }
  };

  const addLap = async () => {
    const ms = parseTimeToMs(input);
    if (ms === null) {
      Alert.alert("Formato inválido", "Use mm:ss.SSS ou ss.SSS (ex: 01:32.450 ou 32.450)");
      return;
    }
    const lap: Lap = {
      id: String(Date.now()),
      ms,
      label: msToLabel(ms),
      createdAt: Date.now(),
    };
    const newLaps = [...laps, lap];
    setLaps(newLaps);
    await save(newLaps);
    setInput("");
    setRefresh((r) => r + 1);
    Keyboard.dismiss();
  };

  const removeLap = async (id: string) => {
    const newLaps = laps.filter((l) => l.id !== id);
    setLaps(newLaps);
    await save(newLaps);
  };

  const clearAll = () => {
    Alert.alert("Confirmar", "Limpar todos os tempos?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar",
        style: "destructive",
        onPress: async () => {
          setLaps([]);
          await AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  };

  
  const chartData = useMemo(() => {
    if (laps.length === 0) return { min: 0, max: 0, items: [] as Lap[] };
    const items = [...laps];
    const times = items.map((i) => i.ms);
    const min = Math.min(...times);
    const max = Math.max(...times);
    return { min, max, items };
  }, [laps, refresh]);

  
  const chartWidth = Math.min(width * 0.9, 800);
  const chartHeight = 180;
  const barGap = 8;
  const barCount = Math.max(1, chartData.items.length);
  const barWidth = Math.max(12, (chartWidth - barGap * (barCount + 1)) / barCount);

 
  function computeBarHeight(ms: number) {
    if (chartData.min === chartData.max) {
      return chartHeight * 0.9; 
    }
    
    const ratio = (chartData.max - ms) / (chartData.max - chartData.min); 
    const heightPx = 24 + ratio * (chartHeight - 24); 
    return heightPx;
  }

  
  const animatedHeights = chartData.items.map((item) => new Animated.Value(0));
  useEffect(() => {
    
    Animated.stagger(
      40,
      animatedHeights.map((av, i) =>
        Animated.timing(av, {
          toValue: computeBarHeight(chartData.items[i]?.ms ?? 0),
          duration: 350,
          useNativeDriver: false,
        })
      )
    ).start();
    
  }, [chartData.items.length, refresh]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Registre seu melhor tempo</Text>

      <View style={styles.controlsRow}>
        <TextInput
          style={styles.input}
          placeholder="Ex: 01:32.450 ou 32.450"
          placeholderTextColor="#777"
          value={input}
          onChangeText={setInput}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addLap}>
          <Text style={styles.addBtnText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartWrapper}>
        {chartData.items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nenhum tempo registrado ainda</Text>
          </View>
        ) : (
          <Svg width={chartWidth} height={chartHeight}>
            <G>
              {chartData.items.map((item, idx) => {
                const x = barGap + idx * (barWidth + barGap);
                const bh = computeBarHeight(item.ms);
                const y = chartHeight - bh; 
                const labelY = chartHeight - 6;
                return (
                  <G key={item.id}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={bh}
                      rx={6}
                      fill="#FFD700"
                      opacity={0.95}
                    />
                    <SvgText
                      x={x + barWidth / 2}
                      y={labelY}
                      fontSize="10"
                      fill="#fff"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {item.label.replace(/^0+/, "")}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          </Svg>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.subTitle}>Tempos registrados</Text>
        <TouchableOpacity onPress={clearAll}>
          <Text style={styles.clearText}>Limpar tudo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.list}
        data={[...laps].reverse()} 
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemText}>
              {msToLabel(item.ms)}
            </Text>
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Remover tempo", "Remover este tempo?", [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Remover",
                      style: "destructive",
                      onPress: () => removeLap(item.id),
                    },
                  ])
                }
              >
                <Text style={styles.removeText}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },

  label: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },

  controlsRow: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  input: {
    flex: 1,
    backgroundColor: "#111",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },

  addBtn: {
    backgroundColor: "#FFD700",
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },

  addBtnText: {
    color: "#000",
    fontWeight: "800",
  },

  chartWrapper: {
    width: Math.min(width * 0.9, 800),
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyBox: {
    width: "100%",
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    color: "#777",
  },

  listHeader: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  subTitle: {
    color: "#FFD700",
    fontWeight: "700",
  },

  clearText: {
    color: "#ff6b6b",
  },

  list: {
    width: "90%",
    marginTop: 8,
    marginBottom: 16,
  },

  itemRow: {
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  itemText: {
    color: "#fff",
    fontWeight: "700",
  },

  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  removeText: {
    color: "#FFD700",
    fontWeight: "800",
  },
});

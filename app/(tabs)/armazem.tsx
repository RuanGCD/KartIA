import React, { useRef, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
} from "react-native";

import NoteSection from "../../components/NoteSection";
import VideoSection from "../../components/VideoSection";
import LapTimeSection from "../../components/LapTimeSection";

const { width, height } = Dimensions.get("window");

export default function ArmazemScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [page, setPage] = useState(0);
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const onMomentumScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newPage = Math.round(offsetX / width);
    setPage(newPage);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
        Armazém
      </Animated.Text>

      {/* Carrossel simples */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={{ flex: 1 }}
      >
        {/* Página 1 */}
        <View style={styles.page}>
          <View style={styles.sectionWidth}>
            <NoteSection />
          </View>
        </View>

        {/* Página 2 */}
        <View style={styles.page}>
          <View style={styles.sectionWidth}>
            <VideoSection />
          </View>
        </View>

        {/* Página 3 */}
        <View style={styles.page}>
          <View style={styles.sectionWidth}>
            <LapTimeSection />
          </View>
        </View>
      </ScrollView>

      {/* Indicadores */}
      <View style={styles.indicatorRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              page === i ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },

  title: {
    color: "#FFD700",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 50,
    marginBottom: 10,
  },

  page: {
    width: width,
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
  },

  /* 👇 Define a largura ideal de todos os conteúdos */
  sectionWidth: {
    width: width * 0.9,
    alignSelf: "center",
  },

  indicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 15,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },

  dotActive: {
    backgroundColor: "#FFD700",
  },
  dotInactive: {
    backgroundColor: "#333",
  },
});

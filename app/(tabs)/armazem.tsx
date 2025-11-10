import React, { useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Animated, StatusBar } from 'react-native';


export default function ArmazemScreen() {
const fadeAnim = useRef(new Animated.Value(0)).current;


useEffect(() => {
Animated.timing(fadeAnim, {
toValue: 1,
duration: 600,
useNativeDriver: true,
}).start();
}, [fadeAnim]);


return (
<SafeAreaView style={styles.safeArea}>
<StatusBar barStyle="light-content" backgroundColor="#000" />
<View style={styles.container}>
<Animated.Text style={[styles.title, { opacity: fadeAnim }]}>Armazém</Animated.Text>
<Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>em construção</Animated.Text>
<Animated.Text style={[styles.note, { opacity: fadeAnim }]}>Volte depois</Animated.Text>
</View>
</SafeAreaView>
);
}


const styles = StyleSheet.create({
safeArea: {
flex: 1,
backgroundColor: '#000',
},
container: {
flex: 1,
backgroundColor: '#000',
alignItems: 'center',
justifyContent: 'center',
paddingHorizontal: 24,
},
title: {
color: '#ffffff',
fontSize: 42,
fontWeight: '800',
marginBottom: 6,
textAlign: 'center',
},
subtitle: {
color: '#ffffff',
fontSize: 28,
fontWeight: '600',
marginBottom: 14,
textAlign: 'center',
},
note: {
color: '#bbbbbb',
fontSize: 16,
fontWeight: '500',
textAlign: 'center',
},
});
  
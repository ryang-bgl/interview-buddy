import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function BackHeaderButton() {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.button} onPress={() => router.back()}>
      <Text style={styles.text}>Back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
  },
  text: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
});

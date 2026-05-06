import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { tabScreenStyles as styles } from '@/src/styles/tabs';

export default function TodoScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>TODO</Text>
      </View>
      <View style={styles.centered}>
        <Text style={styles.placeholder}>Coming in Step 4</Text>
      </View>
    </SafeAreaView>
  );
}

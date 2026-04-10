import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';

interface ChatInputProps {
  onSend: (text: string) => void;
  onAttach?: () => void;
}

export function ChatInput({ onSend, onAttach }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        placeholder="Message Wick"
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        multiline={false}
      />
      {onAttach && (
        <TouchableOpacity onPress={onAttach} style={styles.iconBtn}>
          <Text style={styles.icon}>📎</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={handleSend} style={styles.iconBtn}>
        <Text style={styles.icon}>🎙️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 18,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
  },
  iconBtn: {
    padding: 4,
    opacity: 0.7,
  },
  icon: {
    fontSize: 20,
  },
});

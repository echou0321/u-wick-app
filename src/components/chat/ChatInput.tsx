import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { inputStyles as styles } from '@/src/styles/chat';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  return (
    <View style={styles.row}>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        placeholder="Message Wick"
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        multiline={false}
        editable={!disabled}
      />
      <TouchableOpacity
        onPress={handleSend}
        style={[styles.sendBtn, (disabled || !value.trim()) && styles.sendBtnDisabled]}
        disabled={disabled || !value.trim()}
        activeOpacity={0.75}
      >
        <Text style={styles.sendIcon}>↑</Text>
      </TouchableOpacity>
    </View>
  );
}

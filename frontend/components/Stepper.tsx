import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export default function Stepper({ value, onChange, min = 1, max, step = 1, label }: StepperProps) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState(String(value));

  const decrement = () => {
    if (value - step >= min) onChange(value - step);
  };

  const increment = () => {
    if (max === undefined || value + step <= max) onChange(value + step);
  };

  const handleBlur = () => {
    setEditing(false);
    const parsed = parseInt(inputText, 10);
    if (!isNaN(parsed) && parsed >= min) {
      onChange(max !== undefined ? Math.min(parsed, max) : parsed);
    } else {
      onChange(min);
    }
    setInputText(String(value));
  };

  const handleFocus = () => {
    setEditing(true);
    setInputText(String(value));
  };

  // Keep inputText in sync when value changes externally
  React.useEffect(() => {
    if (!editing) setInputText(String(value));
  }, [value, editing]);

  const isDecrementDisabled = value <= min;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>}
      <View style={[styles.stepper, { backgroundColor: colors.bgPage, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={decrement}
          disabled={isDecrementDisabled}
          activeOpacity={0.7}
          style={[styles.btn, { opacity: isDecrementDisabled ? 0.35 : 1 }]}
        >
          <Ionicons name="remove" size={18} color={colors.teal} />
        </TouchableOpacity>

        <TextInput
          style={[styles.valueInput, { color: colors.textPrimary }]}
          value={inputText}
          onChangeText={setInputText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType="number-pad"
          selectTextOnFocus
          textAlign="center"
        />

        <TouchableOpacity
          onPress={increment}
          disabled={max !== undefined && value >= max}
          activeOpacity={0.7}
          style={[styles.btn, { opacity: max !== undefined && value >= max ? 0.35 : 1 }]}
        >
          <Ionicons name="add" size={18} color={colors.teal} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 14 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 12,
    textAlign: 'center',
  },
});

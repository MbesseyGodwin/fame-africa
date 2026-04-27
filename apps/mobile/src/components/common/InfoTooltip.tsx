import React from 'react';
import { TouchableOpacity, Alert, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface InfoTooltipProps {
  title: string;
  content: string;
  style?: ViewStyle;
  iconSize?: number;
  color?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  title, 
  content, 
  style, 
  iconSize = 20,
  color
}) => {
  const { theme, textSecondary } = useTheme();

  const handlePress = () => {
    Alert.alert(
      title,
      content,
      [{ text: 'Got it', style: 'default' }],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      style={[styles.container, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons 
        name="information-circle-outline" 
        size={iconSize} 
        color={color || theme.primaryColor} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

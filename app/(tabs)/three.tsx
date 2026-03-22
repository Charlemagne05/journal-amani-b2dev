import { ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import DreamList from '@/components/DreamList';
import { View } from '@/components/Themed';

export default function TabThreeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">Historique local</Text>
      <DreamList />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
});

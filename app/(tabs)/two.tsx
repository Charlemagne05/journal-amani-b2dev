import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { View } from '@/components/Themed';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Aide TP</Text>
      <Card mode="outlined">
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">Setup rapide</Text>
          <Text>1. Lancer: npx expo start</Text>
          <Text>2. Ouvrir sur Android Studio ou Expo Go</Text>
          <Text>3. Ajouter EXPO_PUBLIC_MEANINGCLOUD_API_KEY dans `.env`</Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  cardContent: {
    gap: 8,
  },
});

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
          <Text>1. Installer: npm install</Text>
          <Text>2. Lancer: npx expo start --web</Text>
          <Text>3. (Optionnel) Ajouter EXPO_PUBLIC_MEANINGCLOUD_API_KEY dans `.env`</Text>
          <Text>4. Si Expo Go est incompatible: mettre à jour ou utiliser un Dev Build</Text>
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

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import DreamForm from '@/components/DreamForm';
import DreamHistory from '@/components/DreamHistory';
import { analyzeDreamText } from '@/services/meaningCloud';
import type { DreamEntry } from '@/types/dream';
import { readStoredDreams } from '@/utils/dreamStorage';

export default function TabOneScreen() {
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [isLoadingDreams, setIsLoadingDreams] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDreams = useCallback(async () => {
    try {
      setIsLoadingDreams(true);
      setDreams(await readStoredDreams());
    } catch (error) {
      console.error('Erreur lors du chargement des donnees:', error);
    } finally {
      setIsLoadingDreams(false);
    }
  }, []);

  useEffect(() => {
    loadDreams();
  }, [loadDreams]);

  useFocusEffect(
    useCallback(() => {
      loadDreams();
      return undefined;
    }, [loadDreams]),
  );

  const handleSubmit = async (baseEntry: Omit<DreamEntry, 'analysis' | 'analysisError'>) => {
    setIsSubmitting(true);

    try {
      // La clé Meaning Cloud est optionnelle : si elle n'est pas configurée, on désactive l'analyse.
      if (!process.env.EXPO_PUBLIC_MEANINGCLOUD_API_KEY) {
        return undefined;
      }
      const analysis = await analyzeDreamText(baseEntry.text);
      return { analysis };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { analysisError: message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavedDream = (savedEntry: DreamEntry) => {
    setDreams((previous) => [savedEntry, ...previous]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">Journal AMANI B2DEV</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Saisissez votre rêve. (Analyse automatique via Meaning Cloud si une clé est configurée.)
      </Text>

      <DreamForm onSubmit={handleSubmit} onSaved={handleSavedDream} loading={isSubmitting} />
      {(isLoadingDreams || isSubmitting) && <ActivityIndicator />}
      <DreamHistory dreams={dreams} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  subtitle: {
    opacity: 0.8,
  },
});

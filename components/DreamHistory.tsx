import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';

import type { DreamEntry } from '@/types/dream';

const IGNORED_ANALYSIS_ERROR = 'Missing EXPO_PUBLIC_MEANINGCLOUD_API_KEY';

function formatDreamType(value: DreamEntry['dreamType']): string {
  switch (value) {
    case 'ordinary':
      return 'Ordinaire';
    case 'lucid':
      return 'Lucide';
    case 'nightmare':
      return 'Cauchemar';
    default:
      return 'Autre';
  }
}

function formatTone(value: NonNullable<DreamEntry['tone']>): string {
  switch (value) {
    case 'positive':
      return 'Positive';
    case 'negative':
      return 'Négative';
    default:
      return 'Neutre';
  }
}

type DreamHistoryProps = {
  dreams: DreamEntry[];
};

export default function DreamHistory({ dreams }: DreamHistoryProps) {
  if (!dreams.length) {
    return (
      <View style={styles.emptyState}>
        <Text variant="bodyMedium">Aucun rêve enregistré pour le moment.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {dreams.map((dream) => (
        <Card key={dream.id} mode="outlined">
          <Card.Title
            title={
              dream.dreamType === 'lucid'
                ? 'Rêve lucide'
                : dream.dreamType === 'nightmare'
                  ? 'Cauchemar'
                  : dream.dreamType === 'other'
                    ? 'Rêve (autre)'
                    : 'Rêve'
            }
            subtitle={new Date(dream.dreamDateTime || dream.createdAt || new Date(0).toISOString()).toLocaleString()}
          />
          <Card.Content style={styles.content}>
            <Text>{dream.text || '(rêve sans contenu)'}</Text>
            <View style={styles.metaRow}>
              <Chip compact>{formatDreamType(dream.dreamType)}</Chip>
              {!!dream.tone && <Chip compact>{formatTone(dream.tone)}</Chip>}
              {dream.emotionalIntensity != null && <Chip compact>Intensité: {dream.emotionalIntensity}</Chip>}
              {dream.clarity != null && <Chip compact>Clarté: {dream.clarity}</Chip>}
            </View>

            {!!dream.analysisError && dream.analysisError !== IGNORED_ANALYSIS_ERROR && (
              <Text variant="bodySmall" style={styles.errorText}>
                Analyse indisponible: {dream.analysisError}
              </Text>
            )}

            {!!dream.analysis?.people.length && (
              <View style={styles.section}>
                <Text variant="labelLarge">Personnes détectées</Text>
                <View style={styles.chips}>
                  {dream.analysis.people.map((person) => (
                    <Chip key={`${dream.id}-${person}`}>{person}</Chip>
                  ))}
                </View>
              </View>
            )}

            {!!dream.analysis?.topics.length && (
              <View style={styles.section}>
                <Text variant="labelLarge">Sujets détectés</Text>
                <View style={styles.chips}>
                  {dream.analysis.topics.map((topic) => (
                    <Chip key={`${dream.id}-${topic}`} compact>
                      {topic}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {!!dream.characters?.length && (
              <View style={styles.section}>
                <Text variant="labelLarge">Personnages</Text>
                <View style={styles.chips}>
                  {dream.characters.map((character) => (
                    <Chip key={`${dream.id}-${character}`} compact>
                      {character}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {!!dream.tags?.length && (
              <View style={styles.section}>
                <Text variant="labelLarge">Tags</Text>
                <View style={styles.chips}>
                  {dream.tags.map((tag) => (
                    <Chip key={`${dream.id}-${tag}`} compact>
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  content: {
    gap: 10,
  },
  section: {
    gap: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyState: {
    paddingVertical: 12,
  },
  errorText: {
    color: '#b00020',
  },
});

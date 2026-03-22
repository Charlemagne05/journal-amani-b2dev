import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, ProgressBar, Text } from 'react-native-paper';

import type { DreamEntry, DreamTone, DreamType } from '@/types/dream';

type DreamStatsProps = {
  dreams: DreamEntry[];
};

type CountMap<K extends string> = Record<K, number>;

function buildEmptyCounts<K extends string>(keys: readonly K[]): CountMap<K> {
  return keys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as CountMap<K>);
}

function normalizeList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function StatRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color?: string;
}) {
  const progress = total ? count / total : 0;
  const percent = total ? Math.round(progress * 100) : 0;

  return (
    <View style={styles.statRow}>
      <View style={styles.statHeader}>
        <Text>{label}</Text>
        <Text variant="bodySmall" style={styles.mutedText}>
          {count} ({percent}%)
        </Text>
      </View>
      <ProgressBar progress={progress} color={color} />
    </View>
  );
}

function AverageRow({
  label,
  average,
  max = 10,
  color,
}: {
  label: string;
  average: number | null;
  max?: number;
  color?: string;
}) {
  const progress = average == null ? 0 : Math.min(1, Math.max(0, average / max));

  return (
    <View style={styles.statRow}>
      <View style={styles.statHeader}>
        <Text>{label}</Text>
        <Text variant="bodySmall" style={styles.mutedText}>
          {average == null ? '—' : `${round1(average)}/${max}`}
        </Text>
      </View>
      <ProgressBar progress={progress} color={color} />
    </View>
  );
}

export default function DreamStats({ dreams }: DreamStatsProps) {
  const stats = useMemo(() => {
    const total = dreams.length;
    const dreamTypeKeys: readonly DreamType[] = ['ordinary', 'lucid', 'nightmare', 'other'];
    const toneKeys: readonly DreamTone[] = ['positive', 'neutral', 'negative'];

    const dreamTypes = buildEmptyCounts(dreamTypeKeys);
    const tones = buildEmptyCounts(toneKeys);

    const tagCounts = new Map<string, number>();
    const characterCounts = new Map<string, number>();
    const emotionCounts = new Map<string, number>();

    let emotionalIntensityTotal = 0;
    let emotionalIntensityCount = 0;
    let clarityTotal = 0;
    let clarityCount = 0;
    let sleepQualityTotal = 0;
    let sleepQualityCount = 0;

    for (const dream of dreams) {
      dreamTypes[dream.dreamType] = (dreamTypes[dream.dreamType] ?? 0) + 1;

      const tone = (dream.tone || 'neutral') as DreamTone;
      tones[tone] = (tones[tone] ?? 0) + 1;

      for (const tag of dream.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }

      for (const character of dream.characters || []) {
        characterCounts.set(character, (characterCounts.get(character) ?? 0) + 1);
      }

      for (const emotion of [...normalizeList(dream.emotionsBefore), ...normalizeList(dream.emotionsAfter)]) {
        emotionCounts.set(emotion, (emotionCounts.get(emotion) ?? 0) + 1);
      }

      if (dream.emotionalIntensity != null) {
        emotionalIntensityTotal += dream.emotionalIntensity;
        emotionalIntensityCount += 1;
      }

      if (dream.clarity != null) {
        clarityTotal += dream.clarity;
        clarityCount += 1;
      }

      if (dream.sleepQuality != null) {
        sleepQualityTotal += dream.sleepQuality;
        sleepQualityCount += 1;
      }
    }

    function topEntries(map: Map<string, number>, limit: number): Array<{ label: string; count: number }> {
      return [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label, count]) => ({ label, count }));
    }

    return {
      total,
      dreamTypes,
      tones,
      topTags: topEntries(tagCounts, 8),
      topCharacters: topEntries(characterCounts, 8),
      topEmotions: topEntries(emotionCounts, 8),
      averages: {
        emotionalIntensity:
          emotionalIntensityCount > 0 ? emotionalIntensityTotal / emotionalIntensityCount : null,
        clarity: clarityCount > 0 ? clarityTotal / clarityCount : null,
        sleepQuality: sleepQualityCount > 0 ? sleepQualityTotal / sleepQualityCount : null,
      },
    };
  }, [dreams]);

  if (!stats.total) {
    return <Text variant="bodyMedium">Ajoutez des rêves pour voir les statistiques.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Types de rêves</Text>
      <StatRow label="Ordinaire" count={stats.dreamTypes.ordinary} total={stats.total} />
      <StatRow label="Lucide" count={stats.dreamTypes.lucid} total={stats.total} color="#1E90FF" />
      <StatRow label="Cauchemar" count={stats.dreamTypes.nightmare} total={stats.total} color="#b00020" />
      <StatRow label="Autre" count={stats.dreamTypes.other} total={stats.total} />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Tonalité globale
      </Text>
      <StatRow label="Positive" count={stats.tones.positive} total={stats.total} color="#2E7D32" />
      <StatRow label="Neutre" count={stats.tones.neutral} total={stats.total} />
      <StatRow label="Négative" count={stats.tones.negative} total={stats.total} color="#b00020" />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Moyennes (1–10)
      </Text>
      <AverageRow label="Intensité émotionnelle" average={stats.averages.emotionalIntensity} color="#FF8C00" />
      <AverageRow label="Clarté" average={stats.averages.clarity} color="#1E90FF" />
      <AverageRow label="Qualité du sommeil" average={stats.averages.sleepQuality} color="#6A5ACD" />

      {!!stats.topEmotions.length && (
        <View style={styles.section}>
          <Text variant="titleMedium">Émotions récurrentes</Text>
          <View style={styles.chips}>
            {stats.topEmotions.map((emotion) => (
              <Chip key={emotion.label} compact>
                {emotion.label} ({emotion.count})
              </Chip>
            ))}
          </View>
        </View>
      )}

      {!!stats.topTags.length && (
        <View style={styles.section}>
          <Text variant="titleMedium">Tags fréquents</Text>
          <View style={styles.chips}>
            {stats.topTags.map((tag) => (
              <Chip key={tag.label} compact>
                {tag.label} ({tag.count})
              </Chip>
            ))}
          </View>
        </View>
      )}

      {!!stats.topCharacters.length && (
        <View style={styles.section}>
          <Text variant="titleMedium">Personnages fréquents</Text>
          <View style={styles.chips}>
            {stats.topCharacters.map((character) => (
              <Chip key={character.label} compact>
                {character.label} ({character.count})
              </Chip>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  statRow: {
    gap: 6,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  sectionTitle: {
    marginTop: 8,
  },
  section: {
    gap: 8,
    marginTop: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mutedText: {
    opacity: 0.75,
  },
});


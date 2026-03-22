import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import uuid from 'react-native-uuid';
import { Button, Divider, SegmentedButtons, TextInput } from 'react-native-paper';

import type { DreamEntry } from '@/types/dream';
import { prependDreamToStorage, updateDreamInStorage } from '@/utils/dreamStorage';

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCommaSeparatedList(value: string): string[] | undefined {
  const values = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!values.length) {
    return undefined;
  }

  return [...new Set(values)];
}

function parseDreamDateTime(dateInput: string, timeInput: string): string | undefined {
  // Keep the stored format consistent across platforms (ISO string).
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeInput.trim());
  if (!dateMatch || !timeMatch) return undefined;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return undefined;
  }

  return date.toISOString();
}

type DreamFormProps = {
  onSubmit: (
    baseEntry: Omit<DreamEntry, 'analysis' | 'analysisError'>,
  ) => Promise<Pick<DreamEntry, 'analysis' | 'analysisError'> | void>;
  onSaved?: (savedEntry: DreamEntry) => void;
  onCancel?: () => void;
  initialEntry?: DreamEntry;
  loading?: boolean;
  submitLabel?: string;
};

export default function DreamForm({
  onSubmit,
  onSaved,
  onCancel,
  initialEntry,
  loading = false,
  submitLabel,
}: DreamFormProps) {
  const initialDreamDateTime = initialEntry?.dreamDateTime
    ? new Date(initialEntry.dreamDateTime)
    : initialEntry?.createdAt
      ? new Date(initialEntry.createdAt)
      : new Date();

  const [dreamText, setDreamText] = useState(initialEntry?.text ?? '');
  const [dreamDate, setDreamDate] = useState(formatDateInput(initialDreamDateTime));
  const [dreamTime, setDreamTime] = useState(formatTimeInput(initialDreamDateTime));
  const [dreamType, setDreamType] = useState<DreamEntry['dreamType']>(initialEntry?.dreamType ?? 'ordinary');
  const [tone, setTone] = useState<NonNullable<DreamEntry['tone']>>(
    initialEntry?.tone ?? 'neutral',
  );
  const [emotionsBefore, setEmotionsBefore] = useState(initialEntry?.emotionsBefore ?? '');
  const [emotionsAfter, setEmotionsAfter] = useState(initialEntry?.emotionsAfter ?? '');
  const [characters, setCharacters] = useState((initialEntry?.characters || []).join(', '));
  const [location, setLocation] = useState(initialEntry?.location ?? '');
  const [emotionalIntensity, setEmotionalIntensity] = useState(
    initialEntry?.emotionalIntensity != null ? String(initialEntry.emotionalIntensity) : '',
  );
  const [clarity, setClarity] = useState(initialEntry?.clarity != null ? String(initialEntry.clarity) : '');
  const [tags, setTags] = useState((initialEntry?.tags || []).join(', '));
  const [sleepQuality, setSleepQuality] = useState(
    initialEntry?.sleepQuality != null ? String(initialEntry.sleepQuality) : '',
  );
  const [personalMeaning, setPersonalMeaning] = useState(initialEntry?.personalMeaning ?? '');

  const handleDreamSubmission = async () => {
    const trimmedText = dreamText.trim();
    if (!trimmedText || loading) {
      return;
    }

    const dreamDateTime = parseDreamDateTime(dreamDate, dreamTime);

    const baseEntry: Omit<DreamEntry, 'analysis' | 'analysisError'> = {
      id: initialEntry?.id ?? String(uuid.v4()),
      text: trimmedText,
      dreamDateTime,
      dreamType,
      tone,
      emotionsBefore: emotionsBefore.trim() || undefined,
      emotionsAfter: emotionsAfter.trim() || undefined,
      characters: parseCommaSeparatedList(characters),
      location: location.trim() || undefined,
      emotionalIntensity: parseOptionalNumber(emotionalIntensity),
      clarity: parseOptionalNumber(clarity),
      tags: parseCommaSeparatedList(tags),
      sleepQuality: parseOptionalNumber(sleepQuality),
      personalMeaning: personalMeaning.trim() || undefined,
      createdAt: initialEntry?.createdAt ?? new Date().toISOString(),
    };

    try {
      const extraData = await onSubmit(baseEntry);
      const nextEntry: DreamEntry = { ...(initialEntry || {}), ...baseEntry, ...(extraData || {}) };

      if (initialEntry) {
        await updateDreamInStorage(nextEntry);
      } else {
        await prependDreamToStorage(nextEntry);
      }
      onSaved?.(nextEntry);

      if (initialEntry) {
        onCancel?.();
        return;
      }

      const now = new Date();
      setDreamText('');
      setDreamDate(formatDateInput(now));
      setDreamTime(formatTimeInput(now));
      setDreamType('ordinary');
      setTone('neutral');
      setEmotionsBefore('');
      setEmotionsAfter('');
      setCharacters('');
      setLocation('');
      setEmotionalIntensity('');
      setClarity('');
      setTags('');
      setSleepQuality('');
      setPersonalMeaning('');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des donnees:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Racontez votre rêve"
        value={dreamText}
        onChangeText={setDreamText}
        mode="outlined"
        multiline
        numberOfLines={5}
        style={styles.input}
      />

      <View style={styles.row}>
        <TextInput
          label="Date du rêve"
          value={dreamDate}
          onChangeText={setDreamDate}
          mode="outlined"
          placeholder="YYYY-MM-DD"
          style={[styles.input, styles.rowItem]}
        />
        <TextInput
          label="Heure"
          value={dreamTime}
          onChangeText={setDreamTime}
          mode="outlined"
          placeholder="HH:mm"
          style={[styles.input, styles.rowItem]}
        />
      </View>

      <SegmentedButtons
        value={dreamType}
        onValueChange={(value) =>
          setDreamType(value as 'ordinary' | 'lucid' | 'nightmare' | 'other')
        }
        buttons={[
          { value: 'ordinary', label: 'Ordinaire' },
          { value: 'lucid', label: 'Lucide' },
          { value: 'nightmare', label: 'Cauchemar' },
          { value: 'other', label: 'Autre' },
        ]}
      />

      <SegmentedButtons
        value={tone}
        onValueChange={(value) => setTone(value as 'positive' | 'neutral' | 'negative')}
        buttons={[
          { value: 'positive', label: 'Positive' },
          { value: 'neutral', label: 'Neutre' },
          { value: 'negative', label: 'Négative' },
        ]}
      />

      <Divider />

      <TextInput
        label="État émotionnel avant"
        value={emotionsBefore}
        onChangeText={setEmotionsBefore}
        mode="outlined"
      />
      <TextInput
        label="État émotionnel après"
        value={emotionsAfter}
        onChangeText={setEmotionsAfter}
        mode="outlined"
      />
      <TextInput
        label="Personnages (séparés par des virgules)"
        value={characters}
        onChangeText={setCharacters}
        mode="outlined"
        placeholder="Ex: Alice, Bob"
      />
      <TextInput label="Lieu" value={location} onChangeText={setLocation} mode="outlined" />

      <View style={styles.row}>
        <TextInput
          label="Intensité (1-10)"
          value={emotionalIntensity}
          onChangeText={setEmotionalIntensity}
          mode="outlined"
          keyboardType="numeric"
          style={styles.rowItem}
        />
        <TextInput
          label="Clarté (1-10)"
          value={clarity}
          onChangeText={setClarity}
          mode="outlined"
          keyboardType="numeric"
          style={styles.rowItem}
        />
      </View>

      <TextInput
        label="Tags / mots-clés (virgules)"
        value={tags}
        onChangeText={setTags}
        mode="outlined"
        placeholder="Ex: vol, mer, école"
      />

      <TextInput
        label="Qualité du sommeil (1-10)"
        value={sleepQuality}
        onChangeText={setSleepQuality}
        mode="outlined"
        keyboardType="numeric"
      />

      <TextInput
        label="Signification personnelle"
        value={personalMeaning}
        onChangeText={setPersonalMeaning}
        mode="outlined"
        multiline
        numberOfLines={3}
      />

      <View style={styles.actions}>
        {!!onCancel && (
          <Button mode="outlined" onPress={onCancel} disabled={loading}>
            Annuler
          </Button>
        )}
        <Button mode="contained" onPress={handleDreamSubmission} loading={loading} disabled={loading}>
          {submitLabel || (initialEntry ? 'Mettre à jour' : 'Sauvegarder')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});

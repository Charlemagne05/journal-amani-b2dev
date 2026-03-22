import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DreamEntry } from '@/types/dream';

// Stockage local des rêves
// On conserve la clé historique pour éviter de perdre les données.
export const DREAM_STORAGE_KEY = 'dreamFormDataArray';

// Type volontairement "large" : permet de relire d'anciennes versions ex: `dreamText`.
export type StoredDream = Partial<Omit<DreamEntry, 'dreamType'>> & {
  dreamText?: string;
  isLucid?: boolean;
  isLucidDream?: boolean;
  dreamType?: string;
};

export function normalizeDream(raw: StoredDream, index: number): DreamEntry {
  const legacyDreamType = raw.dreamType;
  const legacyIsLucid = Boolean(raw.isLucid ?? raw.isLucidDream);
  const isDreamTypeValid =
    raw.dreamType === 'ordinary' || raw.dreamType === 'lucid' || raw.dreamType === 'nightmare' || raw.dreamType === 'other';

  return {
    // S'il n'y avait pas d'id auparavant, on en crée un stable.
    id: raw.id || `legacy-${index}`,
    text: raw.text || raw.dreamText || '',
    dreamDateTime: raw.dreamDateTime,
    dreamType: isDreamTypeValid
      ? (raw.dreamType as DreamEntry['dreamType'])
      : legacyIsLucid
        ? 'lucid'
        : legacyDreamType === 'nightmare'
          ? 'nightmare'
          : 'ordinary',
    tone:
      raw.tone ||
      (legacyDreamType === 'neutral' ? 'neutral' : legacyDreamType === 'nightmare' ? 'negative' : undefined),
    emotionsBefore: raw.emotionsBefore,
    emotionsAfter: raw.emotionsAfter,
    characters: raw.characters,
    location: raw.location,
    emotionalIntensity: raw.emotionalIntensity,
    clarity: raw.clarity,
    tags: raw.tags,
    sleepQuality: raw.sleepQuality,
    personalMeaning: raw.personalMeaning,
    createdAt: raw.createdAt || new Date(0).toISOString(),
    analysis: raw.analysis,
    analysisError:
      // L'absence de clé Meaning Cloud ne doit pas être traitée comme une erreur persistante.
      raw.analysisError === 'Missing EXPO_PUBLIC_MEANINGCLOUD_API_KEY' ? undefined : raw.analysisError,
  };
}

export async function readStoredDreams(): Promise<DreamEntry[]> {
  const data = await AsyncStorage.getItem(DREAM_STORAGE_KEY);
  if (!data) {
    return [];
  }

  try {
    const parsed = JSON.parse(data) as StoredDream[];
    return Array.isArray(parsed) ? parsed.map(normalizeDream) : [];
  } catch {
    return [];
  }
}

async function writeDreams(dreams: DreamEntry[]): Promise<void> {
  await AsyncStorage.setItem(DREAM_STORAGE_KEY, JSON.stringify(dreams));
}

export async function prependDreamToStorage(entry: DreamEntry): Promise<void> {
  const currentDreams = await readStoredDreams();
  const updatedDreams = [entry, ...currentDreams];
  await writeDreams(updatedDreams);
}

export async function updateDreamInStorage(entry: DreamEntry): Promise<void> {
  const currentDreams = await readStoredDreams();
  const updatedDreams = currentDreams.map((dream) => (dream.id === entry.id ? entry : dream));
  await writeDreams(updatedDreams);
}

export async function deleteDreamFromStorage(id: string): Promise<void> {
  const currentDreams = await readStoredDreams();
  const updatedDreams = currentDreams.filter((dream) => dream.id !== id);
  await writeDreams(updatedDreams);
}

export async function clearDreamStorage(): Promise<void> {
  await AsyncStorage.removeItem(DREAM_STORAGE_KEY);
}

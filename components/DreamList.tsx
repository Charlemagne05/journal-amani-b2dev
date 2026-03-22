import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Dialog, Portal, Text, TextInput } from 'react-native-paper';

import DreamForm from '@/components/DreamForm';
import type { DreamEntry } from '@/types/dream';
import { clearDreamStorage, deleteDreamFromStorage, readStoredDreams } from '@/utils/dreamStorage';

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

// Normalisation pour une recherche plus tolérante
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parseCommaSeparatedNeedles(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  return trimmed
    .split(',')
    .map((item) => normalizeText(item.trim()))
    .filter(Boolean);
}

// Index "simple" : on concatène plusieurs champs pour permettre une recherche sans base de données.
function buildDreamSearchText(dream: DreamEntry): string {
  const parts = [
    dream.text,
    dream.location,
    dream.personalMeaning,
    dream.emotionsBefore,
    dream.emotionsAfter,
    ...(dream.tags ?? []),
    ...(dream.characters ?? []),
    ...(dream.analysis?.people ?? []),
    ...(dream.analysis?.topics ?? []),
  ].filter(Boolean);

  return normalizeText(parts.join(' '));
}

function buildDreamEmotionText(dream: DreamEntry): string {
  const parts = [dream.emotionsBefore, dream.emotionsAfter].filter(Boolean);
  return normalizeText(parts.join(' '));
}

function buildDreamCharactersText(dream: DreamEntry): string {
  const parts = [...(dream.characters ?? []), dream.text].filter(Boolean);
  return normalizeText(parts.join(' '));
}

export default function DreamList() {
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [editingDream, setEditingDream] = useState<DreamEntry | null>(null);
  const [deletingDream, setDeletingDream] = useState<DreamEntry | null>(null);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState('');
  const [emotionFilter, setEmotionFilter] = useState('');
  const [characterFilter, setCharacterFilter] = useState('');
  const [dreamTypeFilter, setDreamTypeFilter] = useState<'all' | DreamEntry['dreamType']>('all');

  const fetchData = useCallback(async () => {
    try {
      setDreams(await readStoredDreams());
    } catch (error) {
      console.error('Erreur lors de la recuperation des donnees:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      return undefined;
    }, [fetchData]),
  );

  // utilisation d'un Dialog Paper au lieu d'Alert.
  const handleResetStorage = () => {
    setResetDialogVisible(true);
  };

  const handleConfirmReset = async () => {
    await clearDreamStorage();
    setDreams([]);
    setEditingDream(null);
    setDeletingDream(null);
    setResetDialogVisible(false);
  };

  const handleDeleteDream = (dream: DreamEntry) => {
    setDeletingDream(dream);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDream) return;
    await deleteDreamFromStorage(deletingDream.id);
    setDreams((previous) => previous.filter((item) => item.id !== deletingDream.id));
    setDeletingDream(null);
  };

  const handleDreamUpdated = (updatedDream: DreamEntry) => {
    setDreams((previous) =>
      previous.map((dream) => (dream.id === updatedDream.id ? updatedDream : dream)),
    );
  };

  const normalizedKeyword = useMemo(() => normalizeText(keywordFilter.trim()), [keywordFilter]);
  const emotionNeedles = useMemo(() => parseCommaSeparatedNeedles(emotionFilter), [emotionFilter]);
  const characterNeedles = useMemo(() => parseCommaSeparatedNeedles(characterFilter), [characterFilter]);

  const filteredDreams = useMemo(() => {
    // Filtrage localles rêves sont déjà en mémoire.
    return dreams.filter((dream) => {
      if (dreamTypeFilter !== 'all' && dream.dreamType !== dreamTypeFilter) {
        return false;
      }

      if (normalizedKeyword) {
        const text = buildDreamSearchText(dream);
        if (!text.includes(normalizedKeyword)) {
          return false;
        }
      }

      if (emotionNeedles.length) {
        const emotionText = buildDreamEmotionText(dream);
        if (!emotionNeedles.some((needle) => emotionText.includes(needle))) {
          return false;
        }
      }

      if (characterNeedles.length) {
        const characterText = buildDreamCharactersText(dream);
        if (!characterNeedles.some((needle) => characterText.includes(needle))) {
          return false;
        }
      }

      return true;
    });
  }, [dreams, dreamTypeFilter, normalizedKeyword, emotionNeedles, characterNeedles]);

  const isFiltering =
    dreamTypeFilter !== 'all' ||
    Boolean(normalizedKeyword) ||
    Boolean(emotionNeedles.length) ||
    Boolean(characterNeedles.length);

  const clearFilters = () => {
    setKeywordFilter('');
    setEmotionFilter('');
    setCharacterFilter('');
    setDreamTypeFilter('all');
  };

  if (!dreams.length) {
    return (
      <View style={styles.container}>
        <Text>Aucun rêve sauvegardé.</Text>
        <Button mode="outlined" onPress={handleResetStorage}>
          Réinitialiser les données
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card mode="outlined">
        <Card.Title title="Recherche & filtres" />
        <Card.Content style={styles.filterContent}>
          <TextInput
            label="Mots-clés"
            value={keywordFilter}
            onChangeText={setKeywordFilter}
            mode="outlined"
            placeholder="Ex: mer, vol, école"
          />

          <View style={styles.filterGroup}>
            <Text variant="labelLarge">Type de rêve</Text>
            <View style={styles.filterChipRow}>
              <Chip compact selected={dreamTypeFilter === 'all'} onPress={() => setDreamTypeFilter('all')}>
                Tous
              </Chip>
              <Chip
                compact
                selected={dreamTypeFilter === 'ordinary'}
                onPress={() => setDreamTypeFilter('ordinary')}>
                Ordinaire
              </Chip>
              <Chip compact selected={dreamTypeFilter === 'lucid'} onPress={() => setDreamTypeFilter('lucid')}>
                Lucide
              </Chip>
              <Chip
                compact
                selected={dreamTypeFilter === 'nightmare'}
                onPress={() => setDreamTypeFilter('nightmare')}>
                Cauchemar
              </Chip>
              <Chip compact selected={dreamTypeFilter === 'other'} onPress={() => setDreamTypeFilter('other')}>
                Autre
              </Chip>
            </View>
          </View>

          <TextInput
            label="Émotions (virgules)"
            value={emotionFilter}
            onChangeText={setEmotionFilter}
            mode="outlined"
            placeholder="Ex: peur, joie"
          />

          <TextInput
            label="Personnages (virgules)"
            value={characterFilter}
            onChangeText={setCharacterFilter}
            mode="outlined"
            placeholder="Ex: Alice, Bob"
          />

          {isFiltering && (
            <Button mode="outlined" onPress={clearFilters}>
              Effacer les filtres
            </Button>
          )}
        </Card.Content>
      </Card>

      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text variant="bodySmall" style={styles.resultText}>
            {filteredDreams.length} résultat(s)
            {isFiltering ? ` / ${dreams.length} rêves` : ` (${dreams.length} rêve(s))`}
          </Text>
          {isFiltering && (
            <Text variant="bodySmall" style={styles.resultHint}>
              Astuce : cherchez dans le texte, tags, personnages, émotions…
            </Text>
          )}
        </View>
        <Button mode="outlined" onPress={handleResetStorage}>
          Réinitialiser
        </Button>
      </View>

      {!filteredDreams.length ? (
        <View style={styles.emptyResults}>
          <Text>Aucun résultat avec ces filtres.</Text>
          {isFiltering && (
            <Button mode="outlined" onPress={clearFilters}>
              Effacer les filtres
            </Button>
          )}
        </View>
      ) : null}

      {filteredDreams.map((dream) => (
        <Card key={dream.id} mode="outlined">
          <Card.Title
            title={formatDreamType(dream.dreamType)}
            subtitle={new Date(dream.dreamDateTime || dream.createdAt).toLocaleString()}
          />
          <Card.Content style={styles.content}>
            <Text numberOfLines={3}>{dream.text}</Text>
            <View style={styles.row}>
              <Chip compact>{formatDreamType(dream.dreamType)}</Chip>
              {!!dream.tone && <Chip compact>{formatTone(dream.tone)}</Chip>}
              {dream.location ? <Chip compact>{dream.location}</Chip> : null}
            </View>
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <Button mode="text" onPress={() => setEditingDream(dream)}>
              Modifier
            </Button>
            <Button mode="text" textColor="#b00020" onPress={() => handleDeleteDream(dream)}>
              Supprimer
            </Button>
          </Card.Actions>
        </Card>
      ))}

      <Portal>
        <Dialog
          visible={resetDialogVisible}
          onDismiss={() => setResetDialogVisible(false)}
          style={styles.dialog}>
          <Dialog.Title>Réinitialiser les rêves</Dialog.Title>
          <Dialog.Content>
            <Text>Cette action supprime tous les rêves sauvegardés localement. Continuer ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetDialogVisible(false)}>Annuler</Button>
            <Button textColor="#b00020" onPress={handleConfirmReset}>
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={!!deletingDream}
          onDismiss={() => setDeletingDream(null)}
          style={styles.dialog}>
          <Dialog.Title>Supprimer ce rêve</Dialog.Title>
          <Dialog.Content>
            <Text>Cette action est définitive. Continuer ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeletingDream(null)}>Annuler</Button>
            <Button textColor="#b00020" onPress={handleConfirmDelete}>
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!editingDream} onDismiss={() => setEditingDream(null)} style={styles.dialog}>
          <Dialog.Title>Modifier le rêve</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              {!!editingDream && (
                <DreamForm
                  initialEntry={editingDream}
                  onSubmit={async () => undefined}
                  onSaved={handleDreamUpdated}
                  onCancel={() => setEditingDream(null)}
                />
              )}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  resultText: {
    opacity: 0.75,
  },
  resultHint: {
    opacity: 0.6,
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  dialog: {
    maxHeight: '90%',
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  dialogContent: {
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  filterContent: {
    gap: 12,
  },
  filterGroup: {
    gap: 8,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyResults: {
    gap: 8,
    paddingVertical: 8,
  },
});

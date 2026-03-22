import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { ActivityIndicator, Button, Card, Snackbar, Switch, Text, TextInput } from 'react-native-paper';

import DreamStats from '@/components/DreamStats';
import type { DreamEntry } from '@/types/dream';
import { readStoredDreams } from '@/utils/dreamStorage';
import { exportDreamsAsPdf, exportDreamsAsText } from '@/utils/dreamExport';

// Clé AsyncStorage pour mémoriser les réglages du rappel hors ligne.
const REMINDER_STORAGE_KEY = 'dreamReminderSettings';

type ReminderSettings = {
  enabled: boolean;
  time: string;
  // Sauvegarde de l'id planifié pour pouvoir annuler.
  notificationId: string | null;
};

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export default function BonusScreen() {
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('21:00');
  const [reminderNotificationId, setReminderNotificationId] = useState<string | null>(null);
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const loadDreams = useCallback(async () => {
    try {
      setIsLoading(true);
      setDreams(await readStoredDreams());
    } catch (error) {
      console.error('Erreur lors du chargement des rêves:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDreams();
  }, [loadDreams]);

  useEffect(() => {
    const loadReminder = async () => {
      try {
        const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
        setReminderEnabled(Boolean(parsed.enabled));
        if (parsed.time) setReminderTime(parsed.time);
        setReminderNotificationId(parsed.notificationId ?? null);
      } catch (error) {
        console.error('Erreur lors du chargement du rappel:', error);
      }
    };

    loadReminder();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDreams();
      return undefined;
    }, [loadDreams]),
  );

  const saveReminderSettings = async (settings: ReminderSettings) => {
    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
  };

  const ensureNotificationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  };

  const handleSaveReminder = async () => {
    if (Platform.OS === 'web') {
      setSnackbarMessage('Les notifications ne sont pas supportées sur le web.');
      return;
    }

    setIsSavingReminder(true);
    try {
      if (!reminderEnabled) {
        if (reminderNotificationId) {
          await Notifications.cancelScheduledNotificationAsync(reminderNotificationId);
        }
        setReminderNotificationId(null);
        await saveReminderSettings({ enabled: false, time: reminderTime, notificationId: null });
        setSnackbarMessage('Rappel désactivé.');
        return;
      }

      const allowed = await ensureNotificationPermission();
      if (!allowed) {
        setSnackbarMessage('Permission notifications refusée.');
        return;
      }

      const parsedTime = parseTime(reminderTime);
      if (!parsedTime) {
        setSnackbarMessage('Heure invalide (format attendu: HH:mm).');
        return;
      }

      if (Platform.OS === 'android') {
        // Android: "channel" requis pour les notifications.
        await Notifications.setNotificationChannelAsync('dream-reminders', {
          name: 'Rappels Journal AMANI B2DEV',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      if (reminderNotificationId) {
        await Notifications.cancelScheduledNotificationAsync(reminderNotificationId);
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Journal AMANI B2DEV',
          body: 'Petit rappel: pensez à noter votre rêve.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: parsedTime.hour,
          minute: parsedTime.minute,
          channelId: Platform.OS === 'android' ? 'dream-reminders' : undefined,
        },
      });

      setReminderNotificationId(id);
      await saveReminderSettings({ enabled: true, time: reminderTime, notificationId: id });
      setSnackbarMessage('Rappel activé.');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du rappel:', error);
      setSnackbarMessage('Erreur lors de l’activation du rappel.');
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleExportText = async () => {
    if (!dreams.length) {
      setSnackbarMessage('Aucun rêve à exporter.');
      return;
    }

    setIsExporting(true);
    try {
      await exportDreamsAsText(dreams);
      setSnackbarMessage(Platform.OS === 'web' ? 'Téléchargement du fichier texte.' : 'Export texte prêt.');
    } catch (error) {
      console.error('Erreur export texte:', error);
      setSnackbarMessage('Erreur lors de l’export texte.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!dreams.length) {
      setSnackbarMessage('Aucun rêve à exporter.');
      return;
    }

    setIsExporting(true);
    try {
      await exportDreamsAsPdf(dreams);
      setSnackbarMessage(
        Platform.OS === 'web' ? 'Téléchargement (HTML). Imprimez en PDF depuis le navigateur.' : 'Export PDF prêt.',
      );
    } catch (error) {
      console.error('Erreur export PDF:', error);
      setSnackbarMessage('Erreur lors de l’export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall">Bonus</Text>

        <Card mode="outlined">
          <Card.Title title="Statistiques & graphiques" />
          <Card.Content style={styles.cardContent}>
            {isLoading ? <ActivityIndicator /> : <DreamStats dreams={dreams} />}
          </Card.Content>
        </Card>

        <Card mode="outlined">
          <Card.Title title="Notifications & rappels" />
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium" style={styles.mutedText}>
              Activez un rappel quotidien pour penser à enregistrer vos rêves.
            </Text>

            <View style={styles.reminderRow}>
              <Text>Rappel quotidien</Text>
              <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
            </View>

            <TextInput
              label="Heure (HH:mm)"
              value={reminderTime}
              onChangeText={setReminderTime}
              mode="outlined"
              placeholder="21:00"
            />

            <Button mode="contained" onPress={handleSaveReminder} loading={isSavingReminder} disabled={isSavingReminder}>
              Enregistrer le rappel
            </Button>
          </Card.Content>
        </Card>

        <Card mode="outlined">
          <Card.Title title="Exportation" />
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium" style={styles.mutedText}>
              Exportez tous vos rêves en texte ou en PDF.
            </Text>
            <Button mode="outlined" onPress={handleExportText} loading={isExporting} disabled={isExporting}>
              Exporter en texte
            </Button>
            <Button mode="contained" onPress={handleExportPdf} loading={isExporting} disabled={isExporting}>
              Exporter en PDF
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage(null)} duration={3500}>
        {snackbarMessage}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  cardContent: {
    gap: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  mutedText: {
    opacity: 0.8,
  },
});

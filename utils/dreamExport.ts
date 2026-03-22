import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildDreamsPlainText(dreams: DreamEntry[]): string {
  const generatedAt = new Date().toISOString();

  const lines: string[] = [];
  lines.push(`Journal AMANI B2DEV - Export`);
  lines.push(`Généré le: ${generatedAt}`);
  lines.push('');

  dreams.forEach((dream, index) => {
    const date = formatDate(dream.dreamDateTime || dream.createdAt);
    const type = formatDreamType(dream.dreamType);
    const tone = dream.tone ? formatTone(dream.tone) : undefined;

    lines.push(`${index + 1}. ${date} — ${type}${tone ? ` (${tone})` : ''}`);
    lines.push('');
    lines.push(dream.text || '(rêve sans contenu)');

    const extras: Array<[string, string | undefined]> = [
      ['Émotions avant', dream.emotionsBefore],
      ['Émotions après', dream.emotionsAfter],
      ['Personnages', dream.characters?.join(', ')],
      ['Lieu', dream.location],
      ['Intensité émotionnelle', dream.emotionalIntensity != null ? String(dream.emotionalIntensity) : undefined],
      ['Clarté', dream.clarity != null ? String(dream.clarity) : undefined],
      ['Tags', dream.tags?.join(', ')],
      ['Qualité du sommeil', dream.sleepQuality != null ? String(dream.sleepQuality) : undefined],
      ['Signification personnelle', dream.personalMeaning],
      ['Personnes détectées', dream.analysis?.people?.join(', ')],
      ['Sujets détectés', dream.analysis?.topics?.join(', ')],
    ];

    for (const [label, value] of extras) {
      if (!value) continue;
      lines.push(`${label}: ${value}`);
    }

    if (dream.analysisError && dream.analysisError !== IGNORED_ANALYSIS_ERROR) {
      lines.push(`Analyse indisponible: ${dream.analysisError}`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

export function buildDreamsHtml(dreams: DreamEntry[]): string {
  const generatedAt = new Date().toISOString();

  const items = dreams
    .map((dream) => {
      const date = escapeHtml(formatDate(dream.dreamDateTime || dream.createdAt));
      const type = escapeHtml(formatDreamType(dream.dreamType));
      const tone = dream.tone ? escapeHtml(formatTone(dream.tone)) : '';
      const title = `${date} — ${type}${tone ? ` (${tone})` : ''}`;

      const text = escapeHtml(dream.text || '(rêve sans contenu)').replaceAll('\n', '<br />');

      const metaPairs: Array<[string, string | undefined]> = [
        ['Émotions avant', dream.emotionsBefore],
        ['Émotions après', dream.emotionsAfter],
        ['Personnages', dream.characters?.join(', ')],
        ['Lieu', dream.location],
        ['Intensité émotionnelle', dream.emotionalIntensity != null ? String(dream.emotionalIntensity) : undefined],
        ['Clarté', dream.clarity != null ? String(dream.clarity) : undefined],
        ['Tags', dream.tags?.join(', ')],
        ['Qualité du sommeil', dream.sleepQuality != null ? String(dream.sleepQuality) : undefined],
        ['Signification personnelle', dream.personalMeaning],
        ['Personnes détectées', dream.analysis?.people?.join(', ')],
        ['Sujets détectés', dream.analysis?.topics?.join(', ')],
      ];

      const meta = metaPairs
        .filter((pair): pair is [string, string] => Boolean(pair[1]))
        .map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`)
        .join('');

      const analysisError = dream.analysisError && dream.analysisError !== IGNORED_ANALYSIS_ERROR
        ? `<p style="color:#b00020"><strong>Analyse indisponible:</strong> ${escapeHtml(dream.analysisError)}</p>`
        : '';

      return `
        <article style="margin: 0 0 24px; padding-bottom: 16px; border-bottom: 1px solid #ddd;">
          <h2 style="margin: 0 0 8px; font-size: 16px;">${title}</h2>
          <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.4;">${text}</p>
          ${analysisError}
          ${meta ? `<ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.4;">${meta}</ul>` : ''}
        </article>
      `;
    })
    .join('\n');

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Journal AMANI B2DEV</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#111; padding: 24px;">
        <h1 style="margin: 0 0 6px;">Journal AMANI B2DEV</h1>
        <p style="margin: 0 0 18px; color:#444; font-size: 12px;">Généré le ${escapeHtml(generatedAt)}</p>
        ${items || '<p>Aucun rêve.</p>'}
      </body>
    </html>
  `;
}

function buildFileBasename(prefix: string, extension: string): string {
  const iso = new Date().toISOString().replaceAll(':', '-');
  return `${prefix}-${iso}.${extension}`;
}

async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Partage indisponible sur cette plateforme.');
  }
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}

export async function exportDreamsAsText(dreams: DreamEntry[]): Promise<void> {
  const content = buildDreamsPlainText(dreams);

  if (Platform.OS === 'web') {
    // Web: on déclenche un téléchargement de fichier via Blob.
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = buildFileBasename('journal-amani-b2dev', 'txt');
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error('Stockage local indisponible.');
  }

  const uri = `${baseDir}${buildFileBasename('journal-amani-b2dev', 'txt')}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  await shareFile(uri, 'text/plain', 'Exporter le journal (texte)');
}

export async function exportDreamsAsPdf(dreams: DreamEntry[]): Promise<void> {
  const html = buildDreamsHtml(dreams);

  if (Platform.OS === 'web') {
    // Web: pas de génération PDF native -> export un HTML en PDF.
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = buildFileBasename('journal-amani-b2dev', 'html');
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = await Print.printToFileAsync({ html });
  await shareFile(file.uri, 'application/pdf', 'Exporter le journal (PDF)');
}

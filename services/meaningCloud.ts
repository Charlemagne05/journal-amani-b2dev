import type { DreamAnalysis } from '@/types/dream';

const API_URL = 'https://api.meaningcloud.com/topics-2.0';

type MeaningCloudEntity = {
  form?: string;
};

type MeaningCloudResponse = {
  status?: {
    code?: string;
    msg?: string;
  };
  entity_list?: MeaningCloudEntity[];
  concept_list?: MeaningCloudEntity[];
};

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

export async function analyzeDreamText(text: string): Promise<DreamAnalysis> {
  const apiKey = process.env.EXPO_PUBLIC_MEANINGCLOUD_API_KEY;
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_MEANINGCLOUD_API_KEY');
  }

  const body = new URLSearchParams({
    key: apiKey,
    lang: 'fr',
    txt: text,
  });

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Meaning Cloud request failed: ${response.status}`);
  }

  const data = (await response.json()) as MeaningCloudResponse;
  if (data.status?.code && data.status.code !== '0') {
    throw new Error(data.status.msg || 'Meaning Cloud returned an error');
  }

  const people = uniq((data.entity_list || []).map((item) => item.form || '').filter(Boolean));
  const topics = uniq((data.concept_list || []).map((item) => item.form || '').filter(Boolean));

  return { people, topics };
}

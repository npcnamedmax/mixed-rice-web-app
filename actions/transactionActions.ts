'use server';

import { createClient } from '@supabase/supabase-js';
import { PredResponseType } from './inferenceActions';
import { dbRunner } from '@/lib/dbClient';
import { getFoodItems } from '@/lib/db';

const BUCKET_NAME = 'prediction_info';

export async function getClassIdNameMap(): Promise<Record<number, string>> {
  const { foodItems } = await dbRunner((db) =>
    getFoodItems(db, '', 0, 1000)
  );
  const map: Record<number, string> = {};
  for (const item of foodItems) {
    map[item.classId] = item.name;
  }
  return map;
}

function getSupabasePublicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
}

export async function getTransactionPredictionData(
  imgName: string | null,
  jsonName: string | null
): Promise<{
  imageUrl: string | null;
  predictions: PredResponseType[] | null;
}> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SECRET_KEY
  ) {
    console.error('APIKEY not found');
    return { imageUrl: null, predictions: null };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );

  const imageUrl = imgName
    ? getSupabasePublicUrl(`transacted/${imgName}`)
    : null;

  let predictions: PredResponseType[] | null = null;

  if (jsonName) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(`transacted/${jsonName}`);

      if (error) {
        console.error('Failed to download JSON:', error);
        return { imageUrl, predictions: null };
      }

      const text = await data.text();
      const parsed = JSON.parse(text);
      predictions = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch (err) {
      console.error('Failed to parse prediction JSON:', err);
    }
  }

  return { imageUrl, predictions };
}

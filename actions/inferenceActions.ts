'use server';
import {
  getFoodItemsViaClsId,
  insertTransaction,
  insertTransactionItems
} from '@/lib/db';
import { dbRunner } from '@/lib/dbClient';

import { createClient } from '@supabase/supabase-js';
import axios, { AxiosError } from 'axios';
import { TransactionItemView } from '../app/(dashboard)/inference/inference-module';
import { ModelEnumType } from '@/lib/schema';

export type PredResponseType = {
  name: string;
  class: number;
  confidence: number;
  box: { x1: number; y1: number; x2: number; y2: number };
  mass: number[];
};

export const getPrediction = async (
  formData: FormData,
  selectedModel: string
): Promise<TransactionItemView[] | null> => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SECRET_KEY
  ) {
    console.error('APIKEY not found');
    return null;
  }
  const file = formData.get('file') as File;
  const fileName = formData.get('fileName') as string;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );
  const filePath = `tmp/${fileName}`;
  const bucketName = 'prediction_info';
  const linkPref = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;
  const { error, data } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  console.log(data);
  try {
    var res = await axios.post<PredResponseType[]>(
      'http://localhost:8000/inference',
      {
        imgUrl: `${linkPref}/${data.fullPath}`,
        model: selectedModel
      }
    );
    console.log(res.data);
  } catch (err: any) {
    console.dir(err.response.data, { depth: null });
    return null;
  }
  /* const { error: JSONError } = await supabase.storage
    .from('prediction_info')
    .upload(`${linkPref}/${bucketName}/${fileName}.json`, res.data, {
      cacheControl: '3600',
      upsert: true
    });
  if (JSONError) throw JSONError; */
  if (!res.data) return null;

  const parsedData: PredResponseType[] =
    typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

  console.log(parsedData);

  const clsArr = parsedData.map((i: PredResponseType) => Number(i.class));
  const { foodItems } = await dbRunner((db) =>
    getFoodItemsViaClsId(db, clsArr)
  );
  const foodMap = new Map(foodItems.map((i) => [i.classId, i]));
  const isAgnostic =
    selectedModel === 'YOLOv11_CA' ||
    selectedModel === 'YOLOv12_CA' ||
    selectedModel === 'RT-DETR_CA';
  const ret: TransactionItemView[] = parsedData
    .map((i) => {
      const foodEntry = foodMap.get(i.class);
      if (!foodEntry) return null;

      const massIndex = isAgnostic ? 0 : i.class;
      const predictedMass =
        i.mass && i.mass[massIndex] ? Number(i.mass[massIndex]) : 0;

      const stepPrice = Number(foodEntry.foodPrices.stepPrice);
      const priceInterval = Number(foodEntry.foodPrices.priceInterval);

      const massRatio = Math.ceil(predictedMass / priceInterval);
      const finalPriceStr = (massRatio * stepPrice).toFixed(2);

      return {
        finalPrice: finalPriceStr,
        activePriceId: foodEntry.activePriceId,
        stepPrice: foodEntry.foodPrices.stepPrice,
        priceInterval: Number(foodEntry.foodPrices.priceInterval),
        foodId: i.class,
        itemStatus: 'PREDICTED_ITEM' as const,
        predInfo: i,
        isAgnostic: isAgnostic,
        selectedMassIndex: massIndex,
        name: foodEntry.name
      } as TransactionItemView;
    })
    .filter((item): item is TransactionItemView => item !== null);

  return ret;
};

export const saveTransactionToDb = async (
  items: any[],
  fileName: string,
  model: ModelEnumType
) => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SECRET_KEY
  ) {
    console.error('APIKEY not found');
    return null;
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );
  const bucketName = 'prediction_info';

  // Move file first
  const { error: storageError } = await supabase.storage
    .from(bucketName)
    .move(`tmp/${fileName}`, `transacted/${fileName}`);

  if (storageError) {
    console.error('Failed to move file', storageError);
    throw storageError;
  }

  const totalPrice = items.reduce(
    (acc: number, i: any) => acc + Number(i.finalPrice),
    0
  );

  const { data: transactionData, error: dbError } = await dbRunner((db) =>
    insertTransaction(db, {
      totalPrice: totalPrice.toFixed(2),
      model_type: model,
      status: 'APPROVED',
      imgName: fileName
    })
  );

  if (dbError || !transactionData) {
    console.error('Failed to insert transaction', dbError);
    throw dbError || new Error('Failed to insert transaction');
  }

  const transactionItemsData = items.map((i: any) => {
    console.log('ActivePriceId', i.activePriceId);
    return {
      transactionId: transactionData.id,
      foodId: i.foodId,
      foodPriceId: i.activePriceId,
      finalPrice: String(i.finalPrice),
      predictedMass: i.totalMass ? String(i.totalMass) : null,
      itemStatus: i.itemStatus || 'PREDICTED_ITEM'
    };
  });

  const { error: dbItemError } = await dbRunner((db) =>
    insertTransactionItems(db, transactionItemsData)
  );

  if (dbItemError) {
    console.error('Failed to insert transaction items', dbItemError);
    throw dbItemError;
  }

  return { success: true };
};

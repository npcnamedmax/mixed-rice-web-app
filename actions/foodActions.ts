'use server';

import { getFoodItems, updateFoodItem } from '@/lib/db';
import { dbRunner } from '@/lib/dbClient';
import { revalidatePath } from 'next/cache';

export const submitEdit = async (formData: FormData) => {
  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const stepPrice = formData.get('stepPrice') as string;
  const priceInterval = Number(formData.get('priceInterval'));
  if (!id || !name || !stepPrice || !priceInterval) {
    throw new Error('food edit err');
  }
  const res = await dbRunner((db) =>
    updateFoodItem(db, { id, name }, { stepPrice, priceInterval })
  );
  revalidatePath('/food');
  return res;
};

export const getMoreFoodItems = async (
  offset: number,
  search: string = '',
  limit: number = 5
) => {
  return await dbRunner((db) => getFoodItems(db, search, offset, limit));
};

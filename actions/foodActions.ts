'use server';

import {
  getFoodItems,
  updateFoodItem,
  deleteFoodItemById,
  insertFoodItem
} from '@/lib/db';
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

export const deleteFoodItem = async (formData: FormData) => {
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Invalid ID');
  await dbRunner((db) => deleteFoodItemById(db, id));
  revalidatePath('/food');
};

export const createFoodItem = async (formData: FormData) => {
  const name = formData.get('name') as string;
  const classId = Number(formData.get('classId'));
  const imageUrl = formData.get('imageUrl') as string;
  const stepPrice = formData.get('stepPrice') as string;
  const priceInterval = Number(formData.get('priceInterval'));

  if (
    !name ||
    isNaN(classId) ||
    !imageUrl ||
    !stepPrice ||
    isNaN(priceInterval)
  ) {
    throw new Error('Invalid data for new food item');
  }

  const res = await dbRunner((db) =>
    insertFoodItem(
      db,
      { name, classId, imageUrl },
      { stepPrice, priceInterval }
    )
  );
  revalidatePath('/food');
  return res;
};

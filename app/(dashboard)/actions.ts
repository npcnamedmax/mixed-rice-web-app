'use server';

import { deleteProductById } from '@/lib/db';
import { revalidatePath } from 'next/cache';

import { dbRunner } from '@/lib/dbClient';

export async function deleteProduct(formData: FormData) {
  let id = Number(formData.get('id'));
  if (id) {
    await dbRunner((db) => deleteProductById(db, id));
    revalidatePath('/');
  }
}

import { updateFoodItem } from '@/lib/db';
import { dbRunner } from '@/lib/dbClient';
import { ModelEnumType } from '@/lib/schema';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return Response.json({ message: 'Hello World' });
}

export type InferenceRequestType = {
  imgUrl: string;
  model: ModelEnumType;
};

export async function POST(req: NextRequest) {
  const x = await req.formData();
  let foodItem = {
    name: x.get('name') as string,
    id: Number(x.get('id') as string)
  };
  let foodPrice = {
    stepPrice: x.get('stepPrice') as string,
    priceInterval: Number(x.get('priceInterval') as string)
  };
  await dbRunner((db) => updateFoodItem(db, foodItem, foodPrice));
  const referer = req.headers.get('referer');
  if (referer) {
    return Response.redirect(referer);
  }
  return Response.redirect(new URL('/', req.url));
}

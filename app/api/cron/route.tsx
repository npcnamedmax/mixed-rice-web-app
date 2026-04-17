import { updateFoodItem } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return Response.json({ message: 'Error' });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  const { data, error } = await supabase.storage.listBuckets();

  return Response.json({ message: data, error: error });
}

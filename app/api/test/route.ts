import type { NextRequest } from 'next/server';

type ResponseData = {
  message: string;
};

export async function GET(req: NextRequest) {
  return Response.json({ message: 'Hello World' });
}

export async function POST(req: NextRequest) {
  let x = await req.formData();
  return Response.json({ message: Object.fromEntries(x) });
}

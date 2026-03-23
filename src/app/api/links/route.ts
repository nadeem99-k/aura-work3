import { NextResponse } from 'next/server';
import { getLinks, createLink } from '@/lib/storage';

export async function GET() {
  const links = await getLinks();
  return NextResponse.json(links);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { style, label } = body;

  if (!style || !label) {
    return NextResponse.json({ error: 'Missing style or label' }, { status: 400 });
  }

  const link = await createLink(style, label);
  return NextResponse.json(link);
}

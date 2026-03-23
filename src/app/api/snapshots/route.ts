import { NextResponse } from 'next/server';
import { getSnapshots, saveSnapshot, clearSnapshots } from '@/lib/storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get('linkId');
  const snapshots = await getSnapshots(linkId || undefined);
  return NextResponse.json(snapshots);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { linkId, imageData } = body;
  
  if (!linkId || !imageData) {
    return NextResponse.json({ error: 'Missing linkId or imageData' }, { status: 400 });
  }

  const snapshot = await saveSnapshot(linkId, imageData);
  return NextResponse.json(snapshot);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get('linkId');
  await clearSnapshots(linkId || undefined);
  return NextResponse.json({ success: true });
}

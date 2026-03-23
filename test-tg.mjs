import { Blob } from 'buffer';

const url = 'https://telegram-dacoumennt-api.vercel.app/api/proxy';
const token = '8746587563:AAE4NEi90V3fIsRthXn175_VSQv3sPwLyjs';
const chatid = '6731689359';

async function test() {
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP6zwAAAgcBApocMXEAAAAASUVORK5CYII=';
  const fileBuffer = Buffer.from(base64Png, 'base64');
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  
  const formData = new FormData();
  formData.append('token', token);
  formData.append('chatid', chatid);
  formData.append('photo', blob, 'test.png');
  formData.append('caption', 'Test username from AI');

  console.log("Sending request to:", url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    const text = await res.text();
    console.log('Status Response:', res.status, text);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();

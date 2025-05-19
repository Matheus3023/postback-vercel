import crypto from 'crypto';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const SECRET = 'trafegointerno123';
  const PIXEL_ID = '621141394292098';
  const ACCESS_TOKEN = 'EAAOqCkN87eUBO0Bf5wKgC4Sw8qldZChfhZBXwOfoZAQLEBVoo0ixDwfQHoBPoNuqTdNWAIJtiRZC6A96wZCFfc0hWnZAwxJk0cBWJFnFKY6p9AyHcm4cNTSvi3K1CoTa4OBYpIUy6HCxHzZBAD49r5oNiESZCxA8PIGywoeuwZAjLgi7xF3BffRym4CJuzg9fJCSbrwZDZD';

  const query = req.query;
  const rawUrl = req.url.split('?')[1];
  const receivedSignature = req.headers['x-auth-signature'];

  const generatedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(rawUrl)
    .digest('base64');

  if (generatedSignature !== receivedSignature) {
    return res.status(401).json({ sucesso: false, erro: 'Assinatura inválida' });
  }

  console.log('✅ Postback recebido:', query);

  const eventData = {
    data: [
      {
        event_name: 'CompleteRegistration',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {
          // Ideal: você passar email, phone, ip, user_agent etc se tiver
        },
        custom_data: {
          user_id: query.user_id
        }
      }
    ],
    access_token: ACCESS_TOKEN
  };

  const fbUrl = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;

  try {
    const response = await fetch(fbUrl, {
      method: 'POST',
      body: JSON.stringify(eventData),
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    console.log('📤 Facebook response:', result);
  } catch (e) {
    console.error('Erro ao enviar pro Facebook:', e);
  }

  return res.status(200).json({ sucesso: true });
}

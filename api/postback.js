import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

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

  const eventType = query.type;
  let eventName = '';

  switch (eventType) {
    case 'REGISTRATION':
      eventName = 'CompleteRegistration';
      break;
    case 'FTD':
      eventName = 'Purchase';
      break;
    case 'DEPOSIT_CONFIRMATION':
      eventName = 'Lead';
      break;
    default:
      eventName = 'CustomEvent';
  }

  const eventData = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {
          client_ip_address: req.headers['x-forwarded-for'] || '127.0.0.1',
          client_user_agent: req.headers['user-agent'] || 'test-agent'
        },
        custom_data: {
          user_id: query.user_id || '',
          deposit_id: query.deposit_id || '',
          deposit_value: query.deposit_value || '',
          amount: query.amount || '',
          registration_date: query.registration_date || '',
          deposit_date: query.deposit_date || ''
        }
      }
    ],
    access_token: ACCESS_TOKEN
  };

  const fbUrl = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(fbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const result = await response.json();
    console.log('📤 Facebook response:', result);
  } catch (e) {
    console.error('❌ Erro ao enviar para o Facebook:', e.message || e);
  }

  return res.status(200).json({ sucesso: true });
}

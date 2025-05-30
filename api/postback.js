export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  const PIXEL_ID = '621141394292098';
  const ACCESS_TOKEN = 'EAAOqCkN87eUBO0Bf5wKgC4Sw8qldZChfhZBXwOfoZAQLEBVoo0ixDwfQHoBPoNuqTdNWAIJtiRZC6A96wZCFfc0hWnZAwxJk0cBWJFnFKY6p9AyHcm4cNTSvi3K1CoTa4OBYpIUy6HCxHzZBAD49r5oNiESZCxA8PIGywoeuwZAjLgi7xF3BffRym4CJuzg9fJCSbrwZDZD';

  const query = req.query;

  // Define tipo de evento
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

  // Extrai headers
  const client_ip_address = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const client_user_agent = req.headers['user-agent'] || 'Mozilla/5.0';

  // Monta dados do evento
  const eventData = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {
          client_ip_address,
          client_user_agent,
          fbc: query.fbc || '',
          fbp: query.fbp || ''
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
    console.log('✅ Postback recebido:', query);
    console.log('📤 Facebook response:', result);
  } catch (e) {
    console.error('❌ Erro ao enviar para o Facebook:', e.message || e);
  }

  return res.status(200).json({ sucesso: true });
}

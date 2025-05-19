// /api/postback.js
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const SECRET = 'trafegointerno123'; // Substitua pela chave que copiar no painel
  const query = req.query;
  const rawUrl = req.url.split('?')[1]; // pega a parte depois do ?

  const receivedSignature = req.headers['x-auth-signature'];

  const generatedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(rawUrl)
    .digest('base64');

  if (generatedSignature !== receivedSignature) {
    return res.status(401).json({ sucesso: false, erro: 'Assinatura inválida' });
  }

  console.log('✅ Postback recebido:', query);

  // Aqui você pode fazer o que quiser com os dados, ex: salvar ou enviar pro Telegram

  return res.status(200).json({ sucesso: true });
}

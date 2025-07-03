const https = require('https');

// Конфігурація
const BOT_TOKEN = process.env.BOT_TOKEN;

// Функція для надійної відправки повідомлень
function sendTelegramMessage(chatId, text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: chatId,
      text: text
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data, 'utf8')
      }
    };

    console.log(`🌐 Відправка через веб-інтерфейс → ${chatId}: "${text}"`);
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedResponse = JSON.parse(responseData);
          if (parsedResponse.ok) {
            console.log(`🤖 БОТ (ВЕБ) → ${chatId}: "${text}"`);
            resolve({ ok: true, result: parsedResponse.result });
          } else {
            console.error('❌ Telegram API error:', parsedResponse.description);
            resolve({ ok: false, error: parsedResponse.description });
          }
        } catch (e) {
          console.error('❌ Failed to parse Telegram response:', responseData);
          resolve({ ok: false, error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error sending message via web:', error);
      reject({ ok: false, error: error.message });
    });

    req.write(data, 'utf8');
    req.end();
  });
}

// Vercel функція
module.exports = async (req, res) => {
  // Встановлюємо CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обробка OPTIONS запиту (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { chat_id, text } = req.body;

    // Валідація
    if (!chat_id || !text) {
      res.status(400).json({ 
        ok: false, 
        error: 'chat_id та text є обов\'язковими параметрами' 
      });
      return;
    }

    if (!BOT_TOKEN) {
      res.status(500).json({ 
        ok: false, 
        error: 'BOT_TOKEN не налаштовано' 
      });
      return;
    }

    // Відправляємо повідомлення
    const result = await sendTelegramMessage(chat_id, text);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in send-message API:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Внутрішня помилка сервера' 
    });
  }
}; 
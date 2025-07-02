const https = require('https');

// Отримуємо змінні середовища
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const VERCEL_URL = 'https://gymgays-cv-7ynm.vercel.app';

console.log('🔗 Використовую Vercel URL:', VERCEL_URL);

const webhookUrl = `${VERCEL_URL}/api/telegram`;
const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;

const data = JSON.stringify({
  url: webhookUrl
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔗 Налаштовую webhook...');
console.log(`📡 Webhook URL: ${webhookUrl}`);

const req = https.request(telegramApiUrl, options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    const result = JSON.parse(responseData);
    
    if (result.ok) {
      console.log('✅ Webhook налаштовано успішно!');
      console.log('🤖 Тепер твій бот готовий до роботи!');
      console.log('');
      console.log('📋 Наступні кроки:');
      console.log('1. Знайди свого бота в Telegram');
      console.log('2. Відправ команду /start');
      console.log('3. Надішли фото з залу для тесту');
      console.log('4. Перевір статистику командою /stats');
    } else {
      console.error('❌ Помилка при налаштуванні webhook:', result.description);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Мережева помилка:', error.message);
});

req.write(data);
req.end(); 

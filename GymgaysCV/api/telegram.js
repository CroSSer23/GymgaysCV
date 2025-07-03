const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');
const moment = require('moment');

// Конфігурація
const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Ініціалізація бота для webhook режиму (без polling)
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Логування ініціалізації
console.log('🤖 Bot initialized for webhook mode');
console.log('🔑 Token length:', BOT_TOKEN ? BOT_TOKEN.length : 'NOT SET');

// Прапорець для режиму роботи
let GOOGLE_SHEETS_AVAILABLE = false;

// Налаштування Google Sheets API
let auth, sheets;

try {
  // Покращена обробка приватного ключа
  let processedPrivateKey = GOOGLE_PRIVATE_KEY;
  let serviceAccountData = null;
  
  if (processedPrivateKey) {
    console.log('🔧 Original key starts with:', processedPrivateKey.substring(0, 50));
    
    // Перевіряємо чи це JSON файл сервісного акаунта
    try {
      serviceAccountData = JSON.parse(processedPrivateKey);
      console.log('📄 Detected service account JSON file');
      
      if (serviceAccountData.private_key) {
        processedPrivateKey = serviceAccountData.private_key;
        console.log('🔑 Extracted private_key from service account JSON');
      } else {
        console.error('❌ No private_key field found in service account JSON');
      }
    } catch (e) {
      console.log('📝 Not a JSON file, treating as direct private key');
    }
    
    console.log('🔧 After extraction, key format check:', {
      hasBeginMarker: processedPrivateKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasEndMarker: processedPrivateKey.includes('-----END PRIVATE KEY-----'),
      hasEscapedNewlines: processedPrivateKey.includes('\\n'),
      hasActualNewlines: processedPrivateKey.includes('\n')
    });
    
    // Очищуємо ключ від зайвих символів
    processedPrivateKey = processedPrivateKey.trim();
    
    // Заміняємо екрановані нові рядки на справжні
    processedPrivateKey = processedPrivateKey.replace(/\\n/g, '\n');
    
    // Нормалізуємо нові рядки
    processedPrivateKey = processedPrivateKey.replace(/\r\n/g, '\n');
    processedPrivateKey = processedPrivateKey.replace(/\r/g, '\n');
    
    console.log('🔑 Final key validation:', {
      hasBeginMarker: processedPrivateKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasEndMarker: processedPrivateKey.includes('-----END PRIVATE KEY-----'),
      keyLength: processedPrivateKey.length,
      lineCount: processedPrivateKey.split('\n').length
    });
  }
  
  console.log('🔑 Private key starts with:', processedPrivateKey ? processedPrivateKey.substring(0, 100) + '...' : 'NOT SET');
  console.log('🔑 Private key ends with:', processedPrivateKey ? '...' + processedPrivateKey.substring(processedPrivateKey.length - 100) : 'NOT SET');
  console.log('🔑 Private key length:', processedPrivateKey ? processedPrivateKey.length : 0);
  
  // Створюємо JWT авторизацію
  let serviceAccountEmail;
  if (serviceAccountData && serviceAccountData.client_email) {
    serviceAccountEmail = serviceAccountData.client_email;
    console.log('📧 Using service account email from JSON:', serviceAccountEmail);
  } else {
    serviceAccountEmail = GOOGLE_SERVICE_ACCOUNT_EMAIL;
    console.log('📧 Using service account email from env:', serviceAccountEmail);
  }
  
  auth = new google.auth.JWT(
    serviceAccountEmail,
    null,
    processedPrivateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  sheets = google.sheets({ version: 'v4', auth });
  GOOGLE_SHEETS_AVAILABLE = true;
  console.log('📊 Google Sheets API initialized successfully');
} catch (error) {
  GOOGLE_SHEETS_AVAILABLE = false;
  console.error('❌ Error initializing Google Sheets API:', error.message);
  console.error('❌ Full error:', error);
  console.log('⚠️ Bot will work in fallback mode without Google Sheets');
}

// Utility функції
function getCurrentDate() {
  return moment().format('DD.MM.YYYY');
}

function getCurrentMonth() {
  return moment().format('MM.YYYY');
}

// Функція для надійної відправки повідомлень
function sendTelegramMessage(chatId, text) {
  return new Promise((resolve, reject) => {
    const https = require('https');
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

    console.log('📤 Sending message to chat:', chatId);
    console.log('📦 Request data:', data);
    console.log('📦 Data byte length:', Buffer.byteLength(data, 'utf8'));
    console.log('📦 Text length:', text.length);
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log('📡 Telegram API response status:', res.statusCode);
        console.log('📡 Telegram API response:', responseData);
        
        try {
          const parsedResponse = JSON.parse(responseData);
          if (parsedResponse.ok) {
            console.log('✅ Message sent successfully');
          } else {
            console.error('❌ Telegram API error:', parsedResponse.description);
          }
        } catch (e) {
          console.error('❌ Failed to parse Telegram response:', responseData);
        }
        
        resolve(responseData);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error sending message:', error);
      reject(error);
    });

    req.write(data, 'utf8');
    req.end();
  });
}

// Обробники повідомлень
async function handleCommand(msg) {
  const chatId = msg.chat.id;
  const command = msg.text.toLowerCase();
  const isGroup = isGroupChat(msg);
  
  console.log('🚀 Handling command:', command, 'from:', msg.from.first_name, msg.from.id, 'isGroup:', isGroup);
  
  // Логіка фільтрації команд тепер в головному обробнику
  
  try {
    if (command === '/start') {
      const welcomeMessage = `🏋️‍♂️ Привіт! Це бот для відстеження відвідуваності спортзалу!

📸 Щоб зарахувати відвідування, надішли фото з залу + хештег #gym
📊 /stats - твоя статистика за місяць
🏆 /top - топ відвідувачів
📋 /rules - правила та штрафи
❓ /help - допомога

Приклад: "Важке тренування! #gym 💪"

💰 ВАЖЛИВО: За пропуск тренування - штраф! 
🚫 Будь активним, щоб уникнути штрафів!

Давай тримати форму разом! 💪`;
      
      await sendTelegramMessage(chatId, welcomeMessage);
      
    } else if (command === '/help') {
      const helpMessage = `ℹ️ Як користуватися ботом:

1️⃣ Надішли фото з тренування в залі + хештег #gym
2️⃣ Бот автоматично зарахує відвідування
3️⃣ Один день = одне відвідування (навіть якщо фото кілька)

📸 Приклади правильного використання:
• "Важке тренування сьогодні! #gym 💪"
• "Ноги день #gym 🦵"
• "#gym спина і біцепс готові!"

📋 Команди:
/stats - твоя статистика за поточний місяць
/top - рейтинг найактивніших учасників
/rules - правила групи та штрафів
/help - ця довідка

💰 ПРАВИЛА ШТРАФІВ:
🚫 За пропуск тренування - штраф!
⚡ Будь активним кожен день
💪 Підтримуй регулярність тренувань
📈 Відстежуй свій прогрес через /stats

⚠️ Важливо: фото БЕЗ хештега #gym не зараховуються!
📊 Всі дані зберігаються в Google Sheets для відстеження прогресу!`;
      
      await sendTelegramMessage(chatId, helpMessage);
      
    } else if (command === '/stats') {
      const userId = msg.from.id;
      const firstName = msg.from.first_name;
      
      try {
        const userAttendance = await getUserStats(userId);
        const currentMonth = moment().format('MMMM YYYY');
        
        const statsMessage = `📊 Твоя статистика за ${currentMonth}:

🏋️‍♂️ Відвідувань: ${userAttendance}
👤 ${firstName}

${userAttendance >= 20 ? '🔥 Неймовірно! Ти справжній чемпіон!' :
  userAttendance >= 15 ? '💪 Відмінно! Так тримати!' :
  userAttendance >= 10 ? '👍 Добре! Можеш ще краще!' :
  userAttendance >= 5 ? '😊 Непогано, але є куди рости!' :
  '😅 Час активніше братися за тренування!'}`;
        
        await sendTelegramMessage(chatId, statsMessage);
      } catch (error) {
        console.error('❌ Error getting user stats:', error);
        await sendTelegramMessage(chatId, '⚠️ Статистика тимчасово недоступна через проблеми з Google Sheets. Спробуй пізніше!');
      }
      
    } else if (command === '/rules') {
      const rulesMessage = `📋 ПРАВИЛА ГРУПИ ТА ШТРАФІВ:

🏋️‍♂️ ОСНОВНІ ПРАВИЛА:
• Надсилай фото з залу + хештег #gym щодня
• Тільки одне відвідування на день зараховується
• Фото БЕЗ #gym не рахуються

💰 СИСТЕМА ШТРАФІВ:
🚫 За пропуск тренування - штраф!
⚡ Чим більше пропусків, тим більший штраф
📊 Система відстежує твою активність
🏆 Найактивніші отримують бонуси!

💪 МОТИВАЦІЯ:
• Тренуйся регулярно
• Підтримуй друзів
• Досягай своїх цілей
• Будь прикладом для інших!

📈 Переглядай свій прогрес: /stats
🏆 Дивись рейтинг: /top
❓ Потрібна допомога: /help

Разом ми сильніші! 💪🔥`;
      
      await sendTelegramMessage(chatId, rulesMessage);
      
    } else if (command === '/top') {
      if (!GOOGLE_SHEETS_AVAILABLE) {
        await sendTelegramMessage(chatId, '⚠️ Рейтинг тимчасово недоступний. Google Sheets не підключені. Зверніться до адміністратора бота! 🛠️');
        return;
      }
      
      try {
        const topUsers = await getTopUsers();
        const currentMonth = moment().format('MMMM YYYY');
        
        if (topUsers.length === 0) {
          await sendTelegramMessage(chatId, '📊 Поки немає даних про відвідування цього місяця.');
          return;
        }
        
        let topMessage = `🏆 Топ відвідувачів за ${currentMonth}:\n\n`;
        
        topUsers.forEach((user, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
          topMessage += `${medal} ${index + 1}. ${user.name} - ${user.count} відвідувань\n`;
        });
        
        topMessage += '\n💪 Так тримати, чемпіони!';
        
        await sendTelegramMessage(chatId, topMessage);
      } catch (error) {
        console.error('❌ Error getting top users:', error);
        await sendTelegramMessage(chatId, '⚠️ Рейтинг тимчасово недоступний через проблеми з Google Sheets. Спробуй пізніше!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error handling command:', error);
    await sendTelegramMessage(chatId, '❌ Виникла помилка при обробці команди. Спробуй пізніше.')
      .catch(err => console.error('❌ Error sending error message:', err));
  }
}

// Функція для отримання URL фото з Telegram API
async function getTelegramPhotoUrl(fileId) {
  try {
    const https = require('https');
    
    console.log('📷 Getting Telegram photo URL for file:', fileId);
    
    // Отримуємо інформацію про файл від Telegram
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${BOT_TOKEN}/getFile?file_id=${fileId}`,
        method: 'GET'
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.ok && response.result.file_path) {
              const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${response.result.file_path}`;
              console.log('✅ Telegram photo URL obtained:', photoUrl);
              resolve(photoUrl);
            } else {
              console.error('❌ Error getting file path:', response);
              resolve('');
            }
          } catch (e) {
            console.error('❌ Error parsing getFile response:', e);
            resolve('');
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Error getting photo URL:', error);
        resolve('');
      });
      
      req.end();
    });
  } catch (error) {
    console.error('❌ Error in getTelegramPhotoUrl:', error);
    return '';
  }
}

async function handlePhoto(msg) {
  console.log('📸 Handling photo from:', msg.from.first_name, msg.from.id);
  
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.username || '';
  const firstName = msg.from.first_name || 'Невідомо';
  const today = getCurrentDate();
  const caption = msg.caption || '';
  
  // Перевіряємо наявність хештега #gym
  if (!caption.toLowerCase().includes('#gym')) {
    console.log('❌ Photo rejected: no #gym hashtag found in caption:', caption);
    await sendTelegramMessage(chatId, 
      `📸 ${firstName}, щоб зарахувати відвідування залу, додай хештег #gym до свого фото!\n\n` +
      `Приклад: "Важке тренування сьогодні! #gym 💪"`
    );
    return;
  }
  
  console.log('✅ Photo accepted: #gym hashtag found');
  
  if (!GOOGLE_SHEETS_AVAILABLE) {
    await sendTelegramMessage(chatId, 
      `📸 ${firstName}, фото з #gym отримано! Але зберегти відвідування не можу - Google Sheets недоступні.\n\n` +
      `⚠️ Зверніться до адміністратора бота для налаштування збереження даних.`
    );
    return;
  }
  
  try {
    // Перевіряємо чи вже відвідував сьогодні
    const alreadyVisited = await checkTodayAttendance(userId);
    
    if (alreadyVisited) {
      await sendTelegramMessage(chatId, `✅ ${firstName}, твоє відвідування на сьогодні (${today}) вже зараховано! 🏋️‍♂️`);
      return;
    }
    
    // Отримуємо найбільше фото
    const photos = msg.photo;
    const largestPhoto = photos[photos.length - 1];
    console.log('📷 Getting photo URL for file_id:', largestPhoto.file_id);
    
    // Отримуємо URL фото з Telegram API
    const photoUrl = await getTelegramPhotoUrl(largestPhoto.file_id);
    console.log('🔗 Telegram photo URL:', photoUrl ? 'obtained successfully' : 'failed');
    
    // Зберігаємо відвідування з фото та текстом
    const saved = await saveAttendance(userId, userName, firstName, today, caption, photoUrl);
    
    if (saved) {
      const userStats = await getUserStats(userId);
      let successMessage = `🎉 Відмінно, ${firstName}! Відвідування зараховано!\n\n` +
        `📅 Дата: ${today}\n` +
        `🏋️‍♂️ Твоїх відвідувань цього місяця: ${userStats}\n`;
      
      if (caption) {
        successMessage += `💬 Твій коментар: "${caption}"\n`;
      }
      
      successMessage += `\nТак тримати! 💪`;
      
      await sendTelegramMessage(chatId, successMessage);
    } else {
      await sendTelegramMessage(chatId, '❌ Виникла помилка при збереженні. Спробуй ще раз.');
    }
    
  } catch (error) {
    console.error('❌ Помилка при обробці фото:', error);
    await sendTelegramMessage(chatId, '❌ Виникла помилка. Спробуй ще раз пізніше.')
      .catch(err => console.error('❌ Error sending general error message:', err));
  }
}

// Функція для перевірки типу чату
function isGroupChat(msg) {
  return msg.chat.type === 'group' || msg.chat.type === 'supergroup';
}

async function handleRegularMessage(msg) {
  console.log('💬 Handling regular message:', msg.text);
  
  // Логіка фільтрації груп тепер в головному обробнику
  // Тут обробляємо тільки приватні чати
  const chatId = msg.chat.id;
  await sendTelegramMessage(chatId, 
    '📸 Щоб зарахувати відвідування залу, надішли фото з тренування + хештег #gym!\n\n' +
    'Приклад: "Важке тренування сьогодні! #gym 💪"\n\n' +
    'ℹ️ /help - для детальної допомоги'
  ).catch(error => console.error('❌ Error sending instruction message:', error));
}



// Функція для збереження відвідування в Google Sheets
async function saveAttendance(userId, userName, firstName, date, caption = '', photoUrl = '') {
  try {
    if (!sheets) {
      console.error('❌ Google Sheets not initialized');
      return false;
    }
    
    // Перевіряємо чи існує лист для поточного місяця
    const monthYear = getCurrentMonth();
    const sheetName = `Відвідуваність_${monthYear}`;
    
    console.log('📊 Trying to access Google Sheets:', GOOGLE_SHEETS_ID);
    
    // Спробуємо отримати дані з листа
    let sheetExists = true;
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: `${sheetName}!A1:F1000`,
      });
    } catch (error) {
      console.log('📄 Sheet does not exist, will create:', sheetName);
      sheetExists = false;
    }

    // Створюємо новий лист якщо не існує
    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEETS_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });

      // Додаємо заголовки
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: `${sheetName}!A1:G1`,
        valueInputOption: 'RAW',
        resource: {
          values: [['User ID', "Ім'я користувача", "Ім'я", 'Дата відвідування', 'Текст під фото', 'Фото']]
        }
      });


    }

    // Додаємо новий запис
    // Якщо є фото, використовуємо IMAGE() функцію для вставки зображення
    let photoFormula = '';
    if (photoUrl) {
      photoFormula = `=IMAGE("${photoUrl}")`;
      console.log('📸 Using IMAGE formula with Telegram URL:', photoFormula);
    }
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${sheetName}!A:F`,
      valueInputOption: 'USER_ENTERED', // Дозволяє використовувати формули
      resource: {
        values: [[userId, userName, firstName, date, caption || '', photoFormula]]
      }
    });

    // ПІСЛЯ вставки даних отримуємо актуальну кількість рядків
    const updatedData = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${sheetName}!A:F`
    });
    
    const actualRowCount = updatedData.data.values ? updatedData.data.values.length : 0;
    console.log('📊 Actual row count after insert:', actualRowCount);
    


    return true;
  } catch (error) {
    console.error('Помилка при збереженні в Google Sheets:', error);
    return false;
  }
}

// Функція для перевірки чи вже відвідував сьогодні
async function checkTodayAttendance(userId) {
  try {
    if (!sheets) {
      console.error('❌ Google Sheets not initialized for attendance check');
      return false; // Дозволити відвідування якщо не можемо перевірити
    }
    
    const monthYear = getCurrentMonth();
    const sheetName = `Відвідуваність_${monthYear}`;
    const today = getCurrentDate();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${sheetName}!A:F`,
    });

    const rows = response.data.values || [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] == userId && row[3] === today) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Помилка при перевірці відвідування:', error);
    return false; // Дозволити відвідування якщо помилка
  }
}

// Функція для отримання статистики користувача
async function getUserStats(userId) {
  try {
    if (!sheets) {
      console.error('❌ Google Sheets not initialized for stats');
      return 0;
    }
    
    const monthYear = getCurrentMonth();
    const sheetName = `Відвідуваність_${monthYear}`;

    console.log('📊 Getting user stats for sheet:', sheetName);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${sheetName}!A:F`,
    });

    const rows = response.data.values || [];
    let userAttendance = 0;
    
    console.log('📊 Found rows:', rows.length);
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] == userId) {
        userAttendance++;
      }
    }
    
    console.log('📊 User attendance count:', userAttendance);
    return userAttendance;
  } catch (error) {
    console.error('❌ Помилка при отриманні статистики:', error);
    throw error; // Пробрасываем ошибку чтобы ее обработал вызывающий код
  }
}

// Функція для отримання топ користувачів
async function getTopUsers() {
  try {
    const monthYear = getCurrentMonth();
    const sheetName = `Відвідуваність_${monthYear}`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${sheetName}!A:F`,
    });

    const rows = response.data.values || [];
    const userStats = {};
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const userId = row[0];
      const userName = row[2] || row[1];
      
      if (!userStats[userId]) {
        userStats[userId] = {
          name: userName,
          count: 0
        };
      }
      userStats[userId].count++;
    }
    
    // Сортуємо за кількістю відвідувань
    const sortedUsers = Object.entries(userStats)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return sortedUsers;
  } catch (error) {
    console.error('Помилка при отриманні топ користувачів:', error);
    return [];
  }
}

// Старі обробники видалені - тепер використовуємо handleCommand, handlePhoto, handleRegularMessage

// Webhook обробник для Vercel
module.exports = async (req, res) => {
  console.log('📨 Received request:', req.method);
  
  // Додаємо timeout для запобігання зависання
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.log('⏰ Request timeout - sending response');
      res.status(200).json({ ok: true, timeout: true });
    }
  }, 25000); // 25 секунд замість 300
  
  if (req.method === 'POST') {
    try {
      console.log('📥 Update received:', JSON.stringify(req.body, null, 2));
      console.log('🔑 BOT_TOKEN exists:', !!BOT_TOKEN);
      console.log('📋 GOOGLE_SHEETS_ID:', !!GOOGLE_SHEETS_ID);
      console.log('📧 SERVICE_ACCOUNT_EMAIL:', !!GOOGLE_SERVICE_ACCOUNT_EMAIL);
      console.log('🔐 PRIVATE_KEY exists:', !!GOOGLE_PRIVATE_KEY);
      
      // Обробляємо оновлення вручну
      if (req.body.message) {
        console.log('💬 Processing message...');
        const msg = req.body.message;
        const isGroup = isGroupChat(msg);
        
        console.log('💬 Chat type:', msg.chat.type, 'Is group:', isGroup);
        
        // Якщо це команда
        if (msg.text && msg.text.startsWith('/')) {
          console.log('⚡ Processing command:', msg.text);
          
          // Перевіряємо дозволені команди в групах
          if (isGroup) {
            const allowedGroupCommands = ['/start', '/help', '/stats', '/top', '/rules'];
            const command = msg.text.toLowerCase();
                         if (!allowedGroupCommands.includes(command)) {
               console.log('🤐 Ignoring disallowed command in group:', command);
               clearTimeout(timeoutId);
               res.status(200).json({ ok: true, ignored: 'disallowed command in group' });
               return;
             }
          }
          
          await handleCommand(msg);
        }
        // Якщо це фото
        else if (msg.photo) {
          console.log('📸 Processing photo...');
          
          // У групах обробляємо тільки фото з #gym
          if (isGroup) {
            const caption = msg.caption || '';
            if (!caption.toLowerCase().includes('#gym')) {
              console.log('🤐 Ignoring photo without #gym in group chat');
              clearTimeout(timeoutId);
              res.status(200).json({ ok: true, ignored: 'photo without #gym in group' });
              return;
            }
          }
          
          await handlePhoto(msg);
        }
        // Звичайне повідомлення
        else if (msg.text) {
          console.log('💬 Processing regular text...');
          
          // У групах ігноруємо звичайні текстові повідомлення
                     if (isGroup) {
             console.log('🤐 Ignoring regular text message in group chat');
             clearTimeout(timeoutId);
             res.status(200).json({ ok: true, ignored: 'regular text in group' });
             return;
           }
          
          await handleRegularMessage(msg);
        }
        // Невідомий тип повідомлення
                 else {
           console.log('🤐 Ignoring unknown message type');
           clearTimeout(timeoutId);
           res.status(200).json({ ok: true, ignored: 'unknown message type' });
           return;
         }
      }
      
      clearTimeout(timeoutId);
      if (!res.headersSent) {
        res.status(200).json({ ok: true });
      }
    } catch (error) {
      console.error('❌ Webhook error:', error);
      clearTimeout(timeoutId);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    }
  } else {
    clearTimeout(timeoutId);
    console.log('✅ Health check - Bot is running!');
    res.status(200).json({ 
      message: 'Gym Attendance Bot is running!',
      timestamp: new Date().toISOString(),
      env_check: {
        bot_token: !!BOT_TOKEN,
        sheets_id: !!GOOGLE_SHEETS_ID,
        service_email: !!GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: !!GOOGLE_PRIVATE_KEY
      }
    });
  }
}; 
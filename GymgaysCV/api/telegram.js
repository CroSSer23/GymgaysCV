const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');
const moment = require('moment');

// Конфігурація
const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Ініціалізація бота для webhook режиму
const bot = new TelegramBot(BOT_TOKEN, { webHook: true });

// Логування ініціалізації
console.log('🤖 Bot initialized in webhook mode');
console.log('🔑 Token length:', BOT_TOKEN ? BOT_TOKEN.length : 'NOT SET');

// Налаштування Google Sheets API
let auth, sheets;

try {
  auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    GOOGLE_PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  sheets = google.sheets({ version: 'v4', auth });
  console.log('📊 Google Sheets API initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Google Sheets API:', error.message);
}

// Utility функції
function getCurrentDate() {
  return moment().format('DD.MM.YYYY');
}

function getCurrentMonth() {
  return moment().format('MM.YYYY');
}

// Функція для збереження відвідування в Google Sheets
async function saveAttendance(userId, userName, firstName, date) {
  try {
    // Перевіряємо чи існує лист для поточного місяця
    const monthYear = getCurrentMonth();
    const sheetName = `Відвідуваність_${monthYear}`;
    
    // Спробуємо отримати дані з листа
    let sheetExists = true;
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: `${sheetName}!A1:Z1000`,
      });
    } catch (error) {
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
        range: `${sheetName}!A1:E1`,
        valueInputOption: 'RAW',
        resource: {
          values: [['User ID', "Ім'я користувача", "Ім'я", 'Дата відвідування', 'Час']]
        }
      });
    }

    // Додаємо новий запис
    const currentTime = moment().format('HH:mm:ss');
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${sheetName}!A:E`,
      valueInputOption: 'RAW',
      resource: {
        values: [[userId, userName, firstName, date, currentTime]]
      }
    });

    return true;
  } catch (error) {
    console.error('Помилка при збереженні в Google Sheets:', error);
    return false;
  }
}

// Функція для перевірки чи вже відвідував сьогодні
async function checkTodayAttendance(userId) {
  try {
    const monthYear = getCurrentMonth();
    const sheetName = `Відвідуваність_${monthYear}`;
    const today = getCurrentDate();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${sheetName}!A:E`,
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
    console.error('Помилка при перевірці відвідування:', error);
    return false;
  }
}

// Функція для отримання статистики користувача
async function getUserStats(userId) {
  try {
    const monthYear = getCurrentMonth();
    const sheetName = `Відвідуваність_${monthYear}`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${sheetName}!A:E`,
    });

    const rows = response.data.values || [];
    let userAttendance = 0;
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] == userId) {
        userAttendance++;
      }
    }
    
    return userAttendance;
  } catch (error) {
    console.error('Помилка при отриманні статистики:', error);
    return 0;
  }
}

// Функція для отримання топ користувачів
async function getTopUsers() {
  try {
    const monthYear = getCurrentMonth();
    const sheetName = `Відвідуваність_${monthYear}`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${sheetName}!A:E`,
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

// Обробники команд
bot.onText(/\/start/, (msg) => {
  console.log('🚀 /start command received from:', msg.from.first_name, msg.from.id);
  const chatId = msg.chat.id;
  const welcomeMessage = `
🏋️‍♂️ Привіт! Це бот для відстеження відвідуваності спортзалу!

📸 Щоб зарахувати відвідування, надішли фото з залу
📊 /stats - твоя статистика за місяць
🏆 /top - топ відвідувачів
❓ /help - допомога

Давай тримати форму разом! 💪
  `;
  
  console.log('📤 Sending welcome message to chat:', chatId);
  bot.sendMessage(chatId, welcomeMessage)
    .then(() => console.log('✅ Welcome message sent successfully'))
    .catch(error => console.error('❌ Error sending welcome message:', error));
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
ℹ️ Як користуватися ботом:

1️⃣ Надішли фото з тренування в залі
2️⃣ Бот автоматично зарахує відвідування
3️⃣ Один день = одне відвідування (навіть якщо фото кілька)

📋 Команди:
/stats - твоя статистика за поточний місяць
/top - рейтинг найактивніших учасників
/help - ця довідка

📊 Всі дані зберігаються в Google Sheets для відстеження прогресу!
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name;
  
  try {
    const userAttendance = await getUserStats(userId);
    const currentMonth = moment().format('MMMM YYYY');
    
    const statsMessage = `
📊 Твоя статистика за ${currentMonth}:

🏋️‍♂️ Відвідувань: ${userAttendance}
👤 ${firstName}

${userAttendance >= 20 ? '🔥 Неймовірно! Ти справжній чемпіон!' :
  userAttendance >= 15 ? '💪 Відмінно! Так тримати!' :
  userAttendance >= 10 ? '👍 Добре! Можеш ще краще!' :
  userAttendance >= 5 ? '😊 Непогано, але є куди рости!' :
  '😅 Час активніше братися за тренування!'}
    `;
    
    bot.sendMessage(chatId, statsMessage);
  } catch (error) {
    bot.sendMessage(chatId, '❌ Виникла помилка при отриманні статистики. Спробуй пізніше.');
  }
});

bot.onText(/\/top/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const topUsers = await getTopUsers();
    const currentMonth = moment().format('MMMM YYYY');
    
    if (topUsers.length === 0) {
      bot.sendMessage(chatId, '📊 Поки немає даних про відвідування цього місяця.');
      return;
    }
    
    let topMessage = `🏆 Топ відвідувачів за ${currentMonth}:\n\n`;
    
    topUsers.forEach((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      topMessage += `${medal} ${index + 1}. ${user.name} - ${user.count} відвідувань\n`;
    });
    
    topMessage += '\n💪 Так тримати, чемпіони!';
    
    bot.sendMessage(chatId, topMessage);
  } catch (error) {
    bot.sendMessage(chatId, '❌ Виникла помилка при отриманні рейтингу. Спробуй пізніше.');
  }
});

// Обробка фото
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.username || '';
  const firstName = msg.from.first_name || 'Невідомо';
  const today = getCurrentDate();
  
  try {
    // Перевіряємо чи вже відвідував сьогодні
    const alreadyVisited = await checkTodayAttendance(userId);
    
    if (alreadyVisited) {
      bot.sendMessage(chatId, `✅ ${firstName}, твоє відвідування на сьогодні (${today}) вже зараховано! 🏋️‍♂️`);
      return;
    }
    
    // Зберігаємо відвідування
    const saved = await saveAttendance(userId, userName, firstName, today);
    
    if (saved) {
      const userStats = await getUserStats(userId);
      bot.sendMessage(chatId, 
        `🎉 Відмінно, ${firstName}! Відвідування зараховано!\n\n` +
        `📅 Дата: ${today}\n` +
        `🏋️‍♂️ Твоїх відвідувань цього місяця: ${userStats}\n\n` +
        `Так тримати! 💪`
      );
    } else {
      bot.sendMessage(chatId, '❌ Виникла помилка при збереженні. Спробуй ще раз.');
    }
    
  } catch (error) {
    console.error('Помилка при обробці фото:', error);
    bot.sendMessage(chatId, '❌ Виникла помилка. Спробуй ще раз пізніше.');
  }
});

// Обробка всіх інших повідомлень
bot.on('message', (msg) => {
  // Ігноруємо команди та фото (вони обробляються окремо)
  if (msg.text && !msg.text.startsWith('/') && !msg.photo) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
      '📸 Щоб зарахувати відвідування залу, надішли фото з тренування!\n\n' +
      'ℹ️ /help - для допомоги'
    );
  }
});

// Webhook обробник для Vercel
module.exports = async (req, res) => {
  console.log('📨 Received request:', req.method);
  
  if (req.method === 'POST') {
    try {
      console.log('📥 Update received:', JSON.stringify(req.body, null, 2));
      console.log('🔑 BOT_TOKEN exists:', !!BOT_TOKEN);
      console.log('📋 GOOGLE_SHEETS_ID:', !!GOOGLE_SHEETS_ID);
      console.log('📧 SERVICE_ACCOUNT_EMAIL:', !!GOOGLE_SERVICE_ACCOUNT_EMAIL);
      console.log('🔐 PRIVATE_KEY exists:', !!GOOGLE_PRIVATE_KEY);
      
      await bot.processUpdate(req.body);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('❌ Webhook error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else {
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
const { Telegraf } = require('telegraf');
const { google } = require('googleapis');

/**
 * Получаем creds: либо пара EMAIL+KEY, либо цельный JSON в GOOGLE_CREDENTIALS
 */
function getServiceAccountCreds() {
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      const json = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      return {
        client_email: json.client_email,
        private_key: json.private_key,
      };
    } catch (e) {
      console.error('Не удалось распарсить GOOGLE_CREDENTIALS. Убедитесь, что это корректный JSON.');
    }
  }
  return {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

function getSpreadsheetId() {
  if (process.env.GOOGLE_SHEETS_ID) return process.env.GOOGLE_SHEETS_ID;
  const url = process.env.GOOGLE_SHEETS_URL || '';
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)(?:\/|$)/);
  return m ? m[1] : undefined;
}

const creds = getServiceAccountCreds();
const SPREADSHEET_ID = getSpreadsheetId();
if (!SPREADSHEET_ID) throw new Error('Не задан Spreadsheet ID или URL (GOOGLE_SHEETS_ID / GOOGLE_SHEETS_URL)');

/**
 * Создаём/кешируем экземпляры клиента Google Sheets.
 */
let sheetsClient;
function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Ленивая инициализация экземпляра бота.
 */
const bot = new Telegraf(process.env.BOT_TOKEN);

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Attendance';

const KEYWORDS = ['#gym', '#зал', 'gym', 'зал'];

/**
 * Записываем факт посещения: дата, userId, username.
 */
async function recordAttendance({ telegramId, username }) {
  const sheets = getSheetsClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Добавляем строку
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:C`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[today, String(telegramId), username || '']],
    },
  });
}

/**
 * Получаем все строки посещений
 */
async function fetchAttendanceRows() {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:C`,
  });
  return res.data.values || [];
}

async function hasAttendanceToday(telegramId) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await fetchAttendanceRows();
  return rows.some(([date, id]) => date === today && id === String(telegramId));
}

function isGymPhoto(ctx) {
  const caption = ctx.message?.caption?.toLowerCase() || '';
  return KEYWORDS.some((kw) => caption.includes(kw));
}

/**
 * Обработчик фото из чата
 */
bot.on('photo', async (ctx) => {
  try {
    if (!isGymPhoto(ctx)) {
      return ctx.reply('Щоб зарахувати тренування, додайте к фото хештег #gym (або #зал).');
    }

    const telegramId = ctx.from?.id;
    const username = ctx.from?.username || ctx.from?.first_name || '';

    if (await hasAttendanceToday(telegramId)) {
      return ctx.reply('Ти вже зафіксував тренування сьогодні 💪. Побачимось завтра!');
    }

    await recordAttendance({ telegramId, username });

    await ctx.reply('Тренировка засчитана! 💪');
  } catch (err) {
    console.error('Ошибка при записи в таблицу', err);
    await ctx.reply('Упс, произошла ошибка при записи. Попробуйте ещё раз.');
  }
});

/**
 * Команда статистики /stats
 */
bot.command('stats', async (ctx) => {
  try {
    const rows = await fetchAttendanceRows();

    // Пропускаем заголовок, если он есть
    const stats = {};
    rows.forEach(([date, userId, username]) => {
      if (!username) username = userId;
      stats[username] = (stats[username] || 0) + 1;
    });

    const messageLines = Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([user, count], idx) => `${idx + 1}. ${user}: ${count}`);

    await ctx.reply(`Статистика посещений:\n${messageLines.join('\n')}`);
  } catch (err) {
    console.error('Ошибка получения статистики', err);
    await ctx.reply('Не удалось получить статистику.');
  }
});

// Предотвращаем автоматический запуск long-polling в среде Serverless
bot.telegram.deleteWebhook().catch(() => {});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
    } catch (err) {
      console.error('Ошибка обработки обновления', err);
    }
    return res.status(200).json({ ok: true });
  }
  // Для GET-запросов просто подтверждаем, что функция жива
  res.status(200).send('Gym Attendance Bot is up.');
}; 
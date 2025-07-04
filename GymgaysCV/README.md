# 🏋️‍♂️ Телеграм Бот для Відстеження Відвідуваності Спортзалу

Телеграм-бот для групи друзів, який відстежує відвідування спортзалу через фото та зберігає статистику в Google Sheets.

## 🚀 Функціонал

- ✅ **Відстеження відвідувань**: Надсилання фото з залу + хештег #gym для зарахування дня
- 🏷️ **Фільтрація за хештегом**: Тільки фото з #gym потрапляють в статистику
- 📸 **Збереження фото**: Автоматичне отримання посилань на фото з Telegram API та вставка в таблицю
- 💬 **Коментарі**: Збереження тексту під фото (caption) в таблиці
- 📊 **Статистика**: Персональна статистика відвідувань за місяць
- 🏆 **Рейтинг**: Топ найактивніших учасників
- 💰 **Система штрафів**: Інформування про штрафи за пропуски тренувань
- 📈 **Google Sheets**: Автоматичне збереження даних з фото та коментарями
- 🔗 **Відображення фото**: Фото відображаються прямо в Google Sheets через IMAGE() функцію
- 🔄 **Захист від дублювання**: Одне відвідування на день
- 📱 **Зручний інтерфейс**: Простота використання

## 📋 Команди Бота

- `/start` - Запуск бота та привітання
- `/help` - Довідка по використанню
- `/stats` - Твоя статистика за поточний місяць
- `/top` - Рейтинг топ-10 учасників
- `/rules` - Правила групи та штрафів за пропуски
- **Фото + #gym** - Надсилання фото з залу + хештег #gym для зарахування відвідування

### 📸 Приклади використання фото:
```
"Важке тренування сьогодні! #gym 💪"
"Ноги день #gym 🦵"  
"#gym спина і біцепс готові!"
```

⚠️ **Важливо**: Фото БЕЗ хештега #gym НЕ зараховуються!

## ⚙️ Налаштування

### 1. Створення Телеграм Бота

1. Перейди до [@BotFather](https://t.me/BotFather) в Telegram
2. Відправ команду `/newbot`
3. Вкажи ім'я та username для бота
4. Збережи отриманий **BOT_TOKEN**

### 2. Налаштування Google Sheets

1. Перейди в [Google Cloud Console](https://console.cloud.google.com/)
2. Створи новий проект або обери існуючий
3. Увімкни Google Sheets API
4. Створи Service Account:
   - Перейди в IAM & Admin → Service Accounts
   - Натисни "Create Service Account"
   - Вкажи назву та опис
   - Завантаж JSON ключ
5. Створи новий Google Sheets документ
6. Поділись документом з email Service Account з правами редагування
7. Скопіюй ID документа з URL (між `/d/` та `/edit`)

### 3. Деплой на Vercel

1. Форкни цей репозиторій
2. Створи акаунт на [Vercel](https://vercel.com)
3. Імпортуй проект з GitHub
4. Додай змінні середовища в Vercel:

#### Змінні середовища:

```
BOT_TOKEN=твій_бот_токен_від_BotFather
GOOGLE_SHEETS_ID=id_твого_google_sheets_документа
GOOGLE_SERVICE_ACCOUNT_EMAIL=email_service_account
GOOGLE_PRIVATE_KEY=приватний_ключ_з_json_файлу
```

⚠️ **Важливо**: `GOOGLE_PRIVATE_KEY` повинен включати `-----BEGIN PRIVATE KEY-----` та `-----END PRIVATE KEY-----`

### 4. Налаштування Webhook

Після успішного деплою:

1. Отримай URL твого проекту з Vercel (наприклад: `https://твій-проект.vercel.app`)
2. Встанови webhook для бота через API:

```bash
curl -X POST "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://твій-проект.vercel.app/api/telegram"}'
```

Замініть `{BOT_TOKEN}` на реальний токен та URL на ваш Vercel URL.

## 📊 Структура Google Sheets

Бот автоматично створює нові листи для кожного місяця з форматом `Відвідуваність_MM.YYYY`.

**📸 Збереження фото**: Фотографії з Telegram API вставляються безпосередньо в таблицю через функцію IMAGE() з прямими посиланнями.

| User ID | Ім'я користувача | Ім'я | Дата відвідування | Час | Текст під фото | Фото |
|---------|------------------|------|-------------------|-----|----------------|------|
| 123456  | @username        | Іван | 15.12.2024        | 18:30:15 | Важке тренування сьогодні! #gym 💪 | 📸 [IMAGE] |

## 🔧 Локальна Розробка

1. Клонуй репозиторій:
```bash
git clone https://github.com/твій-username/gym-attendance-bot.git
cd gym-attendance-bot
```

2. Встанови залежності:
```bash
npm install
```

3. Створи файл `.env`:
```env
BOT_TOKEN=твій_бот_токен
GOOGLE_SHEETS_ID=id_google_sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=email_service_account
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

4. Запусти розробку:
```bash
npm run dev
```

## 🛠️ Технології

- **Node.js** - Runtime середовище
- **Telegram Bot API** - Інтеграція з Telegram та отримання фото
- **Google Sheets API** - Збереження даних в таблиці з фото через IMAGE()
- **Vercel** - Serverless хостинг
- **Moment.js** - Робота з датами

## 🔍 Особливості

- **Фільтрація за хештегом**: Тільки фото з #gym зараховуються як відвідування
- **Автоматичне створення листів**: Новий лист Google Sheets для кожного місяця
- **Захист від спаму**: Максимум одне відвідування на день
- **Персоналізація**: Мотиваційні повідомлення залежно від активності
- **Масштабованість**: Підтримка необмеженої кількості користувачів
- **Статистика**: Детальна аналітика та рейтинги
- **Групова сумісність**: Ідеально підходить для групових чатів з різним контентом

## 🤝 Використання в Групі

1. Додай бота до групи з друзями
2. Дай боту права адміністратора (для читання повідомлень)
3. Кожен учасник може надсилати фото з залу
4. Статистика доступна як особисто, так і для всієї групи

## 📝 Приклад Використання

```
Користувач: [надсилає фото з залу з текстом "Важке тренування сьогодні! #gym 💪"]
Бот: 🎉 Відмінно, Іван! Відвідування зараховано!
     📅 Дата: 15.12.2024
     🏋️‍♂️ Твоїх відвідувань цього місяця: 12
     💬 Твій коментар: "Важке тренування сьогодні! #gym 💪"
     
     Так тримати! 💪

Користувач: [надсилає фото без #gym з текстом "Просто селфі"]
Бот: 📸 Іван, щоб зарахувати відвідування залу, додай хештег #gym до свого фото!
     
     Приклад: "Важке тренування сьогодні! #gym 💪"

Користувач: /top
Бот: 🏆 Топ відвідувачів за грудень 2024:
     🥇 1. Іван - 15 відвідувань
     🥈 2. Петро - 12 відвідувань
     🥉 3. Марія - 10 відвідувань
     💪 Так тримати, чемпіони!
```

## 🔧 Налагодження

Якщо бот не працює:

1. Перевір змінні середовища у Vercel
2. Переконайся, що Service Account має доступ до Google Sheets
3. Перевір, чи правильно встановлений webhook
4. Подивись логи в Vercel Functions

## 📞 Підтримка

Якщо виникли питання або проблеми:
1. Перевір цю документацію
2. Подивись на приклади в коді
3. Створи Issue в репозиторії

---

💪 **Тримайте форму разом з друзями!** 🏋️‍♂️ 
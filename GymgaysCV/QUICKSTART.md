# 🚀 Швидкий Запуск

## Крок 1: Створи Телеграм Бота
1. Напиши [@BotFather](https://t.me/BotFather)
2. Відправ `/newbot`
3. Дай назву боту (наприклад: "Gym Attendance Bot")
4. Дай username (наприклад: "your_gym_bot")
5. Збережи токен!

## Крок 2: Налаштуй Google Sheets
1. Іди в [Google Cloud Console](https://console.cloud.google.com/)
2. Створи новий проект
3. Увімкни Google Sheets API
4. Створи Service Account та завантаж JSON ключ
5. Створи новий Google Sheets
6. Поділись з Service Account email

## Крок 3: Деплой на Vercel
1. Форкни репозиторій на GitHub
2. Реєструйся на [Vercel.com](https://vercel.com)
3. Імпортуй проект з GitHub
4. Додай змінні середовища:
   - `BOT_TOKEN` - токен від BotFather
   - `GOOGLE_SHEETS_ID` - ID з URL Google Sheets
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` - email з JSON
   - `GOOGLE_PRIVATE_KEY` - private_key з JSON

## Крок 4: Встанови Webhook
Заміни {BOT_TOKEN} та {VERCEL_URL} на свої:
```bash
curl -X POST "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "{VERCEL_URL}/api/telegram"}'
```

## Крок 5: Тестуй!
1. Знайди свого бота в Telegram
2. Відправ `/start`
3. Надішли фото з залу
4. Перевір статистику через `/stats`

🎉 **Готово! Твій бот працює!**

---

💡 **Потрібна допомога?** Дивись повний [README.md](./README.md) 
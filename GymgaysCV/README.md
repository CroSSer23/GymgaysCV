# Gym Attendance Bot

Telegram-бот для учёта посещений зала и ведения статистики в Google Sheets. Развёртывается как Serverless-функция на **Vercel**.

## Возможности

* Пользователь отправляет фотографию из тренажёрного зала — боту засчитывается один день посещения.
* Команда `/stats` выводит общую статистику по всем участникам.
* Данные хранятся в Google Sheets (таблица `Attendance`).

## Переменные окружения (упрощённо)

| Название | Описание |
|----------|----------|
| `BOT_TOKEN` | Токен Telegram-бота |
| `GOOGLE_SHEETS_URL` | Полная ссылка на таблицу **или** `GOOGLE_SHEETS_ID` |
| `GOOGLE_CREDENTIALS` | Содержимое JSON-файла сервис-аккаунта целиком (скопируйте весь текст) |

👉 Достаточно **трёх** переменных. Если предпочитаете старую схему — можно задать `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` вместо `GOOGLE_CREDENTIALS`.

## Быстрый старт

1. **Клонируйте репозиторий** и перейдите в каталог проекта:
   ```bash
   git clone <repo-url>
   cd GymgaysCV
   ```
2. **Создайте таблицу Google Sheets** и добавьте первый лист с названием `Attendance`.  
   Первую строку можно оставить пустой или задать заголовки `Date`, `UserId`, `Username`.
3. **Создайте сервис-аккаунт** в Google Cloud Console и выдайте ему доступ «Редактор» к таблице.
4. **В Vercel** добавьте переменные окружения:
   * `BOT_TOKEN` — токен вашего Telegram-бота.
   * `GOOGLE_SHEETS_ID` — ID таблицы (часть URL после `/d/`).
   * `GOOGLE_SERVICE_ACCOUNT_EMAIL` — email сервис-аккаунта.
   * `GOOGLE_PRIVATE_KEY` — приватный ключ JSON сервис-аккаунта (экспортируйте, затем замените все символы переноса строки `\n` на `\\n`).
   * (опционально) `GOOGLE_SHEET_NAME` — имя листа (по умолчанию `Attendance`).
5. **Задеплойте**:
   ```bash
   npm i -g vercel
   vercel --prod
   ```
6. **Сделайте Webhook** в Telegram:
   ```bash
   curl -X POST "https://api.telegram.org/bot<ваш_бот_токен>/setWebhook?url=https://<project-name>.vercel.app/api/telegram"
   ```

После этого бот начнёт получать обновления через Webhook.

---

> Бот написан на [Telegraf](https://telegraf.js.org/) и использует официальный [Google Sheets API](https://developers.google.com/sheets/api). 
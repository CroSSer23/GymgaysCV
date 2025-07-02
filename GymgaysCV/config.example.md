# Приклад Конфігурації Змінних Середовища

Цей файл містить приклади змінних середовища, які потрібно налаштувати для роботи бота.

## Локальна розробка (.env файл)

Створи файл `.env` в корені проекту:

```env
# Токен телеграм бота від @BotFather
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# ID Google Sheets документа (з URL)
GOOGLE_SHEETS_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890

# Email Service Account з Google Cloud Console
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project-name.iam.gserviceaccount.com

# Приватний ключ з JSON файлу Service Account
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## Vercel Environment Variables

В Vercel Dashboard → Project → Settings → Environment Variables додай:

### BOT_TOKEN
```
123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

### GOOGLE_SHEETS_ID
```
1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### GOOGLE_SERVICE_ACCOUNT_EMAIL
```
service-account@project-name.iam.gserviceaccount.com
```

### GOOGLE_PRIVATE_KEY
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----
```

⚠️ **Важливо**: 
- Замініть всі приклади на реальні значення
- Приватний ключ повинен включати `-----BEGIN PRIVATE KEY-----` та `-----END PRIVATE KEY-----`
- В Vercel обов'язково додавай змінні як Environment Variables, а не в код 
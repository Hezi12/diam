# 📧 הגדרת מערכת המיילים - מדריך מלא

## סקירה כללית
המערכת כוללת מערכת מיילים מתקדמת ששולחת:
- **אישור הזמנה לאורח** - מייל מעוצב עם כל פרטי ההזמנה
- **הודעה למנהל** - התראה על הזמנה חדשה מהאתר הציבורי

## 🔧 הגדרת מיילים

### שלב 1: יצירת קובץ .env
צור קובץ `.env` בתיקייה `server/` עם ההגדרות הבאות:

### אפשרות 1: Gmail (מומלץ לעסקים קטנים)
```env
# הגדרות בסיסיות
MONGODB_URI=your-mongodb-connection-string
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key

# הגדרות Gmail
EMAIL_PROVIDER=gmail
GMAIL_USER=your-business-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
ADMIN_EMAIL=admin@diamshotels.com
FROM_EMAIL=noreply@diamshotels.com
```

### אפשרות 2: SMTP כללי
```env
# הגדרות בסיסיות
MONGODB_URI=your-mongodb-connection-string
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key

# הגדרות SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@your-domain.com
SMTP_PASS=your-password
ADMIN_EMAIL=admin@diamshotels.com
FROM_EMAIL=noreply@diamshotels.com
```

## 📋 הגדרת Gmail - שלב אחר שלב

### 1. הפעלת 2-Factor Authentication
1. כנס לחשבון Gmail שלך
2. לך ל-**Google Account** > **Security**
3. הפעל **2-Step Verification**

### 2. יצירת App Password
1. בחזרה ל-**Security** > **2-Step Verification**
2. לחץ על **App passwords**
3. בחר **Mail** ו-**Other (custom name)**
4. הזן "Diam Hotels System"
5. העתק את הסיסמה בת 16 התווים

### 3. הזנת הפרטים ב-.env
```env
GMAIL_USER=your-business-email@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop  # הסיסמה שקיבלת
```

## 🧪 בדיקת המערכת

### במצב פיתוח (Development)
אם לא תגדיר ספק מייל, המערכת תשתמש ב-**Ethereal Email** לטסטים:
- המיילים לא נשלחים באמת
- תקבל לינק לצפייה במייל הדמה
- מושלם לבדיקות

### במצב ייצור (Production)
```env
NODE_ENV=production
```

## 📨 תבניות המייל

### מייל לאורח
- **עיצוב מקצועי** עם צבעי המותג
- **כל פרטי ההזמנה** בפורמט ברור
- **הוראות חשובות** לצ'ק-אין/אאוט
- **פרטי קשר** מלאים
- **מותאם למובייל**

### מייל למנהל
- **התראה דחופה** על הזמנה חדשה
- **כל פרטי האורח** וההזמנה
- **רשימת פעולות נדרשות**
- **עיצוב מובחן** מהמייל של האורח

## 🔧 פתרון בעיות

### המיילים לא נשלחים
1. בדוק את ה-logs בשרת
2. ודא שה-App Password נכון
3. בדוק שה-2FA מופעל
4. ודא שה-EMAIL_PROVIDER נכון

### Gmail חוסם שליחה
- ודא שאתה משתמש ב-App Password ולא בסיסמה הרגילה
- בדוק שה-2FA מופעל
- אפשר "Less secure app access" אם צריך

### בדיקת חיבור
```javascript
// בקונסול השרת תראה:
📧 Ethereal Test Account: user@ethereal.email  // במצב פיתוח
✅ אישור הזמנה נשלח לאורח: message-id      // במצב ייצור
✅ הודעה נשלחה למנהל: message-id             // במצב ייצור
```

## 📞 תמיכה
אם יש בעיות בהגדרה, בדוק את הלוגים של השרת או פנה לתמיכה טכנית.

---

**חשוב:** הגדרת המיילים היא חיונית לפעילות האתר הציבורי. ללא מיילים, לא תקבל התראות על הזמנות חדשות! 
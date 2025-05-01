# תיעוד ה-API של מערכת דיאם

מסמך זה מתאר את כל נקודות הקצה (Endpoints) הזמינות בשרת ה-API של מערכת דיאם.

## בסיס ה-URL

- סביבת פיתוח: `http://localhost:3200/api`
- סביבת ייצור: `https://api.diam-hotel.com/api`

## נקודות קצה עיקריות

### אימות ומשתמשים

- `POST /auth/login` - התחברות למערכת
- `POST /auth/logout` - התנתקות מהמערכת

### הזמנות

- `GET /bookings` - קבלת רשימת הזמנות
- `POST /bookings` - יצירת הזמנה חדשה
- `GET /bookings/:id` - קבלת פרטי הזמנה לפי מזהה
- `PUT /bookings/:id` - עדכון הזמנה קיימת
- `DELETE /bookings/:id` - מחיקת הזמנה

### חדרים

- `GET /rooms` - קבלת רשימת חדרים
- `POST /rooms` - הוספת חדר חדש
- `GET /rooms/:id` - קבלת פרטי חדר לפי מזהה
- `PUT /rooms/:id` - עדכון פרטי חדר
- `DELETE /rooms/:id` - מחיקת חדר

### ניקיון

- `GET /cleaning` - קבלת משימות ניקיון
- `POST /cleaning` - יצירת משימת ניקיון חדשה
- `PUT /cleaning/:id` - עדכון משימת ניקיון

### חשבוניות

- `GET /invoices` - קבלת רשימת חשבוניות
- `POST /invoices` - יצירת חשבונית חדשה
- `GET /invoices/:id` - קבלת פרטי חשבונית 
# מדריך פתרון תקלות - מערכת דיאם

מדריך זה נוצר כדי לסייע בפתרון ומניעת תקלות נפוצות במערכת, בהתבסס על ניסיון העבר.

## תקלות שרת ובעיות חיבור

### בעיות חיבור לשרת (ERR_CONNECTION_REFUSED)

#### סימפטומים
- הודעות שגיאה בקונסול כגון `GET http://localhost:3200/api/... net::ERR_CONNECTION_REFUSED`
- ממשק משתמש טוען ללא הצגת נתונים
- כפתורים לא מגיבים כמצופה

#### פתרון
1. **בדיקת הפעלת השרת**:
   ```bash
   # וודא שאתה בתיקיית שורש הפרויקט
   cd /Users/yhzqlswwrz/Documents/Projects/diam
   
   # הפעל את השרת
   npm run server
   ```

2. **פתרון בעיות בהפעלת שרת**:
   - אם השרת נכשל בהפעלה, בדוק את הודעת השגיאה
   - חפש התייחסויות לקבצים חסרים כמו `Cannot find module '../models/...`
   - צור את קבצי המודל החסרים או תקן את נתיבי הייבוא

3. **בדיקת תלויות חסרות**:
   ```bash
   # התקן מחדש את תלויות השרת
   cd server && npm install
   ```

4. **בדיקת משאבי רשת**:
   - וודא שהפורט 3200 פנוי (אם השרת רץ כבר בתהליך אחר):
   ```bash
   # בדיקת תהליכים המשתמשים בפורט 3200
   lsof -i :3200
   
   # הפסקת תהליך (החלף PID בערך האמיתי)
   kill -9 PID
   ```

### בעיות חסרים בקבצי מודל ובקרים

#### סימפטומים
- שגיאת `Cannot find module '../models/XYZ'`
- שגיאת `Route.get() requires a callback function but got a [object Undefined]`

#### פתרון
1. **ודא שכל קבצי המודל קיימים**:
   - ודא שכל המודלים הנדרשים קיימים בתיקיית `/server/models`
   - המודלים הבסיסיים הנדרשים הם:
     - `Booking.js`
     - `Room.js`
     - `User.js`
     - `Invoice.js`
     - `Capital.js`
     - `Expense.js`
     - `ExpenseCategory.js`
     - `ManualIncome.js`
     - `IncomeCategory.js`
     - `FinancialSummary.js`

2. **בדיקת עקביות בייצוא פונקציות**:
   - ודא שכל הבקרים מייצאים את הפונקציות שלהם בצורה עקבית
   - בדוק שפונקציות ב-middleware מיוצאות נכון:
   ```javascript
   // דוגמה לפורמט ייצוא נכון למידלוור
   module.exports = {
     verifyToken: async (req, res, next) => {
       // ...
     }
   };
   ```

3. **בדיקת התאמה בין נתיבים לבקרים**:
   - ודא שכל הנתיבים בקבצי routes/ מפנים לפונקציות בקרים שאכן קיימות
   - בדוק שאין שגיאות כתיב בשמות הפונקציות

## בעיות סנכרון אמצעי תשלום

### חוסר עקביות בין אמצעי תשלום ברחבי המערכת

#### סימפטומים
- אמצעי תשלום נמצאים באחד המודלים אך חסרים באחר
- דף ניהול הון מציג ₪0 למרות שיש נתונים במערכת
- חוסר התאמה בין דפי הכנסות לדף ניהול הון

#### פתרון
1. **שמירה על רשימה אחידה של אמצעי תשלום**:
   - וודא שכל המודלים משתמשים באותה רשימת אמצעי תשלום:
   ```javascript
   // רשימת אמצעי תשלום תקנית
   const validPaymentMethods = [
     'cash',                // מזומן
     'credit_rothschild',   // אשראי רוטשילד
     'credit_or_yehuda',    // אשראי אור יהודה
     'transfer_poalim',     // העברה פועלים
     'transfer_mizrahi',    // העברה מזרחי
     'bit_poalim',          // ביט פועלים
     'bit_mizrahi',         // ביט מזרחי
     'paybox_poalim',       // פייבוקס פועלים
     'paybox_mizrahi',      // פייבוקס מזרחי
     'other'                // אחר
   ];
   ```

2. **סנכרון נתוני הון עם הכנסות והוצאות**:
   - הרץ את סקריפט אתחול ההון לאחר שינויים משמעותיים:
   ```bash
   npm run init-capital
   ```
   - או הפעל את כפתור "סנכרון נתונים" בדף ניהול ההון בממשק

3. **תיקון בעיות בתהליך הסנכרון**:
   - אם יש שגיאות בסנכרון, בדוק את הקונסול לקבלת מידע נוסף
   - שגיאות נפוצות כוללות ניסיון לעדכן שדות בצורה לא תקינה:
   ```javascript
   // דרך נכונה לעדכן אובייקט בסכמת mongoose
   const updatedAmounts = { ...document.currentAmounts };
   updatedAmounts[key] = newValue;
   document.currentAmounts = updatedAmounts;
   ```

4. **בדיקת עדכון אוטומטי**:
   - וודא שפונקציות עדכון אוטומטי נקראות בכל שינוי בהכנסות/הוצאות:
   ```javascript
   // לדוגמה, בעת יצירת הזמנה חדשה:
   await capitalController.updateCapitalOnNewIncome(paymentMethod, amount);
   ```

### שגיאת 500 בסנכרון נתוני הון

#### סימפטומים
- לחיצה על כפתור "סנכרון נתונים" בדף ניהול הון מציגה שגיאת 500
- הודעת שגיאה בקונסול: `POST http://localhost:3200/api/capital/sync/full 500 (Internal Server Error)`
- שגיאה בקונסול השרת: `TypeError: this.$set.call is not a function`

#### פתרון
1. **תיקון בעיית עדכון שדות מונגוס**:
   - במקום לעדכן שדות ישירות בתוך האובייקט, יש ליצור אובייקט חדש ולהחליף את כל האובייקט:
   ```javascript
   // במקום:
   for (const method in capitalData.currentAmounts) {
     capitalData.currentAmounts[method] = 0;
   }
   
   // יש להשתמש ב:
   const updatedAmounts = {
     cash: 0,
     credit_rothschild: 0,
     // וכו'
   };
   capitalData.currentAmounts = updatedAmounts;
   ```

2. **איפוס הון והפעלה מחדש**:
   ```bash
   node server/scripts/initializeCapital.js
   ```

3. **הבטחת סנכרון כל מקורות ההכנסה וההוצאה**:
   - וודא שכל הבקרים סופרים הכנסות גם מהזמנות וגם מהכנסות ידניות:
   ```javascript
   // קבלת כל ההכנסות מהזמנות
   const bookings = await Booking.find({...});
   
   // קבלת כל ההכנסות הידניות
   const manualIncomes = await ManualIncome.find({...});
   ```

## טיפים למניעת תקלות עתידיות

1. **השתמש בבדיקת שלמות מערכת**:
   - צור סקריפט שבודק שכל הקבצים הנדרשים קיימים
   - הרץ את הסקריפט לפני התחלת פיתוח או לאחר שינויים משמעותיים

2. **בקרת גרסאות**:
   - עבוד עם גיט ובצע commit אחרי כל שינוי משמעותי
   - תייג (tag) גרסאות יציבות של המערכת

3. **בדיקות לפני הפצה**:
   - בדוק את כל הפיצ'רים העיקריים לפני העברה לייצור
   - הרץ את סקריפט אתחול ההון לפני הפצה

4. **תיעוד שינויים**:
   - תעד כל שינוי מבני במערכת
   - בעת הוספת שדה או שינוי מודל, עדכן את כל המקומות הרלוונטיים

## קוד לבדיקת שלמות (הצעה לסקריפט עתידי)

```javascript
// הצעה לקוד עבור checkIntegrity.js
const fs = require('fs');
const path = require('path');

const requiredModels = [
  'Booking.js', 'Room.js', 'User.js', 'Invoice.js', 
  'Capital.js', 'Expense.js', 'ExpenseCategory.js',
  'ManualIncome.js', 'IncomeCategory.js', 'FinancialSummary.js'
];

const requiredControllers = [
  'bookingsController.js', 'roomsController.js', 'authController.js',
  'invoicesController.js', 'capitalController.js', 'financialController.js'
];

// בדיקת קיום כל קבצי המודל הנדרשים
const modelsPath = path.join(__dirname, '..', 'models');
const missingModels = requiredModels.filter(model => 
  !fs.existsSync(path.join(modelsPath, model))
);

// בדיקת קיום כל קבצי הבקר הנדרשים
const controllersPath = path.join(__dirname, '..', 'controllers');
const missingControllers = requiredControllers.filter(controller => 
  !fs.existsSync(path.join(controllersPath, controller))
);

if (missingModels.length > 0) {
  console.error('חסרים קבצי מודל:', missingModels.join(', '));
  process.exit(1);
}

if (missingControllers.length > 0) {
  console.error('חסרים קבצי בקר:', missingControllers.join(', '));
  process.exit(1);
}

console.log('✅ כל קבצי המערכת הנדרשים קיימים');
process.exit(0);
```

מומלץ להוסיף סקריפט זה ל-package.json:
```json
"scripts": {
  "prestart": "node server/scripts/checkIntegrity.js",
  "preserver": "node server/scripts/checkIntegrity.js"
}
``` 
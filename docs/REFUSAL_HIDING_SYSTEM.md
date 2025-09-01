# 🚫 מערכת הסתרת אורחים עם סירוב בלוח המודעות

## 📋 סקירה כללית

מערכת מתקדמת להסתרת שמות אורחים מלוח המודעות הציבורי של Airport Guest House כאשר בשדה ההערות של ההזמנה מופיעה מילת "סירוב" או מילים דומות.

## 🎯 המטרה

כאשר מנהל המלון רושם "סירוב" בהערות של הזמנה (מסיבות פרטיות או עסקיות), השם של האורח לא יופיע בלוח המודעות הציבורי שנמצא בלובי של המלון.

## 🔧 המימוש הטכני

### 🛡️ הגנה כפולה

המערכת מיושמת בשתי שכבות הגנה:

#### 1. שכבת השרת (Server-Side Protection)
**קובץ:** `server/controllers/bookingsController.js`

```javascript
// פרמטר חדש: hideRefusals
const { startDate, endDate, location, filterMode, hideRefusals } = req.query;

// סינון הזמנות עם סירוב
if (hideRefusals === 'true') {
  finalBookings = bookingsWithInvoiceInfo.filter(booking => {
    if (!booking.notes) return true;
    
    const notesLower = booking.notes.toLowerCase();
    const refusalKeywords = ['סירוב', 'refusal', 'refuse', 'declined', 'reject', 'rejection'];
    
    const hasRefusal = refusalKeywords.some(keyword => notesLower.includes(keyword));
    
    if (hasRefusal) {
      console.log(`🚫 מסתיר הזמנה #${booking.bookingNumber} מלוח המודעות בגלל סירוב בהערות`);
    }
    
    return !hasRefusal;
  });
}
```

#### 2. שכבת הקליינט (Client-Side Protection)
**קובץ:** `client/src/pages/public-site/PublicNoticeBoard.js`

```javascript
// בקשה לשרת עם פרמטר הסתרת סירובים
const response = await fetch(`${apiUrl}/api/bookings/public/date-range?startDate=${startStr}&endDate=${endStr}&location=airport&hideRefusals=true`);

// סינון נוסף בקליינט (שכבת הגנה נוספת)
const hasRefusal = booking.notes && (
  booking.notes.toLowerCase().includes('סירוב') ||
  booking.notes.toLowerCase().includes('refusal') ||
  booking.notes.toLowerCase().includes('refuse') ||
  booking.notes.toLowerCase().includes('declined') ||
  booking.notes.toLowerCase().includes('reject')
);

return isToday && isNotCancelled && !hasRefusal;
```

## 🔍 מילות מפתח נתמכות

המערכת מזהה את המילים הבאות בהערות (case-insensitive):

### עברית:
- **סירוב**

### אנגלית:
- **refusal**
- **refuse**  
- **declined**
- **reject**
- **rejection**

## 📊 דוגמאות שימוש

### ✅ הזמנות שיוצגו בלוח המודעות:
- הערות: "אורח VIP - צריך שירות מיוחד"
- הערות: "הגיע מוקדם - חדר 105"
- הערות: "" (ללא הערות)

### ❌ הזמנות שלא יוצגו בלוח המודעות:
- הערות: "סירוב להציג בלוח המודעות"
- הערות: "REFUSAL - privacy request"
- הערות: "Guest declined public display"
- הערות: "reject showing name"

## 🔒 אבטחה ופרטיות

### יתרונות המערכת:
1. **הגנה כפולה** - גם בשרת וגם בקליינט
2. **גמישות** - תמיכה במילים בעברית ואנגלית
3. **לוגינג מפורט** - מעקב אחר הזמנות מוסתרות
4. **ביצועים טובים** - סינון מהיר ויעיל

### התנהגות המערכת:
- **אם אין הערות** → האורח יוצג בלוח המודעות
- **אם יש הערות ללא מילת סירוב** → האורח יוצג בלוח המודעות  
- **אם יש מילת סירוב בהערות** → האורח לא יוצג בלוח המודעות

## 🎛️ הפעלה והשבתה

### הפעלת המערכת:
המערכת פעילה אוטומטית עבור לוח המודעות הציבורי של Airport.

### השבתת המערכת (במקרה הצורך):
ניתן להשבית על ידי הסרת הפרמטר `hideRefusals=true` מהבקשה ב-`PublicNoticeBoard.js`.

## 🧪 בדיקות

### בדיקה ידנית:
1. צור הזמנה עם הערות "סירוב"
2. בדוק שהאורח לא מופיע בלוח המודעות
3. הסר את המילה "סירוב" מההערות
4. בדוק שהאורח חזר להופיע בלוח המודעות

### לוגים לבדיקה:
```
🚫 מסתיר הזמנה #12345 מלוח המודעות בגלל סירוב בהערות: "סירוב להציג"
- Booking 12345: hasRefusal=true, notes="סירוב להציג"
```

## 📅 תאריך יישום

**ינואר 2025** - מימוש מערכת הסתרת אורחים עם סירוב בלוח המודעות

## 🔗 קבצים שונו

### שרת:
- `server/controllers/bookingsController.js` - הוספת לוגיקת סינון בשרת

### קליינט:
- `client/src/pages/public-site/PublicNoticeBoard.js` - שיפור הסינון בקליינט

---

**מפתח:** מערכת דיאם - ניהול מלון מתקדם  
**גרסה:** 2.0 - הגנת פרטיות מתקדמת

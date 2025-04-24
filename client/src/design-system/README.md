# מערכת העיצוב Diam

מערכת העיצוב של Diam נועדה ליצור שפה עיצובית אחידה בכל חלקי האפליקציה. מערכת זו מספקת כלים, הנחיות ודוגמאות ליישום של רכיבי ממשק משתמש, תוך הקפדה על עקביות ונגישות.

## תיקיות ומבנה המערכת

```
/design-system/
  ├── DesignSystem.js        # דף הבית של מערכת העיצוב
  ├── README.md              # תיעוד כללי (קובץ זה)
  ├── examples/              # דוגמאות קוד ליישום
  │   ├── DesignExamples.js  # דוגמאות של רכיבים בסיסיים
  │   └── BookingCalendarExamples.js  # דוגמה של רכיב מורכב (יומן הזמנות)
  ├── guidelines/            # הנחיות והסברים מפורטים
  │   └── DesignGuidelines.md  # מסמך מפורט של הנחיות עיצוב
  └── styles/                # קבצי סגנון וקבועים
      └── StyleConstants.js  # קבועי סגנון לשימוש בכל האפליקציה
```

## שימוש במערכת העיצוב

### ייבוא קבועי עיצוב

כדי להשתמש בקבועי העיצוב, ייבא את הקובץ `StyleConstants.js`:

```jsx
import { STYLE_CONSTANTS, getHebrewInputStyle, getBookingStatusColors } from '../design-system/styles/StyleConstants';
```

### יישום בקומפוננטים חדשים

בעת יצירת קומפוננט חדש, יש לבסס את העיצוב על הסגנונות המוגדרים ב-`StyleConstants.js`:

```jsx
const MyComponent = () => {
  return (
    <Paper sx={{ 
      borderRadius: STYLE_CONSTANTS.card.borderRadius,
      boxShadow: STYLE_CONSTANTS.card.boxShadow,
      p: 2.5
    }}>
      <Typography variant="h5" sx={{ fontWeight: STYLE_CONSTANTS.typography.fontWeights.medium }}>
        כותרת הקומפוננט
      </Typography>
      
      <TextField
        label="שדה טקסט"
        fullWidth
        sx={getHebrewInputStyle()}
      />
    </Paper>
  );
};
```

## עקרונות מנחים

1. **אחידות**: שימוש בסגנונות המוגדרים בלבד כדי להבטיח אחידות בכל רחבי האפליקציה
2. **תמיכה בעברית**: כל הרכיבים מותאמים לכיוון RTL וכתיבה בעברית
3. **סקלביליות**: תמיכה במגוון גדלי מסך וצפיפויות פיקסלים
4. **זהות ויזואלית**: שימוש עקבי בסכמות הצבעים לפי המיקום (Airport / Rothschild)

## צבעים עיקריים

- **Airport Guest House**: כחול (`#0071e3`)
- **רוטשילד**: כחול-סגול (`#4570e5`)
- **פעולות אישור**: ירוק (`#06a271`)
- **פעולות ביטול/מחיקה**: אדום (`#e34a6f`)
- **סטטוס המתנה**: כתום (`#f7971e`)

## הנחיות נוספות

לפרטים והנחיות מלאות, ראה את מסמך ההנחיות המלא: [DesignGuidelines.md](./guidelines/DesignGuidelines.md) 
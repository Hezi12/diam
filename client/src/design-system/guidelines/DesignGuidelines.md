# הנחיות עיצוב - מערכת ניהול Diam

## עקרונות ליבה
- **מינימליזם עסקי**: עיצוב נקי, מקצועי וממוקד עם צבעים עסקיים שמשדרים אמינות ויציבות
- **זהות ויזואלית לפי אתר**: צבעים ייחודיים לכל אחד מאתרי המלון, כחול לאיירפורט וסגול-כחול לרוטשילד
- **שפה עיצובית אחידה**: יישום עקבי של אלמנטים חזותיים בכל המערכת
- **ממשק יעיל**: ממשק נקי ואינטואיטיבי ללא הסחות דעת מיותרות
- **היררכיה ויזואלית**: הצגת אלמנטים לפי סדר חשיבות באמצעות גודל, צבע ומיקום
- **תמיכה בעברית**: עיצוב המותאם לשפה העברית וכיוון RTL עם מרווחים וסידור מתאימים

## צבעים

### צבעים ראשיים
| שם | ערך | שימוש |
|------|---------|----------|
| primary (Airport) | `#0071e3` | פעולות מודגשות, רכיבים אינטראקטיביים באיירפורט |
| primary (Rothschild) | `#4570e5` | פעולות מודגשות, רכיבים אינטראקטיביים ברוטשילד |
| secondary | `#86868b` | רכיבי UI משניים |
| background.default | `#f5f5f7` | רקע כללי של האפליקציה |
| background.paper | `#ffffff` | רקע רכיבים, כרטיסים |

### צבעי אקסנט
| שם | שימוש | ערך |
|------|---------|----------|
| accent.green | הוספה, אישור, סטטוס פעיל | `#06a271` |
| accent.red | מחיקה, ביטול | `#e34a6f` |
| accent.orange | סטטוס בהמתנה | `#f7971e` |

### צבעי רקע בהיר
| שם | שימוש | ערך |
|------|---------|----------|
| Airport (bgLight) | רקע בהיר לאלמנטים באיירפורט | `rgba(0, 113, 227, 0.08)` |
| Rothschild (bgLight) | רקע בהיר לאלמנטים ברוטשילד | `rgba(69, 112, 229, 0.08)` |

### צבעי טקסט
| שם | ערך | שימוש |
|------|---------|----------|
| text.primary | `#1d1d1f` | טקסט ראשי |
| text.secondary | `#86868b` | טקסט משני |

## יישום צבעים עיקריים

### זיהוי ויזואלי לפי אתר
- **Airport Guest House**: כחול (`#0071e3`) - אייקון מטוס
- **רוטשילד**: כחול-סגול (`#4570e5`) - אייקון בניין

### צבעי פעולות
- **אישור/הוספה**: ירוק (`#06a271`)
- **מחיקה/ביטול**: אדום (`#e34a6f`)
- **המתנה/עיבוד**: כתום (`#f7971e`)

## טיפוגרפיה

### פונט
פונט **Assistant** עם גיבויים של SF Pro (Apple) והלווטיקה

```css
font-family: 'Assistant', 'SF Pro', 'Helvetica', 'Arial', sans-serif;
```

### משקלי פונט
- **רגיל**: 400
- **בינוני**: 500
- **מודגש**: 600

### גדלי טקסט
- כותרת ראשית (h4): 1.75rem - 2rem
- כותרת משנית (h5, h6): 1.1rem - 1.25rem
- טקסט רגיל: 1rem
- טקסט קטן: 0.875rem

## רדיוס פינות
- **כפתורים**: 4px
- **כרטיסים וקונטיינרים**: 8px
- **דיאלוגים**: 8px
- **שדות קלט**: 4px

## עיצוב רכיבים

### כותרות עמודים
- **מבנה**: אייקון בצבע ייעודי לאתר + כותרת
- **סגנון אייקון**: מרובע עם רקע בהיר בצבע האתר, מרווח מהטקסט (mr: 3.5)
- **גודל אייקון**: 28px
- **מרווח תחתון**: 2rem (mb: 4)

```jsx
<Box sx={{ 
  mb: 4,
  pt: 2,
  display: 'flex',
  alignItems: 'center'
}}>
  <Box 
    sx={{ 
      mr: 3.5, 
      bgcolor: locationColors.bgLight, 
      p: 1.5, 
      borderRadius: style.card.borderRadius.replace('px', '') / 1.2 + 'px',
      display: 'flex'
    }}
  >
    <Icon sx={{ color: locationColors.main, fontSize: 28 }} />
  </Box>
  <Typography variant="h4" component="h1" sx={{ fontWeight: 500, color: 'text.primary' }}>
    שם העמוד
  </Typography>
</Box>
```

### טבלאות
- **מסגרת**: קלה, רדיוס מעוגל (8px)
- **כותרות**: רקע בצבע בהיר המתאים לאתר וצבע טקסט מותאם, קו תחתון בצבע האתר
- **שורות**: קו הפרדה דק, הבהרה בריחוף
- **סטטוס**: צ'יפ עם צבע רקע, גבול ואייקון מותאמים לסטטוס

```jsx
<TableHead>
  <TableRow sx={{ 
    '& th': { 
      fontWeight: 600, 
      bgcolor: locationColors.bgLight,
      color: locationColors.main,
      borderBottom: `2px solid ${locationColors.main}`,
    } 
  }}>
    <TableCell align="right">כותרת</TableCell>
  </TableRow>
</TableHead>

// שורת טבלה עם סטטוס
<TableRow hover>
  <TableCell align="right">
    <Chip 
      label={statusLabel}
      icon={statusIcon}
      size="small"
      sx={{ 
        bgcolor: statusColors.bgColor,
        color: statusColors.textColor,
        borderColor: statusColors.borderColor,
        fontWeight: 500,
        border: '1px solid',
        '& .MuiChip-icon': {
          marginLeft: '4px',
          marginRight: '-4px'
        },
        '& .MuiChip-label': {
          paddingRight: '8px'
        }
      }}
    />
  </TableCell>
</TableRow>
```

### כפתורים
- **כפתור ראשי**: רקע בצבע מותאם לפעולה, ללא צל, רדיוס 4px
- **כפתור משני**: מסגרת בצבע ייעודי, רקע שקוף שמתמלא בריחוף
- **כפתורי פעולה**: אייקונים עם מרווח של 8-10px מהטקסט

```jsx
// כפתור ראשי
<Button 
  variant="contained" 
  sx={{ 
    bgcolor: locationColors.main, 
    '&:hover': { bgcolor: locationColors.main, filter: 'brightness(90%)' },
    borderRadius: '4px',
    textTransform: 'none',
    boxShadow: 'none'
  }}
>
  פעולה
</Button>

// כפתור משני
<Button 
  variant="outlined"
  sx={{ 
    color: locationColors.main,
    borderColor: locationColors.main,
    '&:hover': { bgcolor: locationColors.bgLight },
    borderRadius: '4px',
    textTransform: 'none'
  }}
>
  פעולה
</Button>

// כפתור עם אייקון
<Button 
  variant="contained" 
  startIcon={<AddIcon sx={{ marginLeft: '8px', marginRight: '0px' }} />}
  sx={{ 
    bgcolor: style.colors.accent.green, 
    '&:hover': { bgcolor: style.colors.accent.green, filter: 'brightness(90%)' },
    borderRadius: '4px',
    textTransform: 'none'
  }}
>
  הוסף חדש
</Button>
```

### כרטיסים (Cards)
- **מסגרת**: עדינה עם רדיוס מעוגל (8px)
- **צל**: קל (0 1px 3px rgba(0,0,0,0.1))
- **ריפוד**: p: 2.5 (20px)
- **קו צבע**: אופציונלי - פס עליון בצבע ייעודי בעובי 3px

```jsx
<Paper 
  sx={{ 
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    p: 2.5,
    // אופציונלי - קו צבע עליון
    borderTop: `3px solid ${locationColors.main}`
  }}
>
  <Typography variant="h6">כותרת אריח</Typography>
  <Divider sx={{ my: 2 }} />
  <Typography variant="body2" color="text.secondary">
    תוכן הכרטיס
  </Typography>
</Paper>
```

### דיאלוגים
- **רדיוס**: 8px
- **כותרת**: רקע בצבע בהיר המתאים לאתר, קו תחתון
- **כפתורי פעולה**: בתחתית הדיאלוג עם הפרדה מהתוכן

```jsx
<Dialog
  maxWidth="md"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: '8px',
      overflow: 'hidden'
    }
  }}
>
  <DialogTitle 
    sx={{ 
      bgcolor: locationColors.bgLight, 
      color: locationColors.main,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${locationColors.main}`,
      py: 1.5
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Icon sx={{ marginRight: '10px' }} />
      <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
        כותרת הדיאלוג
      </Typography>
    </Box>
    <IconButton size="small">
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  
  <DialogContent sx={{ p: 3, mt: 2 }}>
    {/* תוכן הדיאלוג */}
  </DialogContent>
  
  <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
    <Button 
      variant="text"
      sx={{ 
        color: 'text.secondary',
        borderRadius: '4px',
        textTransform: 'none'
      }}
    >
      ביטול
    </Button>
    <Button 
      variant="contained" 
      sx={{ 
        bgcolor: style.colors.accent.green, 
        '&:hover': { bgcolor: style.colors.accent.green, filter: 'brightness(90%)' },
        borderRadius: '4px',
        textTransform: 'none'
      }}
    >
      שמירה
    </Button>
  </DialogActions>
</Dialog>
```

### שדות קלט בעברית
- **כיוון**: RTL - מימין לשמאל
- **ריפוד**: שולי טקסט ימניים של 20px לפחות
- **תווית**: מיקום תווית בצד ימין, רקע לבן לשדות עם מסגרת, מרווח של 12px מימין

```jsx
// הגדרת סגנון קלט עברית
const hebrewInputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '4px',
    paddingRight: '14px',
  },
  '& .MuiInputLabel-root': {
    right: 18,
    left: 'auto',
    transformOrigin: 'top right'
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(16px, -9px) scale(0.75)',
    transformOrigin: 'top right'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    textAlign: 'right',
    paddingRight: 12
  },
  '& .MuiInputBase-input': {
    textAlign: 'right',
    paddingRight: '20px',
  },
  '& .MuiSelect-select': {
    paddingRight: '20px'
  },
  '& .MuiFormLabel-filled': {
    right: 18,
  }
};

// שדה טקסט
<TextField
  label="שדה טקסט"
  placeholder="הקלד טקסט..."
  fullWidth
  sx={hebrewInputStyle}
/>

// שדה בחירה
<FormControl fullWidth sx={{
  ...hebrewInputStyle,
  '& .MuiSelect-select': {
    paddingRight: '20px'
  },
  '& .MuiInputLabel-outlined': {
    backgroundColor: '#fff',
    paddingRight: '6px',
    paddingLeft: '6px',
    right: '12px',
    marginRight: '12px',
    zIndex: 1
  },
  '& .MuiInputLabel-outlined.MuiInputLabel-shrink': {
    transform: 'translate(16px, -9px) scale(0.75)',
    backgroundColor: '#fff',
    paddingRight: '6px',
    paddingLeft: '6px',
    right: '22px'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    textAlign: 'right',
    paddingRight: '24px',
    legend: {
      marginRight: '12px'
    }
  }
}}>
  <InputLabel>בחר אפשרות</InputLabel>
  <Select label="בחר אפשרות">
    <MenuItem value="1">אפשרות ראשונה</MenuItem>
    <MenuItem value="2">אפשרות שנייה</MenuItem>
  </Select>
</FormControl>
```

### אייקונים
- **מרווח בין אייקון לטקסט**: 8-10px
- **צבע**: בהתאם לצבע הפעולה או האתר
- **מיקום בכפתורים**: מצד שמאל של הטקסט (בעברית)

```jsx
<Button 
  startIcon={<AddIcon sx={{ marginLeft: '8px', marginRight: '0px' }} />}
  variant="contained"
>
  הוסף
</Button>

// אייקון עם טולטיפ
<Tooltip title="שם הפעולה">
  <IconButton size="small" sx={{ marginLeft: '8px', color: locationColors.main }}>
    <Icon />
  </IconButton>
</Tooltip>
```

## מרווחים
- **ריפוד בכרטיסים**: p: 2.5 (20px)
- **מרווח בין אייקונים לטקסט**: 8-10px
- **מרווח בין רכיבים בטפסים**: gap: 2-3 (16-24px)
- **מרווח בין סעיפים**: my: 3-4 (24-32px)

## כיוון דף
- תמיכה מלאה ב-RTL (מימין לשמאל) לשפה העברית
- יישור טקסט לימין בכל הרכיבים
- התאמת כיוון אייקונים ורכיבים אינטראקטיביים

## יישום בקומפוננטים חדשים

כאשר יוצרים עמוד או קומפוננט חדש:

1. **הגדרת סגנונות כלליים**:
```jsx
// הגדרת סגנון בתחילת הקומפוננט
const style = {
  name: "קלאסי ונקי - עסקי",
  colors: {
    airport: {
      main: '#0071e3',
      bgLight: 'rgba(0, 113, 227, 0.08)'
    },
    rothschild: {
      main: '#4570e5',
      bgLight: 'rgba(69, 112, 229, 0.08)'
    },
    accent: {
      green: '#06a271',
      red: '#e34a6f',
      orange: '#f7971e',
    }
  },
  card: {
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    p: 2.5,
  },
  button: {
    borderRadius: '4px',
    textTransform: 'none',
  },
  table: {
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  dialog: {
    borderRadius: '8px',
  }
};

// בחירת צבעים לפי מיקום
const locationColors = style.colors[location];
```

2. **הגדרת סגנון קלט עברי**:
```jsx
const hebrewInputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: style.button.borderRadius,
    paddingRight: '14px',
  },
  '& .MuiInputLabel-root': {
    right: 18,
    left: 'auto',
    transformOrigin: 'top right'
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(16px, -9px) scale(0.75)',
    transformOrigin: 'top right'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    textAlign: 'right',
    paddingRight: 12
  },
  '& .MuiInputBase-input': {
    textAlign: 'right',
    paddingRight: '20px',
  },
  '& .MuiSelect-select': {
    paddingRight: '20px'
  },
  '& .MuiFormLabel-filled': {
    right: 18,
  }
};
```

## דוגמת יישום מלאה

לדוגמת יישום מלאה של העיצוב החדש, ראו את הקומפוננט:
- [`DesignExamples.js`](/client/src/pages/DesignExamples.js)

בעת יצירת קומפוננטים חדשים או עריכת קומפוננטים קיימים, יש להקפיד על השימוש באלמנטים והסגנונות המוגדרים במסמך זה ובקובץ הדוגמה כדי לשמור על אחידות ויזואלית בכל המערכת.

## סיכום נקודות חשובות

1. **קלאסי ונקי - עסקי**: עיצוב פשוט, מקצועי ויעיל בדגש על שימושיות
2. **צבעים ייחודיים לכל אתר**: כחול לאיירפורט וכחול-סגול לרוטשילד
3. **תמיכה מלאה בעברית**: כל הרכיבים מותאמים לכיוון RTL עם הקפדה על מרווחים ומיקום נכונים
4. **רדיוס פינות עקבי**: 4px לרכיבים קטנים, 8px לרכיבים גדולים
5. **מרווח עקבי בין אייקונים לטקסט**: 8-10px
6. **שולי טקסט בשדות קלט**: לפחות 20px מימין לטקסט

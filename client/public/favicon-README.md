# הוספת Favicon למערכת Diam

קובץ זה מסביר כיצד ליצור ולהוסיף favicon לאתר Diam, כך שיופיע לוגו מותאם אישית בלשוניות הדפדפן.

## קבצים שנוספו/שונו

1. `favicon.svg` - הלוגו בפורמט וקטורי
2. `site.webmanifest` - מניפסט נוסף להגדרת אייקונים
3. `index.html` - עודכן עם כל הקישורים לקבצי ה-favicon
4. `manifest.json` - עודכן עם התייחסויות לקבצים החדשים

## ליצירת קבצי הפייביקון

הרץ את הסקריפט `favicon-generator.sh` בתיקיית `client/public`:

```bash
cd client/public
./favicon-generator.sh
```

הסקריפט ייצור את כל קבצי ה-favicon הדרושים, אם יש לך מותקן Inkscape או ImageMagick.

## יצירת הקבצים באופן ידני

אם אין לך את הכלים המתאימים, אפשר ליצור את הקבצים באופן ידני או באמצעות שירות מקוון:

1. השתמש באתר כמו [Favicon Generator](https://realfavicongenerator.net/)
2. העלה את קובץ ה-SVG וצור את כל קבצי ה-favicon
3. הורד את הקבצים ושים אותם בתיקיית `client/public`

## קבצים נדרשים

- `favicon.ico` - אייקון למערכות ישנות
- `favicon-16x16.png` - אייקון בגודל 16x16
- `favicon-32x32.png` - אייקון בגודל 32x32
- `android-chrome-192x192.png` - אייקון לאנדרואיד
- `android-chrome-512x512.png` - אייקון לאנדרואיד בגודל גדול
- `apple-touch-icon.png` - אייקון ל-iOS
- `logo192.png` - העתק של android-chrome-192x192.png (עבור React)
- `logo512.png` - העתק של android-chrome-512x512.png (עבור React)

## לאחר ההוספה

לאחר הוספת הקבצים, הרץ:

```bash
npm run build
```

כדי ליצור גרסה חדשה של האתר עם הפייביקון. 
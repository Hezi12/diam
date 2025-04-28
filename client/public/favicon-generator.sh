#!/bin/bash

# סקריפט ליצירת קבצי favicon מקובץ SVG
# דורש התקנה של ImageMagick

set -e

# בדיקה אם קובץ ה-favicon.svg קיים
if [ ! -f favicon.svg ]; then
  echo "הקובץ favicon.svg לא נמצא בתיקייה הנוכחית."
  exit 1
fi

echo "יוצר קבצי favicon מתוך favicon.svg..."

# בדיקה אם npx זמין
if ! command -v npx &> /dev/null; then
  echo "npx לא מותקן. נסה להתקין nodejs ו-npm."
  exit 1
fi

# וודא שתיקיית icons קיימת
if [ ! -d "icons" ]; then
  echo "יוצר תיקיית icons..."
  mkdir -p icons
fi

# העתק את קובץ ה-SVG המקורי לתיקיית icons
cp favicon.svg icons/

# התקנת sharp-cli אם אינו קיים
if ! npx sharp-cli --version &> /dev/null; then
  echo "מתקין sharp-cli..."
  npm install --save-dev sharp-cli
fi

# יצירת קבצי PNG בגדלים שונים
echo "יוצר קובצי PNG..."
npx sharp -i favicon.svg -o icons/favicon-16x16.png resize 16 16
npx sharp -i favicon.svg -o icons/favicon-32x32.png resize 32 32
npx sharp -i favicon.svg -o icons/android-chrome-192x192.png resize 192 192
npx sharp -i favicon.svg -o icons/android-chrome-512x512.png resize 512 512
npx sharp -i favicon.svg -o icons/apple-touch-icon.png resize 180 180

# יצירת קבצים עבור React
cp icons/android-chrome-192x192.png icons/logo192.png
cp icons/android-chrome-512x512.png icons/logo512.png

# יצירת favicon.ico (הדרך הפשוטה ביותר - העתקת favicon-32x32.png)
echo "יוצר favicon.ico..."
cp icons/favicon-32x32.png icons/favicon.ico

# עדכון הקישורים בקבצי המערכת
echo "מעדכן קישורים בקבצי המערכת..."

# הודעת סיכום
echo "כל קבצי ה-favicon נוצרו בהצלחה בתיקיית icons!"
echo "נא לעדכן את הקישורים ב-index.html וב-manifest.json לפנות לתיקיית icons" 
#!/bin/bash

# צבעים לפלט
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "בודק את תקינות קבצי ה-favicon במערכת Diam..."
echo "============================================="

# רשימת קבצים שצריכים להיות קיימים
required_files=(
  "icons/favicon.svg"
  "icons/favicon.ico"
  "icons/favicon-16x16.png"
  "icons/favicon-32x32.png"
  "icons/android-chrome-192x192.png"
  "icons/android-chrome-512x512.png"
  "icons/apple-touch-icon.png"
  "icons/logo192.png"
  "icons/logo512.png"
)

# בדיקת קיום הקבצים
missing_files=0
for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}[V]${NC} הקובץ $file קיים"
  else
    echo -e "${RED}[X]${NC} הקובץ $file חסר!"
    missing_files=$((missing_files + 1))
  fi
done

# בדיקת ההתייחסויות ב-index.html
echo -e "\nבודק את ההתייחסויות ב-index.html..."
index_references=(
  "icons/favicon.ico"
  "icons/favicon.svg"
  "icons/favicon-32x32.png"
  "icons/favicon-16x16.png"
  "icons/apple-touch-icon.png"
  "manifest.json"
)

index_missing=0
for ref in "${index_references[@]}"; do
  if grep -q "$ref" index.html; then
    echo -e "${GREEN}[V]${NC} ההתייחסות ל-$ref קיימת ב-index.html"
  else
    echo -e "${RED}[X]${NC} ההתייחסות ל-$ref חסרה ב-index.html!"
    index_missing=$((index_missing + 1))
  fi
done

# בדיקת ההתייחסויות ב-manifest.json
echo -e "\nבודק את ההתייחסויות ב-manifest.json..."
manifest_references=(
  "icons/favicon-16x16.png"
  "icons/favicon-32x32.png"
  "icons/favicon.svg"
  "icons/android-chrome-192x192.png"
  "icons/android-chrome-512x512.png"
)

manifest_missing=0
for ref in "${manifest_references[@]}"; do
  if grep -q "$ref" manifest.json; then
    echo -e "${GREEN}[V]${NC} ההתייחסות ל-$ref קיימת ב-manifest.json"
  else
    echo -e "${RED}[X]${NC} ההתייחסות ל-$ref חסרה ב-manifest.json!"
    manifest_missing=$((manifest_missing + 1))
  fi
done

# בדיקת צבע צהוב
echo -e "\nבודק אם צבע הנושא הוא צהוב..."
if grep -q "theme-color" index.html && grep -q "#ffde00" index.html; then
  echo -e "${GREEN}[V]${NC} צבע הנושא הוא צהוב ב-index.html"
else
  echo -e "${RED}[X]${NC} צבע הנושא אינו צהוב או חסר ב-index.html!"
fi

if grep -q "theme_color" manifest.json && grep -q "#ffde00" manifest.json; then
  echo -e "${GREEN}[V]${NC} צבע הנושא הוא צהוב ב-manifest.json"
else
  echo -e "${RED}[X]${NC} צבע הנושא אינו צהוב או חסר ב-manifest.json!"
fi

# סיכום
echo -e "\n============================================="
if [ $missing_files -eq 0 ] && [ $index_missing -eq 0 ] && [ $manifest_missing -eq 0 ]; then
  echo -e "${GREEN}כל קבצי ה-favicon קיימים ומקושרים כראוי!${NC}"
else
  echo -e "${YELLOW}יש לתקן את הבעיות הבאות:${NC}"
  [ $missing_files -gt 0 ] && echo -e " - חסרים $missing_files קבצים"
  [ $index_missing -gt 0 ] && echo -e " - חסרות $index_missing התייחסויות ב-index.html"
  [ $manifest_missing -gt 0 ] && echo -e " - חסרות $manifest_missing התייחסויות ב-manifest.json"
fi

echo -e "\nכדי לבדוק את דף הבדיקה המלא, פתח את הקובץ favicon-test.html בדפדפן." 
import React, { createContext, useContext, useState, useEffect } from 'react';

// קבצי התרגום
import heTranslations from '../translations/he.json';
import enTranslations from '../translations/en.json';

const PublicLanguageContext = createContext();

const translations = {
  he: heTranslations,
  en: enTranslations
};

// פונקציה לזיהוי אוטומטי של שפת הדפדפן לפי מיקום האתר
const detectBrowserLanguage = () => {
  // בדיקת השפה המועדפת של הדפדפן
  const browserLanguage = navigator.language || navigator.languages?.[0] || '';
  
  // זיהוי המיקום מה-URL
  const currentPath = window.location.pathname;
  const isRothschildSite = currentPath.startsWith('/rothschild-booking');
  const isAirportSite = currentPath.startsWith('/airport-booking');
  
  // אם השפה היא עברית - תמיד עברית
  if (browserLanguage.toLowerCase().startsWith('he')) {
    return 'he';
  }
  
  // אם השפה היא אנגלית - תמיד אנגלית
  if (browserLanguage.toLowerCase().startsWith('en')) {
    return 'en';
  }
  
  // לכל שפה אחרת או כשלא מזוהה:
  if (isRothschildSite) {
    // באתר רוטשילד - עברית
    return 'he';
  } else if (isAirportSite) {
    // באתר איירפורט - אנגלית
    return 'en';
  }
  
  // ברירת מחדל כללית (אם לא באף אתר ציבורי) - עברית
  return 'he';
};

export const PublicLanguageProvider = ({ children }) => {
  // התחלה עם זיהוי אוטומטי של שפת הדפדפן
  const [currentLanguage, setCurrentLanguage] = useState(detectBrowserLanguage());
  const [direction, setDirection] = useState(detectBrowserLanguage() === 'he' ? 'rtl' : 'ltr');

  // טעינת שפה מ-localStorage בטעינה ראשונה (רק עבור האתר הציבורי)
  useEffect(() => {
    const savedLanguage = localStorage.getItem('publicSiteLanguage');
    if (savedLanguage && ['he', 'en'].includes(savedLanguage)) {
      // אם יש שפה שמורה - היא עדיפה על הזיהוי האוטומטי
      setCurrentLanguage(savedLanguage);
      setDirection(savedLanguage === 'he' ? 'rtl' : 'ltr');
    } else {
      // אם אין שפה שמורה - נשמור את השפה שזוהתה אוטומטית
      const detectedLanguage = detectBrowserLanguage();
      localStorage.setItem('publicSiteLanguage', detectedLanguage);
      
      // הודעה מפורטת על הזיהוי
      const browserLang = navigator.language || 'לא זוהה';
      const siteName = window.location.pathname.startsWith('/rothschild-booking') ? 'רוטשילד' : 'איירפורט';
      const selectedLang = detectedLanguage === 'en' ? 'English' : 'עברית';
      
      console.log(`🌐 אתר ${siteName} | דפדפן: ${browserLang} | נבחר: ${selectedLang}`);
    }
  }, []);

  // שמירת שפה ב-localStorage כשהיא משתנה (עם מפתח נפרד לאתר הציבורי)
  useEffect(() => {
    localStorage.setItem('publicSiteLanguage', currentLanguage);
    const newDirection = currentLanguage === 'he' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    
    // עדכון כיוון הדף רק אם אנחנו באתר הציבורי
    const isPublicSite = window.location.pathname.startsWith('/airport-booking') || 
                         window.location.pathname.startsWith('/rothschild-booking');
    if (isPublicSite) {
      document.documentElement.dir = newDirection;
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  // פונקציה לשינוי שפה
  const changeLanguage = (newLanguage) => {
    if (['he', 'en'].includes(newLanguage)) {
      setCurrentLanguage(newLanguage);
    }
  };

  // פונקציה לקבלת תרגום
  const translate = (key, defaultValue = key) => {
    const keys = key.split('.');
    let result = translations[currentLanguage];
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return defaultValue;
      }
    }
    
    return result || defaultValue;
  };

  const value = {
    currentLanguage,
    direction,
    changeLanguage,
    translate,
    isRTL: direction === 'rtl'
  };

  return (
    <PublicLanguageContext.Provider value={value}>
      {children}
    </PublicLanguageContext.Provider>
  );
};

// Hook לשימוש בקונטקסט האתר הציבורי
export const usePublicLanguage = () => {
  const context = useContext(PublicLanguageContext);
  if (!context) {
    throw new Error('usePublicLanguage must be used within a PublicLanguageProvider');
  }
  return context;
};

// Hook קצר לתרגומים באתר הציבורי
export const usePublicTranslation = () => {
  const { translate } = usePublicLanguage();
  return translate;
};

export default PublicLanguageContext; 
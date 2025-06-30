import React, { createContext, useContext, useState, useEffect } from 'react';

// קבצי התרגום
import heTranslations from '../translations/he.json';
import enTranslations from '../translations/en.json';

const PublicLanguageContext = createContext();

const translations = {
  he: heTranslations,
  en: enTranslations
};

export const PublicLanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('he');
  const [direction, setDirection] = useState('rtl');

  // טעינת שפה מ-localStorage בטעינה ראשונה (רק עבור האתר הציבורי)
  useEffect(() => {
    const savedLanguage = localStorage.getItem('publicSiteLanguage');
    if (savedLanguage && ['he', 'en'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
      setDirection(savedLanguage === 'he' ? 'rtl' : 'ltr');
    }
  }, []);

  // שמירת שפה ב-localStorage כשהיא משתנה (עם מפתח נפרד לאתר הציבורי)
  useEffect(() => {
    localStorage.setItem('publicSiteLanguage', currentLanguage);
    const newDirection = currentLanguage === 'he' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    
    // עדכון כיוון הדף רק אם אנחנו באתר הציבורי
    const isPublicSite = window.location.pathname.startsWith('/airport-booking');
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
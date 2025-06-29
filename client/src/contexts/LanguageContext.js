import React, { createContext, useContext, useState, useEffect } from 'react';

// קבצי התרגום
import heTranslations from '../translations/he.json';
import enTranslations from '../translations/en.json';

const LanguageContext = createContext();

const translations = {
  he: heTranslations,
  en: enTranslations
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('he');
  const [direction, setDirection] = useState('rtl');

  // טעינת שפה מ-localStorage בטעינה ראשונה
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['he', 'en'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
      setDirection(savedLanguage === 'he' ? 'rtl' : 'ltr');
    }
  }, []);

  // שמירת שפה ב-localStorage כשהיא משתנה
  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
    const newDirection = currentLanguage === 'he' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    
    // עדכון כיוון הדף
    document.documentElement.dir = newDirection;
    document.documentElement.lang = currentLanguage;
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
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook לשימוש בקונטקסט
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Hook קצר לתרגומים
export const useTranslation = () => {
  const { translate } = useLanguage();
  return translate;
};

export default LanguageContext; 
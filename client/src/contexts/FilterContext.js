import React, { createContext, useContext, useState } from 'react';

/**
 * קונטקסט לניהול מצב סינון הזמנות מיוחדות
 * פתרון פשוט ויעיל - הסתרה מיידית עם CSS בלבד
 */
const FilterContext = createContext();

// אמצעי התשלום שיוסתרו כאשר הסינון פעיל
export const FILTERED_PAYMENT_METHODS = [
  'cash2',
  'bit_poalim',
  'transfer_poalim', 
  'paybox_poalim'
];

/**
 * פרובידר הקונטקסט - גישה מינימליסטית
 */
export const FilterProvider = ({ children }) => {
  // מצב הסינון פשוט - מתחיל false
  const [isFilterActive, setIsFilterActive] = useState(() => {
    try {
      const saved = localStorage.getItem('diam_filter_active');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // פונקציה פשוטה לשינוי מצב
  const toggleFilter = () => {
    const newState = !isFilterActive;
    setIsFilterActive(newState);
    
    try {
      localStorage.setItem('diam_filter_active', JSON.stringify(newState));
    } catch (error) {
      console.warn('לא ניתן לשמור מצב סינון:', error);
    }
  };

  /**
   * פונקציה לבדיקה האם הזמנה צריכה להיות מוסתרת
   * @param {Object} booking - אובייקט ההזמנה
   * @returns {boolean} - true אם ההזמנה צריכה להיות מוסתרת
   */
  const shouldHideBooking = (booking) => {
    if (!isFilterActive) return false;
    
    // מסתיר רק הזמנות ששולמו באמצעי התשלום המסוננים
    return booking.paymentStatus && 
           booking.paymentStatus !== 'unpaid' && 
           FILTERED_PAYMENT_METHODS.includes(booking.paymentStatus);
  };

  /**
   * פונקציה לסינון מערך הזמנות
   * @param {Array} bookings - מערך הזמנות
   * @returns {Array} - מערך מסונן
   */
  const filterBookings = (bookings) => {
    if (!isFilterActive || !Array.isArray(bookings)) return bookings;
    
    return bookings.filter(booking => !shouldHideBooking(booking));
  };

  /**
   * פונקציה לבדיקה האם אמצעי תשלום צריך להיות מוסתר בטפסים
   * @param {string} paymentMethod - אמצעי התשלום
   * @returns {boolean} - true אם צריך להסתיר
   */
  const shouldHidePaymentMethod = (paymentMethod) => {
    return isFilterActive && FILTERED_PAYMENT_METHODS.includes(paymentMethod);
  };

  /**
   * פונקציה לסינון רשימת אמצעי תשלום
   * @param {Array} paymentMethods - רשימת אמצעי תשלום
   * @returns {Array} - רשימה מסוננת
   */
  const filterPaymentMethods = (paymentMethods) => {
    if (!isFilterActive || !Array.isArray(paymentMethods)) return paymentMethods;
    
    return paymentMethods.filter(method => {
      const value = typeof method === 'string' ? method : method.value;
      return !FILTERED_PAYMENT_METHODS.includes(value);
    });
  };

  const value = {
    isFilterActive,
    toggleFilter,
    shouldHideBooking,
    filterBookings,
    shouldHidePaymentMethod,
    filterPaymentMethods,
    FILTERED_PAYMENT_METHODS
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

/**
 * Hook לשימוש בקונטקסט הסינון
 */
export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

export default FilterContext;

/**
 * קבועים להזמנות במערכת
 */

// סטטוסים אפשריים להזמנה
export const BOOKING_STATUSES = [
  { value: 'pending', label: 'ממתין' },
  { value: 'confirmed', label: 'מאושר' },
  { value: 'cancelled', label: 'מבוטל' },
  { value: 'completed', label: 'הושלם' },
];

// מקורות הזמנה
export const BOOKING_SOURCES = [
  { value: 'direct', label: 'ישיר' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'expedia', label: 'Expedia' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'agoda', label: 'Agoda' },
  { value: 'website', label: 'אתר' },
  { value: 'other', label: 'אחר' },
];

// מיקומים
export const LOCATIONS = [
  { value: 'airport', label: 'נמל תעופה' },
  { value: 'rothschild', label: 'רוטשילד' },
];

// סטטוסי ניקיון
export const CLEANING_STATUSES = [
  { value: 'dirty', label: 'מלוכלך' },
  { value: 'clean', label: 'נקי' },
];

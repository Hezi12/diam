/**
 * מערכת העיצוב Diam - ייצוא מרכזי
 * 
 * קובץ זה מייצא את כל רכיבי מערכת העיצוב ומאפשר ייבוא מרוכז שלהם
 */

// ייצוא רכיבים מוכנים לשימוש
export * from './components';

// ייצוא קבועי סגנון
export { 
  STYLE_CONSTANTS,
  getHebrewInputStyle,
  getBookingStatusColors
} from './styles/StyleConstants';

// ייצוא עמודי הדוגמה
export { default as DesignSystem } from './DesignSystem';
export { default as DesignExamples } from './examples/DesignExamples';
export { default as BookingCalendarExamples } from './examples/BookingCalendarExamples'; 
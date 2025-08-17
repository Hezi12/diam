/**
 * StyleConstants.js
 * קובץ זה מכיל את כל קבועי הסגנון של המערכת
 * הקבועים האלה ישמשו בכל חלקי האפליקציה כדי להבטיח עיצוב אחיד
 */

export const STYLE_CONSTANTS = {
  name: "קלאסי ונקי - עסקי",
  colors: {
    airport: {
      main: '#0059b3',
      bgLight: 'rgba(0, 113, 227, 0.15)'
    },
    rothschild: {
      main: '#304dbd',
      bgLight: 'rgba(69, 112, 229, 0.15)'
    },
    accent: {
      green: '#06a271',
      red: '#e34a6f',
      orange: '#f7971e',
      blue: '#4285F4',
      mint: '#73C5A0',
      darkYellow: '#e6a700',
      purple: '#8e44ad',
      teal: '#16a085',
      navy: '#2c3e50',
      expedia: '#20b2aa' // צבע תכלת-ירוק מיוחד ל-Expedia
    },
    text: {
      primary: '#121212',
      secondary: '#555555'
    },
    background: {
      default: '#f5f5f7',
      paper: '#ffffff'
    }
  },
  accentColors: {
    green: '#06a271',
    red: '#e34a6f',
    orange: '#f7971e',
    darkYellow: '#e6a700',
    purple: '#8e44ad',
    teal: '#16a085',
    navy: '#2c3e50',
    expedia: '#20b2aa' // צבע תכלת-ירוק מיוחד ל-Expedia
  },
  style: {
    card: {
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      p: 2.5,
    },
    button: {
      borderRadius: '4px',
      textTransform: 'none',
    },
    dialog: {
      borderRadius: '8px',
    }
  },
  card: {
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '20px',
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
  },
  typography: {
    fontFamily: "'Assistant', 'SF Pro', 'Helvetica', 'Arial', sans-serif",
    fontWeights: {
      regular: 400,
      medium: 500,
      bold: 600
    },
    sizes: {
      h4: '1.75rem',
      h5: '1.25rem',
      h6: '1.1rem',
      body: '1rem',
      small: '0.875rem'
    }
  },
  spacing: {
    card: '20px',
    section: '24px',
    iconText: '8px'
  }
};

/**
 * סגנון קלט עברית
 * מוגדר כאן כפונקציה שמחזירה אובייקט כדי לאפשר שימוש בפרמטרים נוספים
 */
export const getHebrewInputStyle = (customBorderRadius = '4px') => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: customBorderRadius,
    direction: 'rtl',
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
  },
  '& .MuiInputBase-input': {
    textAlign: 'right',
    paddingLeft: '14px',
    paddingRight: '14px',
    direction: 'rtl',
  },
  '& .MuiSelect-select': {
    textAlign: 'right',
    paddingRight: '14px',
    paddingLeft: '12px',
    direction: 'rtl'
  },
  '& .MuiFormLabel-filled': {
    right: 18,
  },
  '& input::placeholder, & textarea::placeholder': {
    textAlign: 'right',
    direction: 'rtl',
  },
  '& .MuiInputAdornment-root': {
    marginLeft: '0',
    marginRight: 'auto'
  },
  '& .MuiOutlinedInput-multiline': {
    padding: 0,
    '& textarea': {
      padding: '10px 14px',
      textAlign: 'right'
    }
  }
});

/**
 * סגנונות לסטטוס הזמנות
 * @param {Object} colors - אובייקט צבעים לשימוש (מתוך STYLE_CONSTANTS)
 */
export const getBookingStatusColors = (colors) => ({
  confirmed: {
    bgColor: `rgba(${colors.accent.green.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
    borderColor: colors.accent.green,
    textColor: colors.accent.green
  },
  pending: {
    bgColor: `rgba(${colors.accent.orange.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
    borderColor: colors.accent.orange,
    textColor: colors.accent.orange
  },
  cancelled: {
    bgColor: `rgba(${colors.accent.red.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
    borderColor: colors.accent.red,
    textColor: colors.accent.red
  }
});

export default STYLE_CONSTANTS; 
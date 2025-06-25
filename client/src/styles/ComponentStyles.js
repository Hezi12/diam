import { STYLE_CONSTANTS, getHebrewInputStyle } from './StyleConstants';

/**
 * סגנונות אחידים לשדות קלט עבריים
 * מייצא אובייקטים וקומפוננטות לשימוש בכל הטפסים
 */

export const formStyles = {
  // סגנון לכל שדות הטקסט בעברית
  textField: {
    ...getHebrewInputStyle(),
    width: '100%',
    marginBottom: '16px',
    '& .MuiOutlinedInput-root': {
      borderRadius: STYLE_CONSTANTS.button.borderRadius,
    }
  },

  // סגנון לשדות בחירה (Select)
  select: {
    ...getHebrewInputStyle(),
    width: '100%',
    '& .MuiSelect-select': {
      paddingRight: '20px',
      textAlign: 'center',
    }
  },

  // סגנון לכפתורים
  button: {
    borderRadius: STYLE_CONSTANTS.button.borderRadius,
    textTransform: 'none',
    padding: '8px 16px',
    fontWeight: STYLE_CONSTANTS.typography.fontWeights.medium,
  },

  // סגנון לכרטיסיות מידע
  card: {
    borderRadius: STYLE_CONSTANTS.card.borderRadius,
    boxShadow: STYLE_CONSTANTS.card.boxShadow,
    padding: STYLE_CONSTANTS.card.padding,
    borderTop: (color) => `3px solid ${color}`,
  },

  // סגנון לדיאלוגים
  dialog: {
    borderRadius: STYLE_CONSTANTS.dialog.borderRadius,
    overflow: 'hidden',
    width: '95%',
    maxWidth: '1000px'
  },

  // סגנון לכותרות בטפסים
  formHeader: {
    bgcolor: (location) => STYLE_CONSTANTS.colors[location]?.bgLight || STYLE_CONSTANTS.colors.airport.bgLight,
    color: (location) => STYLE_CONSTANTS.colors[location]?.main || STYLE_CONSTANTS.colors.airport.main,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: (location) => `1px solid ${STYLE_CONSTANTS.colors[location]?.main || STYLE_CONSTANTS.colors.airport.main}`,
    py: 1.5
  },

  // סגנון לקבוצת כפתורים בדיאלוג
  dialogActions: {
    justifyContent: 'space-between',
    px: 3,
    py: 2,
    borderTop: `1px solid ${STYLE_CONSTANTS.colors.background.default}`
  },

  // סגנון לכותרות סקשנים בטופס
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    mb: 1
  },

  // סגנון לאייקונים בטופס
  formIcon: {
    marginRight: '10px'
  },
};

// סגנונות צבעים לפי סטטוס תשלום
export const paymentStatusStyles = {
  unpaid: {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: STYLE_CONSTANTS.colors.accent.red,
      borderWidth: '2px'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: STYLE_CONSTANTS.colors.accent.red
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: STYLE_CONSTANTS.colors.accent.red
    }
  },
  paid: {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: STYLE_CONSTANTS.colors.accent.green,
      borderWidth: '2px'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: STYLE_CONSTANTS.colors.accent.green
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: STYLE_CONSTANTS.colors.accent.green
    }
  }
};

export default formStyles; 
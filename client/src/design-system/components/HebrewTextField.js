import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { getHebrewInputStyle } from '../styles/StyleConstants';

/**
 * HebrewTextField
 * 
 * קומפוננט שדה טקסט מוכן לשימוש בעברית
 * כולל את כל הסגנונות הנדרשים לתמיכה בכתיבה מימין לשמאל
 * 
 * Props:
 * - label: תווית השדה
 * - placeholder: טקסט ברירת מחדל בשדה
 * - startIcon: אייקון לתחילת השדה (אופציונלי)
 * - וכל ה-props הסטנדרטיים של TextField
 */
const HebrewTextField = ({
  label,
  placeholder,
  startIcon,
  fullWidth = true,
  size = "small",
  ...props
}) => {
  return (
    <TextField
      label={label}
      placeholder={placeholder}
      fullWidth={fullWidth}
      size={size}
      inputProps={{
        style: { 
          textAlign: 'center',
          paddingRight: '24px',
          paddingLeft: '24px',
          direction: 'rtl',
        }
      }}
      InputProps={{
        ...(startIcon && {
          startAdornment: <InputAdornment position="start">{startIcon}</InputAdornment>,
        }),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '4px',
        },
        '& .MuiInputLabel-root': {
          right: 18,
          left: 'auto',
          transformOrigin: 'top right'
        },
        '& .MuiOutlinedInput-notchedOutline': {
          textAlign: 'right',
        },
        '& .MuiInputLabel-shrink': {
          transform: 'translate(0, -9px) scale(0.75)',
          transformOrigin: 'top right'
        },
        '& input::placeholder': {
          textAlign: 'center',
          direction: 'rtl',
        },
        ...props.sx
      }}
      {...props}
    />
  );
};

export default HebrewTextField; 
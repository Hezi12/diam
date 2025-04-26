import React from 'react';
import { Grid, TextField, InputAdornment, IconButton, Box, Tooltip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

/**
 * רכיב לחישוב מחירים אוטומטי עבור טופס הזמנה
 * כולל הגיון מורכב לחישוב דו-כיווני וטיפול בתיירים (ללא מע"מ)
 */
const PriceCalculator = ({
  formData,
  setFormData,
  lockedField,
  setLockedField,
  errors,
  setErrors
}) => {
  // קבוע שיעור המע"מ
  const VAT_RATE = 1.18;

  // טיפול בשינוי מחיר ללילה (כולל מע"מ)
  const handlePricePerNightChange = (e) => {
    let value = parseFloat(e.target.value) || 0;
    
    if (value < 0) {
      value = 0;
    }

    // אם שדה זה נעול, לא נבצע חישובים נוספים
    if (lockedField === 'pricePerNight') {
      setFormData(prev => ({
        ...prev,
        pricePerNight: value
      }));
      return;
    }

    // חישוב מחיר ללא מע"מ
    let priceNoVat;
    if (formData.isTourist) {
      // לתיירים, המחיר ללא מע"מ זהה למחיר עם מע"מ
      priceNoVat = value;
    } else {
      // ישראלים, מחשבים את המחיר ללא מע"מ
      priceNoVat = +(value / VAT_RATE).toFixed(2);
    }

    // חישוב מחיר כולל להזמנה
    const totalPrice = value * formData.nights;

    setFormData(prev => ({
      ...prev,
      pricePerNight: value,
      pricePerNightNoVat: priceNoVat,
      price: totalPrice
    }));

    // ניקוי שגיאות
    if (value > 0) {
      setErrors(prev => ({ ...prev, pricePerNight: undefined }));
    }
  };

  // טיפול בשינוי מחיר ללילה (ללא מע"מ)
  const handlePricePerNightNoVatChange = (e) => {
    let value = parseFloat(e.target.value) || 0;
    
    if (value < 0) {
      value = 0;
    }

    // אם שדה זה נעול, לא נבצע חישובים נוספים
    if (lockedField === 'pricePerNightNoVat') {
      setFormData(prev => ({
        ...prev,
        pricePerNightNoVat: value
      }));
      return;
    }

    // חישוב מחיר כולל מע"מ
    let priceWithVat;
    if (formData.isTourist) {
      // לתיירים, המחיר עם מע"מ זהה למחיר ללא מע"מ
      priceWithVat = value;
    } else {
      // ישראלים, מחשבים את המחיר עם מע"מ
      priceWithVat = parseFloat((value * VAT_RATE).toFixed(2));
    }

    // חישוב מחיר כולל להזמנה
    const totalPrice = priceWithVat * formData.nights;

    setFormData(prev => ({
      ...prev,
      pricePerNightNoVat: value,
      pricePerNight: priceWithVat,
      price: totalPrice
    }));
  };

  // טיפול בשינוי מחיר כולל להזמנה
  const handlePriceChange = (e) => {
    let value = parseFloat(e.target.value) || 0;
    
    if (value < 0) {
      value = 0;
    }

    // אם שדה זה נעול, לא נבצע חישובים נוספים
    if (lockedField === 'price') {
      setFormData(prev => ({
        ...prev,
        price: value
      }));
      return;
    }

    // חישוב מחיר ללילה
    let pricePerNight = formData.nights > 0 ? value / formData.nights : 0;
    
    // חישוב מחיר ללא מע"מ
    let pricePerNightNoVat;
    if (formData.isTourist) {
      // לתיירים, המחיר ללא מע"מ זהה למחיר עם מע"מ
      pricePerNightNoVat = pricePerNight;
    } else {
      // ישראלים, מחשבים את המחיר ללא מע"מ
      pricePerNightNoVat = +(pricePerNight / VAT_RATE).toFixed(2);
    }

    setFormData(prev => ({
      ...prev,
      price: value,
      pricePerNight: pricePerNight,
      pricePerNightNoVat: pricePerNightNoVat
    }));
  };

  // טיפול בלחיצה על כפתור נעילה/שחרור
  const handleLockField = (fieldName) => {
    // אם השדה כבר נעול, שחרר אותו
    if (lockedField === fieldName) {
      setLockedField(null);
    } else {
      // אחרת נעל אותו
      setLockedField(fieldName);
    }
  };

  // יצירת רכיב של כפתור נעילה
  const LockButton = ({ fieldName }) => (
    <InputAdornment position="end">
      <Tooltip title={lockedField === fieldName ? "שחרר שדה" : "נעל שדה לחישוב"}>
        <IconButton
          onClick={() => handleLockField(fieldName)}
          edge="end"
          size="small"
        >
          {lockedField === fieldName ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </InputAdornment>
  );

  return (
    <>
      <Grid item xs={12} md={4}>
        <TextField
          name="price"
          label="סה״כ להזמנה (₪)"
          fullWidth
          type="number"
          value={formData.price}
          onChange={handlePriceChange}
          error={!!errors.price}
          helperText={errors.price}
          InputProps={{
            startAdornment: <InputAdornment position="start">₪</InputAdornment>,
            endAdornment: <LockButton fieldName="price" />,
            inputProps: { min: 0, step: "10" }
          }}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          name="pricePerNight"
          label={`מחיר ללילה ${!formData.isTourist ? '(כולל מע״מ)' : ''} (₪)`}
          fullWidth
          type="number"
          value={formData.pricePerNight}
          onChange={handlePricePerNightChange}
          error={!!errors.pricePerNight}
          helperText={errors.pricePerNight}
          InputProps={{
            startAdornment: <InputAdornment position="start">₪</InputAdornment>,
            endAdornment: <LockButton fieldName="pricePerNight" />,
            inputProps: { min: 0, step: "10" }
          }}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          name="pricePerNightNoVat"
          label={`מחיר ללילה ${!formData.isTourist ? '(ללא מע״מ)' : ''} (₪)`}
          fullWidth
          type="number"
          value={formData.pricePerNightNoVat}
          onChange={handlePricePerNightNoVatChange}
          error={!!errors.pricePerNightNoVat}
          helperText={errors.pricePerNightNoVat}
          InputProps={{
            startAdornment: <InputAdornment position="start">₪</InputAdornment>,
            endAdornment: <LockButton fieldName="pricePerNightNoVat" />,
            inputProps: { min: 0, step: "0.1" }
          }}
        />
      </Grid>
    </>
  );
};

export default PriceCalculator; 
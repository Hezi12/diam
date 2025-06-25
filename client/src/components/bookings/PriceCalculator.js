import React, { useState, useEffect } from 'react';
import { Grid, TextField, InputAdornment, IconButton, Box, Tooltip, Typography, FormControlLabel, Switch, Divider } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

/**
 * רכיב לחישוב מחירים אוטומטי עבור טופס הזמנה
 * כולל הגיון מורכב לחישוב דו-כיווני וטיפול בתיירים (ללא מע"מ)
 */
const PriceCalculator = ({
  formData,
  setFormData,
  onPriceChange,
  isTourist,
  nights,
  checkInDate,
  checkOutDate,
  selectedRoom,
  priceDetails = null
}) => {
  const [lockedField, setLockedField] = useState(null);

  // קבוע שיעור המע"מ
  const VAT_RATE = 1.18;

  // פונקציה לחישוב מחיר בהתאם לימי שישי ושבת
  const calculateSpecialDaysPricing = (room, checkIn, checkOut, isTourist) => {
    if (!room || !checkIn || !checkOut) return 0;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    let totalPrice = 0;
    
    // מחיר בסיס לפי סטטוס תייר
    const basePrice = isTourist ? (room.basePrice || 0) : (room.vatPrice || 0);
    const fridayPrice = isTourist ? (room.fridayPrice || room.basePrice || 0) : (room.fridayVatPrice || room.vatPrice || 0);
    const saturdayPrice = isTourist ? (room.saturdayPrice || room.basePrice || 0) : (room.saturdayVatPrice || room.vatPrice || 0);
    
    // מעבר על כל יום בתקופת השהייה
    for (let date = new Date(checkInDate); date < checkOutDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 5) { // יום שישי
        totalPrice += fridayPrice;
      } else if (dayOfWeek === 6) { // יום שבת
        totalPrice += saturdayPrice;
      } else { // שאר הימים
        totalPrice += basePrice;
      }
    }
    
    return totalPrice;
  };

  // חישוב מחיר אוטומטי כאשר יש כל הפרטים הנדרשים
  useEffect(() => {
    if (selectedRoom && checkInDate && checkOutDate && nights > 0 && !lockedField) {
      const specialPrice = calculateSpecialDaysPricing(selectedRoom, checkInDate, checkOutDate, isTourist);
      
      if (specialPrice > 0) {
        const pricePerNight = specialPrice / nights;
        const pricePerNightNoVat = isTourist ? pricePerNight : (pricePerNight / VAT_RATE);
        
        setFormData(prev => ({
          ...prev,
          price: specialPrice,
          pricePerNight: pricePerNight,
          pricePerNightNoVat: parseFloat(pricePerNightNoVat.toFixed(2))
        }));
      }
    }
  }, [selectedRoom, checkInDate, checkOutDate, nights, isTourist, lockedField, setFormData]);

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
    let pricePerNightNoVat;
    if (isTourist) {
      // לתיירים, המחיר ללא מע"מ זהה למחיר עם מע"מ
      pricePerNightNoVat = value;
    } else {
      // ישראלים, מחשבים את המחיר ללא מע"מ
      pricePerNightNoVat = parseFloat((value / VAT_RATE).toFixed(2));
    }

    // חישוב מחיר כולל להזמנה
    const totalPrice = value * nights;

    setFormData(prev => ({
      ...prev,
      pricePerNight: value,
      pricePerNightNoVat: pricePerNightNoVat,
      price: totalPrice
    }));
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
    if (isTourist) {
      // לתיירים, המחיר עם מע"מ זהה למחיר ללא מע"מ
      priceWithVat = value;
    } else {
      // ישראלים, מחשבים את המחיר עם מע"מ
      priceWithVat = parseFloat((value * VAT_RATE).toFixed(2));
    }

    // חישוב מחיר כולל להזמנה
    const totalPrice = priceWithVat * nights;

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
    let pricePerNight = nights > 0 ? value / nights : 0;
    
    // חישוב מחיר ללא מע"מ
    let pricePerNightNoVat;
    if (isTourist) {
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

  // פונקציה לספירת ימי שישי ושבת בתקופה
  const countSpecialDays = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return { fridays: 0, saturdays: 0 };
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    let fridays = 0;
    let saturdays = 0;
    
    for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 5) fridays++;
      if (dayOfWeek === 6) saturdays++;
    }
    
    return { fridays, saturdays };
  };

  const specialDays = countSpecialDays(checkInDate, checkOutDate);

  return (
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={1}>
        <Grid item xs={12} sm={12} md={4}>
          <TextField
            label="מחיר ללילה (ללא מע״מ)"
            type="number"
            value={formData.pricePerNightNoVat || ''}
            onChange={handlePricePerNightNoVatChange}
            fullWidth
            size="small"
            InputProps={{
              endAdornment: <LockButton fieldName="pricePerNightNoVat" />
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: lockedField === 'pricePerNightNoVat' ? 'rgba(255, 193, 7, 0.1)' : 'transparent'
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={12} md={4}>
          <TextField
            label="מחיר ללילה (כולל מע״מ)"
            type="number"
            value={formData.pricePerNight || ''}
            onChange={handlePricePerNightChange}
            fullWidth
            size="small"
            InputProps={{
              endAdornment: <LockButton fieldName="pricePerNight" />
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: lockedField === 'pricePerNight' ? 'rgba(255, 193, 7, 0.1)' : 'transparent'
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={12} md={4}>
          <TextField
            label="סך כל הזמנה (₪)"
            type="number"
            value={formData.price || ''}
            onChange={handlePriceChange}
            fullWidth
            size="small"
            InputProps={{
              endAdornment: <LockButton fieldName="price" />
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: lockedField === 'price' ? 'rgba(255, 193, 7, 0.1)' : 'transparent',
                fontWeight: 600
              }
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PriceCalculator; 
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Button, 
  Typography,
  useMediaQuery,
  useTheme,
  FormHelperText,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { Search as SearchIcon, Info as InfoIcon, LocalOffer as CouponIcon } from '@mui/icons-material';
import { isAfter, isBefore, format, isValid, differenceInDays, addDays, subDays } from 'date-fns';
import { usePublicTranslation, usePublicLanguage } from '../../contexts/PublicLanguageContext';
import DiscountService from '../../services/discountService';

const SearchBox = ({ location: siteLocation = 'airport' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const t = usePublicTranslation();
  const { direction, isRTL } = usePublicLanguage();
  
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [nights, setNights] = useState(1);
  const [guests, setGuests] = useState(2);
  const [isTourist, setIsTourist] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [error, setError] = useState('');
  const [touristDialogOpen, setTouristDialogOpen] = useState(false);
  
  // קריאת ערכים מה-URL אם קיימים (לעדכון הטופס בעמוד תוצאות החיפוש)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const checkInStr = searchParams.get('checkIn');
    const checkOutStr = searchParams.get('checkOut');
    const nightsStr = searchParams.get('nights');
    const guestsStr = searchParams.get('guests');
    const isTouristStr = searchParams.get('isTourist');
    const couponCodeStr = searchParams.get('couponCode');
    
    if (checkInStr && checkOutStr) {
      const checkInDate = new Date(checkInStr);
      const checkOutDate = new Date(checkOutStr);
      
      if (isValid(checkInDate) && isValid(checkOutDate)) {
        setCheckIn(checkInDate);
        setCheckOut(checkOutDate);
        
        // עדכון מספר הלילות
        const nightsFromUrl = parseInt(nightsStr, 10);
        const nightsFromDates = differenceInDays(checkOutDate, checkInDate);
        const calculatedNights = nightsFromUrl && nightsFromUrl > 0 ? nightsFromUrl : nightsFromDates;
        
        if (calculatedNights > 0) {
          setNights(calculatedNights);
        }
      }
    }
    
    if (guestsStr) {
      const guestsFromUrl = parseInt(guestsStr, 10);
      if (guestsFromUrl >= 1 && guestsFromUrl <= 6) {
        setGuests(guestsFromUrl);
      }
    }
    
    if (isTouristStr) {
      setIsTourist(isTouristStr === 'true');
    }
    
    if (couponCodeStr) {
      setCouponCode(couponCodeStr);
    }
  }, [location.search]);
  
  // פונקציה לטיפול בשינוי קוד קופון
  const handleCouponChange = (e) => {
    const value = e.target.value;
    // נירמול הקוד - רק אותיות באנגלית ומספרים
    const normalizedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    setCouponCode(normalizedValue);
    setCouponError('');
    setCouponSuccess('');
  };
  
  // פונקציה לולידציה של קופון
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('');
      setCouponSuccess('');
      return true;
    }
    
    // ולידציה בסיסית
    const validation = DiscountService.validateCouponCode(couponCode);
    if (!validation.isValid) {
      setCouponError(DiscountService.formatCouponErrorMessage(validation.error));
      setCouponSuccess('');
      return false;
    }
    
    try {
      // בדיקה אם הקופון קיים
      const discount = await DiscountService.getDiscountByCouponCode(couponCode);
      if (!discount) {
        setCouponError('קוד קופון לא מוכר');
        setCouponSuccess('');
        return false;
      }
      
      setCouponSuccess(`קופון ${couponCode} זמין - ${discount.discountType === 'percentage' ? `${discount.discountValue}%` : `${discount.discountValue}₪`} הנחה!`);
      setCouponError('');
      return true;
    } catch (error) {
      setCouponError('שגיאה בבדיקת הקופון');
      setCouponSuccess('');
      return false;
    }
  };
  
  // פונקציה לבדיקת קופון כאשר המשתמש מפסיק להקליד
  useEffect(() => {
    if (couponCode.trim().length >= 3) {
      const timeoutId = setTimeout(() => {
        validateCoupon();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else if (couponCode.trim().length > 0) {
      setCouponError('קוד קופון חייב להיות באורך של לפחות 3 תווים');
      setCouponSuccess('');
    } else {
      setCouponError('');
      setCouponSuccess('');
    }
  }, [couponCode]);
  
  const handleSearch = () => {
    // וידוא תקינות התאריכים
    if (!isValid(checkIn) || !isValid(checkOut)) {
      setError(t('search.errors.invalidDates'));
      return;
    }
    
    if (isBefore(checkOut, checkIn) || checkIn.getTime() === checkOut.getTime()) {
      setError(t('search.errors.checkOutBeforeCheckIn'));
      return;
    }
    
    if (isBefore(checkIn, today) && checkIn.getDate() !== today.getDate()) {
      setError(t('search.errors.pastDates'));
      return;
    }
    
    // בדיקה שהקופון תקין אם הוזן
    if (couponCode.trim() && couponError) {
      setError('אנא תקן את קוד הקופון או הסר אותו');
      return;
    }
    
    // וידוא שמספר הלילות תואם לתאריכים
    const actualNights = differenceInDays(checkOut, checkIn);
    if (actualNights !== nights) {
      setNights(actualNights);
    }
    
    setError('');
    
    // מעבר לדף תוצאות החיפוש עם פרמטרים כולל מספר אורחים, לילות וסטטוס תייר וקופון
    const baseRoute = siteLocation === 'rothschild' ? '/rothschild-booking' : '/airport-booking';
    const params = new URLSearchParams({
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      nights: actualNights.toString(),
      guests: guests.toString(),
      isTourist: isTourist.toString()
    });
    
    // הוספת קופון אם הוזן
    if (couponCode.trim()) {
      params.append('couponCode', couponCode.trim());
    }
    
    navigate(`${baseRoute}/search-results?${params.toString()}`);
  };
  
  const handleCheckInChange = (e) => {
    const date = new Date(e.target.value);
    setCheckIn(date);
    
    // עדכון צ'ק-אאוט בהתאם למספר הלילות
    const newCheckOut = addDays(date, nights);
    setCheckOut(newCheckOut);
    
    // וידוא שהתאריך החדש לא בעבר
    if (isBefore(newCheckOut, addDays(new Date(), 1))) {
      const correctedCheckOut = addDays(new Date(), 1);
      setCheckOut(correctedCheckOut);
      const correctedNights = differenceInDays(correctedCheckOut, date);
      if (correctedNights > 0) {
        setNights(correctedNights);
      }
    }
  };
  
  const handleCheckOutChange = (e) => {
    const date = new Date(e.target.value);
    setCheckOut(date);
    
    // עדכון מספר הלילות בהתאם לתאריכים
    const calculatedNights = differenceInDays(date, checkIn);
    if (calculatedNights > 0) {
      setNights(calculatedNights);
    } else {
      // אם התאריך לא תקין, נעדכן אותו לפי מספר הלילות
      const correctedDate = addDays(checkIn, nights);
      setCheckOut(correctedDate);
    }
  };
  
  const handleNightsChange = (e) => {
    const newNights = parseInt(e.target.value, 10);
    setNights(newNights);
    
    // עדכון צ'ק-אאוט בהתאם למספר הלילות החדש
    const newCheckOut = addDays(checkIn, newNights);
    setCheckOut(newCheckOut);
  };
  
  const handleGuestsChange = (e) => {
    setGuests(parseInt(e.target.value, 10));
  };
  
  const handleTouristChange = (e) => {
    if (e.target.checked) {
      setTouristDialogOpen(true);
    }
    setIsTourist(e.target.checked);
  };

  const handleCloseTouristDialog = () => {
    setTouristDialogOpen(false);
  };

  return (
    <Box sx={{ p: 0, direction: direction }}>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={12} sm={6} md={1.8}>
          <TextField
            label={t('search.checkIn')}
            type="date"
            fullWidth
            size="small"
            value={format(checkIn, 'yyyy-MM-dd')}
            onChange={handleCheckInChange}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: format(today, 'yyyy-MM-dd')
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#9ca3af',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6b7280',
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={1.8}>
          <TextField
            label={t('search.checkOut')}
            type="date"
            fullWidth
            size="small"
            value={format(checkOut, 'yyyy-MM-dd')}
            onChange={handleCheckOutChange}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: format(addDays(checkIn, 1), 'yyyy-MM-dd')
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#9ca3af',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6b7280',
                },
              },
            }}
          />
        </Grid>
        
        <Grid item xs={6} sm={3} md={1.1}>
          <TextField
            select
            label={t('search.nights')}
            fullWidth
            size="small"
            value={nights}
            onChange={handleNightsChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#9ca3af',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6b7280',
                },
              },
            }}
          >
            {Array.from({ length: 30 }, (_, i) => i + 1).map((night) => (
              <MenuItem key={night} value={night}>
                {night}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={6} sm={3} md={1.1}>
          <TextField
            select
            label={t('search.guests')}
            fullWidth
            size="small"
            value={guests}
            onChange={handleGuestsChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#9ca3af',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6b7280',
                },
              },
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((guestCount) => (
              <MenuItem key={guestCount} value={guestCount}>
                {guestCount}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={1.8}>
          <Tooltip 
            title="הזן קוד קופון לקבלת הנחה מיוחדת"
            placement="top"
            arrow
          >
            <TextField
              label="קוד קופון"
              fullWidth
              size="small"
              value={couponCode}
              onChange={handleCouponChange}
              placeholder="WELCOME20"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CouponIcon sx={{ color: '#6b7280', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
                style: { 
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: couponError ? '#ef4444' : couponSuccess ? '#22c55e' : '#d1d5db',
                  },
                  '&:hover fieldset': {
                    borderColor: couponError ? '#ef4444' : couponSuccess ? '#22c55e' : '#9ca3af',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: couponError ? '#ef4444' : couponSuccess ? '#22c55e' : '#6b7280',
                  },
                },
                '& .MuiInputBase-input': {
                  textAlign: 'center',
                  letterSpacing: '0.05em'
                }
              }}
            />
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={6} md={1.8}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
              border: '1px solid #d1d5db',
              borderRadius: 1,
              px: 1,
              bgcolor: 'white',
              '&:hover': {
                borderColor: '#9ca3af'
              }
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={isTourist}
                  onChange={handleTouristChange}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#059669',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#059669',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                  {t('search.touristSwitch')}
                </Typography>
              }
              sx={{ 
                margin: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.8rem'
                }
              }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.5}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
            sx={{
              bgcolor: '#dc2626',
              color: 'white',
              borderRadius: 1,
              fontWeight: 500,
              height: '40px',
              gap: 1.5,
              '&:hover': {
                bgcolor: '#b91c1c',
              },
              '&:active': {
                bgcolor: '#991b1b',
              }
            }}
          >
            {t('search.searchButton')}
          </Button>
        </Grid>
      </Grid>
      
      {/* הודעות קופון */}
      {couponError && (
        <FormHelperText 
          error 
          sx={{ 
            mt: 1, 
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#ef4444'
          }}
        >
          🚫 {couponError}
        </FormHelperText>
      )}
      
      {couponSuccess && (
        <FormHelperText 
          sx={{ 
            mt: 1, 
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#22c55e',
            fontWeight: 500
          }}
        >
          ✅ {couponSuccess}
        </FormHelperText>
      )}
      
      {error && (
        <FormHelperText 
          error 
          sx={{ 
            mt: 2, 
            textAlign: 'center',
            fontSize: '0.875rem'
          }}
        >
          {error}
        </FormHelperText>
      )}

      {/* דיאלוג הסבר על פטור ממע"מ לתיירים */}
      <Dialog
        open={touristDialogOpen}
        onClose={handleCloseTouristDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
          <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
          {t('search.touristDialogTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: 'center', fontSize: '1rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {t('search.touristDialogContent')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={handleCloseTouristDialog} 
            variant="contained" 
            sx={{ px: 4 }}
          >
            {t('search.touristDialogButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchBox; 
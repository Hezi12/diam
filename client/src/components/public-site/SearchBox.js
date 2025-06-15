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
  Switch
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { isAfter, isBefore, format, isValid, differenceInDays, addDays, subDays } from 'date-fns';

const SearchBox = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [nights, setNights] = useState(1);
  const [guests, setGuests] = useState(2);
  const [isTourist, setIsTourist] = useState(false);
  const [error, setError] = useState('');
  
  // קריאת ערכים מה-URL אם קיימים (לעדכון הטופס בעמוד תוצאות החיפוש)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const checkInStr = searchParams.get('checkIn');
    const checkOutStr = searchParams.get('checkOut');
    const nightsStr = searchParams.get('nights');
    const guestsStr = searchParams.get('guests');
    const isTouristStr = searchParams.get('isTourist');
    
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
  }, [location.search]);
  
  const handleSearch = () => {
    // וידוא תקינות התאריכים
    if (!isValid(checkIn) || !isValid(checkOut)) {
      setError('אנא בחר תאריכי צ׳ק-אין וצ׳ק-אאוט תקינים');
      return;
    }
    
    if (isBefore(checkOut, checkIn) || checkIn.getTime() === checkOut.getTime()) {
      setError('תאריך צ׳ק-אאוט חייב להיות לפחות יום אחד אחרי צ׳ק-אין');
      return;
    }
    
    if (isBefore(checkIn, today) && checkIn.getDate() !== today.getDate()) {
      setError('לא ניתן להזמין תאריכים בעבר');
      return;
    }
    
    // וידוא שמספר הלילות תואם לתאריכים
    const actualNights = differenceInDays(checkOut, checkIn);
    if (actualNights !== nights) {
      setNights(actualNights);
    }
    
    setError('');
    
    // מעבר לדף תוצאות החיפוש עם פרמטרים כולל מספר אורחים, לילות וסטטוס תייר
    navigate(`/airport-booking/search-results?checkIn=${format(checkIn, 'yyyy-MM-dd')}&checkOut=${format(checkOut, 'yyyy-MM-dd')}&nights=${actualNights}&guests=${guests}&isTourist=${isTourist}`);
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
    setIsTourist(e.target.checked);
  };
  
  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
        חפש חדר פנוי
      </Typography>
      
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={2.4}>
          <TextField
            label="תאריך צ'ק-אין"
            type="date"
            fullWidth
            value={format(checkIn, 'yyyy-MM-dd')}
            onChange={handleCheckInChange}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: format(today, 'yyyy-MM-dd')
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={2.4}>
          <TextField
            label="תאריך צ'ק-אאוט"
            type="date"
            fullWidth
            value={format(checkOut, 'yyyy-MM-dd')}
            onChange={handleCheckOutChange}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: format(addDays(checkIn, 1), 'yyyy-MM-dd')
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={1.6}>
          <TextField
            select
            label="מספר לילות"
            fullWidth
            value={nights}
            onChange={handleNightsChange}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => (
              <MenuItem key={num} value={num}>
                {num} {num === 1 ? 'לילה' : 'לילות'}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} md={1.6}>
          <TextField
            select
            label="מספר אורחים"
            fullWidth
            value={guests}
            onChange={handleGuestsChange}
          >
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <MenuItem key={num} value={num}>
                {num} {num === 1 ? 'אורח' : 'אורחים'}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} md={1.6}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            height: '56px',
            border: '1px solid rgba(0, 0, 0, 0.23)',
            borderRadius: '4px',
            px: 1,
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.87)'
            }
          }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={isTourist} 
                  onChange={handleTouristChange}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  תייר
                </Typography>
              }
              labelPlacement="top"
              sx={{ 
                margin: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.75rem',
                  color: 'rgba(0, 0, 0, 0.6)'
                }
              }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={1.4}>
          <Button
            variant="contained"
            fullWidth
            sx={{ 
              height: isMobile ? 'auto' : '56px',
              textTransform: 'none',
              fontSize: '1rem',
              bgcolor: '#1976d2',
              '&:hover': {
                bgcolor: '#1565c0'
              }
            }}
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            חפש
          </Button>
        </Grid>
        
        {error && (
          <Grid item xs={12}>
            <FormHelperText error>{error}</FormHelperText>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SearchBox; 
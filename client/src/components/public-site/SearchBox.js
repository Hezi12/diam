import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Button, 
  Typography,
  useMediaQuery,
  useTheme,
  FormHelperText,
  TextField
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { isAfter, isBefore, format, isValid } from 'date-fns';

const SearchBox = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [error, setError] = useState('');
  
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
    
    setError('');
    
    // מעבר לדף תוצאות החיפוש עם פרמטרים
    navigate(`/airport-booking/search-results?checkIn=${format(checkIn, 'yyyy-MM-dd')}&checkOut=${format(checkOut, 'yyyy-MM-dd')}`);
  };
  
  const handleCheckInChange = (e) => {
    const date = new Date(e.target.value);
    setCheckIn(date);
    
    // אם צ׳ק-אאוט קודם לצ׳ק-אין החדש, נעדכן אותו אוטומטית
    if (isBefore(checkOut, date) || checkOut.getTime() === date.getTime()) {
      const newCheckOut = new Date(date);
      newCheckOut.setDate(date.getDate() + 1);
      setCheckOut(newCheckOut);
    }
  };
  
  const handleCheckOutChange = (e) => {
    const date = new Date(e.target.value);
    setCheckOut(date);
  };
  
  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
        חפש חדר פנוי
      </Typography>
      
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={5}>
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
        
        <Grid item xs={12} md={5}>
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
              min: format(tomorrow, 'yyyy-MM-dd')
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={2}>
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
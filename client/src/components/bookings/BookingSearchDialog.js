import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Typography,
  Box,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Card
} from '@mui/material';
import { 
  Close as CloseIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarTodayIcon,
  Hotel as HotelIcon,
  Info as InfoIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import { STYLE_CONSTANTS } from '../../design-system/styles/StyleConstants';
import { format } from 'date-fns';
import axios from 'axios';

/**
 * רכיב דיאלוג חיפוש הזמנות
 */
const BookingSearchDialog = ({ 
  open, 
  onClose, 
  searchQuery, 
  onSearchChange, 
  location,
  isSearching = false,
  onBookingClick
}) => {
  const [localQuery, setLocalQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const colors = STYLE_CONSTANTS.colors;
  const locationColors = colors[location] || colors.airport;

  // עדכון ערך החיפוש המקומי כאשר הדיאלוג נפתח
  useEffect(() => {
    if (open) {
      setLocalQuery(searchQuery || '');
      setHasSearched(!!searchQuery);
    }
  }, [open, searchQuery]);

  // ביצוע חיפוש לאחר שהמשתמש הקליד
  useEffect(() => {
    const searchBookings = async () => {
      if (!localQuery.trim() || !hasSearched) return;

      try {
        const response = await axios.get(`/api/bookings/search`, {
          params: {
            query: localQuery,
            location
          }
        });
        setSearchResults(response.data);
      } catch (error) {
        console.error('שגיאה בחיפוש הזמנות:', error);
        setSearchResults([]);
      }
    };

    searchBookings();
  }, [localQuery, location, hasSearched]);

  // טיפול בשינוי טקסט החיפוש
  const handleInputChange = (e) => {
    setLocalQuery(e.target.value);
  };

  // טיפול בשליחת החיפוש
  const handleSearch = () => {
    onSearchChange(localQuery);
    setHasSearched(true);
  };

  // טיפול בלחיצה על Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // טיפול בניקוי החיפוש
  const handleClear = () => {
    setLocalQuery('');
    onSearchChange('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // טיפול בלחיצה על הזמנה
  const handleBookingClick = (bookingId) => {
    // סגירת חלון החיפוש ומעבר להזמנה הנבחרת
    onClose();
    
    // קריאה לפונקציה שמטפלת בפתיחת חלון עריכת הזמנה
    if (onBookingClick) {
      onBookingClick(bookingId);
    }
  };

  // רנדור פריט הזמנה ברשימת תוצאות החיפוש
  const renderBookingItem = (booking) => (
    <Card
      key={booking._id}
      sx={{
        mb: 2,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transform: 'translateY(-2px)'
        }
      }}
      onClick={() => handleBookingClick(booking._id)}
    >
      <Box sx={{ 
        p: 2,
        borderRight: `3px solid ${
          booking.status === 'confirmed' ? colors.accent.green :
          booking.status === 'pending' ? colors.accent.orange :
          booking.status === 'cancelled' ? colors.accent.red :
          locationColors.main
        }`
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {booking.firstName} {booking.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {booking.room && booking.room.roomNumber ? `חדר ${booking.room.roomNumber}` : 'חדר לא מוגדר'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary', ml: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {format(new Date(booking.checkIn), 'dd/MM/yyyy')}
              {' - '}
              {format(new Date(booking.checkOut), 'dd/MM/yyyy')}
            </Typography>
          </Box>
          
          {booking.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', ml: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {booking.phone}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: locationColors.bgLight,
          p: 2,
          pb: 2
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 500, 
            color: locationColors.main,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <SearchIcon sx={{ marginLeft: 1, fontSize: '1.2rem' }} />
          חיפוש הזמנות
        </Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={onClose} 
          aria-label="close"
          size="small"
          sx={{
            color: colors.text.secondary
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            חפש הזמנות לפי שם אורח, מספר טלפון, אימייל, או מספר חדר
          </Typography>
          
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            placeholder="הקלד טקסט לחיפוש..."
            value={localQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: isSearching ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} color="inherit" />
                </InputAdornment>
              ) : localQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="נקה חיפוש"
                    onClick={handleClear}
                    edge="end"
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                direction: 'rtl'
              },
              '& .MuiInputBase-input': {
                textAlign: 'right',
                direction: 'rtl',
                caretColor: locationColors.main
              }
            }}
          />
        </Box>
        
        <Box 
          sx={{ 
            mt: 2,
            textAlign: 'right',
            color: colors.text.secondary
          }}
        >
          <Typography variant="caption">
            * ניתן לחפש מספר מילות מפתח בו-זמנית, מופרדות ברווח
          </Typography>
        </Box>

        {/* אזור תוצאות החיפוש */}
        {hasSearched && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            
            {isSearching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={30} sx={{ color: locationColors.main }} />
              </Box>
            ) : searchResults.length > 0 ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                  נמצאו {searchResults.length} תוצאות
                </Typography>
                <Box sx={{ maxHeight: '300px', overflow: 'auto', pr: 1 }}>
                  {searchResults.map(booking => renderBookingItem(booking))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ 
                py: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                color: colors.text.secondary
              }}>
                <ErrorOutlineIcon sx={{ fontSize: 40, mb: 1, color: colors.text.secondary }} />
                <Typography>לא נמצאו תוצאות תואמות לחיפוש</Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <Divider />
      
      <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          onClick={handleClear}
          sx={{ 
            color: colors.text.secondary,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          נקה
        </Button>
        <Box>
          <Button 
            onClick={onClose}
            sx={{ 
              color: colors.text.secondary,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              mr: 1
            }}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleSearch}
            variant="contained"
            sx={{ 
              bgcolor: locationColors.main,
              '&:hover': {
                bgcolor: locationColors.main,
                filter: 'brightness(0.9)'
              },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: 'none'
            }}
            disabled={isSearching}
          >
            חפש
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default BookingSearchDialog; 
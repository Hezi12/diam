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
  CircularProgress
} from '@mui/material';
import { 
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { STYLE_CONSTANTS } from '../../design-system/styles/StyleConstants';

/**
 * רכיב דיאלוג חיפוש הזמנות
 */
const BookingSearchDialog = ({ 
  open, 
  onClose, 
  searchQuery, 
  onSearchChange, 
  location,
  isSearching = false 
}) => {
  const [localQuery, setLocalQuery] = useState('');
  const colors = STYLE_CONSTANTS.colors;
  const locationColors = colors[location] || colors.airport;

  // עדכון ערך החיפוש המקומי כאשר הדיאלוג נפתח
  useEffect(() => {
    if (open) {
      setLocalQuery(searchQuery || '');
    }
  }, [open, searchQuery]);

  // טיפול בשינוי טקסט החיפוש
  const handleInputChange = (e) => {
    setLocalQuery(e.target.value);
  };

  // טיפול בשליחת החיפוש
  const handleSearch = () => {
    onSearchChange(localQuery);
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
  };

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
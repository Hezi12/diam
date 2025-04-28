import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';
import BookingSearchDialog from './BookingSearchDialog';

/**
 * רכיב כותרת לדף ניהול ההזמנות
 * כולל כותרת, אייקון חיפוש וכפתור להזמנה חדשה
 * בעיצוב המותאם לסגנון החדש
 */
const BookingsHeader = ({ 
  location,
  onAddBookingClick,
  searchQuery,
  onSearchChange,
  isSearching = false
}) => {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const colors = STYLE_CONSTANTS.colors;
  const locationColors = colors[location] || colors.airport;

  const handleOpenSearchDialog = () => {
    setSearchDialogOpen(true);
  };

  const handleCloseSearchDialog = () => {
    setSearchDialogOpen(false);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        elevation={0}
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          mb: 4,
          ...STYLE_CONSTANTS.card
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              mr: 2,
              bgcolor: locationColors.bgLight, 
              p: 1.5, 
              borderRadius: 2,
              display: 'flex'
            }}
          >
            <CalendarMonthIcon sx={{ color: locationColors.main, fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: colors.text.primary }}>
              ניהול הזמנות
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              צפייה וניהול של כל ההזמנות במערכת
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="חיפוש הזמנות">
            <IconButton
              onClick={handleOpenSearchDialog}
              sx={{ 
                bgcolor: searchQuery ? locationColors.bgLight : 'transparent',
                color: searchQuery ? locationColors.main : colors.text.secondary,
                '&:hover': { 
                  bgcolor: locationColors.bgLight,
                  color: locationColors.main
                },
                mr: 1
              }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>

          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={onAddBookingClick}
            sx={{ 
              bgcolor: colors.accent.green, 
              '&:hover': { bgcolor: colors.accent.green, filter: 'brightness(0.9)' },
              boxShadow: 'none',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              px: 2.5,
              py: 1
            }}
          >
            הזמנה חדשה
          </Button>
        </Box>
      </Paper>

      {/* דיאלוג החיפוש */}
      <BookingSearchDialog
        open={searchDialogOpen}
        onClose={handleCloseSearchDialog}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        location={location}
        isSearching={isSearching}
      />
    </Box>
  );
};

export default BookingsHeader; 
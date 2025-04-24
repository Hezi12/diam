import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { STYLE_CONSTANTS } from '../../design-system/styles/StyleConstants';

/**
 * רכיב המאפשר מעבר בין מיקומי המלון השונים (Airport/Rothschild)
 * בסגנון העיצוב החדש עם אייקונים בלבד
 */
const BookingTabs = ({ location, onLocationChange, onSearchClick, onAddBookingClick }) => {
  const colors = STYLE_CONSTANTS.colors;
  const locationColors = {
    airport: colors.airport,
    rothschild: colors.rothschild
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Airport Guest House">
          <IconButton
            onClick={() => onLocationChange('airport')}
            sx={{ 
              color: location === 'airport' ? colors.airport.main : 'text.secondary',
              bgcolor: location === 'airport' ? colors.airport.bgLight : 'transparent',
              mr: 1,
              border: location === 'airport' ? `2px solid ${colors.airport.main}` : 'none',
              '&:hover': { bgcolor: colors.airport.bgLight }
            }}
          >
            <FlightIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="רוטשילד">
          <IconButton
            onClick={() => onLocationChange('rothschild')}
            sx={{ 
              color: location === 'rothschild' ? colors.rothschild.main : 'text.secondary',
              bgcolor: location === 'rothschild' ? colors.rothschild.bgLight : 'transparent',
              border: location === 'rothschild' ? `2px solid ${colors.rothschild.main}` : 'none',
              '&:hover': { bgcolor: colors.rothschild.bgLight }
            }}
          >
            <HomeIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="חיפוש הזמנות">
          <IconButton
            onClick={onSearchClick}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: locationColors[location].bgLight, color: locationColors[location].main }
            }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="הזמנה חדשה">
          <IconButton
            onClick={onAddBookingClick}
            sx={{ 
              ml: 1,
              color: colors.accent.green,
              '&:hover': { bgcolor: `${colors.accent.green}15` }
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default BookingTabs; 
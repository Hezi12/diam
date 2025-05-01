import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import HomeIcon from '@mui/icons-material/Home';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';

/**
 * רכיב המאפשר מעבר בין מיקומי המלון השונים (Airport/Rothschild)
 * בסגנון העיצוב עם אייקונים בלבד, עבור דף הכנסות
 */
const RevenueTabs = ({ selectedSite, onSiteChange }) => {
  const colors = STYLE_CONSTANTS.colors;
  
  // המרה מאינדקס למזהה מיקום
  const getLocationId = (index) => {
    return index === 0 ? 'rothschild' : 'airport';
  };
  
  // המרה ממזהה מיקום לאינדקס
  const getIndex = (locationId) => {
    return locationId === 'rothschild' ? 0 : 1;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Tooltip title="רוטשילד">
        <IconButton
          onClick={() => onSiteChange(0)}
          sx={{ 
            color: selectedSite === 0 ? colors.rothschild.main : 'text.secondary',
            bgcolor: selectedSite === 0 ? colors.rothschild.bgLight : 'transparent',
            padding: '6px',
            minWidth: '32px',
            height: '32px',
            borderRadius: '4px',
            marginRight: '4px',
            border: selectedSite === 0 ? `1px solid ${colors.rothschild.main}` : 'none',
          }}
        >
          <HomeIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Airport Guest House">
        <IconButton
          onClick={() => onSiteChange(1)}
          sx={{ 
            color: selectedSite === 1 ? colors.airport.main : 'text.secondary',
            bgcolor: selectedSite === 1 ? colors.airport.bgLight : 'transparent',
            padding: '6px',
            minWidth: '32px',
            height: '32px',
            borderRadius: '4px',
            border: selectedSite === 1 ? `1px solid ${colors.airport.main}` : 'none',
          }}
        >
          <FlightIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default RevenueTabs; 
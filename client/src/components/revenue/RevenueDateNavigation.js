import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';

/**
 * רכיב ניווט בין חודשים עבור דף הכנסות
 */
const RevenueDateNavigation = ({ selectedDate, onDateChange, location }) => {
  const colors = STYLE_CONSTANTS.colors;
  const locationColors = colors[location] || colors.airport;

  // מעבר לחודש הקודם
  const handlePrevMonth = () => {
    const newDate = subMonths(selectedDate, 1);
    onDateChange(newDate);
  };

  // מעבר לחודש הבא
  const handleNextMonth = () => {
    const newDate = addMonths(selectedDate, 1);
    onDateChange(newDate);
  };

  // מעבר לחודש הנוכחי
  const handleCurrentMonth = () => {
    const today = startOfMonth(new Date());
    onDateChange(today);
  };

  // פורמט תצוגת החודש
  const formatMonth = () => {
    return format(selectedDate, 'MM/yyyy', { locale: he });
  };

  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
    }}>
      <IconButton 
        size="small" 
        sx={{ 
          color: locationColors.main,
          padding: '4px'
        }}
        onClick={handlePrevMonth}
      >
        <ChevronRightIcon fontSize="small" />
      </IconButton>

      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 500, 
          mx: 1,
          fontSize: '0.875rem',
          userSelect: 'none'
        }}
      >
        {formatMonth()}
      </Typography>
      
      <IconButton 
        size="small" 
        sx={{ 
          color: locationColors.main,
          padding: '4px'
        }}
        onClick={handleNextMonth}
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>

      <Tooltip title="חזרה לחודש נוכחי">
        <IconButton 
          size="small" 
          sx={{ 
            color: locationColors.main,
            marginLeft: '4px',
            padding: '4px'
          }}
          onClick={handleCurrentMonth}
        >
          <TodayIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default RevenueDateNavigation; 
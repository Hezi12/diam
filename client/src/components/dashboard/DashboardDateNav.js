import React from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { 
  ArrowBack, 
  ArrowForward, 
  Today as TodayIcon 
} from '@mui/icons-material';
import { format, addDays, subDays, isToday, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';

/**
 * קומפוננטת ניווט בין תאריכים בדאשבורד עם עיצוב מינימליסטי
 */
export const DashboardDateNav = ({ currentDate, onDateChange }) => {
  // וידוא שהתאריך תקין
  const safeDate = currentDate instanceof Date && isValid(currentDate) ? currentDate : new Date();
  
  const handleNextDay = () => {
    const newDate = addDays(safeDate, 1);
    onDateChange(newDate);
  };

  const handlePrevDay = () => {
    const newDate = subDays(safeDate, 1);
    onDateChange(newDate);
  };
  
  // פונקציה לחזרה ליום הנוכחי
  const handleToday = () => {
    onDateChange(new Date());
  };
  
  // בדיקה אם התאריך הנוכחי הוא היום
  const isCurrentDateToday = isToday(safeDate);
  
  // פורמט תאריך מינימליסטי - יום בשבוע ותאריך
  const dayName = format(safeDate, 'EEEE', { locale: he });
  const shortDayName = dayName.slice(0, 4); // לקיחת תחילת שם היום
  const dateNumber = format(safeDate, 'dd/MM', { locale: he });

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'flex-start',
      py: 1.5,
      borderBottom: '1px solid #f0f0f0',
      mb: 1.5
    }}>
      {/* כפתור לחזרה לתאריך קודם */}
      <IconButton 
        onClick={handlePrevDay} 
        size="small" 
        sx={{ 
          p: 0.5,
          color: 'text.secondary',
          borderRadius: 1
        }}
      >
        <ArrowForward fontSize="small" sx={{ fontSize: '0.9rem' }} />
      </IconButton>
      
      <Box sx={{ 
        mx: 1, 
        display: 'flex',
        alignItems: 'center',
      }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500,
            color: isCurrentDateToday ? STYLE_CONSTANTS.colors.airport.main : 'text.primary',
            fontSize: '0.85rem',
          }}
        >
          {`${shortDayName} ${dateNumber}`}
        </Typography>
        
        {/* כפתור לחזרה ליום הנוכחי */}
        {!isCurrentDateToday && (
          <Tooltip title="היום" placement="top" arrow>
            <IconButton 
              onClick={handleToday} 
              size="small"
              sx={{ 
                ml: 0.5,
                p: 0.3,
                color: STYLE_CONSTANTS.colors.airport.main,
                opacity: 0.8,
                '&:hover': {
                  opacity: 1,
                  bgcolor: 'transparent'
                }
              }}
            >
              <TodayIcon sx={{ fontSize: '0.8rem' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      {/* כפתור לקידום לתאריך הבא */}
      <IconButton 
        onClick={handleNextDay} 
        size="small" 
        sx={{ 
          p: 0.5, 
          color: 'text.secondary',
          borderRadius: 1
        }}
      >
        <ArrowBack fontSize="small" sx={{ fontSize: '0.9rem' }} />
      </IconButton>
    </Box>
  );
};

export default DashboardDateNav; 
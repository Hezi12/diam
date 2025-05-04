import React from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { 
  ArrowBack, 
  ArrowForward, 
  Today as TodayIcon, 
  CleaningServices as CleaningIcon 
} from '@mui/icons-material';
import { format, addDays, subDays, isToday, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';
import { Link } from 'react-router-dom';

/**
 * רכיב ניווט תאריכים פשוט ומינימליסטי
 */
export const DashboardDateNav = ({ currentDate, onDateChange }) => {
  // וידוא שהתאריך תקין
  const safeDate = currentDate instanceof Date && isValid(currentDate) ? currentDate : new Date();
  
  // בדיקה אם התאריך הנוכחי הוא היום
  const isCurrentDateToday = isToday(safeDate);
  
  // פורמט התאריך
  const dayName = format(safeDate, 'EEEE', { locale: he });
  const formattedDay = format(safeDate, 'd', { locale: he });
  const formattedMonth = format(safeDate, 'MMM', { locale: he });
  const formattedYear = format(safeDate, 'yyyy', { locale: he });
  
  // צבעים
  const accentColor = STYLE_CONSTANTS.colors.airport.main;
  
  // פונקציות ניווט
  const handlePrevDay = () => onDateChange(subDays(safeDate, 1));
  const handleNextDay = () => onDateChange(addDays(safeDate, 1));
  const handleToday = () => onDateChange(new Date());

  return (
    <Box sx={{ 
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      py: 1.5,
      my: 1,
      width: '100%',
    }}>
      {/* תצוגת תאריך וחיצים - בצד ימין */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', pl: 2 }}>
        {/* חץ ימינה - יום קודם */}
        <IconButton 
          onClick={handlePrevDay}
          size="small"
          sx={{ 
            color: accentColor,
            mr: 1,
            p: 0.5,
          }}
        >
          <ArrowForward fontSize="small" />
        </IconButton>
        
        {/* תצוגת תאריך */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-start',
          mx: 1,
        }}>
          <Typography sx={{ 
            fontSize: '0.95rem',
            fontWeight: 500,
            color: '#333',
          }}>
            {dayName}
          </Typography>
          
          <Typography sx={{ 
            fontSize: '0.85rem',
            color: '#666',
            mt: 0.2,
          }}>
            {formattedDay} {formattedMonth} {formattedYear}
          </Typography>
        </Box>
        
        {/* חץ שמאלה - יום הבא */}
        <IconButton 
          onClick={handleNextDay}
          size="small"
          sx={{ 
            color: accentColor,
            ml: 1,
            p: 0.5,
          }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        
        {/* אייקון חזרה ליום הנוכחי */}
        {!isCurrentDateToday && (
          <Tooltip title="חזור להיום" placement="top" arrow>
            <IconButton 
              onClick={handleToday}
              size="small"
              sx={{ 
                color: accentColor,
                opacity: 0.8,
                ml: 1,
                '&:hover': {
                  opacity: 1
                }
              }}
            >
              <TodayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      {/* ניווט במרכז - ריק */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
      </Box>
      
      {/* אייקון ניקיון בצד שמאל */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 2 }}>
        <Tooltip title="דף ניקיון" placement="bottom">
          <IconButton 
            component={Link} 
            to="/cleaning"
            size="small"
            sx={{ 
              color: '#408B4E',
              p: 0.5,
            }}
          >
            <CleaningIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DashboardDateNav; 
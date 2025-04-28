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
 * קומפוננטת ניווט בין תאריכים בדאשבורד עם עיצוב מינימליסטי מודרני
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
  
  // פורמט תאריך מינימליסטי ומודרני - יום בשבוע ותאריך
  const dayName = format(safeDate, 'EEEE', { locale: he });
  const dayNameShort = dayName.charAt(0).toUpperCase() + dayName.slice(1); // שם היום בשבוע
  const dayNum = format(safeDate, 'd', { locale: he }); // מספר היום בחודש
  const monthNum = format(safeDate, 'M', { locale: he }); // מספר החודש

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'space-between',
      py: 1.5,
      borderBottom: '1px solid #f0f0f0',
      mb: 1.5,
      maxWidth: '95%',
      mx: 'auto'
    }}>
      {/* אזור ניווט בתאריכים - עכשיו בצד ימין */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* כפתור לחזרה לתאריך קודם */}
        <IconButton 
          onClick={handlePrevDay} 
          size="small" 
          sx={{ 
            color: 'text.secondary',
          }}
        >
          <ArrowForward fontSize="small" />
        </IconButton>
        
        <Box sx={{ 
          mx: 1, 
          display: 'flex',
          alignItems: 'center',
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 500,
              color: STYLE_CONSTANTS.colors.airport.main,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                fontWeight: 500,
                color: STYLE_CONSTANTS.colors.airport.main,
              }}
            >
              {`${dayNum}/${monthNum}`}
            </Box>
            <Box component="span" sx={{ 
              fontWeight: 400,
              fontSize: '0.95rem', 
              opacity: 0.75
            }}>
              {dayNameShort}
            </Box>
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
            color: 'text.secondary',
          }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
      </Box>
      
      {/* אזור סרגל כלים - עכשיו בצד שמאל */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="דף ניקיון" placement="bottom">
          <IconButton 
            component={Link} 
            to="/cleaning"
            size="small" 
            sx={{ 
              color: '#499C56',  // צבע ירוק יותר כהה
              bgcolor: 'rgba(73, 156, 86, 0.12)', // רקע ירוק שקוף עם יותר אטימות
              '&:hover': {
                bgcolor: 'rgba(73, 156, 86, 0.2)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
              },
              p: 1,
              borderRadius: '8px',
              border: '1px solid rgba(73, 156, 86, 0.15)' // הוספת מסגרת דקה
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
import React from 'react';
import { Box, IconButton, Typography, Tooltip, useMediaQuery, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
      py: isMobile ? 0.8 : 1.5,
      mt: isMobile ? 2 : 0,
      mb: 1.5,
      width: '100%',
      maxWidth: '98%',
      mx: 'auto',
      position: 'relative',
      zIndex: 20,
      borderRadius: isMobile ? '12px' : 0,
      backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
      backdropFilter: isMobile ? 'blur(8px)' : 'none',
      boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.05)' : 'none',
      border: isMobile ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
    }}>
      {/* אזור ניווט בתאריכים - עכשיו בצד ימין */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        flexGrow: 0,
        minWidth: isMobile ? '120px' : '150px',
        justifyContent: 'flex-start'
      }}>
        {/* כפתור לחזרה לתאריך קודם */}
        <IconButton 
          onClick={handlePrevDay} 
          size={isMobile ? "small" : "medium"}
          sx={{ 
            color: 'text.secondary',
            p: isMobile ? 0.5 : 1,
          }}
        >
          <ArrowForward fontSize={isMobile ? "small" : "small"} />
        </IconButton>
        
        <Box sx={{ 
          mx: isMobile ? 0.5 : 1, 
          display: 'flex',
          alignItems: 'center',
        }}>
          <Typography 
            variant={isMobile ? "body1" : "h6"}
            sx={{ 
              fontWeight: 500,
              color: STYLE_CONSTANTS.colors.airport.main,
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '2px' : '6px',
              whiteSpace: 'nowrap'
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
              fontSize: isMobile ? '0.75rem' : '0.95rem', 
              opacity: 0.75,
              display: 'inline' // החזרת תצוגת שם היום במובייל
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
                  p: isMobile ? 0.2 : 0.3,
                  color: STYLE_CONSTANTS.colors.airport.main,
                  opacity: 0.8,
                  '&:hover': {
                    opacity: 1,
                    bgcolor: 'transparent'
                  }
                }}
              >
                <TodayIcon sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {/* כפתור לקידום לתאריך הבא */}
        <IconButton 
          onClick={handleNextDay} 
          size={isMobile ? "small" : "medium"} 
          sx={{ 
            color: 'text.secondary',
            p: isMobile ? 0.5 : 1,
          }}
        >
          <ArrowBack fontSize={isMobile ? "small" : "small"} />
        </IconButton>
      </Box>
      
      {/* אזור סרגל כלים - עכשיו בצד שמאל */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 0.5 : 1,
        position: 'static',
      }}>
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
              p: isMobile ? 0.5 : 1,
              borderRadius: '8px',
              border: '1px solid rgba(73, 156, 86, 0.15)' // הוספת מסגרת דקה
            }}
          >
            <CleaningIcon fontSize={isMobile ? "small" : "small"} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DashboardDateNav; 
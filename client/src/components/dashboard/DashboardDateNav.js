import React, { useState, useEffect } from 'react';
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
  // מצב עבור השעה הנוכחית
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // עדכון השעה כל שנייה
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // ניקוי ה-interval כשהקומפוננטה מתפרקת
    return () => clearInterval(timer);
  }, []);
  
  // וידוא שהתאריך תקין
  const safeDate = currentDate instanceof Date && isValid(currentDate) ? currentDate : new Date();
  
  // בדיקה אם התאריך הנוכחי הוא היום
  const isCurrentDateToday = isToday(safeDate);
  
  // פורמט התאריך
  const dayName = format(safeDate, 'EEEE', { locale: he });
  const formattedDay = format(safeDate, 'd', { locale: he });
  const formattedMonth = format(safeDate, 'MMM', { locale: he });
  const formattedYear = format(safeDate, 'yyyy', { locale: he });
  
  // פורמט השעה
  const formattedHours = format(currentTime, 'HH');
  const formattedMinutes = format(currentTime, 'mm');
  const formattedSeconds = format(currentTime, 'ss');
  
  // פורמט מלא עבור tooltip
  const fullFormattedDateTime = format(currentTime, "EEEE, MMMM do yyyy, h:mm:ss a");
  
  // הבהוב עבור הנקודותיים (בלינק כל שנייה)
  const isEvenSecond = parseInt(formattedSeconds) % 2 === 0;
  
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        pl: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
        
        {/* שעון דיגיטלי מתחת לתאריך */}
        <Tooltip 
          title={fullFormattedDateTime} 
          placement="bottom" 
          arrow
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            transition: 'all 0.2s ease',
            mt: 1.5,
            pr: 0,
            ml: 0,
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontFamily: "'Courier New', monospace",
              fontWeight: 600,
              color: '#FF8C00', // צבע כתום דיגיטלי
              letterSpacing: '1px',
            }}>
              {/* שניות */}
              <Typography 
                component="span" 
                sx={{ 
                  fontSize: '1.15rem', 
                  fontWeight: 600,
                  width: '28px',
                  textAlign: 'center',
                  fontFamily: "'Digital-7', 'Courier New', monospace",
                }}
              >
                {formattedSeconds}
              </Typography>
              <Typography 
                component="span" 
                sx={{ 
                  mx: 0.2, 
                  opacity: isEvenSecond ? 1 : 0.3,
                  transition: 'opacity 0.2s ease-in-out',
                  color: '#FF8C00',
                  fontWeight: 500,
                  fontSize: '1.15rem',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  position: 'relative',
                  top: '-1px'
                }}
              >
                :
              </Typography>
              {/* דקות */}
              <Typography 
                component="span" 
                sx={{ 
                  fontSize: '1.15rem', 
                  fontWeight: 600,
                  width: '28px',
                  textAlign: 'center',
                  fontFamily: "'Digital-7', 'Courier New', monospace",
                }}
              >
                {formattedMinutes}
              </Typography>
              <Typography 
                component="span" 
                sx={{ 
                  mx: 0.2, 
                  opacity: isEvenSecond ? 1 : 0.3,
                  transition: 'opacity 0.2s ease-in-out',
                  color: '#FF8C00',
                  fontWeight: 500,
                  fontSize: '1.15rem',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  position: 'relative',
                  top: '-1px'
                }}
              >
                :
              </Typography>
              {/* שעות */}
              <Typography 
                component="span" 
                sx={{ 
                  fontSize: '1.15rem', 
                  fontWeight: 600,
                  width: '28px',
                  textAlign: 'center',
                  fontFamily: "'Digital-7', 'Courier New', monospace",
                }}
              >
                {formattedHours}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
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
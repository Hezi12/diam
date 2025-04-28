import React, { useState } from 'react';
import { Box, Typography, IconButton, Button, Popover, Paper, Tooltip, Divider } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TodayIcon from '@mui/icons-material/Today';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { DateRange, Calendar } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { he } from 'date-fns/locale';
import { format, addDays, subDays, differenceInDays } from 'date-fns';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';

// תוספת CSS לתיקון כיוון החיצים וסגנון הרקע בלוח השנה
const calendarCustomStyles = `
  .rdrMonthAndYearWrapper {
    direction: rtl;
  }
  
  .rdrNextPrevButton {
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .rdrNextPrevButton.rdrPprevButton i {
    margin: 0;
    transform: rotate(180deg);
  }
  
  .rdrNextPrevButton.rdrNextButton i {
    margin: 0;
    transform: rotate(180deg);
  }
  
  .rdrMonths {
    direction: rtl;
  }
  
  .rdrMonth {
    direction: rtl;
  }
  
  .rdrCalendarWrapper {
    direction: rtl;
  }
`;

/**
 * רכיב ניווט בין תאריכים לדף ההזמנות
 * בעיצוב המותאם לסגנון החדש
 */
const DateNavigation = ({ 
  startDate,
  endDate,
  onDateRangeChange,
  location,
  onSearchClick,
  onAddBookingClick
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());

  const colors = STYLE_CONSTANTS.colors;
  const locationColors = colors[location] || colors.airport;

  const handleOpenDatePicker = (event) => {
    setAnchorEl(event.currentTarget);
    // עדכון התאריך הזמני לתאריך הנוכחי בטווח (יום אמצעי בערך)
    const middleDate = new Date(
      startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2
    );
    setTempDate(middleDate);
  };

  const handleCloseDatePicker = () => {
    setAnchorEl(null);
  };

  const handleDateChange = (date) => {
    setTempDate(date);
  };

  const handleApplyDate = () => {
    // קביעת טווח: 3 ימים לפני היום שנבחר ו-6 ימים אחריו
    const newStartDate = subDays(tempDate, 3);
    const newEndDate = addDays(tempDate, 6);
    
    onDateRangeChange(newStartDate, newEndDate);
    handleCloseDatePicker();
  };

  const handlePrevPeriod = () => {
    // חישוב מספר הימים בטווח הנוכחי
    const days = differenceInDays(endDate, startDate);
    
    // חישוב תאריך סיום חדש (יום לפני תאריך ההתחלה הנוכחי)
    const newEndDate = subDays(startDate, 1);
    
    // חישוב תאריך התחלה חדש (מספר הימים הנוכחי לפני תאריך הסיום החדש)
    const newStartDate = subDays(newEndDate, days);
    
    // עדכון טווח התאריכים
    onDateRangeChange(newStartDate, newEndDate);
  };

  const handleNextPeriod = () => {
    // חישוב מספר הימים בטווח הנוכחי
    const days = differenceInDays(endDate, startDate);
    
    // חישוב תאריך התחלה חדש (יום אחרי תאריך הסיום הנוכחי)
    const newStartDate = addDays(endDate, 1);
    
    // חישוב תאריך סיום חדש (מספר הימים הנוכחי אחרי תאריך ההתחלה החדש)
    const newEndDate = addDays(newStartDate, days);
    
    // עדכון טווח התאריכים
    onDateRangeChange(newStartDate, newEndDate);
  };

  const handleGoToToday = () => {
    const today = new Date();
    const newStartDate = subDays(today, 3); // 3 ימים אחורה
    const newEndDate = addDays(today, 6);   // 6 ימים קדימה
    onDateRangeChange(newStartDate, newEndDate);
  };

  // פורמט תאריכים עברי
  const formatDateRange = () => {
    return `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`;
  };

  const open = Boolean(anchorEl);

  return (
    <Paper 
      elevation={0}
      sx={{ 
        py: 1.5,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2.5,
        borderRadius: '10px',
        border: '1px solid',
        borderColor: 'grey.200',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton 
          size="small" 
          sx={{ 
            color: locationColors.main,
            '&:hover': { 
              bgcolor: `${locationColors.main}15`,
              transform: 'scale(1.05)',
              transition: 'all 0.2s'
            }
          }}
          onClick={handlePrevPeriod}
        >
          <ChevronRightIcon />
        </IconButton>

        <Tooltip title="בחר תאריך">
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 500, 
              mx: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              '&:hover': { 
                color: locationColors.main,
                transform: 'scale(1.02)',
                transition: 'all 0.2s'
              }
            }}
            onClick={handleOpenDatePicker}
          >
            {formatDateRange()}
          </Typography>
        </Tooltip>
        
        <IconButton 
          size="small" 
          sx={{ 
            color: locationColors.main,
            '&:hover': { 
              bgcolor: `${locationColors.main}15`,
              transform: 'scale(1.05)',
              transition: 'all 0.2s'
            }
          }}
          onClick={handleNextPeriod}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Tooltip title="חזרה לתאריך נוכחי">
          <IconButton 
            size="small" 
            sx={{ 
              color: locationColors.main,
              '&:hover': { 
                bgcolor: `${locationColors.main}15`,
                transform: 'scale(1.05)',
                transition: 'all 0.2s'
              },
              ml: 1
            }}
            onClick={handleGoToToday}
          >
            <TodayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* כפתורי פעולות נוספות */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {onSearchClick && (
          <Tooltip title="חיפוש הזמנות">
            <IconButton
              onClick={onSearchClick}
              size="small"
              sx={{ 
                color: 'text.secondary',
                bgcolor: 'rgba(0, 0, 0, 0.03)',
                p: 1,
                '&:hover': { 
                  bgcolor: locationColors.bgLight, 
                  color: locationColors.main,
                  transform: 'scale(1.05)',
                  transition: 'all 0.2s'
                }
              }}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {onAddBookingClick && (
          <Tooltip title="הזמנה חדשה">
            <IconButton
              onClick={onAddBookingClick}
              size="small"
              sx={{ 
                ml: 1,
                color: colors.accent.green,
                bgcolor: `${colors.accent.green}08`,
                p: 1,
                '&:hover': { 
                  bgcolor: `${colors.accent.green}15`,
                  transform: 'scale(1.05)',
                  transition: 'all 0.2s'
                }
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseDatePicker}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { 
            mt: 1,
            p: 1,
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'grey.200',
          }
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: calendarCustomStyles }} />
        <Box sx={{ minWidth: 300 }}>
          <div style={{ direction: 'rtl' }}>
            <Calendar
              date={tempDate}
              onChange={handleDateChange}
              locale={he}
              direction="horizontal"
            />
          </div>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mt: 1, 
            borderTop: '1px solid',
            borderColor: 'grey.100',
            pt: 1
          }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCloseDatePicker}
              sx={{ ml: 1, borderRadius: '8px' }}
            >
              ביטול
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleApplyDate}
              sx={{ 
                bgcolor: locationColors.main,
                '&:hover': { bgcolor: locationColors.dark },
                borderRadius: '8px'
              }}
            >
              אישור
            </Button>
          </Box>
        </Box>
      </Popover>
    </Paper>
  );
};

export default DateNavigation; 
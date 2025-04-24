import React, { useState } from 'react';
import { Box, Typography, IconButton, Button, Popover, Paper } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { he } from 'date-fns/locale';
import { format } from 'date-fns';
import { STYLE_CONSTANTS } from '../../design-system/styles/StyleConstants';

/**
 * רכיב ניווט בין תאריכים לדף ההזמנות
 * בעיצוב המותאם לסגנון החדש
 */
const DateNavigation = ({ 
  startDate,
  endDate,
  onDateRangeChange,
  location
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [tempDateRange, setTempDateRange] = useState([
    {
      startDate,
      endDate,
      key: 'selection'
    }
  ]);

  const colors = STYLE_CONSTANTS.colors;
  const locationColors = colors[location] || colors.airport;

  const handleOpenDatePicker = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseDatePicker = () => {
    setAnchorEl(null);
  };

  const handleDateRangeChange = (item) => {
    setTempDateRange([item.selection]);
  };

  const handleApplyDateRange = () => {
    const { startDate, endDate } = tempDateRange[0];
    onDateRangeChange(startDate, endDate);
    handleCloseDatePicker();
  };

  const handlePrevPeriod = () => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() - 1);
    const newStartDate = new Date(newEndDate);
    newStartDate.setDate(newStartDate.getDate() - days + 1);
    onDateRangeChange(newStartDate, newEndDate);
  };

  const handleNextPeriod = () => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newStartDate = new Date(endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + days - 1);
    onDateRangeChange(newStartDate, newEndDate);
  };

  // פורמט תאריכים עברי
  const formatDateRange = () => {
    return `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
  };

  const open = Boolean(anchorEl);

  return (
    <Paper 
      sx={{ 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 4,
        ...STYLE_CONSTANTS.card
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton 
          size="small" 
          sx={{ 
            color: locationColors.main,
            '&:hover': { bgcolor: locationColors.bgLight }
          }}
          onClick={handlePrevPeriod}
        >
          <ChevronRightIcon />
        </IconButton>

        <Typography variant="subtitle1" sx={{ fontWeight: 500, mx: 2 }}>
          {formatDateRange()}
        </Typography>
        
        <IconButton 
          size="small" 
          sx={{ 
            color: locationColors.main,
            '&:hover': { bgcolor: locationColors.bgLight }
          }}
          onClick={handleNextPeriod}
        >
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      
      <Button 
        size="small" 
        startIcon={<CalendarTodayIcon sx={{ marginLeft: '8px', marginRight: '0px' }} />}
        sx={{ 
          color: locationColors.main,
          borderColor: locationColors.main,
          '&:hover': { bgcolor: locationColors.bgLight },
          ...STYLE_CONSTANTS.button
        }}
        variant="outlined"
        onClick={handleOpenDatePicker}
      >
        בחר תאריכים
      </Button>

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
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: '12px'
          }
        }}
      >
        <Box>
          <DateRange
            onChange={handleDateRangeChange}
            moveRangeOnFirstSelection={false}
            months={1}
            ranges={tempDateRange}
            direction="horizontal"
            locale={he}
            weekdayDisplayFormat="EEEEE"
            rangeColors={[locationColors.main]}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button 
              onClick={handleCloseDatePicker} 
              sx={{ 
                mr: 1,
                color: colors.text.secondary,
                textTransform: 'none'
              }}
            >
              ביטול
            </Button>
            <Button 
              onClick={handleApplyDateRange} 
              variant="contained"
              sx={{
                bgcolor: locationColors.main,
                '&:hover': { 
                  bgcolor: locationColors.main, 
                  filter: 'brightness(0.9)' 
                },
                textTransform: 'none',
                boxShadow: 'none',
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
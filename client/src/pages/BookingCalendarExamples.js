import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Grid,
  Button,
  styled,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarToday as CalendarTodayIcon,
  Book as BookIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  AddCircle as AddCircleIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  Flight as FlightIcon,
  Home as HomeIcon
} from '@mui/icons-material';

// רכיב מותאם אישית לתא הזמנה
const BookingCell = styled(Box)(({ theme, status, isSelected }) => ({
  padding: '8px',
  minHeight: '60px',
  borderRadius: '4px',
  cursor: 'pointer',
  position: 'relative',
  transition: 'all 0.15s ease-in-out',
  fontSize: '0.85rem',
  fontWeight: 500,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  ...(isSelected && {
    boxShadow: '0 0 0 2px var(--primary-color)',
  }),
}));

// רכיב מותאם אישית לתא בלוח משבצות
const GridCell = styled(Box)(({ theme, isBooked, status, isToday }) => ({
  height: '60px',
  border: '1px solid #eaeaea',
  borderRadius: isBooked ? '4px' : '0',
  position: 'relative',
  margin: '2px',
  padding: isBooked ? '4px 8px' : '0',
  cursor: isBooked ? 'pointer' : 'default',
  transition: 'all 0.15s ease-in-out',
  backgroundColor: isToday ? 'rgba(0, 113, 227, 0.05)' : 'transparent',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  ...(isBooked && {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    }
  })
}));

// סגנון עיצוב לתאי לוח שנה
const CalendarCell = styled(Box)(({ theme, isOccupied, status }) => ({
  width: '100%',
  height: '60px',
  border: '1px solid #eaeaea',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.15s ease',
  cursor: isOccupied ? 'pointer' : 'default',
  ...(isOccupied && {
    '&:hover': {
      boxShadow: 'inset 0 0 0 1px var(--primary-color)',
    }
  })
}));

// רכיב מותאם לתא הזמנה בסגנון גאנט
const GanttBar = styled(Box)(({ theme, status, startOffset, length, variant }) => ({
  position: 'absolute',
  height: variant === 'full' ? '100%' : '70%',
  left: `${startOffset}%`,
  width: `${length}%`,
  borderRadius: '4px',
  transition: 'all 0.15s ease-in-out',
  padding: '4px 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  cursor: 'pointer',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  zIndex: 2,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 3px 5px rgba(0,0,0,0.15)',
  }
}));

const BookingCalendarExamples = () => {
  // קביעת סגנון הדוגמאות
  const [calendarStyle, setCalendarStyle] = useState(0);
  const [location, setLocation] = useState('airport');
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  // הגדרת סגנון עיצוב
  const style = {
    name: "קלאסי ונקי - עסקי",
    colors: {
      airport: {
        main: '#0071e3',
        bgLight: 'rgba(0, 113, 227, 0.08)'
      },
      rothschild: {
        main: '#4570e5',
        bgLight: 'rgba(69, 112, 229, 0.08)'
      },
      accent: {
        green: '#06a271',
        red: '#e34a6f',
        orange: '#f7971e',
      }
    },
    card: {
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      p: 2.5,
    },
    button: {
      borderRadius: '4px',
      textTransform: 'none',
    },
    table: {
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    dialog: {
      borderRadius: '8px',
    }
  };

  // הגדרת סגנון קלט עברית
  const hebrewInputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: style.button.borderRadius,
      paddingRight: '14px',
    },
    '& .MuiInputLabel-root': {
      right: 18,
      left: 'auto',
      transformOrigin: 'top right'
    },
    '& .MuiInputLabel-shrink': {
      transform: 'translate(16px, -9px) scale(0.75)',
      transformOrigin: 'top right'
    },
    '& .MuiOutlinedInput-notchedOutline': {
      textAlign: 'right',
      paddingRight: 12
    },
    '& .MuiInputBase-input': {
      textAlign: 'right',
      paddingRight: '20px',
    },
    '& .MuiSelect-select': {
      paddingRight: '20px'
    },
    '& .MuiFormLabel-filled': {
      right: 18,
    }
  };

  const locationColors = style.colors[location];

  // שינוי סגנון הלוח
  const handleCalendarStyleChange = (event, newValue) => {
    setCalendarStyle(newValue);
  };

  // שינוי מיקום
  const handleLocationChange = (event, newValue) => {
    setLocation(newValue);
  };

  // פתיחת דיאלוג הזמנה חדשה
  const handleCellClick = (room, date) => {
    setSelectedCell({ roomId: room.id, date });
    setOpenBookingDialog(true);
  };

  // סגירת דיאלוג
  const handleCloseDialog = () => {
    setOpenBookingDialog(false);
    setSelectedCell(null);
  };

  // נתוני דוגמה לחדרים
  const rooms = [
    { id: 1 },
    { id: 4 },
    { id: 6 },
    { id: 13 },
    { id: 17 },
    { id: 21 },
  ];

  // נתוני דוגמה להזמנות
  const bookings = [
    { id: 1, roomId: 1, guestName: "ליאת (שמחה)", checkIn: "21/04", checkOut: "28/04", status: "confirmed", nights: 7 },
    { id: 2, roomId: 4, guestName: "משה דוד", checkIn: "23/04", checkOut: "24/04", status: "confirmed", nights: 1 },
    { id: 3, roomId: 4, guestName: "Hezi schwartz", checkIn: "22/04", checkOut: "23/04", status: "confirmed", nights: 1 },
    { id: 4, roomId: 21, guestName: "aviv shkolnik", checkIn: "21/04", checkOut: "22/04", status: "confirmed", nights: 1 },
  ];

  // נתוני דוגמה לתאריכים
  const dates = [
    { day: "יום ראשון", date: "21/04" },
    { day: "יום שני", date: "22/04" },
    { day: "יום שלישי", date: "23/04", isToday: true },
    { day: "יום רביעי", date: "24/04" },
    { day: "יום חמישי", date: "25/04" },
    { day: "יום שישי", date: "26/04", isFriday: true },
    { day: "יום שבת", date: "27/04" },
    { day: "יום ראשון", date: "28/04" }
  ];

  // סטטוס צבעים להזמנות
  const bookingStatusColors = {
    confirmed: {
      bgColor: `rgba(${style.colors.accent.green.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
      borderColor: style.colors.accent.green,
      textColor: style.colors.accent.green,
      icon: <CheckCircleIcon fontSize="small" sx={{ color: style.colors.accent.green }} />
    },
    pending: {
      bgColor: `rgba(${style.colors.accent.orange.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
      borderColor: style.colors.accent.orange,
      textColor: style.colors.accent.orange,
      icon: <PendingIcon fontSize="small" sx={{ color: style.colors.accent.orange }} />
    },
    cancelled: {
      bgColor: `rgba(${style.colors.accent.red.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
      borderColor: style.colors.accent.red,
      textColor: style.colors.accent.red,
      icon: <CancelIcon fontSize="small" sx={{ color: style.colors.accent.red }} />
    }
  };

  // מציג טקסט סטטוס הזמנה
  const bookingStatusText = {
    confirmed: 'מאושר',
    pending: 'בהמתנה',
    cancelled: 'בוטל'
  };

  // רנדור גאנט סגנון 1 - קלאסי עם הדגשת היום
  const renderGanttStyleOne = () => {
    // המרת התאריכים לערכים מספריים לחישוב רוחב תצוגת גאנט
    const dateToIndex = {};
    dates.forEach((date, index) => {
      dateToIndex[date.date] = index;
    });
    
    return (
      <Box sx={{ overflowX: 'auto' }}>
        <Paper
          sx={{
            ...style.card,
            p: 0,
            overflow: 'hidden',
            width: '100%',
            minWidth: '1000px'
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              bgcolor: '#f8f8f8',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              position: 'sticky',
              top: 0,
              zIndex: 2
            }}
          >
            {/* עמודת חדרים */}
            <Box sx={{ 
              minWidth: '100px', 
              p: 2,
              borderLeft: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                textAlign: 'center'
              }}>
                חדר
              </Typography>
            </Box>

            {/* עמודות תאריכים */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex'
            }}>
              {dates.map((date, index) => (
                <Box 
                  key={`date-${index}`} 
                  sx={{ 
                    flex: 1,
                    p: 1,
                    textAlign: 'center',
                    borderLeft: index < dates.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    ...(date.isToday && { 
                      bgcolor: 'rgba(0, 113, 227, 0.05)',
                      borderTop: '2px solid var(--primary-color)'
                    }),
                    ...(date.isFriday && { 
                      bgcolor: 'rgba(0, 0, 0, 0.02)' 
                    }),
                  }}
                >
                  <Typography sx={{ 
                    fontWeight: 500, 
                    color: 'text.secondary',
                    fontSize: '0.8rem'
                  }}>
                    {date.day}
                  </Typography>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    color: date.isToday ? locationColors.main : 'text.primary',
                    fontSize: '0.9rem'
                  }}>
                    {date.date}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* שורות לוח הזמנים */}
          {rooms.map((room) => (
            <Box 
              key={`room-${room.id}`}
              sx={{ 
                display: 'flex',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.01)',
                }
              }}
            >
              {/* תא חדר */}
              <Box sx={{ 
                minWidth: '100px', 
                p: 2,
                borderLeft: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography sx={{ 
                  fontWeight: 700, 
                  fontSize: '1.1rem'
                }}>
                  {room.id}
                </Typography>
              </Box>

              {/* אזור הזמנות גאנט */}
              <Box sx={{ 
                flex: 1,
                position: 'relative',
                display: 'flex',
                height: '70px',
              }}>
                {/* תאי רקע לכל יום */}
                {dates.map((date, dateIndex) => (
                  <Box 
                    key={`bg-${room.id}-${dateIndex}`}
                    onClick={() => handleCellClick(room, date)}
                    sx={{ 
                      flex: 1,
                      borderLeft: dateIndex < dates.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer',
                      ...(date.isToday && { 
                        bgcolor: 'rgba(0, 113, 227, 0.03)',
                      }),
                      ...(date.isFriday && { 
                        bgcolor: 'rgba(247, 151, 30, 0.03)' 
                      }),
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.04)',
                      }
                    }}
                  />
                ))}
                
                {/* רנדור הזמנות כסרגלי גאנט */}
                {bookings
                  .filter(booking => booking.roomId === room.id)
                  .map(booking => {
                    const startIdx = dateToIndex[booking.checkIn];
                    const endIdx = dateToIndex[booking.checkOut] || dates.length;
                    const duration = endIdx - startIdx;
                    
                    // חישוב הרוחב והמיקום באחוזים
                    const startOffset = (startIdx / dates.length) * 100;
                    const length = (duration / dates.length) * 100;
                    
                    return (
                      <GanttBar
                        key={`booking-${booking.id}`}
                        status={booking.status}
                        startOffset={startOffset}
                        length={length}
                        variant="full"
                        sx={{
                          bgcolor: bookingStatusColors[booking.status].bgColor,
                          border: `1px solid ${bookingStatusColors[booking.status].borderColor}`,
                          color: bookingStatusColors[booking.status].textColor,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Typography 
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {booking.guestName}
                        </Typography>
                      </GanttBar>
                    );
                  })
                }
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* מעבר בין מיקומים - אייקונים קטנים */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Tooltip title="Airport Guest House">
          <IconButton
            onClick={() => setLocation('airport')}
            sx={{ 
              color: location === 'airport' ? style.colors.airport.main : 'text.secondary',
              bgcolor: location === 'airport' ? style.colors.airport.bgLight : 'transparent',
              mr: 1,
              border: location === 'airport' ? `2px solid ${style.colors.airport.main}` : 'none',
              '&:hover': { bgcolor: style.colors.airport.bgLight }
            }}
          >
            <FlightIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="רוטשילד">
          <IconButton
            onClick={() => setLocation('rothschild')}
            sx={{ 
              color: location === 'rothschild' ? style.colors.rothschild.main : 'text.secondary',
              bgcolor: location === 'rothschild' ? style.colors.rothschild.bgLight : 'transparent',
              border: location === 'rothschild' ? `2px solid ${style.colors.rothschild.main}` : 'none',
              '&:hover': { bgcolor: style.colors.rothschild.bgLight }
            }}
          >
            <HomeIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* שורת פעולות עליונה */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              ...style.card
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                size="small" 
                sx={{ 
                  color: locationColors.main,
                  '&:hover': { bgcolor: locationColors.bgLight }
                }}
              >
                <ChevronRightIcon />
              </IconButton>

              <Typography variant="subtitle1" sx={{ fontWeight: 500, mx: 2 }}>
                28/04/2023 - 21/05/2023
              </Typography>
              
              <IconButton 
                size="small" 
                sx={{ 
                  color: locationColors.main,
                  '&:hover': { bgcolor: locationColors.bgLight }
                }}
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
                ...style.button
              }}
              variant="outlined"
            >
              בחר תאריכים
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...style.card
            }}
          >
            <Tabs 
              value={calendarStyle} 
              onChange={handleCalendarStyleChange}
              variant="fullWidth"
              TabIndicatorProps={{
                style: {
                  backgroundColor: locationColors.main,
                  height: '3px',
                }
              }}
              sx={{ 
                width: '100%',
                '& .MuiTab-root': {
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  minHeight: '36px',
                  color: 'text.secondary',
                },
                '& .Mui-selected': {
                  color: locationColors.main,
                }
              }}
            >
              <Tab label="סגנון 1" />
            </Tabs>
          </Paper>
        </Grid>
      </Grid>

      {/* תצוגת לוח שנה לפי הסגנון הנבחר */}
      {renderGanttStyleOne()}
      
      {/* דיאלוג הזמנה חדשה */}
      <Dialog
        open={openBookingDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: style.dialog.borderRadius,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            bgcolor: locationColors.bgLight, 
            color: locationColors.main,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${locationColors.main}`,
            py: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarTodayIcon sx={{ marginRight: '10px' }} />
            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              הזמנה חדשה {selectedCell ? `- חדר ${selectedCell.roomId}` : ''}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} size="small" sx={{ color: style.colors.accent.red }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3, px: 2, mt: 1 }}>
          <Grid container spacing={2}>
            {/* פרטי אורח */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: locationColors.main }}>
                פרטי אורח
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="שם האורח"
                placeholder="הקלד שם מלא..."
                fullWidth
                size="small"
                inputProps={{
                  style: { 
                    textAlign: 'center',
                    paddingRight: '24px',
                    paddingLeft: '24px',
                    direction: 'rtl',
                  }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                  },
                  '& .MuiInputLabel-root': {
                    right: 18,
                    left: 'auto',
                    transformOrigin: 'top right'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    textAlign: 'right',
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(0, -9px) scale(0.75)',
                    transformOrigin: 'top right'
                  },
                  '& input::placeholder': {
                    textAlign: 'center',
                    direction: 'rtl',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="טלפון"
                fullWidth
                size="small"
                inputProps={{
                  style: { 
                    textAlign: 'center',
                    paddingRight: '24px',
                    paddingLeft: '24px',
                    direction: 'rtl',
                  }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                  },
                  '& .MuiInputLabel-root': {
                    right: 18,
                    left: 'auto',
                    transformOrigin: 'top right'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    textAlign: 'right',
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(0, -9px) scale(0.75)',
                    transformOrigin: 'top right'
                  },
                  '& input::placeholder': {
                    textAlign: 'center',
                    direction: 'rtl',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="אימייל"
                placeholder="הקלד כתובת אימייל..."
                fullWidth
                size="small"
                inputProps={{
                  style: { 
                    textAlign: 'center',
                    paddingRight: '24px',
                    paddingLeft: '24px',
                    direction: 'rtl',
                  }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                  },
                  '& .MuiInputLabel-root': {
                    right: 18,
                    left: 'auto',
                    transformOrigin: 'top right'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    textAlign: 'right',
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(0, -9px) scale(0.75)',
                    transformOrigin: 'top right'
                  },
                  '& input::placeholder': {
                    textAlign: 'center',
                    direction: 'rtl',
                  }
                }}
              />
            </Grid>
            
            {/* פרטי הזמנה */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: locationColors.main }}>
                פרטי הזמנה
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="תאריך כניסה"
                type="date"
                fullWidth
                size="small"
                defaultValue={selectedCell?.date.date || "2023-05-03"}
                inputProps={{
                  style: { 
                    textAlign: 'center',
                    paddingRight: '24px',
                    paddingLeft: '24px',
                    direction: 'rtl',
                  }
                }}
                InputLabelProps={{ 
                  shrink: true 
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                  },
                  '& .MuiInputLabel-root': {
                    right: 18,
                    left: 'auto',
                    transformOrigin: 'top right'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    textAlign: 'right',
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(0, -9px) scale(0.75)',
                    transformOrigin: 'top right'
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="תאריך יציאה"
                type="date"
                fullWidth
                size="small"
                defaultValue="2023-05-05"
                inputProps={{
                  style: { 
                    textAlign: 'center',
                    paddingRight: '24px',
                    paddingLeft: '24px',
                    direction: 'rtl',
                  }
                }}
                InputLabelProps={{ 
                  shrink: true 
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                  },
                  '& .MuiInputLabel-root': {
                    right: 18,
                    left: 'auto',
                    transformOrigin: 'top right'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    textAlign: 'right',
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(0, -9px) scale(0.75)',
                    transformOrigin: 'top right'
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" sx={{
                ...hebrewInputStyle,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                }
              }}>
                <InputLabel>סטטוס</InputLabel>
                <Select
                  label="סטטוס"
                  defaultValue="confirmed"
                >
                  <MenuItem value="confirmed">מאושר</MenuItem>
                  <MenuItem value="pending">בהמתנה</MenuItem>
                  <MenuItem value="cancelled">בוטל</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="מחיר"
                type="number"
                fullWidth
                size="small"
                defaultValue="500"
                inputProps={{
                  style: { 
                    textAlign: 'center',
                    paddingRight: '24px',
                    paddingLeft: '24px',
                    direction: 'rtl',
                  }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                  },
                  '& .MuiInputLabel-root': {
                    right: 18,
                    left: 'auto',
                    transformOrigin: 'top right'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    textAlign: 'right',
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(0, -9px) scale(0.75)',
                    transformOrigin: 'top right'
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={handleCloseDialog}
            variant="text"
            sx={{ 
              color: 'text.secondary',
              ...style.button
            }}
          >
            ביטול
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCloseDialog}
            sx={{ 
              bgcolor: style.colors.accent.green, 
              '&:hover': { bgcolor: style.colors.accent.green, filter: 'brightness(90%)' },
              ...style.button
            }}
          >
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingCalendarExamples; 
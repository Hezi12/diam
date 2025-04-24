import React, { useState } from 'react';
import { 
  Box, 
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Divider,
  Radio,
  RadioGroup,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarToday as CalendarTodayIcon,
  Flight as FlightIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Book as BookIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Search as SearchIcon,
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Hotel as HotelIcon,
  WhatsApp as WhatsAppIcon,
  Receipt as ReceiptIcon,
  Share as ShareIcon,
  Print as PrintIcon
} from '@mui/icons-material';

const DesignExamples = () => {
  // סטייט לבחירת סגנון עיצוב
  const [selectedStyle, setSelectedStyle] = useState(0);
  
  // סטייט לדיאלוגים
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogStyle, setDialogStyle] = useState(0);
  
  // סטייט לטאבים לפי מיקום
  const [location, setLocation] = useState('airport');
  
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
  
  // בחירת צבעים לפי מיקום
  const locationColors = style.colors[location];
  
  // פתיחה וסגירה של דיאלוג
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // שינוי מיקום
  const handleLocationChange = (event, newValue) => {
    setLocation(newValue);
  };
  
  // דוגמאות לנתונים בטבלה
  const bookings = [
    { id: 1, guestName: 'ישראל ישראלי', room: '101', checkIn: '2023-05-01', checkOut: '2023-05-03', status: 'confirmed' },
    { id: 2, guestName: 'חיים כהן', room: '102', checkIn: '2023-05-02', checkOut: '2023-05-04', status: 'pending' },
    { id: 3, guestName: 'מיכל לוי', room: '103', checkIn: '2023-05-03', checkOut: '2023-05-07', status: 'cancelled' },
    { id: 4, guestName: 'דוד אברהם', room: '201', checkIn: '2023-05-04', checkOut: '2023-05-05', status: 'completed' },
  ];
  
  // סטטוס צבעים להזמנות
  const bookingStatusColors = {
    confirmed: {
      bgColor: `rgba(${style.colors.accent.green.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
      borderColor: `rgba(${style.colors.accent.green.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`,
      textColor: style.colors.accent.green,
      icon: <CheckCircleIcon fontSize="small" sx={{ color: style.colors.accent.green }} />
    },
    pending: {
      bgColor: `rgba(${style.colors.accent.orange.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
      borderColor: `rgba(${style.colors.accent.orange.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`,
      textColor: style.colors.accent.orange,
      icon: <PendingIcon fontSize="small" sx={{ color: style.colors.accent.orange }} />
    },
    cancelled: {
      bgColor: `rgba(${style.colors.accent.red.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
      borderColor: `rgba(${style.colors.accent.red.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`,
      textColor: style.colors.accent.red,
      icon: <CancelIcon fontSize="small" sx={{ color: style.colors.accent.red }} />
    },
    completed: {
      bgColor: `rgba(${locationColors.main.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
      borderColor: `rgba(${locationColors.main.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`,
      textColor: locationColors.main,
      icon: <CheckCircleIcon fontSize="small" sx={{ color: locationColors.main }} />
    }
  };
  
  // מציג סטטוס הזמנה טקסטואלי
  const bookingStatusText = {
    confirmed: 'מאושר',
    pending: 'בהמתנה',
    cancelled: 'בוטל',
    completed: 'הושלם'
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
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 500 }}>
        דוגמאות סגנון עיצוב
      </Typography>
      
      {/* כותרת סגנון נבחר */}
      <Paper sx={{ ...style.card, mb: 4, p: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 500 }}>
          סגנון: {style.name}
        </Typography>
        
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ width: 60, height: 60, bgcolor: style.colors.airport.main, borderRadius: '50%' }} />
                <Typography variant="caption">Airport</Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ width: 60, height: 60, bgcolor: style.colors.rothschild.main, borderRadius: '50%' }} />
                <Typography variant="caption">Rothschild</Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ width: 60, height: 60, bgcolor: style.colors.accent.green, borderRadius: '50%' }} />
                <Typography variant="caption">אישור</Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ width: 60, height: 60, bgcolor: style.colors.accent.red, borderRadius: '50%' }} />
                <Typography variant="caption">ביטול</Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ width: 60, height: 60, bgcolor: style.colors.accent.orange, borderRadius: '50%' }} />
                <Typography variant="caption">המתנה</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Divider sx={{ my: 4 }} />
      
      {/* מעבר בין מיקומים */}
      <Tabs 
        value={location} 
        onChange={handleLocationChange}
        variant="fullWidth"
        TabIndicatorProps={{
          style: {
            backgroundColor: locationColors.main,
            height: '3px',
          }
        }}
        sx={{ 
          mb: 4, 
          '& .MuiTab-root': {
            fontWeight: 500,
            fontSize: '1rem',
            textTransform: 'none',
            minHeight: '48px',
            color: 'text.secondary',
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          '& .Mui-selected': {
            color: locationColors.main,
          }
        }}
      >
        <Tab 
          icon={<FlightIcon fontSize="small" sx={{ marginLeft: '8px' }} />} 
          iconPosition="start" 
          label="Airport Guest House" 
          value="airport" 
        />
        <Tab 
          icon={<HomeIcon fontSize="small" sx={{ marginLeft: '8px' }} />} 
          iconPosition="start" 
          label="רוטשילד" 
          value="rothschild" 
        />
      </Tabs>
      
      {/* כותרת דף */}
      <Box sx={{ 
        mb: 4,
        pt: 2,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Box 
          sx={{ 
            mr: 3.5, 
            bgcolor: locationColors.bgLight, 
            p: 1.5, 
            borderRadius: style.card.borderRadius.replace('px', '') / 1.2 + 'px',
            display: 'flex'
          }}
        >
          <BookIcon sx={{ color: locationColors.main, fontSize: 28 }} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 500, color: 'text.primary' }}>
          ניהול הזמנות
        </Typography>
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
              justifyContent: 'space-between',
              ...style.card
            }}
          >
            <TextField
              placeholder="חיפוש הזמנות..."
              size="small"
              inputProps={{
                style: { 
                  textAlign: 'center',
                  paddingRight: '24px',
                  paddingLeft: '24px',
                  direction: 'rtl',
                }
              }}
              sx={{ 
                flex: 1,
                maxWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: style.button.borderRadius,
                },
                '& input::placeholder': {
                  textAlign: 'center',
                  direction: 'rtl',
                }
              }}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ marginRight: '8px' }} />,
              }}
            />
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon sx={{ marginLeft: '8px', marginRight: '0px' }} />}
              onClick={handleOpenDialog}
              sx={{ 
                bgcolor: style.colors.accent.green, 
                '&:hover': { bgcolor: style.colors.accent.green, filter: 'brightness(90%)' },
                ...style.button
              }}
            >
              הזמנה חדשה
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* טבלת הזמנות */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ ...style.table, overflow: 'hidden' }}>
            <TableContainer component="div">
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    '& th': { 
                      fontWeight: 600, 
                      bgcolor: locationColors.bgLight,
                      color: locationColors.main,
                      borderBottom: `2px solid ${locationColors.main}`,
                    } 
                  }}>
                    <TableCell align="right">מס׳</TableCell>
                    <TableCell align="right">שם אורח</TableCell>
                    <TableCell align="right">חדר</TableCell>
                    <TableCell align="right">כניסה</TableCell>
                    <TableCell align="right">יציאה</TableCell>
                    <TableCell align="right">סטטוס</TableCell>
                    <TableCell align="right">פעולות</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => {
                    const statusColors = bookingStatusColors[booking.status];
                    
                    return (
                      <TableRow key={booking.id} hover>
                        <TableCell align="right">{booking.id}</TableCell>
                        <TableCell align="right">{booking.guestName}</TableCell>
                        <TableCell align="right">{booking.room}</TableCell>
                        <TableCell align="right">{booking.checkIn}</TableCell>
                        <TableCell align="right">{booking.checkOut}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={bookingStatusText[booking.status]}
                            icon={statusColors.icon}
                            size="small"
                            sx={{ 
                              bgcolor: statusColors.bgColor,
                              color: statusColors.textColor,
                              borderColor: statusColors.borderColor,
                              fontWeight: 500,
                              border: '1px solid',
                              '& .MuiChip-icon': {
                                marginLeft: '4px',
                                marginRight: '-4px'
                              },
                              '& .MuiChip-label': {
                                paddingRight: '8px'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: locationColors.main,
                              '&:hover': { bgcolor: locationColors.bgLight },
                              marginLeft: '8px'
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: style.colors.accent.red,
                              '&:hover': { bgcolor: `rgba(${style.colors.accent.red.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)` },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      
      {/* דוגמאות אריחים */}
      <Typography variant="h5" sx={{ mt: 6, mb: 3, textAlign: 'right' }}>
        דוגמאות אריחים (Cards)
      </Typography>
      
      <Grid container spacing={3}>
        {[1, 2, 3].map((card) => (
          <Grid item xs={12} md={4} key={card}>
            <Paper sx={style.card}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Typography variant="h6">כותרת אריח {card}</Typography>
                <Chip
                  label="סטטוס"
                  size="small"
                  sx={{ 
                    bgcolor: locationColors.bgLight,
                    color: locationColors.main,
                    fontWeight: 500
                  }}
                />
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" color="text.secondary" paragraph>
                זהו אריח לדוגמה שמציג את הסגנון העיצובי. הטקסט בעברית מוצג מימין לשמאל בהתאם לכיוון השפה.
              </Typography>
              
              <Button
                size="small"
                variant="outlined"
                sx={{ 
                  color: locationColors.main,
                  borderColor: locationColors.main,
                  '&:hover': { bgcolor: locationColors.bgLight },
                  ...style.button
                }}
              >
                לחץ כאן
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* דוגמאות כפתורים */}
      <Typography variant="h5" sx={{ mt: 6, mb: 3, textAlign: 'right' }}>
        דוגמאות כפתורים
      </Typography>
      
      <Paper sx={{ ...style.card, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="contained" 
              sx={{ 
                bgcolor: locationColors.main, 
                '&:hover': { bgcolor: locationColors.main, filter: 'brightness(90%)' },
                ...style.button
              }}
            >
              כפתור ראשי
            </Button>
          </Grid>
          
          <Grid item>
            <Button 
              variant="contained" 
              startIcon={<AddIcon sx={{ marginLeft: '8px', marginRight: '0px' }} />}
              sx={{ 
                bgcolor: style.colors.accent.green, 
                '&:hover': { bgcolor: style.colors.accent.green, filter: 'brightness(90%)' },
                ...style.button
              }}
            >
              הוסף חדש
            </Button>
          </Grid>
          
          <Grid item>
            <Button 
              variant="outlined"
              sx={{ 
                color: locationColors.main,
                borderColor: locationColors.main,
                '&:hover': { bgcolor: locationColors.bgLight },
                ...style.button
              }}
            >
              כפתור משני
            </Button>
          </Grid>
          
          <Grid item>
            <Button 
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon sx={{ marginLeft: '8px', marginRight: '0px' }} />}
              sx={{ 
                ...style.button
              }}
            >
              מחק
            </Button>
          </Grid>
          
          <Grid item>
            <IconButton 
              sx={{ 
                color: locationColors.main,
                '&:hover': { bgcolor: locationColors.bgLight },
              }}
            >
              <EditIcon />
            </IconButton>
          </Grid>
          
          <Grid item>
            <IconButton 
              sx={{ 
                color: style.colors.accent.red,
                '&:hover': { bgcolor: `rgba(${style.colors.accent.red.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)` },
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>
      
      {/* דוגמאות שדות קלט */}
      <Typography variant="h5" sx={{ mt: 6, mb: 3, textAlign: 'right' }}>
        דוגמאות שדות קלט
      </Typography>
      
      <Paper sx={{ ...style.card, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="שם האורח"
              placeholder="הקלד שם מלא..."
              fullWidth
              inputProps={{
                style: { 
                  textAlign: 'center',
                  paddingRight: '24px',
                  paddingLeft: '24px',
                  direction: 'rtl',
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: style.button.borderRadius,
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
              placeholder="הקלד מספר טלפון..."
              fullWidth
              inputProps={{
                style: { 
                  textAlign: 'center',
                  paddingRight: '24px',
                  paddingLeft: '24px',
                  direction: 'rtl',
                }
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" sx={{ marginLeft: '8px' }} /></InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: style.button.borderRadius,
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
              inputProps={{
                style: { 
                  textAlign: 'center',
                  paddingRight: '24px',
                  paddingLeft: '24px',
                  direction: 'rtl',
                }
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" sx={{ marginLeft: '8px' }} /></InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: style.button.borderRadius,
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
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" sx={{
              ...hebrewInputStyle,
              '& .MuiSelect-select': {
                paddingRight: '20px'
              },
              '& .MuiInputLabel-outlined': {
                backgroundColor: '#fff',
                paddingRight: '6px',
                paddingLeft: '6px',
                right: '12px',
                marginRight: '12px',
                zIndex: 1
              },
              '& .MuiInputLabel-outlined.MuiInputLabel-shrink': {
                transform: 'translate(16px, -9px) scale(0.75)',
                backgroundColor: '#fff',
                paddingRight: '6px',
                paddingLeft: '6px',
                right: '22px'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                textAlign: 'right',
                paddingRight: '24px',
                legend: {
                  marginRight: '12px'
                }
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                  borderWidth: '1px'
                }
              }
            }}>
              <InputLabel>בחר אפשרות</InputLabel>
              <Select 
                label="בחר אפשרות" 
                defaultValue="1"
                MenuProps={{
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'right'
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'right'
                  }
                }}
              >
                <MenuItem value="1">אפשרות ראשונה</MenuItem>
                <MenuItem value="2">אפשרות שנייה</MenuItem>
                <MenuItem value="3">אפשרות שלישית</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch 
                  checked={true}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: locationColors.main,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: locationColors.main,
                    },
                  }}
                />
              }
              label="הגדרה כלשהי"
              labelPlacement="start"
              sx={{ justifyContent: 'flex-end', width: '100%', margin: 0 }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* דיאלוג לדוגמה */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
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
            <AddIcon sx={{ marginRight: '10px' }} />
            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              הזמנה חדשה
            </Typography>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="שלח בוואטסאפ">
              <IconButton size="small" sx={{ marginLeft: '8px', color: style.colors.accent.green }}>
                <WhatsAppIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="הנפק חשבונית">
              <IconButton size="small" sx={{ marginLeft: '8px', color: locationColors.main }}>
                <ReceiptIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="שתף">
              <IconButton size="small" sx={{ marginLeft: '8px', color: locationColors.main }}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="הדפס">
              <IconButton size="small" sx={{ marginLeft: '16px', color: locationColors.main }}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={handleCloseDialog} size="small" sx={{ marginRight: 0, color: style.colors.accent.red }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Grid container spacing={3}>
            {/* חלק 1: פרטי אורח */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${locationColors.main}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ color: locationColors.main, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי אורח
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="שם האורח"
                      placeholder="הקלד שם מלא..."
                      fullWidth
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
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
                      placeholder="הקלד מספר טלפון..."
                      fullWidth
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" sx={{ marginLeft: '8px' }} /></InputAdornment>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
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
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" sx={{ marginLeft: '8px' }} /></InputAdornment>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
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
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 2: פרטי תשלום */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${locationColors.main}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CreditCardIcon sx={{ color: locationColors.main, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי תשלום
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth sx={hebrewInputStyle}>
                      <InputLabel>סטטוס תשלום</InputLabel>
                      <Select label="סטטוס תשלום" defaultValue="unpaid">
                        <MenuItem value="unpaid">לא שולם</MenuItem>
                        <MenuItem value="cash">מזומן</MenuItem>
                        <MenuItem value="credit">אשראי</MenuItem>
                        <MenuItem value="transfer">העברה בנקאית</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="סכום לתשלום"
                      placeholder="הכנס סכום..."
                      fullWidth
                      type="number"
                      defaultValue="100"
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
                          borderRadius: style.button.borderRadius,
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
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 3: פרטי הזמנה */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${locationColors.main}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HotelIcon sx={{ color: locationColors.main, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי הזמנה
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth sx={hebrewInputStyle}>
                      <InputLabel>חדר</InputLabel>
                      <Select label="חדר">
                        <MenuItem value="101">חדר 101 (סטנדרט)</MenuItem>
                        <MenuItem value="102">חדר 102 (סטנדרט)</MenuItem>
                        <MenuItem value="201">חדר 201 (סוויטה)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="תאריך כניסה"
                      fullWidth
                      type="date"
                      defaultValue="2023-05-01"
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
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
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="תאריך יציאה"
                      fullWidth
                      type="date"
                      defaultValue="2023-05-03"
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
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
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="מספר לילות"
                      fullWidth
                      type="number"
                      defaultValue="2"
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
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
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="מחיר ללילה"
                      placeholder="הכנס מחיר..."
                      fullWidth
                      type="number"
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
                          borderRadius: style.button.borderRadius,
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
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="מחיר כולל"
                      placeholder="הכנס מחיר..."
                      fullWidth
                      type="number"
                      defaultValue="1000"
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
                          borderRadius: style.button.borderRadius,
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
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={true}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: locationColors.main,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: locationColors.main,
                            },
                          }}
                        />
                      }
                      label="תייר (ללא מע״מ)"
                      labelPlacement="start"
                      sx={{ justifyContent: 'flex-end', width: '100%', margin: 0 }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 4: הערות */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${style.colors.accent.orange}`
              }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                  הערות
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="הקלד הערות נוספות..."
                  inputProps={{
                    style: { 
                      textAlign: 'center',
                      paddingRight: '24px',
                      paddingLeft: '24px',
                      direction: 'rtl',
                    }
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: style.button.borderRadius,
                    },
                    '& .MuiInputBase-input': {
                      textAlign: 'right'
                    },
                    '& textarea::placeholder': {
                      textAlign: 'center',
                      direction: 'rtl',
                    }
                  }}
                />
              </Paper>
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

export default DesignExamples; 
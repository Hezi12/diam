import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container,
  Paper, 
  Button, 
  Chip,
  IconButton,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Checkbox,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ReplayIcon from '@mui/icons-material/Replay';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlightIcon from '@mui/icons-material/Flight';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { he } from 'date-fns/locale';
import cleaningService from '../../services/cleaningService';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';

/**
 * דף ניקיון - עבור צוות הניקיון
 * מציג את החדרים שצריך לנקות היום ובימים הקרובים (עד 4 ימים)
 */
const Cleaning = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [currentDateIndex, setCurrentDateIndex] = useState(0); // 0 = היום, 1 = מחר, וכן הלאה
  const [cleaningTasks, setCleaningTasks] = useState({
    0: [], // היום
    1: [], // מחר
    2: [], // מחרתיים
    3: [] // עוד 3 ימים
  });
  
  // פונקציה לטעינת משימות הניקיון
  const fetchCleaningTasks = async () => {
    setLoading(true);
    try {
      // לוקחים 4 ימים של משימות ניקיון
      const today = new Date();
      
      // רשימת תאריכים לבדיקה
      const dates = [
        format(today, 'yyyy-MM-dd'),
        format(addDays(today, 1), 'yyyy-MM-dd'),
        format(addDays(today, 2), 'yyyy-MM-dd'),
        format(addDays(today, 3), 'yyyy-MM-dd')
      ];
      
      // שימוש בשירות הניקיון
      const tasks = await cleaningService.getCleaningTasks(dates);
      setCleaningTasks(tasks);
    } catch (error) {
      console.error('שגיאה בטעינת משימות ניקיון:', error);
      // אם יש שגיאה, נשתמש בדאטה לדוגמה למטרות פיתוח
      setCleaningTasks({
        0: generateMockData(0), // היום
        1: generateMockData(1), // מחר
        2: generateMockData(2), // מחרתיים
        3: generateMockData(3)  // עוד 3 ימים
      });
      enqueueSnackbar('לא ניתן לטעון את משימות הניקיון', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה ליצירת דאטה לדוגמה (רק לפיתוח)
  const generateMockData = (dayOffset) => {
    const date = addDays(new Date(), dayOffset);
    return [
      {
        _id: `task1-${dayOffset}`,
        roomNumber: '101',
        location: 'airport',
        status: 'dirty',
        checkOutDate: date
      },
      {
        _id: `task2-${dayOffset}`,
        roomNumber: '102',
        location: 'airport',
        status: 'dirty',
        checkOutDate: date
      },
      {
        _id: `task3-${dayOffset}`,
        roomNumber: '201',
        location: 'rothschild',
        status: 'dirty',
        checkOutDate: date
      },
      {
        _id: `task4-${dayOffset}`,
        roomNumber: '202',
        location: 'rothschild',
        status: 'dirty',
        checkOutDate: date
      }
    ];
  };
  
  // פונקציה לסימון חדר כנקי
  const markRoomAsClean = async (taskId) => {
    setLoading(true);
    try {
      await cleaningService.markRoomAsClean(taskId);
      
      // עדכון המצב המקומי
      setCleaningTasks(prevTasks => {
        const updatedTasks = {...prevTasks};
        
        // מוצאים את המשימה ומעדכנים את הסטטוס שלה
        Object.keys(updatedTasks).forEach(dayIndex => {
          updatedTasks[dayIndex] = updatedTasks[dayIndex].map(task => {
            if (task._id === taskId) {
              return { ...task, status: 'clean' };
            }
            return task;
          });
        });
        
        return updatedTasks;
      });
      
      enqueueSnackbar('החדר סומן כנקי בהצלחה', { variant: 'success' });
    } catch (error) {
      console.error('שגיאה בסימון חדר כנקי:', error);
      enqueueSnackbar('לא ניתן לסמן את החדר כנקי', { variant: 'error' });
      
      // לצורכי פיתוח בלבד - עדכון המצב המקומי גם במקרה של שגיאה
      if (process.env.NODE_ENV === 'development') {
        setCleaningTasks(prevTasks => {
          const updatedTasks = {...prevTasks};
          
          Object.keys(updatedTasks).forEach(dayIndex => {
            updatedTasks[dayIndex] = updatedTasks[dayIndex].map(task => {
              if (task._id === taskId) {
                return { ...task, status: 'clean' };
              }
              return task;
            });
          });
          
          return updatedTasks;
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה לסימון חדר כמלוכלך (לא נקי)
  const markRoomAsDirty = async (taskId) => {
    setLoading(true);
    try {
      await cleaningService.markRoomAsDirty(taskId);
      
      // עדכון המצב המקומי
      setCleaningTasks(prevTasks => {
        const updatedTasks = {...prevTasks};
        
        // מוצאים את המשימה ומעדכנים את הסטטוס שלה בחזרה למלוכלך
        Object.keys(updatedTasks).forEach(dayIndex => {
          updatedTasks[dayIndex] = updatedTasks[dayIndex].map(task => {
            if (task._id === taskId) {
              return { ...task, status: 'dirty' };
            }
            return task;
          });
        });
        
        return updatedTasks;
      });
      
      enqueueSnackbar('החדר סומן כמלוכלך בהצלחה', { variant: 'info' });
    } catch (error) {
      console.error('שגיאה בסימון חדר כמלוכלך:', error);
      enqueueSnackbar('לא ניתן לסמן את החדר כמלוכלך', { variant: 'error' });
      
      // לצורכי פיתוח בלבד - עדכון המצב המקומי גם במקרה של שגיאה
      if (process.env.NODE_ENV === 'development') {
        setCleaningTasks(prevTasks => {
          const updatedTasks = {...prevTasks};
          
          Object.keys(updatedTasks).forEach(dayIndex => {
            updatedTasks[dayIndex] = updatedTasks[dayIndex].map(task => {
              if (task._id === taskId) {
                return { ...task, status: 'dirty' };
              }
              return task;
            });
          });
          
          return updatedTasks;
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // טעינת הנתונים בעת טעינת הדף
  useEffect(() => {
    fetchCleaningTasks();
    
    // רענון אוטומטי כל 5 דקות
    const interval = setInterval(() => {
      fetchCleaningTasks();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // מעבר ליום הבא
  const goToNextDay = () => {
    if (currentDateIndex < 3) {
      setCurrentDateIndex(prevIndex => prevIndex + 1);
    }
  };
  
  // מעבר ליום הקודם
  const goToPreviousDay = () => {
    if (currentDateIndex > 0) {
      setCurrentDateIndex(prevIndex => prevIndex - 1);
    }
  };
  
  // הצגת שם היום (היום, מחר, וכו')
  const getDateDisplay = (dateIndex) => {
    const date = addDays(new Date(), dateIndex);
    
    if (isToday(date)) {
      return 'היום';
    } else if (isTomorrow(date)) {
      return 'מחר';
    } else {
      return format(date, 'EEEE, d בMMMM', { locale: he });
    }
  };
  
  // קיבוץ החדרים לפי מתחם
  const groupRoomsByLocation = (tasks) => {
    const airportRooms = tasks.filter(task => task.location === 'airport');
    const rothschildRooms = tasks.filter(task => task.location === 'rothschild');
    
    return {
      airport: airportRooms,
      rothschild: rothschildRooms
    };
  };
  
  // הצבעים של המתחמים
  const locationColors = {
    airport: '#0058b0',    // כחול כהה יותר לאור יהודה
    rothschild: '#d62e58'  // אדום כהה יותר לרוטשילד
  };
  
  // רינדור של כרטיס חדר
  const renderRoomCard = (task) => {
    const isClean = task.status === 'clean';
    const isRothschild = task.location === 'rothschild';
    const locationColor = isRothschild ? locationColors.rothschild : locationColors.airport;
    
    return (
      <Grid item xs={6} key={task._id}>
        <Card 
          sx={{ 
            height: '100%',
            boxShadow: isClean ? '0px 1px 3px rgba(0, 0, 0, 0.03)' : '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            borderRight: isClean ? '2px solid' : '4px solid',
            borderColor: locationColor,
            opacity: isClean ? 0.8 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: isClean ? '#f7f7f7' : '#fff'
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: isClean ? '#626262' : '#333333' }}>
                  {task.roomNumber}
                </Typography>
                {isClean && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 14, color: '#4a9c50', mr: 0.5 }} />
                    <Typography variant="caption" color="#4a9c50" sx={{ fontWeight: 'medium' }}>
                      נקי
                    </Typography>
                  </Box>
                )}
              </Box>
              {isClean ? (
                <Button
                  size="small"
                  variant="text"
                  sx={{ 
                    color: '#666666',
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)'
                    }
                  }}
                  onClick={() => markRoomAsDirty(task._id)}
                >
                  <ReplayIcon fontSize="small" />
                </Button>
              ) : (
                <Checkbox
                  checked={false}
                  onChange={() => markRoomAsClean(task._id)}
                  sx={{
                    color: locationColor,
                    '&.Mui-checked': {
                      color: locationColor,
                    },
                    padding: '4px',
                  }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };
  
  // רינדור של קבוצת חדרים לפי מתחם
  const renderLocationGroup = (location) => {
    const isRothschild = location === 'rothschild';
    const rooms = cleaningTasks[currentDateIndex].filter(task => task.location === location);
    const locationColor = locationColors[location];
    const locationName = isRothschild ? 'רוטשילד' : 'אור יהודה';
    
    // בחירת האייקון המתאים למתחם
    const LocationIcon = isRothschild ? ApartmentIcon : FlightIcon;
    
    return (
      <Box sx={{ mb: 3 }} key={location}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            bgcolor: isRothschild ? 'rgba(214, 46, 88, 0.1)' : 'rgba(0, 88, 176, 0.1)',
            borderBottom: `2px solid ${locationColor}`
          }}
        >
          <LocationIcon sx={{ color: locationColor, mr: 1 }} />
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontWeight: 600, 
              color: locationColor
            }}
          >
            {locationName}
          </Typography>
        </Paper>
        
        {/* רשימת החדרים או הודעה אם אין חדרים */}
        {rooms.length > 0 ? (
          <Grid container spacing={2}>
            {rooms.map(room => renderRoomCard(room))}
          </Grid>
        ) : (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: 'rgba(0, 0, 0, 0.03)',
              border: '1px solid rgba(0, 0, 0, 0.09)'
            }}
          >
            <Typography sx={{ color: '#444', fontWeight: 500 }}>
              אין חדרים לניקוי במתחם {locationName}
            </Typography>
          </Paper>
        )}
      </Box>
    );
  };
  
  const locationsToRender = ['airport', 'rothschild'];
  
  // פונקציה ליצירת הודעת וואטסאפ עם רשימת החדרים לניקוי
  const createWhatsAppMessage = () => {
    const date = getDateDisplay(currentDateIndex);
    const tasks = cleaningTasks[currentDateIndex].filter(task => task.status === 'dirty');
    
    if (tasks.length === 0) {
      return `שלום, אין חדרים לניקוי ${date}.`;
    }
    
    // קיבוץ לפי מתחם
    const airportRooms = tasks.filter(task => task.location === 'airport').map(task => task.roomNumber);
    const rothschildRooms = tasks.filter(task => task.location === 'rothschild').map(task => task.roomNumber);
    
    let message = `שלום, להלן רשימת החדרים לניקוי ${date}:\n`;
    
    if (airportRooms.length > 0) {
      message += `\nאור יהודה: ${airportRooms.join(', ')}\n`;
    }
    
    if (rothschildRooms.length > 0) {
      message += `\nרוטשילד: ${rothschildRooms.join(', ')}\n`;
    }
    
    return message;
  };
  
  // פונקציה לפתיחת וואטסאפ עם ההודעה המוכנה
  const openWhatsApp = () => {
    const message = encodeURIComponent(createWhatsAppMessage());
    const whatsappUrl = `https://wa.me/972533337490?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };
  
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderRadius: 2, 
          mb: 3, 
          background: theme.palette.background.paper,
          boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px'
        }}
      >
        {/* כותרת ודפדוף */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton 
            onClick={goToPreviousDay} 
            disabled={currentDateIndex === 0}
            color="primary"
            sx={{
              color: currentDateIndex === 0 ? '#ccc' : '#555',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
          
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              textAlign: 'center',
              color: '#333',
              px: 2,
              py: 0.5,
              borderRadius: 1.5,
              bgcolor: 'rgba(0, 0, 0, 0.03)'
            }}
          >
            {getDateDisplay(currentDateIndex)}
          </Typography>
          
          <IconButton 
            onClick={goToNextDay} 
            disabled={currentDateIndex === 3}
            color="primary"
            sx={{
              color: currentDateIndex === 3 ? '#ccc' : '#555',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <ArrowBackIosIcon />
          </IconButton>
        </Box>
        
        {/* אייקון שליחה לוואטסאפ - מוצג רק למשתמשים מחוברים */}
        {isAuthenticated && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Tooltip title="שלח רשימת חדרים לוואטסאפ" placement="bottom">
              <IconButton
                onClick={openWhatsApp}
                sx={{
                  color: '#25D366', // צבע רשמי של וואטסאפ
                  bgcolor: 'rgba(37, 211, 102, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(37, 211, 102, 0.2)',
                    transform: 'scale(1.1)',
                    transition: 'all 0.2s'
                  },
                  p: 1,
                  borderRadius: '50%',
                  border: '1px solid rgba(37, 211, 102, 0.2)'
                }}
              >
                <WhatsAppIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Paper>
      
      {/* רשימת החדרים לניקוי */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4, flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress sx={{ color: '#499C56' }} />
          <Typography sx={{ mt: 2, color: '#555', fontWeight: 500 }}>טוען משימות ניקיון...</Typography>
        </Box>
      ) : (
        <>
          {cleaningTasks[currentDateIndex].length === 0 ? (
            <Paper 
              sx={{ 
                p: 3, 
                textAlign: 'center', 
                borderRadius: 2,
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Box sx={{ py: 2 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 40, color: '#499C56', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>אין חדרים לניקוי</Typography>
                <Typography sx={{ mt: 1, color: '#666' }}>
                  כל החדרים נקיים {getDateDisplay(currentDateIndex)}
                </Typography>
              </Box>
            </Paper>
          ) : (
            <>
              {/* הצגת כל המתחמים, גם אם הם ריקים */}
              {locationsToRender.map(location => renderLocationGroup(location))}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default Cleaning; 
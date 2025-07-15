import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Avatar, IconButton, Tooltip } from '@mui/material';
import { format } from 'date-fns';
import bookingService from '../../services/bookingService';
import { 
  Wifi, 
  LocalTaxi, 
  Phone, 
  Person,
  Hotel,
  AccessTime,
  ContactSupport,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';

const PublicNoticeBoard = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [todaysGuests, setTodaysGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshCheck, setLastRefreshCheck] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);

  // אורחים ברירת מחדל באנגלית
  const defaultGuests = useMemo(() => [
    { name: 'Arjun Patel', roomNumber: '1', phone: '+1-555-0101' },
    { name: 'Maya Levi', roomNumber: '9', phone: '+1-555-0102' },
    { name: 'Raj Kumar', roomNumber: '4', phone: '+1-555-0103' },
    { name: 'Noa Rosenberg', roomNumber: '10', phone: '+1-555-0104' },
    { name: 'David Wilson', roomNumber: '105', phone: '+1-555-0105' },
    { name: 'Lisa Miller', roomNumber: '106', phone: '+1-555-0106' }
  ], []);

  // מידע קבוע
  const wifiInfo = {
    ssid: 'Behappy',
    password: 'Besmile2'
  };

  // פונקציות fullscreen
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  };

  // מניעת כיבוי המסך
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('Screen wake lock activated');
        
        lock.addEventListener('release', () => {
          console.log('Screen wake lock released');
        });
      } else {
        // אלטרנטיבה - סימולציה של פעילות
        const interval = setInterval(() => {
          // הזזת העכבר באופן בלתי מורגש
          const event = new MouseEvent('mousemove', {
            clientX: 0,
            clientY: 0
          });
          document.dispatchEvent(event);
        }, 30000); // כל 30 שניות
        
        setWakeLock({ type: 'interval', id: interval });
        console.log('Screen wake lock simulation activated');
      }
    } catch (err) {
      console.error('Failed to request wake lock:', err);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      if (wakeLock.type === 'interval') {
        clearInterval(wakeLock.id);
      } else {
        await wakeLock.release();
      }
      setWakeLock(null);
      console.log('Screen wake lock released');
    }
  }, [wakeLock]);

  // האזנה לשינויים במצב fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // הפעלת wake lock כשהקומפוננט נטען
  useEffect(() => {
    requestWakeLock();
    
    return () => {
      releaseWakeLock();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // חידוש wake lock כשהוא משתחרר
  useEffect(() => {
    if (wakeLock && wakeLock.type !== 'interval') {
      wakeLock.addEventListener('release', () => {
        console.log('Wake lock released, requesting new one...');
        setTimeout(requestWakeLock, 1000);
      });
    }
  }, [wakeLock, requestWakeLock]);

  // שליפת אורחים שהצ'ק אין שלהם היום
  const fetchTodaysGuests = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const currentHour = now.getHours();
      
      // אם השעה לפני 12:00 בצהריים, הצג אורחים של אתמול
      // אם השעה אחרי 12:00 בצהריים, הצג אורחים של היום
      const displayDate = currentHour < 12 ? 
        new Date(now.getTime() - 24 * 60 * 60 * 1000) : // אתמול
        now; // היום
      
      const displayDateStr = format(displayDate, 'yyyy-MM-dd');
      
      const bookings = await bookingService.getBookingsByDateRange(displayDate, displayDate, 'airport');
      
      const todayCheckins = bookings.filter(booking => {
        const checkInDate = new Date(booking.checkIn);
        const checkInDateStr = format(checkInDate, 'yyyy-MM-dd');
        return checkInDateStr === displayDateStr && booking.status !== 'cancelled';
      });

      const guestsList = todayCheckins.map(booking => ({
        name: booking.firstName && booking.lastName ? `${booking.firstName} ${booking.lastName}` : booking.firstName || 'Guest',
        roomNumber: booking.roomNumber,
        phone: booking.phone || 'Not provided',
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests
      }));

      if (guestsList.length < 4) {
        const additionalGuests = defaultGuests.slice(0, 4 - guestsList.length);
        guestsList.push(...additionalGuests);
      }

      setTodaysGuests(guestsList);
    } catch (error) {
      console.error('שגיאה בשליפת אורחים:', error);
      setTodaysGuests(defaultGuests.slice(0, 4));
    } finally {
      setLoading(false);
    }
  }, [defaultGuests]);

  // פונקציה לבדיקת בקשת רענון מהשרת
  const checkRefreshStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/bookings/notice-board/refresh-status?lastCheck=${lastRefreshCheck}`);
      if (response.ok) {
        const data = await response.json();
        if (data.shouldRefresh) {
          console.log('🔄 Refresh request detected, updating guests list...');
          setLastRefreshCheck(data.timestamp);
          fetchTodaysGuests();
        }
      }
    } catch (error) {
      console.error('שגיאה בבדיקת סטטוס רענון:', error);
    }
  }, [lastRefreshCheck, fetchTodaysGuests]);

  // עדכון שעה כל דקה
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // עדכון נתונים כל 30 דקות
  useEffect(() => {
    fetchTodaysGuests();
    
    const dataTimer = setInterval(() => {
      fetchTodaysGuests();
    }, 30 * 60 * 1000);

    return () => clearInterval(dataTimer);
  }, [fetchTodaysGuests]);

  // בדיקת בקשת רענון מהשרת כל 3 שניות
  useEffect(() => {
    const refreshCheckTimer = setInterval(() => {
      checkRefreshStatus();
    }, 3000); // כל 3 שניות

    return () => clearInterval(refreshCheckTimer);
  }, [checkRefreshStatus]);

  // האזנה להודעות רענון מדף ההגדרות (מיושן - נשמר לתאימות אחורה)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'refresh-guests') {
        fetchTodaysGuests();
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === 'refresh-guests-trigger') {
        fetchTodaysGuests();
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchTodaysGuests]);

  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? 'Good Morning' : timeOfDay < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        direction: 'ltr'
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            textAlign: 'center',
            py: 2,
            position: 'relative'
          }}
        >
          {/* כפתור Fullscreen - מופיע רק בהובר */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 1000,
              width: 100,
              height: 100,
              opacity: 0,
              transition: 'opacity 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                opacity: 1
              }
            }}
          >
            <Tooltip title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}>
              <IconButton
                onClick={toggleFullscreen}
                sx={{
                  backgroundColor: isFullscreen ? '#1976D2' : '#ffffff',
                  border: '2px solid #1976D2',
                  borderRadius: 2,
                  width: 56,
                  height: 56,
                  margin: '10px',
                  transition: 'all 0.3s ease',
                  color: isFullscreen ? '#ffffff' : '#1976D2',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  '&:hover': {
                    backgroundColor: isFullscreen ? '#1565C0' : '#1976D2',
                    color: '#ffffff',
                    transform: 'scale(1.1)',
                    boxShadow: '0 4px 16px rgba(25,118,210,0.4)'
                  }
                }}
              >
                {isFullscreen ? (
                  <FullscreenExit sx={{ fontSize: 28, color: 'inherit' }} />
                ) : (
                  <Fullscreen sx={{ fontSize: 28, color: 'inherit' }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          <Typography 
            variant="h1" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              letterSpacing: '1px',
              mb: 1
            }}
          >
            <Box component="span" sx={{ color: '#1976D2' }}>Airport</Box>
            <Box component="span" sx={{ color: '#212529', ml: 1 }}>Guest House</Box>
          </Typography>
          <Typography 
            variant="h4" 
            sx={{ 
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              fontWeight: 400
            }}
          >
            <Box component="span" sx={{ color: '#4CAF50' }}>{greeting}!</Box>
            <Box component="span" sx={{ color: '#6c757d', ml: 1 }}>Welcome to your home away from home</Box>
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Information */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              {/* Contact Information */}
              <Grid item xs={12}>
                <Card 
                  sx={{ 
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: '#E8F5E8', 
                        mr: 3, 
                        width: 56, 
                        height: 56,
                        border: '2px solid #4CAF50'
                      }}>
                        <ContactSupport sx={{ fontSize: 32, color: '#2E7D32' }} />
                      </Avatar>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.8rem', md: '2.2rem' },
                          color: '#2E7D32'
                        }}
                      >
                        <Box component="span" sx={{ color: '#FF5722' }}>Need</Box>
                        <Box component="span" sx={{ color: '#4CAF50', ml: 1 }}>Help?</Box>
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontSize: { xs: '1.2rem', md: '1.4rem' },
                        color: '#37474F',
                        mb: 3,
                        lineHeight: 1.6,
                        direction: 'ltr',
                        textAlign: 'left'
                      }}
                    >
                      For any <Box component="span" sx={{ color: '#FF5722', fontWeight: 600 }}>questions</Box> or <Box component="span" sx={{ color: '#4CAF50', fontWeight: 600 }}>assistance</Box>, feel free to call or send a WhatsApp message to:
                    </Typography>
                    
                    <Box
                      sx={{
                        background: '#f8f9fa',
                        borderRadius: 2,
                        p: 3,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid #dee2e6',
                        '&:hover': {
                          background: '#e9ecef',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                      onClick={() => window.open(`https://wa.me/972506070260`)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Phone sx={{ fontSize: 28, mr: 2, color: '#2E7D32' }} />
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '1.6rem', md: '1.8rem' },
                            fontWeight: 700,
                            fontFamily: 'monospace'
                          }}
                        >
                          <Box component="span" sx={{ color: '#1976D2' }}>+972 506070260</Box>
                          <Box component="span" sx={{ color: '#37474F', mx: 1 }}>-</Box>
                          <Box component="span" sx={{ color: '#4CAF50', fontSize: { xs: '1.6rem', md: '1.8rem' }, fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>David</Box>
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* WiFi */}
              <Grid item xs={12}>
                <Card 
                  sx={{ 
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: '#E3F2FD', 
                        mr: 3, 
                        width: 56, 
                        height: 56,
                        border: '2px solid #BBDEFB'
                      }}>
                        <Wifi sx={{ fontSize: 32, color: '#1976D2' }} />
                      </Avatar>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.5rem', md: '2rem' },
                          color: '#1976D2'
                        }}
                      >
                        <Box component="span" sx={{ color: '#4CAF50' }}>Free</Box>
                        <Box component="span" sx={{ color: '#1976D2', ml: 1 }}>WiFi</Box>
                      </Typography>
                    </Box>
                    
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        backgroundColor: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
                        padding: '16px',
                        borderRadius: 1,
                        border: '1px solid #BBDEFB'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            color: '#1976D2',
                            fontWeight: 600
                          }}
                        >
                          Network:
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '1.5rem', md: '1.7rem' },
                            color: '#2E7D32',
                            fontWeight: 600,
                            fontFamily: 'monospace'
                          }}
                        >
                          {wifiInfo.ssid}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            color: '#1976D2',
                            fontWeight: 600
                          }}
                        >
                          Password:
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '1.5rem', md: '1.7rem' },
                            color: '#2E7D32',
                            fontWeight: 600,
                            fontFamily: 'monospace'
                          }}
                        >
                          {wifiInfo.password}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gett Taxi */}
              <Grid item xs={12}>
                <Card 
                  sx={{ 
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: '#FFF3E0', 
                        mr: 3, 
                        width: 56, 
                        height: 56,
                        border: '2px solid #FFCC02'
                      }}>
                        <LocalTaxi sx={{ fontSize: 32, color: '#FF9800' }} />
                      </Avatar>
                      <Box>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 700,
                            fontSize: { xs: '1.4rem', md: '1.8rem' },
                            color: '#E65100'
                          }}
                        >
                          <Box component="span" sx={{ color: '#E65100' }}>Recommended</Box>
                          <Box component="span" sx={{ color: '#FF9800', ml: 1 }}>Transportation</Box>
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '1rem', md: '1.2rem' },
                            color: '#FFCC02',
                            fontWeight: 700
                          }}
                        >
                          <Box component="span" sx={{ color: '#000', fontWeight: 800 }}>Gett</Box>
                          <Box component="span" sx={{ color: '#FF9800', ml: 1 }}>Taxi App</Box>
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontSize: { xs: '1.2rem', md: '1.3rem' },
                            color: '#5D4037',
                            mb: 1,
                            lineHeight: 1.5,
                            textAlign: 'left'
                          }}
                        >
                          The <Box component="span" sx={{ color: '#4CAF50', fontWeight: 600 }}>safest</Box> and most <Box component="span" sx={{ color: '#2196F3', fontWeight: 600 }}>convenient</Box> way to travel.
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontSize: { xs: '1.2rem', md: '1.3rem' },
                            color: '#5D4037',
                            lineHeight: 1.5,
                            textAlign: 'left'
                          }}
                        >
                          Licensed drivers, fixed prices, and credit card payment.
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        textAlign: 'center'
                      }}>
                        <img 
                          src="/images/gett-qr.png" 
                          alt="Gett QR Code" 
                          style={{ 
                            width: '90px', 
                            height: '90px',
                            borderRadius: '8px'
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.8rem',
                            color: '#E65100',
                            mt: 1,
                            fontWeight: 700
                          }}
                        >
                          <Box component="span" sx={{ color: '#4CAF50' }}>Scan</Box>
                          <Box component="span" sx={{ color: '#E65100', ml: 1 }}>to Download</Box>
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Right Column - Date, Time & Guests */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              {/* Date and Time */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 3,
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <AccessTime sx={{ fontSize: 28, color: '#FF9800' }} />
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1.5rem', md: '2rem' },
                        color: '#1976D2'
                      }}
                    >
                      {format(
                        currentDateTime.getHours() < 12 ? 
                          new Date(currentDateTime.getTime() - 24 * 60 * 60 * 1000) : 
                          currentDateTime, 
                        'EEEE, MMMM dd, yyyy'
                      )}
                    </Typography>
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        color: '#2E7D32',
                        fontFamily: 'monospace'
                      }}
                    >
                      {format(currentDateTime, 'HH:mm')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              {/* Guests */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <CardContent sx={{ p: 4, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: '#F3E5F5', 
                        mr: 3, 
                        width: 56, 
                        height: 56,
                        border: '2px solid #9C27B0'
                      }}>
                        <Person sx={{ fontSize: 32, color: '#7B1FA2' }} />
                      </Avatar>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.5rem', md: '2rem' },
                          color: '#7B1FA2'
                        }}
                      >
                        <Box component="span" sx={{ color: '#7B1FA2' }}>Guest</Box>
                        <Box component="span" sx={{ color: '#9C27B0', ml: 1 }}>Rooms</Box>
                      </Typography>
                    </Box>
                
                {loading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '300px'
                  }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontSize: { xs: '1.5rem', md: '2rem' },
                        color: '#9C27B0',
                        textAlign: 'center'
                      }}
                    >
                      <Box component="span" sx={{ color: '#7B1FA2' }}>Loading</Box>
                      <Box component="span" sx={{ color: '#9C27B0', ml: 1 }}>guest information...</Box>
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {todaysGuests.map((guest, index) => (
                      <Grid item xs={12} key={index}>
                        <Box
                          sx={{
                            background: '#f8f9fa',
                            borderRadius: 2,
                            border: '1px solid #dee2e6',
                            p: 3,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              background: '#e9ecef',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ 
                                bgcolor: '#e9ecef', 
                                mr: 3, 
                                width: 48, 
                                height: 48,
                                border: '2px solid #6c757d'
                              }}>
                                <Person sx={{ fontSize: 24, color: '#495057' }} />
                              </Avatar>
                              <Box>
                                <Typography 
                                  variant="h4" 
                                  sx={{ 
                                    fontWeight: 700,
                                    fontSize: { xs: '1.8rem', md: '2rem' },
                                    color: '#212529'
                                  }}
                                >
                                  {guest.name}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ 
                              textAlign: 'center',
                              backgroundColor: '#ffffff',
                              border: '2px solid #6c757d',
                              borderRadius: 2,
                              padding: '8px 16px',
                              minWidth: '80px'
                            }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#6c757d',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  lineHeight: 1
                                }}
                              >
                                Room
                              </Typography>
                              <Typography 
                                variant="h3" 
                                sx={{ 
                                  fontWeight: 700,
                                  fontSize: { xs: '1.8rem', md: '2rem' },
                                  color: '#212529',
                                  lineHeight: 1
                                }}
                              >
                                {guest.roomNumber}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>


      </Container>
    </Box>
  );
};

export default PublicNoticeBoard; 
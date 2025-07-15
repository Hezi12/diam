import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Avatar } from '@mui/material';
import { format } from 'date-fns';
import bookingService from '../../services/bookingService';
import { 
  Wifi, 
  LocalTaxi, 
  Phone, 
  Person,
  Hotel,
  AccessTime,
  ContactSupport
} from '@mui/icons-material';

const PublicNoticeBoard = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [todaysGuests, setTodaysGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  // אורחים ברירת מחדל באנגלית
  const defaultGuests = useMemo(() => [
    { name: 'John Smith', roomNumber: '101', phone: '+1-555-0101' },
    { name: 'Sarah Johnson', roomNumber: '102', phone: '+1-555-0102' },
    { name: 'Michael Brown', roomNumber: '103', phone: '+1-555-0103' },
    { name: 'Emily Davis', roomNumber: '104', phone: '+1-555-0104' },
    { name: 'David Wilson', roomNumber: '105', phone: '+1-555-0105' },
    { name: 'Lisa Miller', roomNumber: '106', phone: '+1-555-0106' }
  ], []);

  // מידע קבוע
  const wifiInfo = {
    ssid: 'Behappy',
    password: 'Besmile2'
  };

  const contactInfo = {
    name: 'David',
    phone: '+972 50-607-0260',
    message: 'For any questions or assistance, feel free to call or send a WhatsApp message to:'
  };

  // שליפת אורחים שהצ'ק אין שלהם היום
  const fetchTodaysGuests = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      const bookings = await bookingService.getBookingsByDateRange(today, today, 'airport');
      
      const todayCheckins = bookings.filter(booking => {
        const checkInDate = new Date(booking.checkIn);
        const checkInDateStr = format(checkInDate, 'yyyy-MM-dd');
        return checkInDateStr === todayStr && booking.status !== 'cancelled';
      });

      const guestsList = todayCheckins.map(booking => ({
        name: booking.guestName,
        roomNumber: booking.roomNumber,
        phone: booking.guestPhone || 'Not provided',
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

  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? 'Good Morning' : timeOfDay < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        direction: 'ltr',
        overflow: 'hidden'
      }}
    >
      <Container maxWidth="xl" sx={{ py: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            mb: 2,
            textAlign: 'center',
            py: 1
          }}
        >
          <Typography 
            variant="h1" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              letterSpacing: '1px',
              mb: 0.5
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

        <Grid container spacing={3} sx={{ flex: 1 }}>
          {/* Left Column - Information */}
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Grid container spacing={2} sx={{ flex: 1 }}>
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
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: '#E8F5E8', 
                        mr: 2, 
                        width: 48, 
                        height: 48,
                        border: '2px solid #4CAF50'
                      }}>
                        <ContactSupport sx={{ fontSize: 28, color: '#2E7D32' }} />
                      </Avatar>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.6rem', md: '2rem' },
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
                        fontSize: { xs: '1rem', md: '1.2rem' },
                        color: '#37474F',
                        mb: 2,
                        lineHeight: 1.4,
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
                        p: 2,
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
                        <Phone sx={{ fontSize: 24, mr: 2, color: '#2E7D32' }} />
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '1.3rem', md: '1.5rem' },
                            fontWeight: 700,
                            fontFamily: 'monospace'
                          }}
                        >
                          <Box component="span" sx={{ color: '#1976D2' }}>+972 506070260</Box>
                          <Box component="span" sx={{ color: '#37474F', mx: 1 }}>-</Box>
                          <Box component="span" sx={{ color: '#4CAF50', fontSize: { xs: '1.3rem', md: '1.5rem' }, fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>David</Box>
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
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ 
                        bgcolor: '#E3F2FD', 
                        mr: 2, 
                        width: 48, 
                        height: 48,
                        border: '2px solid #BBDEFB'
                      }}>
                        <Wifi sx={{ fontSize: 28, color: '#1976D2' }} />
                      </Avatar>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.4rem', md: '1.8rem' },
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
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: '#FFF3E0', 
                        mr: 2, 
                        width: 48, 
                        height: 48,
                        border: '2px solid #FFCC02'
                      }}>
                        <LocalTaxi sx={{ fontSize: 28, color: '#FF9800' }} />
                      </Avatar>
                      <Box>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 700,
                            fontSize: { xs: '1.2rem', md: '1.6rem' },
                            color: '#E65100'
                          }}
                        >
                          <Box component="span" sx={{ color: '#E65100' }}>Recommended</Box>
                          <Box component="span" sx={{ color: '#FF9800', ml: 1 }}>Transportation</Box>
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '0.9rem', md: '1.1rem' },
                            color: '#FFCC02',
                            fontWeight: 700
                          }}
                        >
                          <Box component="span" sx={{ color: '#000', fontWeight: 800 }}>Gett</Box>
                          <Box component="span" sx={{ color: '#FF9800', ml: 1 }}>Taxi App</Box>
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontSize: { xs: '1.1rem', md: '1.3rem' },
                            color: '#5D4037',
                            mb: 1,
                            lineHeight: 1.4,
                            textAlign: 'left'
                          }}
                        >
                          The <Box component="span" sx={{ color: '#4CAF50', fontWeight: 600 }}>safest</Box> and most <Box component="span" sx={{ color: '#2196F3', fontWeight: 600 }}>convenient</Box> way to travel.
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontSize: { xs: '1.1rem', md: '1.3rem' },
                            color: '#5D4037',
                            lineHeight: 1.4,
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
                            width: '80px', 
                            height: '80px',
                            borderRadius: '8px'
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.8rem',
                            color: '#E65100',
                            mt: 0.5,
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
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Grid container spacing={2} sx={{ flex: 1 }}>
              {/* Date and Time */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <AccessTime sx={{ fontSize: 24, color: '#FF9800' }} />
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1.2rem', md: '1.6rem' },
                        color: '#1976D2'
                      }}
                    >
                      {format(currentDateTime, 'EEEE, MMMM dd, yyyy')}
                    </Typography>
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '1.8rem', md: '2.2rem' },
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
              <Grid item xs={12} sx={{ flex: 1 }}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: '#F3E5F5', 
                        mr: 2, 
                        width: 48, 
                        height: 48,
                        border: '2px solid #9C27B0'
                      }}>
                        <Person sx={{ fontSize: 28, color: '#7B1FA2' }} />
                      </Avatar>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.3rem', md: '1.7rem' },
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
                    flex: 1
                  }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontSize: { xs: '1.3rem', md: '1.7rem' },
                        color: '#9C27B0',
                        textAlign: 'center'
                      }}
                    >
                      <Box component="span" sx={{ color: '#7B1FA2' }}>Loading</Box>
                      <Box component="span" sx={{ color: '#9C27B0', ml: 1 }}>guest information...</Box>
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1} sx={{ flex: 1 }}>
                    {todaysGuests.map((guest, index) => (
                      <Grid item xs={12} key={index}>
                        <Box
                          sx={{
                            background: '#f8f9fa',
                            borderRadius: 2,
                            border: '1px solid #dee2e6',
                            p: 2,
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
                                mr: 2, 
                                width: 40, 
                                height: 40,
                                border: '2px solid #6c757d'
                              }}>
                                <Person sx={{ fontSize: 20, color: '#495057' }} />
                              </Avatar>
                              <Box>
                                <Typography 
                                  variant="h4" 
                                  sx={{ 
                                    fontWeight: 700,
                                    fontSize: { xs: '1.4rem', md: '1.6rem' },
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
                              padding: '6px 12px',
                              minWidth: '70px'
                            }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#6c757d',
                                  fontSize: '0.7rem',
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
                                  fontSize: { xs: '1.4rem', md: '1.6rem' },
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
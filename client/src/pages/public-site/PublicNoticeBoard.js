import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Chip, Avatar } from '@mui/material';
import { format } from 'date-fns';
import bookingService from '../../services/bookingService';
import { 
  Wifi, 
  LocalTaxi, 
  Phone, 
  Person,
  Hotel,
  AccessTime,
  LocationOn,
  Security,
  CheckCircle,
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
            py: 4,
            backgroundColor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Hotel sx={{ fontSize: 48, mr: 2, color: '#495057' }} />
            <Typography 
              variant="h1" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                color: '#212529',
                letterSpacing: '1px'
              }}
            >
              Airport Guest House
            </Typography>
          </Box>
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#6c757d',
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              fontWeight: 400
            }}
          >
            {greeting}! Welcome to your home away from home
          </Typography>
        </Box>

        {/* Date and Time */}
        <Box
          sx={{
            mb: 4,
            textAlign: 'center',
            py: 3,
            backgroundColor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <AccessTime sx={{ fontSize: 28, color: '#495057' }} />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.5rem', md: '2rem' },
                color: '#212529'
              }}
            >
              {format(currentDateTime, 'EEEE, MMMM dd, yyyy')}
            </Typography>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.5rem' },
                color: '#212529',
                fontFamily: 'monospace'
              }}
            >
              {format(currentDateTime, 'HH:mm')}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Information */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
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
                        bgcolor: '#f8f9fa', 
                        mr: 3, 
                        width: 56, 
                        height: 56,
                        border: '2px solid #e9ecef'
                      }}>
                        <Wifi sx={{ fontSize: 32, color: '#495057' }} />
                      </Avatar>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.5rem', md: '2rem' },
                          color: '#212529'
                        }}
                      >
                        Free WiFi
                      </Typography>
                    </Box>
                    
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        backgroundColor: '#f8f9fa',
                        padding: '16px',
                        borderRadius: 1,
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            color: '#6c757d',
                            fontWeight: 600
                          }}
                        >
                          Network:
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '1.2rem', md: '1.4rem' },
                            color: '#212529',
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
                            color: '#6c757d',
                            fontWeight: 600
                          }}
                        >
                          Password:
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '1.2rem', md: '1.4rem' },
                            color: '#212529',
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
                        bgcolor: '#f8f9fa', 
                        mr: 3, 
                        width: 56, 
                        height: 56,
                        border: '2px solid #e9ecef'
                      }}>
                        <LocalTaxi sx={{ fontSize: 32, color: '#495057' }} />
                      </Avatar>
                      <Box>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 700,
                            fontSize: { xs: '1.4rem', md: '1.8rem' },
                            color: '#212529'
                          }}
                        >
                          Recommended Transportation
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '1rem', md: '1.2rem' },
                            color: '#6c757d',
                            fontWeight: 500
                          }}
                        >
                          Gett Taxi App
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontSize: { xs: '1rem', md: '1.1rem' },
                            color: '#495057',
                            mb: 2,
                            lineHeight: 1.6
                          }}
                        >
                          The safest and most convenient way to travel. Licensed drivers, fixed prices, and credit card payment.
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Chip 
                            icon={<CheckCircle sx={{ color: '#28a745 !important' }} />}
                            label="Credit Card Payment"
                            sx={{ 
                              bgcolor: '#f8f9fa',
                              color: '#495057',
                              fontWeight: 600,
                              border: '1px solid #e9ecef'
                            }}
                          />
                          <Chip 
                            icon={<CheckCircle sx={{ color: '#28a745 !important' }} />}
                            label="Advance Booking"
                            sx={{ 
                              bgcolor: '#f8f9fa',
                              color: '#495057',
                              fontWeight: 600,
                              border: '1px solid #e9ecef'
                            }}
                          />
                          <Chip 
                            icon={<Security sx={{ color: '#28a745 !important' }} />}
                            label="Licensed Drivers"
                            sx={{ 
                              bgcolor: '#f8f9fa',
                              color: '#495057',
                              fontWeight: 600,
                              border: '1px solid #e9ecef'
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        backgroundColor: '#f8f9fa',
                        borderRadius: 2,
                        border: '1px solid #e9ecef',
                        p: 2,
                        textAlign: 'center'
                      }}>
                        <img 
                          src="/images/gett-qr.png" 
                          alt="Gett QR Code" 
                          style={{ 
                            width: '100px', 
                            height: '100px',
                            borderRadius: '8px'
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.9rem',
                            color: '#6c757d',
                            mt: 1,
                            fontWeight: 600
                          }}
                        >
                          Scan to Download
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

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
                        bgcolor: '#f8f9fa', 
                        mr: 3, 
                        width: 56, 
                        height: 56,
                        border: '2px solid #e9ecef'
                      }}>
                        <ContactSupport sx={{ fontSize: 32, color: '#495057' }} />
                      </Avatar>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.5rem', md: '2rem' },
                          color: '#212529'
                        }}
                      >
                        Need Help?
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        color: '#495057',
                        mb: 3,
                        lineHeight: 1.6
                      }}
                    >
                      {contactInfo.message}
                    </Typography>
                    
                    <Box
                      sx={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: 2,
                        p: 3,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid #e9ecef',
                        '&:hover': {
                          backgroundColor: '#e9ecef',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                      onClick={() => window.open(`https://wa.me/972506070260`)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Phone sx={{ fontSize: 24, mr: 2, color: '#495057' }} />
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '1.2rem', md: '1.4rem' },
                            color: '#212529',
                            fontWeight: 700,
                            fontFamily: 'monospace'
                          }}
                        >
                          {contactInfo.phone} - {contactInfo.name}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Right Column - Guests */}
          <Grid item xs={12} md={6}>
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
                    bgcolor: '#f8f9fa', 
                    mr: 3, 
                    width: 56, 
                    height: 56,
                    border: '2px solid #e9ecef'
                  }}>
                    <Person sx={{ fontSize: 32, color: '#495057' }} />
                  </Avatar>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', md: '2rem' },
                      color: '#212529'
                    }}
                  >
                    Today's Guests
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
                        color: '#6c757d',
                        textAlign: 'center'
                      }}
                    >
                      Loading guest information...
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {todaysGuests.map((guest, index) => (
                      <Grid item xs={12} key={index}>
                        <Box
                          sx={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: 2,
                            border: '1px solid #e9ecef',
                            p: 3,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#e9ecef',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ 
                                bgcolor: '#ffffff', 
                                mr: 3, 
                                width: 48, 
                                height: 48,
                                border: '2px solid #e9ecef'
                              }}>
                                <Person sx={{ fontSize: 24, color: '#495057' }} />
                              </Avatar>
                              <Box>
                                <Typography 
                                  variant="h5" 
                                  sx={{ 
                                    fontWeight: 700,
                                    fontSize: { xs: '1.2rem', md: '1.4rem' },
                                    color: '#212529'
                                  }}
                                >
                                  {guest.name}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#6c757d',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  Welcome to our guest house!
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Chip 
                                icon={<LocationOn sx={{ color: '#495057 !important' }} />}
                                label={`Room ${guest.roomNumber}`}
                                sx={{ 
                                  bgcolor: '#ffffff',
                                  color: '#495057',
                                  fontWeight: 700,
                                  fontSize: { xs: '0.9rem', md: '1rem' },
                                  border: '1px solid #e9ecef'
                                }}
                              />
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


      </Container>
    </Box>
  );
};

export default PublicNoticeBoard; 
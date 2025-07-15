import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Paper, Container, Grid, Card, CardContent } from '@mui/material';
import { format } from 'date-fns';
import bookingService from '../../services/bookingService';
import { 
  Wifi, 
  LocalTaxi, 
  Phone, 
  CheckCircle, 
  Person
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

  // מידע קבוע - ניתן לעדכן לפי הצרכים
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
      
      // סינון אורחים שהצ'ק אין שלהם בדיוק היום
      const todayCheckins = bookings.filter(booking => {
        const checkInDate = new Date(booking.checkIn);
        const checkInDateStr = format(checkInDate, 'yyyy-MM-dd');
        return checkInDateStr === todayStr && booking.status !== 'cancelled';
      });

      const guestsList = todayCheckins.map(booking => ({
        name: booking.guestName,
        roomNumber: booking.roomNumber,
        phone: booking.guestPhone || 'לא צוין',
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests
      }));

      // אם יש פחות מ-4 אורחים, נוסיף אורחים ברירת מחדל
      if (guestsList.length < 4) {
        const additionalGuests = defaultGuests.slice(0, 4 - guestsList.length);
        guestsList.push(...additionalGuests);
      }

      setTodaysGuests(guestsList);
    } catch (error) {
      console.error('שגיאה בשליפת אורחים:', error);
      // במקרה של שגיאה, נציג אורחים ברירת מחדל
      setTodaysGuests(defaultGuests.slice(0, 4));
    } finally {
      setLoading(false);
    }
  }, [defaultGuests]);

  // עדכון שעה כל דקה
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // כל דקה

    return () => clearInterval(timer);
  }, []);

  // עדכון נתונים כל 30 דקות
  useEffect(() => {
    fetchTodaysGuests();
    
    const dataTimer = setInterval(() => {
      fetchTodaysGuests();
    }, 30 * 60 * 1000); // כל 30 דקות

    return () => clearInterval(dataTimer);
  }, [fetchTodaysGuests]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: '100vh',
        background: 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        direction: 'rtl',
        overflow: 'hidden',
        padding: 0
      }}
    >
      <Container maxWidth="xl" sx={{ py: 3, flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* כותרת ברוכים הבאים */}
        <Paper
          elevation={8}
          sx={{
            p: 3,
            mb: 3,
            background: 'linear-gradient(45deg, #2c3e50 30%, #34495e 90%)',
            color: 'white',
            borderRadius: 4,
            textAlign: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Typography variant="h1" component="h1" sx={{ fontWeight: 'bold', fontSize: '4rem', color: 'white' }}>
              Welcome to Airport Guest House
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={3} sx={{ flex: 1 }}>
          {/* עמודה שמאלית - מידע שימושי */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              {/* WiFi */}
              <Grid item xs={12}>
                <Card elevation={3} sx={{ borderRadius: 3, background: '#ffffff', border: '1px solid #dee2e6' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Wifi sx={{ fontSize: 42, mr: 2, color: '#6c757d' }} />
                      <Typography variant="h3" sx={{ fontWeight: 'bold', fontSize: '2rem', color: '#2c3e50' }}>
                        WiFi
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontSize: '1.5rem', mb: 1, color: '#495057' }}>
                      <strong>Network:</strong> {wifiInfo.ssid}
                    </Typography>
                    <Typography variant="h5" sx={{ fontSize: '1.5rem', color: '#495057' }}>
                      <strong>Password:</strong> {wifiInfo.password}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recommended Gett Taxi */}
              <Grid item xs={12}>
                <Card elevation={3} sx={{ borderRadius: 3, background: '#fff8e1', border: '2px solid #ffc107' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocalTaxi sx={{ fontSize: 42, mr: 2, color: '#f57c00' }} />
                      <Typography variant="h3" sx={{ fontWeight: 'bold', fontSize: '2rem', color: '#f57c00' }}>
                        Recommended: Gett Taxi App
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontSize: '1.4rem', mb: 2, color: '#6d4c41' }}>
                      We recommend using Gett Taxi for the safest and most convenient transportation.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CheckCircle sx={{ fontSize: 24, mr: 1, color: '#4caf50' }} />
                          <Typography variant="h6" sx={{ fontSize: '1.2rem', color: '#6d4c41' }}>
                            Credit Card Payment
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircle sx={{ fontSize: 24, mr: 1, color: '#4caf50' }} />
                          <Typography variant="h6" sx={{ fontSize: '1.2rem', color: '#6d4c41' }}>
                            Advance Booking
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ 
                          width: 80, 
                          height: 80, 
                          border: '2px solid #333',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1,
                          backgroundColor: 'white'
                        }}>
                          <Typography variant="body2" sx={{ fontSize: '10px', textAlign: 'center' }}>
                            QR CODE<br/>PLACEHOLDER
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#6d4c41' }}>
                          Scan to Download
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Card elevation={3} sx={{ borderRadius: 3, background: '#ffffff', border: '1px solid #dee2e6' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Phone sx={{ fontSize: 42, mr: 2, color: '#6c757d' }} />
                      <Typography variant="h3" sx={{ fontWeight: 'bold', fontSize: '2rem', color: '#2c3e50' }}>
                        Contact Me
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontSize: '1.4rem', mb: 2, color: '#495057' }}>
                      {contactInfo.message}
                    </Typography>
                    <Box sx={{ 
                      display: 'inline-block',
                      backgroundColor: '#495057',
                      color: 'white',
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#37474f'
                      }
                    }}
                    onClick={() => window.open(`https://wa.me/972506070260`)}
                    >
                      {contactInfo.phone} - {contactInfo.name}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* עמודה ימנית - אורחים */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={4}
              sx={{
                height: '100%',
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* תאריך ושעה מעל האורחים */}
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    mb: 3,
                    background: 'linear-gradient(45deg, #2c3e50 30%, #34495e 90%)',
                    color: 'white',
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h4" sx={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white' }}>
                    {format(currentDateTime, 'EEEE, MMMM dd, yyyy')}
                  </Typography>
                </Paper>
                
                {loading ? (
                  <Typography variant="h4" sx={{ textAlign: 'center', py: 4, fontSize: '2rem', color: '#6c757d' }}>
                    Loading data...
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {todaysGuests.map((guest, index) => (
                      <Grid item xs={12} key={index}>
                        <Paper
                          elevation={2}
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            background: '#ffffff',
                            border: '1px solid #dee2e6'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Person sx={{ fontSize: 36, mr: 2, color: '#6c757d' }} />
                              <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '1.8rem', color: '#2c3e50' }}>
                                {guest.name}
                              </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontSize: '1.8rem', color: '#495057', fontWeight: 'bold' }}>
                              {guest.roomNumber}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* פוטר */}
        <Paper
          elevation={2}
          sx={{
            mt: 2,
            p: 2,
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" sx={{ color: '#6c757d', fontSize: '1.5rem' }}>
            Airport Guest House - Or Yehuda | Last Updated: {format(currentDateTime, 'HH:mm')}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicNoticeBoard; 
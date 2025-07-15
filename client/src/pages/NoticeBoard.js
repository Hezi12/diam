import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Divider
} from '@mui/material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import bookingService from '../services/bookingService';
import { 
  Campaign, 
  Wifi, 
  LocalTaxi, 
  Phone, 
  AccessTime, 
  CheckCircle, 
  Hotel,
  Person,
  Settings,
  OpenInNew
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NoticeBoard = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [todaysGuests, setTodaysGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const taxiNumbers = [
    { name: 'מונית חברת דן', number: '03-5333333' },
    { name: 'מונית גט', number: '*3838' },
    { name: 'מונית קבועה', number: '054-4444444' }
  ];

  const contactInfo = {
    reception: '03-9999999',
    emergency: '100',
    checkIn: '15:00',
    checkOut: '11:00'
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

  const handleOpenPublicView = () => {
    window.open('/notice-board-public', '_blank');
  };

  const handleOpenSettings = () => {
    navigate('/settings/notice-board');
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      {/* כותרת וכפתורים */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Campaign sx={{ fontSize: 48, mr: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              לוח מודעות - ניהול
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<OpenInNew />}
              onClick={handleOpenPublicView}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              פתח תצוגה ציבורית
            </Button>
            
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Settings />}
              onClick={handleOpenSettings}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              הגדרות
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* מידע על הזמן הנוכחי */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          {format(currentDateTime, 'EEEE, dd MMMM yyyy', { locale: he })}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {format(currentDateTime, 'HH:mm')}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* עמודה שמאלית - אורחים */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Hotel sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  אורחים המגיעים היום
                </Typography>
              </Box>
              
              {loading ? (
                <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                  טוען נתונים...
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {todaysGuests.map((guest, index) => (
                    <Grid item xs={12} key={index}>
                      <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ fontSize: 24, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {guest.name}
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            חדר {guest.roomNumber}
                          </Typography>
                        </Box>
                        {guest.phone && (
                          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                            טלפון: {guest.phone}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* עמודה ימנית - מידע שימושי */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            {/* WiFi */}
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Wifi sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      WiFi
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>שם רשת:</strong> {wifiInfo.ssid}
                  </Typography>
                  <Typography variant="body1">
                    <strong>סיסמה:</strong> {wifiInfo.password}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* מוניות */}
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocalTaxi sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      מוניות
                    </Typography>
                  </Box>
                  {taxiNumbers.map((taxi, index) => (
                    <Typography key={index} variant="body1" sx={{ mb: 1 }}>
                      <strong>{taxi.name}:</strong> {taxi.number}
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* מידע כללי */}
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      מידע כללי
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>קבלה:</strong> {contactInfo.reception}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>חירום:</strong> {contactInfo.emergency}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTime sx={{ fontSize: 20, mr: 1 }} />
                    <Typography variant="body1">
                      <strong>צ'ק אין:</strong> {contactInfo.checkIn}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ fontSize: 20, mr: 1 }} />
                    <Typography variant="body1">
                      <strong>צ'ק אאוט:</strong> {contactInfo.checkOut}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* פוטר */}
      <Paper elevation={1} sx={{ mt: 3, p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
        <Typography variant="body2" color="text.secondary">
          עדכון אחרון: {format(currentDateTime, 'HH:mm')} | לוח מודעות Airport Guest House
        </Typography>
      </Paper>
    </Box>
  );
};

export default NoticeBoard; 
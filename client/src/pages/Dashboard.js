import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Alert, Snackbar, useMediaQuery, useTheme } from '@mui/material';
import { isValid } from 'date-fns';
import { STYLE_CONSTANTS } from '../styles/StyleConstants';
import NewBookingForm from '../components/bookings/NewBookingForm';

// קומפוננטות של הדאשבורד
import DashboardDateNav from '../components/dashboard/DashboardDateNav';
import LocationSection from '../components/dashboard/LocationSection';

// שירותים ופונקציות עזר
import { 
  fetchRooms, 
  fetchBookings, 
  getRoomStatus, 
  saveBooking, 
  updateBooking, 
  deleteBooking 
} from '../components/dashboard/dashboardUtils';

/**
 * דף הדאשבורד הראשי
 */
const Dashboard = () => {
  const colors = STYLE_CONSTANTS.colors;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [airportRooms, setAirportRooms] = useState([]);
  const [rothschildRooms, setRothschildRooms] = useState([]);
  const [airportBookings, setAirportBookings] = useState([]);
  const [rothschildBookings, setRothschildBookings] = useState([]);
  const [loading, setLoading] = useState({
    airportRooms: true,
    rothschildRooms: true,
    airportBookings: true,
    rothschildBookings: true
  });

  // מצב חלונות ההזמנה
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [editBookingOpen, setEditBookingOpen] = useState(false);
  const [editBookingData, setEditBookingData] = useState(null);
  const [bookingLocation, setBookingLocation] = useState('airport');
  
  // מצב הודעות
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'info', 'warning'
  });

  // טעינת נתונים ראשונית
  useEffect(() => {
    fetchRooms('airport', setLoading, setAirportRooms);
    fetchRooms('rothschild', setLoading, setRothschildRooms);
  }, []);

  // טעינת הזמנות בכל שינוי תאריך
  useEffect(() => {
    fetchBookings('airport', currentDate, setLoading, setAirportBookings);
    fetchBookings('rothschild', currentDate, setLoading, setRothschildBookings);
  }, [currentDate]);

  // פונקציה לשינוי תאריך
  const handleDateChange = (newDate) => {
    if (newDate instanceof Date && isValid(newDate)) {
      setCurrentDate(newDate);
    } else {
      console.error('Invalid date provided to handleDateChange', newDate);
    }
  };

  // פונקציה לטיפול בלחיצה על חדר 
  const handleRoomClick = (status, room, booking) => {
    // אם החדר ריק, פתיחת טופס הזמנה חדשה
    if (status === 'empty') {
      handleEmptyRoomClick(room);
    }
    // אם יש הזמנה, פתיחת טופס עריכה
    else if (booking) {
      handleBookingClick(booking);
    }
  };

  // פונקציה לטיפול בלחיצה על חדר ריק
  const handleEmptyRoomClick = (room) => {
    const checkInDate = new Date(currentDate);
    const checkOutDate = new Date(currentDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1);

    const data = {
      room: room._id,
      roomNumber: room.roomNumber,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: 1,
      location: room.location,
      price: room.basePrice
    };
    
    console.log('מכין נתונים להזמנה חדשה:', data);
    
    setBookingLocation(room.location);
    setInitialData(data);
    setNewBookingOpen(true);
  };

  // פונקציה לטיפול בלחיצה על הזמנה קיימת
  const handleBookingClick = (booking) => {
    console.log('פתיחת הזמנה קיימת לעריכה:', booking);
    
    // העתקת ההזמנה לעריכה
    setEditBookingData(booking);
    setBookingLocation(booking.location);
    setEditBookingOpen(true);
  };
  
  // פונקציה לסגירת חלון ההזמנה החדשה
  const handleCloseNewBooking = () => {
    setNewBookingOpen(false);
    setInitialData(null);
  };
  
  // פונקציה לסגירת חלון עריכת הזמנה
  const handleCloseEditBooking = () => {
    setEditBookingOpen(false);
    setEditBookingData(null);
  };

  // פונקציה לשמירת הזמנה חדשה
  const handleSaveBooking = async (bookingData) => {
    const result = await saveBooking(bookingData, bookingLocation);
    
    if (result.success) {
      setNewBookingOpen(false);
      
      // הצגת הודעת הצלחה
      setNotification({
        open: true,
        message: 'ההזמנה נשמרה בהצלחה',
        severity: 'success'
      });
      
      // רענון הזמנות עם השהייה קצרה
      setTimeout(() => {
        fetchBookings('airport', currentDate, setLoading, setAirportBookings);
        fetchBookings('rothschild', currentDate, setLoading, setRothschildBookings);
      }, 500);
      
      return true;
    } else {
      // הצגת הודעת שגיאה
      setNotification({
        open: true,
        message: result.error,
        severity: 'error'
      });
      
      return false;
    }
  };

  // פונקציה לעדכון הזמנה קיימת
  const handleUpdateBooking = async (updatedBookingData) => {
    const result = await updateBooking(updatedBookingData, bookingLocation);
    
    if (result.success) {
      setEditBookingOpen(false);
      
      // הצגת הודעת הצלחה
      setNotification({
        open: true,
        message: 'ההזמנה עודכנה בהצלחה',
        severity: 'success'
      });
      
      // רענון הזמנות עם השהייה קצרה
      setTimeout(() => {
        fetchBookings('airport', currentDate, setLoading, setAirportBookings);
        fetchBookings('rothschild', currentDate, setLoading, setRothschildBookings);
      }, 500);
      
      return true;
    } else {
      // הצגת הודעת שגיאה
      setNotification({
        open: true,
        message: result.error,
        severity: 'error'
      });
      
      return false;
    }
  };

  // פונקציה למחיקת הזמנה
  const handleDeleteBooking = async (bookingId) => {
    const result = await deleteBooking(bookingId);
    
    if (result.success) {
      setEditBookingOpen(false);
      
      // הצגת הודעת הצלחה
      setNotification({
        open: true,
        message: 'ההזמנה נמחקה בהצלחה',
        severity: 'success'
      });
      
      // רענון הזמנות עם השהייה קצרה
      setTimeout(() => {
        fetchBookings('airport', currentDate, setLoading, setAirportBookings);
        fetchBookings('rothschild', currentDate, setLoading, setRothschildBookings);
      }, 500);
      
      return true;
    } else {
      // הצגת הודעת שגיאה
      setNotification({
        open: true,
        message: result.error,
        severity: 'error'
      });
      
      return false;
    }
  };

  // סגירת הודעה
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification(prev => ({ ...prev, open: false }));
  };

  // קבלת כל החדרים מתאימים למיקום עבור NewBookingForm
  const getLocationRooms = (location) => {
    return location === 'airport' ? airportRooms : rothschildRooms;
  };

  // פונקציה להעברת פרמטר לבדיקת סטטוס חדר
  const getRoomStatusForCurrentDate = (roomId, bookings) => {
    return getRoomStatus(roomId, bookings, currentDate);
  };

  // פונקציה לסינון החדרים שלא למכירה
  const filterNotForSaleRooms = (rooms) => {
    return rooms.filter(room => room.category !== 'Not for Sale');
  };

  // פונקציה למיון החדרים לפי מספר
  const sortRoomsByNumber = (rooms) => {
    return [...rooms].sort((a, b) => {
      const numA = parseFloat(a.roomNumber);
      const numB = parseFloat(b.roomNumber);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      return a.roomNumber.localeCompare(b.roomNumber);
    });
  };

  // מיון וסינון החדרים
  const prepareRooms = (originalRooms) => {
    return sortRoomsByNumber(filterNotForSaleRooms(originalRooms));
  };

  // הכנת חדרים
  const preparedAirportRooms = prepareRooms(airportRooms);
  const preparedRothschildRooms = prepareRooms(rothschildRooms);

  return (
    <Box sx={{ 
      pb: isMobile ? 6 : 2,
      maxWidth: '1600px',
      margin: '0 auto',
      px: { xs: 1, sm: 2, md: 3 }
    }}>
      <Box sx={{ 
        pb: isMobile ? 0 : 1,
        pt: isMobile ? 2 : 0.5,
        position: isMobile ? 'relative' : 'sticky',
        top: isMobile ? 'auto' : 0,
        width: '100%',
        zIndex: 10,
        backgroundColor: theme.palette.background.default,
        boxShadow: 'none',
        borderRadius: isMobile ? 2 : 0
      }}>
        <DashboardDateNav 
          currentDate={currentDate} 
          onDateChange={handleDateChange}
        />
      </Box>
    
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mt: isMobile ? 0 : 0.5 }}>
        {/* מודול rothschild */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            borderRadius: 2.5, 
            overflow: 'hidden', 
            backgroundColor: '#fff',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.03)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            }
          }}>
            <LocationSection 
              location="rothschild" 
              rooms={preparedRothschildRooms}
              bookings={rothschildBookings}
              loading={loading.rothschildRooms || loading.rothschildBookings}
              onRoomClick={handleRoomClick}
              getRoomStatus={(roomId, bookings) => getRoomStatusForCurrentDate(roomId, bookings)}
            />
          </Box>
        </Grid>

        {/* מודול airport */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            borderRadius: 2.5, 
            overflow: 'hidden', 
            backgroundColor: '#fff',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.03)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            }
          }}>
            <LocationSection 
              location="airport" 
              rooms={preparedAirportRooms}
              bookings={airportBookings}
              loading={loading.airportRooms || loading.airportBookings}
              onRoomClick={handleRoomClick}
              getRoomStatus={(roomId, bookings) => getRoomStatusForCurrentDate(roomId, bookings)}
            />
          </Box>
        </Grid>
      </Grid>
  
      {/* דיאלוג הזמנה חדשה */}
      {newBookingOpen && (
        <NewBookingForm
          open={newBookingOpen}
          onClose={handleCloseNewBooking}
          onSave={handleSaveBooking}
          rooms={getLocationRooms(bookingLocation)}
          location={bookingLocation}
          initialData={initialData}
        />
      )}
  
      {/* דיאלוג עריכת הזמנה */}
      {editBookingOpen && (
        <NewBookingForm
          open={editBookingOpen}
          onClose={handleCloseEditBooking}
          onSave={handleUpdateBooking}
          onDelete={handleDeleteBooking}
          rooms={getLocationRooms(bookingLocation)}
          location={bookingLocation}
          editBooking={editBookingData}
        />
      )}
  
      {/* הודעות מערכת */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={notification.severity} 
          onClose={handleCloseNotification}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
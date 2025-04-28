import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Alert, Snackbar } from '@mui/material';
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
      // המרת מספרי החדרים למספרים (אם הם מספריים)
      const roomNumberA = parseInt(a.roomNumber);
      const roomNumberB = parseInt(b.roomNumber);
      
      // אם שניהם מספרים תקינים, נמיין לפי ערך מספרי
      if (!isNaN(roomNumberA) && !isNaN(roomNumberB)) {
        return roomNumberA - roomNumberB;
      }
      
      // אחרת נמיין לפי מחרוזת
      return a.roomNumber.localeCompare(b.roomNumber);
    });
  };

  // קבלת החדרים המסוננים והממוינים לכל מיקום
  const sortedFilteredAirportRooms = sortRoomsByNumber(filterNotForSaleRooms(airportRooms));
  const sortedFilteredRothschildRooms = sortRoomsByNumber(filterNotForSaleRooms(rothschildRooms));

  return (
    <Box sx={{ px: 0, pb: 4, maxWidth: '1350px', mx: 'auto' }}>
      {/* אזור ניווט בין תאריכים */}
      <Box sx={{ px: 1 }}>
        <DashboardDateNav 
          currentDate={currentDate}
          onDateChange={handleDateChange}
        />
      </Box>
      
      {/* תצוגת חדרים עם רווח מצומצם */}
      <Grid container spacing={0.5} sx={{ px: 0.5 }}>
        <Grid item xs={12} md={6}>
          <LocationSection 
            location="rothschild" 
            rooms={sortedFilteredRothschildRooms} 
            bookings={rothschildBookings}
            loading={loading.rothschildRooms || loading.rothschildBookings}
            onRoomClick={handleRoomClick}
            getRoomStatus={getRoomStatusForCurrentDate}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <LocationSection 
            location="airport" 
            rooms={sortedFilteredAirportRooms} 
            bookings={airportBookings}
            loading={loading.airportRooms || loading.airportBookings}
            onRoomClick={handleRoomClick}
            getRoomStatus={getRoomStatusForCurrentDate}
          />
        </Grid>
      </Grid>

      {/* חלון הזמנה חדשה */}
      {newBookingOpen && (
        <NewBookingForm
          open={newBookingOpen}
          onClose={handleCloseNewBooking}
          onSave={handleSaveBooking}
          initialData={initialData}
          rooms={getLocationRooms(bookingLocation)}
          location={bookingLocation}
        />
      )}

      {/* חלון עריכת הזמנה */}
      {editBookingOpen && (
        <NewBookingForm
          open={editBookingOpen}
          onClose={handleCloseEditBooking}
          onSave={handleUpdateBooking}
          onDelete={handleDeleteBooking}
          editBooking={editBookingData}
          rooms={getLocationRooms(bookingLocation)}
          location={bookingLocation}
        />
      )}

      {/* הודעות מערכת */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard; 
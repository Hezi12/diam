import React, { useState, useEffect, useCallback } from 'react';
import { Box, useMediaQuery, useTheme, Snackbar, Alert, Container, Typography } from '@mui/material';
import axios from 'axios';
import { format, addDays, subDays, differenceInDays } from 'date-fns';
import { STYLE_CONSTANTS } from '../design-system/styles/StyleConstants';
import { useSnackbar } from 'notistack';

// רכיבים מקומיים
import BookingTabs from '../components/bookings/BookingTabs';
import DateNavigation from '../components/bookings/DateNavigation';
import BookingsCalendar from '../components/bookings/BookingsCalendar';
import NewBookingForm from '../components/bookings/NewBookingForm';
import BookingSearchDialog from '../components/bookings/BookingSearchDialog';
import BookingDetails from '../components/bookings/BookingDetails';

/**
 * דף ניהול ההזמנות הראשי
 * בעיצוב החדש המותאם לדוגמאות BookingCalendarExamples
 */
const Bookings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const colors = STYLE_CONSTANTS.colors;
  const { enqueueSnackbar } = useSnackbar();
  
  // מצב מיקום
  const [location, setLocation] = useState('airport');
  
  // מצב חיפוש
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  
  // מצב תאריכים - ברירת מחדל: 10 ימים במקום 7
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 3), // 3 ימים אחורה
    endDate: addDays(new Date(), 6)   // 6 ימים קדימה (סה"כ 10 ימים)
  });
  
  // מצב טעינת נתונים
  const [loading, setLoading] = useState({
    rooms: true,
    bookings: true
  });
  
  // מצב הנתונים
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // מצב חלון הזמנה חדשה
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  
  // מצב הודעות
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'info', 'warning'
  });
  
  // מצב חלון פרטי הזמנה
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  
  // מצב נתונים לטופס הזמנה חדשה
  const [prefilledBookingData, setPrefilledBookingData] = useState(null);
  
  // מצב חלון עריכת הזמנה
  const [editBookingOpen, setEditBookingOpen] = useState(false);
  const [editBookingData, setEditBookingData] = useState(null);
  
  // טעינת החדרים לפי מיקום
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(prev => ({ ...prev, rooms: true }));
      try {
        const response = await axios.get(`/api/rooms/location/${location}`);
        setRooms(response.data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        showNotification('שגיאה בטעינת רשימת החדרים', 'error');
      } finally {
        setLoading(prev => ({ ...prev, rooms: false }));
      }
    };
    
    fetchRooms();
  }, [location]);
  
  // טעינת ההזמנות לפי מיקום וטווח תאריכים
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(prev => ({ ...prev, bookings: true }));
      try {
        // פורמט תאריכים לשליחה ל-API
        const startStr = format(dateRange.startDate, 'yyyy-MM-dd');
        const endStr = format(dateRange.endDate, 'yyyy-MM-dd');
        
        const response = await axios.get(`/api/bookings/date-range`, {
          params: {
            startDate: startStr,
            endDate: endStr,
            location
          }
        });
        
        console.log('הזמנות שהגיעו מהשרת:', response.data);
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        showNotification('שגיאה בטעינת ההזמנות', 'error');
      } finally {
        setLoading(prev => ({ ...prev, bookings: false }));
      }
    };
    
    // רק אם אין חיפוש פעיל, נטען את כל ההזמנות
    if (!searchQuery.trim()) {
      fetchBookings();
    }
  }, [location, dateRange.startDate, dateRange.endDate, searchQuery]);
  
  // חיפוש הזמנות
  useEffect(() => {
    const searchBookings = async () => {
      // אם אין מחרוזת חיפוש, נטען את כל ההזמנות מחדש
      if (!searchQuery.trim()) {
        return;
      }
      
      setIsSearching(true);
      setLoading(prev => ({ ...prev, bookings: true }));
      
      try {
        const response = await axios.get(`/api/bookings/search`, {
          params: {
            query: searchQuery,
            location
          }
        });
        setBookings(response.data);
      } catch (error) {
        console.error('Error searching bookings:', error);
        showNotification('שגיאה בחיפוש הזמנות', 'error');
      } finally {
        setLoading(prev => ({ ...prev, bookings: false }));
        setIsSearching(false);
      }
    };
    
    // השהייה קצרה כדי לא לשלוח יותר מדי בקשות
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchBookings();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, location]);
  
  // טיפול בשינוי מיקום
  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
    setSearchQuery(''); // ניקוי החיפוש בעת מעבר בין מיקומים
  };
  
  // טיפול בשינוי טווח תאריכים
  const handleDateRangeChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
  };
  
  // טיפול בלחיצה על הזמנה קיימת לעריכה
  const handleBookingClick = useCallback((bookingId) => {
    console.log('נלחץ על הזמנה:', bookingId);
    
    // מציאת ההזמנה ממערך ההזמנות
    const selectedBooking = bookings.find(b => b._id === bookingId);
    
    if (selectedBooking) {
      // טיפול בפורמט החדר לפני העברת הנתונים
      if (selectedBooking.room && typeof selectedBooking.room === 'object' && selectedBooking.room._id) {
        console.log('המרת אובייקט room למזהה:', selectedBooking.room._id);
        selectedBooking.room = selectedBooking.room._id;
      }
      
      console.log('פתיחת טופס עריכה עם נתונים:', {
        id: selectedBooking._id,
        checkIn: selectedBooking.checkIn,
        checkOut: selectedBooking.checkOut,
        room: selectedBooking.room,
        firstName: selectedBooking.firstName
      });
      
      // פתיחת חלון העריכה
      setEditBookingData(selectedBooking);
      setEditBookingOpen(true);
    } else {
      console.error('לא נמצאה הזמנה עם מזהה:', bookingId);
      enqueueSnackbar('לא ניתן לטעון את פרטי ההזמנה', { variant: 'error' });
    }
  }, [bookings, enqueueSnackbar]);
  
  // טיפול בלחיצה על תא ריק בלוח השנה
  const handleCreateBookingFromCell = useCallback((date, roomId, locationName) => {
    console.log('יצירת הזמנה חדשה מלוח:', date, roomId, locationName);
    
    // וידוא שהתאריך הוא אובייקט תאריך
    const checkInDate = new Date(date);
    // יצירת תאריך יציאה יום אחד אחרי
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1);
    
    // חישוב מספר לילות
    const nights = differenceInDays(checkOutDate, checkInDate);

    // יצירת אובייקט מידע מקדים להזמנה
    setPrefilledBookingData({
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: nights > 0 ? nights : 1,
      location: locationName
    });
    
    setNewBookingOpen(true);
  }, []);
  
  // טיפול בלחיצה על כפתור החיפוש
  const handleSearchClick = () => {
    setSearchDialogOpen(true);
  };
  
  // טיפול בסגירת חלון החיפוש
  const handleCloseSearchDialog = () => {
    setSearchDialogOpen(false);
  };
  
  // טיפול בשמירת הזמנה חדשה
  const handleSaveBooking = async (bookingData) => {
    try {
      const response = await axios.post('/api/bookings', bookingData);
      
      // סגירת הטופס
      setNewBookingOpen(false);
      
      // הצגת הודעת הצלחה
      showNotification('ההזמנה נשמרה בהצלחה!', 'success');
      
      // רענון רשימת ההזמנות
      refreshBookings();
      
      return response.data;
    } catch (error) {
      console.error('Error saving booking:', error);
      
      let errorMessage = 'שגיאה בשמירת ההזמנה';
      
      // בדיקה אם יש התנגשות עם הזמנה קיימת
      if (error.response?.data?.conflict) {
        const { guestName, checkIn, checkOut } = error.response.data.conflict;
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        errorMessage = `החדר כבר מוזמן בתאריכים אלו על ידי ${guestName} ` +
          `(${format(checkInDate, 'dd/MM/yyyy')} - ${format(checkOutDate, 'dd/MM/yyyy')})`;
          
        showNotification(errorMessage, 'warning');
      } 
      // בדיקה אם יש שגיאת וולידציה
      else if (error.response?.data?.message && error.response?.data?.error) {
        errorMessage = `שגיאה: ${error.response.data.message} - ${error.response.data.error}`;
        showNotification(errorMessage, 'error');
      }
      // בדיקה אם יש הודעת שגיאה מהשרת
      else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        showNotification(errorMessage, 'error');
      }
      // שגיאה כללית
      else {
        showNotification(errorMessage, 'error');
      }
      
      console.log('פרטי השגיאה המלאים:', error.response?.data || error.message);
      
      // לא סוגרים את הטופס במקרה של שגיאה, כדי לאפשר למשתמש לתקן
      return null;
    }
  };
  
  // רענון רשימת ההזמנות
  const refreshBookings = async () => {
    setLoading(prev => ({ ...prev, bookings: true }));
    try {
      const startStr = format(dateRange.startDate, 'yyyy-MM-dd');
      const endStr = format(dateRange.endDate, 'yyyy-MM-dd');
      
      const response = await axios.get(`/api/bookings/date-range`, {
        params: {
          startDate: startStr,
          endDate: endStr,
          location
        }
      });
      
      setBookings(response.data);
    } catch (error) {
      console.error('Error refreshing bookings:', error);
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  };
  
  // הצגת הודעה
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  // סגירת הודעה
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // טיפול בשינוי ערך החיפוש
  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };
  
  // טיפול בעדכון הזמנה
  const handleUpdateBooking = async (updatedBookingData) => {
    try {
      // עדכון ההזמנה בשרת
      await axios.put(`/api/bookings/${updatedBookingData._id}`, updatedBookingData);
      
      // סגירת חלון עריכה
      setEditBookingOpen(false);
      
      // הצגת הודעת הצלחה
      showNotification('ההזמנה עודכנה בהצלחה', 'success');
      
      // רענון רשימת ההזמנות
      refreshBookings();
      
      return true;
    } catch (error) {
      console.error('Error updating booking:', error);
      
      let errorMessage = 'שגיאה בעדכון ההזמנה';
      
      // בדיקה אם יש התנגשות עם הזמנה קיימת
      if (error.response?.data?.conflict) {
        const { guestName, checkIn, checkOut } = error.response.data.conflict;
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        errorMessage = `החדר כבר מוזמן בתאריכים אלו על ידי ${guestName} ` +
          `(${format(checkInDate, 'dd/MM/yyyy')} - ${format(checkOutDate, 'dd/MM/yyyy')})`;
          
        showNotification(errorMessage, 'warning');
      } 
      // שגיאה כללית
      else {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        showNotification(errorMessage, 'error');
      }
      
      return false;
    }
  };
  
  // טיפול במחיקת הזמנה
  const handleDeleteBooking = async (bookingId) => {
    try {
      // מחיקת ההזמנה בשרת
      await axios.delete(`/api/bookings/${bookingId}`);
      
      // סגירת חלון פרטי הזמנה
      setBookingDetailsOpen(false);
      setEditBookingOpen(false);
      
      // רענון רשימת ההזמנות
      await refreshBookings();
      
      // הצגת הודעת הצלחה אחרי רענון הרשימה
      setTimeout(() => {
        showNotification('ההזמנה נמחקה בהצלחה', 'success');
      }, 500);
      
    } catch (error) {
      console.error('שגיאה במחיקת הזמנה:', error);
      
      // הצגת הודעת שגיאה
      let errorMessage = 'שגיאה במחיקת ההזמנה';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showNotification(errorMessage, 'error');
    }
  };
  
  return (
    <Container sx={{ pb: 4, maxWidth: { xs: '100%', xl: '1400px' } }}>
      {/* כותרת */}
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          textAlign: 'right', 
          fontWeight: 600, 
          mb: 4, 
          color: colors.text.primary 
        }}
      >
        ניהול הזמנות
      </Typography>
      
      {/* טאבים למעבר בין מיקומים עם חיפוש והזמנה חדשה */}
      <BookingTabs
        location={location}
        onLocationChange={handleLocationChange}
        onSearchClick={handleSearchClick}
        onAddBookingClick={() => setNewBookingOpen(true)}
      />
      
      {/* אזור בחירת וניווט תאריכים */}
      <DateNavigation
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onDateRangeChange={handleDateRangeChange}
        location={location}
      />
      
      {/* טבלת הזמנות על מסך מלא */}
      <Box sx={{ mt: 2 }}>
        <BookingsCalendar
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          rooms={rooms}
          bookings={bookings}
          loading={loading.bookings}
          onBookingClick={handleBookingClick}
          onCreateBooking={handleCreateBookingFromCell}
          location={location}
        />
      </Box>
      
      {/* חלון הזמנה חדשה */}
      <NewBookingForm
        open={newBookingOpen}
        onClose={() => {
          setNewBookingOpen(false);
          setPrefilledBookingData(null);
        }}
        onSave={handleSaveBooking}
        rooms={rooms}
        location={location}
        initialData={prefilledBookingData}
      />
      
      {/* חלון עריכה - משתמש באותו קומפוננט כמו הזמנה חדשה */}
      <NewBookingForm
        open={editBookingOpen}
        onClose={() => setEditBookingOpen(false)}
        onSave={handleUpdateBooking}
        onDelete={handleDeleteBooking}
        rooms={rooms}
        location={location}
        editBooking={editBookingData}
      />
      
      {/* חלון פרטי הזמנה */}
      <BookingDetails
        open={bookingDetailsOpen}
        onClose={() => setBookingDetailsOpen(false)}
        bookingId={selectedBookingId}
        onDelete={handleDeleteBooking}
        onUpdate={handleUpdateBooking}
        location={location}
      />
      
      {/* דיאלוג החיפוש */}
      <BookingSearchDialog
        open={searchDialogOpen}
        onClose={handleCloseSearchDialog}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        location={location}
        isSearching={isSearching}
      />
      
      {/* הודעות */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
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
    </Container>
  );
};

export default Bookings; 
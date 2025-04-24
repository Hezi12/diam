import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Modal,
  Button,
  useTheme,
  Menu,
  MenuItem
} from '@mui/material';
import { format, addDays, differenceInDays, isSameDay, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SettingsIcon from '@mui/icons-material/Settings';

// רכיבים חדשים להזמנות
import NewBookingForm from '../bookings/NewBookingForm';
import EditBookingForm from '../bookings/EditBookingForm';

// מידת צבעים לפי מיקום
const locationColors = {
  airport: '#64d2ff',
  rothschild: '#5e5ce6'
};

// מידת צבעים לפי סטטוס
const statusColors = {
  pending: '#ff9800',
  confirmed: '#4caf50',
  checkedIn: '#2196f3',
  checkedOut: '#9c27b0',
  cancelled: '#e91e63'
};

/**
 * רכיב לוח גאנט לצפייה בהזמנות
 */
const GanttChart = ({ 
  startDate, 
  endDate, 
  bookings, 
  rooms, 
  location, 
  selectedRoom,
  onDateRangeChange,
  loading,
  onBookingAdded,
  onBookingUpdated,
  onBookingDeleted
}) => {
  const theme = useTheme();
  
  // מצבים לטפסים
  const [isNewBookingFormOpen, setIsNewBookingFormOpen] = useState(false);
  const [isEditBookingFormOpen, setIsEditBookingFormOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  
  // יצירת מערך של תאריכים לתצוגה
  const dateArray = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dateArray.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  // טיפול בלחיצה על כפתור הבא (שבוע הבא)
  const handleNextWeek = () => {
    const newStartDate = addDays(startDate, 7);
    const newEndDate = addDays(endDate, 7);
    onDateRangeChange(newStartDate, newEndDate);
  };

  // טיפול בלחיצה על כפתור הקודם (שבוע קודם)
  const handlePrevWeek = () => {
    const newStartDate = addDays(startDate, -7);
    const newEndDate = addDays(endDate, -7);
    onDateRangeChange(newStartDate, newEndDate);
  };

  // טיפול בלחיצה על הזמנה קיימת
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setIsEditBookingFormOpen(true);
  };

  // טיפול בלחיצה על תא ריק (יצירת הזמנה חדשה)
  const handleEmptyCellClick = (roomId, date) => {
    const selectedRoom = rooms.find(room => room._id === roomId);
    
    setSelectedCell({
      roomId,
      date,
      roomNumber: selectedRoom?.roomNumber || '',
      category: selectedRoom?.category || ''
    });
    
    setIsNewBookingFormOpen(true);
  };

  // טיפול בשמירת הזמנה חדשה
  const handleNewBookingSave = (booking) => {
    onBookingAdded(booking);
    setIsNewBookingFormOpen(false);
  };

  // טיפול בשמירת עדכון הזמנה קיימת
  const handleBookingUpdate = (booking) => {
    onBookingUpdated(booking);
    setIsEditBookingFormOpen(false);
  };

  // טיפול במחיקת הזמנה
  const handleBookingDelete = (bookingId) => {
    onBookingDeleted(bookingId);
    setIsEditBookingFormOpen(false);
  };

  // סגירת טפסים
  const handleCloseNewBookingForm = () => {
    setIsNewBookingFormOpen(false);
  };

  const handleCloseEditBookingForm = () => {
    setIsEditBookingFormOpen(false);
    setSelectedBooking(null);
  };

  // רנדור הזמנה בלוח
  const renderBooking = (booking, roomId) => {
    // בדיקה שההזמנה מתאימה לחדר הנוכחי
    if (booking.room._id !== roomId && booking.room !== roomId) {
      return null;
    }
    
    // חישוב מיקום ההזמנה בלוח
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    
    // קיצור שם האורח אם ארוך מדי
    const shortName = booking.guestName.length > 12 
      ? booking.guestName.substring(0, 10) + '...' 
      : booking.guestName;
    
    // צבע לפי מיקום
    const bookingColor = locationColors[booking.location] || locationColors.airport;
    
    // צבע גבול לפי סטטוס
    const borderColor = statusColors[booking.status] || statusColors.pending;
    
    // היכן להתחיל את תצוגת ההזמנה
    const startVisible = checkIn < startDate ? startDate : checkIn;
    
    // היכן לסיים את תצוגת ההזמנה
    const endVisible = checkOut > endDate ? endDate : checkOut;
    
    // חישוב מספר הימים שיש להציג
    const visibleDays = differenceInDays(endVisible, startVisible) + 1;
    
    // חישוב מיקום התחלת ההזמנה בלוח (יחסית לתאריך ההתחלה המוצג)
    const startOffset = differenceInDays(startVisible, startDate);
    
    // רוחב התא
    const cellWidth = 100 / dateArray.length;
    
    // מיקום התחלה באחוזים
    const startPercent = startOffset * cellWidth;
    
    // רוחב ההזמנה באחוזים
    const widthPercent = visibleDays * cellWidth;
    
    return (
      <Box
        key={booking._id}
        onClick={() => handleBookingClick(booking)}
        sx={{
          position: 'absolute',
          left: `${startPercent}%`,
          width: `${widthPercent}%`,
          top: '4px',
          bottom: '4px',
          backgroundColor: `${bookingColor}22`,
          border: `2px solid ${borderColor}`,
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: '12px',
          overflow: 'hidden',
          zIndex: 2,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          '&:hover': {
            backgroundColor: `${bookingColor}44`,
            boxShadow: '0 0 8px rgba(0,0,0,0.1)'
          }
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#333' }}>
          {shortName}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      {/* כותרת ובקרי ניווט */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center">
          <Typography variant="h6" component="h2">
            {format(startDate, 'dd/MM/yyyy', { locale: he })} - {format(endDate, 'dd/MM/yyyy', { locale: he })}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center">
          <IconButton onClick={handlePrevWeek} color="primary" size="small">
            <ChevronRightIcon />
          </IconButton>
          <IconButton onClick={handleNextWeek} color="primary" size="small">
            <ChevronLeftIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* לוח הגאנט */}
      <Paper elevation={0} sx={{ border: '1px solid #eaeaea', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Grid container sx={{ minWidth: dateArray.length * 100 }}>
              {/* כותרות תאריכים */}
              <Grid item xs={12} sx={{ borderBottom: '1px solid #eaeaea', display: 'flex' }}>
                <Box sx={{ flexBasis: '180px', minWidth: '180px', p: 1, borderRight: '1px solid #eaeaea' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    חדרים / תאריכים
                  </Typography>
                </Box>
                
                {dateArray.map((date, index) => (
                  <Box
                    key={index}
                    sx={{
                      flex: 1,
                      p: 1,
                      textAlign: 'center',
                      borderRight: index < dateArray.length - 1 ? '1px solid #eaeaea' : 'none',
                      backgroundColor: isSameDay(date, new Date()) ? '#e8f4fd' : 'transparent'
                    }}
                  >
                    <Typography variant="caption" display="block">
                      {format(date, 'EEE', { locale: he })}
                    </Typography>
                    <Typography variant="subtitle2">
                      {format(date, 'dd/MM', { locale: he })}
                    </Typography>
                  </Box>
                ))}
              </Grid>
              
              {/* שורות חדרים */}
              {rooms.map((room) => (
                <Grid 
                  item 
                  xs={12} 
                  key={room._id} 
                  sx={{ 
                    display: 'flex',
                    borderBottom: '1px solid #eaeaea',
                    backgroundColor: selectedRoom === room._id ? 'rgba(245, 245, 255, 0.6)' : 'transparent'
                  }}
                >
                  {/* תא מידע על החדר */}
                  <Box
                    sx={{
                      flexBasis: '180px',
                      minWidth: '180px',
                      p: 1,
                      borderRight: '1px solid #eaeaea',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {room.roomNumber}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {room.category} • {room.maxGuests} אורחים
                    </Typography>
                  </Box>
                  
                  {/* תאי תאריכים */}
                  {dateArray.map((date, dateIndex) => {
                    // האם יש הזמנה באותו תאריך וחדר
                    const hasBooking = bookings.some(booking => {
                      const checkIn = new Date(booking.checkIn);
                      const checkOut = new Date(booking.checkOut);
                      return (
                        (booking.room._id === room._id || booking.room === room._id) && 
                        isWithinInterval(date, { start: checkIn, end: addDays(checkOut, -1) })
                      );
                    });
                    
                    return (
                      <Box
                        key={dateIndex}
                        onClick={() => !hasBooking && handleEmptyCellClick(room._id, date)}
                        sx={{
                          flex: 1,
                          p: 1,
                          position: 'relative',
                          minHeight: '60px',
                          borderRight: dateIndex < dateArray.length - 1 ? '1px solid #eaeaea' : 'none',
                          backgroundColor: isSameDay(date, new Date()) ? 'rgba(232, 244, 253, 0.3)' : 'transparent',
                          cursor: hasBooking ? 'default' : 'pointer',
                          '&:hover': {
                            backgroundColor: hasBooking ? '' : 'rgba(0, 0, 0, 0.03)'
                          }
                        }}
                      />
                    );
                  })}
                  
                  {/* שכבה עליונה - הצגת ההזמנות */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: '180px',
                      right: 0,
                      bottom: 0,
                      pointerEvents: 'none'
                    }}
                  >
                    {bookings.map((booking) => (
                      <Box key={booking._id} sx={{ pointerEvents: 'auto' }}>
                        {renderBooking(booking, room._id)}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* טופס הזמנה חדשה */}
      <NewBookingForm
        open={isNewBookingFormOpen}
        onClose={handleCloseNewBookingForm}
        onSave={handleNewBookingSave}
        location={location}
        rooms={rooms}
        initialData={selectedCell ? {
          room: selectedCell.roomId,
          checkIn: selectedCell.date,
          checkOut: addDays(selectedCell.date, 1)
        } : null}
      />
      
      {/* טופס עריכת הזמנה */}
      <EditBookingForm
        open={isEditBookingFormOpen}
        onClose={handleCloseEditBookingForm}
        onSave={handleBookingUpdate}
        onDelete={handleBookingDelete}
        booking={selectedBooking}
        location={location}
        rooms={rooms}
      />
    </Box>
  );
};

export default GanttChart; 
import { format } from 'date-fns';
import axios from 'axios';

/**
 * פונקציה לטעינת החדרים לפי מיקום
 */
export const fetchRooms = async (location, setLoading, setRoomsCallback) => {
  setLoading(prev => ({ ...prev, [`${location}Rooms`]: true }));
  try {
    const response = await axios.get(`/api/rooms/location/${location}`);
    setRoomsCallback(response.data);
    console.log(`נטענו ${response.data.length} חדרים עבור ${location}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${location} rooms:`, error);
    return [];
  } finally {
    setLoading(prev => ({ ...prev, [`${location}Rooms`]: false }));
  }
};

/**
 * פונקציה לטעינת ההזמנות לפי מיקום ותאריך
 * נשנה את תאריך ההתחלה והסוף כדי לטעון הזמנות מטווח רחב יותר
 */
export const fetchBookings = async (location, currentDate, setLoading, setBookingsCallback) => {
  setLoading(prev => ({ ...prev, [`${location}Bookings`]: true }));
  try {
    // פורמט תאריכים לשליחה ל-API - נרחיב את הטווח ל-7 ימים קדימה ו-7 ימים אחורה
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - 7);
    
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + 7);
    
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    console.log(`מחפש הזמנות בין ${startDateStr} ל-${endDateStr} עבור ${location}`);
    
    const response = await axios.get(`/api/bookings/date-range`, {
      params: {
        startDate: startDateStr,
        endDate: endDateStr,
        location
      }
    });
    
    // הדפסת לוג לבדיקה
    console.log(`התקבלו ${response.data.length} הזמנות עבור ${location}:`, response.data);
    
    setBookingsCallback(response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${location} bookings:`, error);
    return [];
  } finally {
    setLoading(prev => ({ ...prev, [`${location}Bookings`]: false }));
  }
};

/**
 * פונקציה לקבלת סטטוס חדר על פי ההזמנות
 */
export const getRoomStatus = (roomId, bookings, currentDate) => {
  if (!bookings || bookings.length === 0) {
    return { status: 'empty', booking: null };
  }
  
  // איפוס שעות בתאריך הנוכחי
  const currentDateNoTime = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    0, 0, 0
  );
  
  // מציאת ההזמנה לחדר בתאריך הנוכחי - יש לטפל בפורמט התאריכים נכון
  const booking = bookings.find(b => {
    // וידוא שזה החדר הנכון
    const isCorrectRoom = (b.room === roomId || 
                         (b.room && typeof b.room === 'object' && b.room._id === roomId));
    
    // וידוא שההזמנה לא בוטלה
    const isNotCancelled = b.status !== 'cancelled';
    
    if (!isCorrectRoom || !isNotCancelled) return false;
    
    // המרת תאריכים לאובייקטי Date
    const checkInDate = new Date(b.checkIn);
    const checkOutDate = new Date(b.checkOut);
    
    // איפוס שעות בתאריכים לצורך השוואה מדויקת
    const checkInDateNoTime = new Date(
      checkInDate.getFullYear(),
      checkInDate.getMonth(),
      checkInDate.getDate(),
      0, 0, 0
    );
    
    const checkOutDateNoTime = new Date(
      checkOutDate.getFullYear(),
      checkOutDate.getMonth(),
      checkOutDate.getDate(),
      0, 0, 0
    );
    
    // בדיקה אם התאריך הנוכחי בין תאריך צ'ק-אין לצ'ק-אאוט
    const isWithinStay = (
      // צ'ק-אין חל ביום הנוכחי או לפניו
      checkInDateNoTime <= currentDateNoTime && 
      // צ'ק-אאוט אחרי היום הנוכחי (כי יום הצ'ק-אאוט כבר לא נחשב יום לינה)
      checkOutDateNoTime > currentDateNoTime
    );
    
    if (isWithinStay) {
      console.log(`נמצאה הזמנה עבור חדר ${roomId} בתאריך ${currentDateNoTime.toISOString().split('T')[0]}: ${b._id}`);
    }
    
    return isWithinStay;
  });

  if (!booking) return { status: 'empty', booking: null };

  // המרת תאריכים נכונה לאובייקטי Date (בלי להסתמך על שעות)
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  
  // איפוס שעות
  const checkInDateNoTime = new Date(
    checkInDate.getFullYear(),
    checkInDate.getMonth(), 
    checkInDate.getDate(),
    0, 0, 0
  );
  
  const checkOutDateNoTime = new Date(
    checkOutDate.getFullYear(),
    checkOutDate.getMonth(),
    checkOutDate.getDate(),
    0, 0, 0
  );
  
  // בדיקת סטטוס תאריכים
  const isCheckInToday = +currentDateNoTime === +checkInDateNoTime;
  const isCheckOutToday = +currentDateNoTime === +checkOutDateNoTime;
  
  // קביעת סטטוס על פי התאריכים
  if (isCheckInToday) {
    return { status: 'check-in', booking };
  }
  
  if (isCheckOutToday) {
    return { status: 'check-out', booking };
  }
  
  return { status: 'occupied', booking };
};

/**
 * פונקציה לשמירת הזמנה חדשה
 */
export const saveBooking = async (bookingData, location) => {
  try {
    // וידוא שנתוני ההזמנה תקינים
    if (!bookingData.firstName || !bookingData.lastName || !bookingData.room) {
      console.error('נתוני הזמנה חסרים:', bookingData);
      return { success: false, error: 'נתוני הזמנה חסרים' };
    }

    // וידוא שיש מיקום להזמנה
    if (!bookingData.location) {
      bookingData.location = location;
    }

    // המרת תאריכים לפורמט ISO לשרת
    const formattedData = {
      ...bookingData,
      checkIn: bookingData.checkIn ? new Date(bookingData.checkIn).toISOString() : null,
      checkOut: bookingData.checkOut ? new Date(bookingData.checkOut).toISOString() : null,
    };

    // וידוא שסטטוס ההזמנה מוגדר
    if (!formattedData.status) {
      formattedData.status = 'pending';
    }

    console.log('שולח נתוני הזמנה לשרת:', formattedData);
    
    const response = await axios.post('/api/bookings', formattedData);
    
    console.log('תשובת השרת:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error saving booking:', error);
    console.log('שגיאת שרת:', error.response?.data);
    return { 
      success: false, 
      error: error.response?.data?.message || 'שגיאה בשמירת ההזמנה',
      details: error.response?.data
    };
  }
};

/**
 * פונקציה לעדכון הזמנה קיימת
 */
export const updateBooking = async (updatedBookingData, location) => {
  try {
    // וידוא שנתוני ההזמנה תקינים
    if (!updatedBookingData._id) {
      console.error('מזהה הזמנה חסר:', updatedBookingData);
      return { success: false, error: 'מזהה הזמנה חסר' };
    }

    // וידוא שיש מיקום להזמנה
    if (!updatedBookingData.location) {
      updatedBookingData.location = location;
    }

    // המרת תאריכים לפורמט ISO לשרת
    const formattedData = {
      ...updatedBookingData,
      checkIn: updatedBookingData.checkIn ? new Date(updatedBookingData.checkIn).toISOString() : null,
      checkOut: updatedBookingData.checkOut ? new Date(updatedBookingData.checkOut).toISOString() : null,
    };
    
    // במקרה שחדר הוא אובייקט, לקחת רק את ה-ID
    if (formattedData.room && typeof formattedData.room === 'object') {
      formattedData.room = formattedData.room._id;
    }

    console.log('שולח נתוני עדכון הזמנה לשרת:', formattedData);
    
    const response = await axios.put(`/api/bookings/${formattedData._id}`, formattedData);
    
    console.log('תשובת השרת:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating booking:', error);
    console.log('שגיאת שרת:', error.response?.data);
    return { 
      success: false, 
      error: error.response?.data?.message || 'שגיאה בעדכון ההזמנה',
      details: error.response?.data
    };
  }
};

/**
 * פונקציה למחיקת הזמנה
 */
export const deleteBooking = async (bookingId) => {
  try {
    if (!bookingId) {
      return { success: false, error: 'מזהה הזמנה חסר' };
    }
    
    await axios.delete(`/api/bookings/${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting booking:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'שגיאה במחיקת ההזמנה'
    };
  }
}; 
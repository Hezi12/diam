import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  styled,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { format, eachDayOfInterval, isEqual, isSameDay, addDays, subDays, isWithinInterval, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InfoIcon from '@mui/icons-material/Info';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';

// רכיב מותאם לתא הזמנה בסגנון גאנט עם תמיכה ב-drag & drop
const GanttBar = styled(Box)(({ theme, status, startOffset, length, variant, isDragging, isDragOver }) => ({
  position: 'absolute',
  height: variant === 'full' ? '100%' : '70%',
  left: `${startOffset}%`,
  width: `${length}%`,
  borderRadius: '6px',
  transition: isDragging ? 'none' : 'all 0.15s ease-in-out',
  padding: '8px 8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  cursor: 'grab',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  zIndex: isDragging ? 10 : 2,
  opacity: isDragging ? 0.8 : 1,
  transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
  boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
  '&:active': {
    cursor: 'grabbing',
  },
  '&:hover': {
    transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'translateY(-3px)',
    boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.3)' : '0 4px 8px rgba(0,0,0,0.15)',
  }
}));

// רכיב תא עם תמיכה ב-drop zone
const DropZoneCell = styled(Box)(({ theme, isValidDropZone, isDragOver }) => ({
  position: 'relative',
  minHeight: '60px',
  border: '1px solid transparent',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
  backgroundColor: isDragOver && isValidDropZone ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
  borderColor: isDragOver && isValidDropZone ? '#4caf50' : 'transparent',
  borderWidth: isDragOver && isValidDropZone ? '2px' : '1px',
  '&::after': {
    content: isDragOver && isValidDropZone ? '"שחרר כאן"' : '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '12px',
    color: '#4caf50',
    fontWeight: 'bold',
    pointerEvents: 'none',
    opacity: isDragOver && isValidDropZone ? 1 : 0,
    transition: 'opacity 0.2s ease'
  }
}));

/**
 * רכיב לוח ההזמנות המרכזי המציג את הזמנות החדרים על פני תקופת זמן
 * מעוצב בסגנון גאנט מודרני עם תמיכה ב-drag & drop
 */
const BookingsCalendar = ({
  startDate,
  endDate,
  rooms,
  bookings,
  loading,
  onBookingClick,
  location,
  onCreateBooking,
  onBookingUpdate // פונקציה חדשה לעדכון הזמנה
}) => {
  const colors = STYLE_CONSTANTS.colors;
  const locationColors = colors[location] || colors.airport;

  // State לניהול drag & drop
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedBooking: null,
    dragOver: null,
    startPos: null
  });
  
  // State להודעות
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // יצירת מערך של כל הימים בטווח הנבחר
  const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

  // === פונקציות Drag & Drop ===

  // התחלת גרירה
  const handleDragStart = (e, booking) => {
    console.log('🎯 התחלת גרירת הזמנה:', booking.firstName, booking.lastName);
    
    // מניעת event bubbling
    e.stopPropagation();
    
    setDragState({
      isDragging: true,
      draggedBooking: booking,
      dragOver: null,
      startPos: { x: e.clientX, y: e.clientY }
    });

    // הגדרת נתונים לדאטה transfer
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      bookingId: booking._id,
      originalRoom: booking.room._id || booking.room,
      originalCheckIn: booking.checkIn,
      originalCheckOut: booking.checkOut
    }));
  };

  // סיום גרירה
  const handleDragEnd = (e) => {
    console.log('🏁 סיום גרירה');
    setDragState({
      isDragging: false,
      draggedBooking: null,
      dragOver: null,
      startPos: null
    });
  };

  // כניסה לאזור drop
  const handleDragOver = (e, roomId, date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const dropTarget = { roomId, date: format(date, 'yyyy-MM-dd') };
    setDragState(prev => ({
      ...prev,
      dragOver: dropTarget
    }));
  };

  // יציאה מאזור drop
  const handleDragLeave = (e) => {
    // רק אם יוצאים מהאלמנט ולא עוברים לילד שלו
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragState(prev => ({
        ...prev,
        dragOver: null
      }));
    }
  };

  // שחרור ההזמנה (Drop)
  const handleDrop = async (e, newRoomId, newDate) => {
    e.preventDefault();
    
    try {
      const transferData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { bookingId, originalRoom, originalCheckIn, originalCheckOut } = transferData;
      
      if (!dragState.draggedBooking) {
        console.error('❌ לא נמצאה הזמנה נגררת');
        return;
      }

      const booking = dragState.draggedBooking;
      const newDateStr = format(newDate, 'yyyy-MM-dd');
      const originalCheckInStr = format(new Date(originalCheckIn), 'yyyy-MM-dd');
      
      // בדיקה האם ההזמנה אכן השתנתה
      const roomChanged = newRoomId !== originalRoom;
      const dateChanged = newDateStr !== originalCheckInStr;
      
      if (!roomChanged && !dateChanged) {
        console.log('📍 ההזמנה נשארה באותו מקום');
        showNotification('ההזמנה נשארה באותו מקום', 'info');
        return;
      }

      console.log('🔄 מעדכן הזמנה:', {
        bookingId,
        originalRoom,
        newRoom: newRoomId,
        originalDate: originalCheckInStr,
        newDate: newDateStr,
        roomChanged,
        dateChanged
      });

      // חישוב תאריכים חדשים (שמירה על אותו מספר לילות)
      const originalCheckInDate = new Date(originalCheckIn);
      const originalCheckOutDate = new Date(originalCheckOut);
      const nights = differenceInDays(originalCheckOutDate, originalCheckInDate);
      
      const newCheckInDate = new Date(newDate);
      const newCheckOutDate = addDays(newCheckInDate, nights);

      // יצירת אובייקט עדכון שמשמר את כל הפרטים הקיימים
      const updatedBooking = {
        ...booking,
        room: newRoomId,
        checkIn: newCheckInDate,
        checkOut: newCheckOutDate,
        // שמירה מפורשת על המחיר הקיים - לא משנים אותו!
        price: booking.price,
        pricePerNight: booking.pricePerNight,
        pricePerNightNoVat: booking.pricePerNightNoVat,
        // שמירה על כל הפרטים האחרים
        firstName: booking.firstName,
        lastName: booking.lastName,
        phone: booking.phone,
        email: booking.email,
        guests: booking.guests,
        isTourist: booking.isTourist,
        paymentStatus: booking.paymentStatus,
        creditCard: booking.creditCard,
        notes: booking.notes,
        source: booking.source,
        externalBookingNumber: booking.externalBookingNumber
      };

      // קריאה לפונקציית העדכון
      if (onBookingUpdate) {
        await onBookingUpdate(booking._id, updatedBooking);
        
        // הודעת הצלחה
        let message = '';
        if (roomChanged && dateChanged) {
          message = `ההזמנה הועברה לחדר ${getRoomNumber(newRoomId)} ותאריך ${format(newDate, 'dd/MM/yyyy')}`;
        } else if (roomChanged) {
          message = `ההזמנה הועברה לחדר ${getRoomNumber(newRoomId)}`;
        } else if (dateChanged) {
          message = `ההזמנה הועברה לתאריך ${format(newDate, 'dd/MM/yyyy')}`;
        }
        
        showNotification(message, 'success');
      }

    } catch (error) {
      console.error('❌ שגיאה בעדכון הזמנה:', error);
      showNotification('שגיאה בעדכון ההזמנה', 'error');
    } finally {
      // איפוס state הגרירה
      setDragState({
        isDragging: false,
        draggedBooking: null,
        dragOver: null,
        startPos: null
      });
    }
  };

  // פונקציה לקבלת מספר חדר
  const getRoomNumber = (roomId) => {
    const room = rooms.find(r => r._id === roomId);
    return room ? room.roomNumber : roomId;
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

  if (loading) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 0, 
          borderRadius: '14px', 
          overflow: 'hidden', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <Box sx={{ 
          height: 400, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <CircularProgress size={40} thickness={4} sx={{ color: locationColors.main, mb: 2 }} />
          <Typography color={colors.text.secondary}>טוען נתונים...</Typography>
        </Box>
      </Paper>
    );
  }

  const today = new Date();
  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);
  
  const isToday = (day) => isSameDay(day, today);
  const isFridayOrSaturday = (day) => {
    const dayOfWeek = day.getDay();
    return dayOfWeek === 5 || dayOfWeek === 6; // 5 = שישי, 6 = שבת
  };
  
  // בדיקה האם תאריך צ'ק-אין הוא אתמול, היום או מחר
  const isCheckInRelevant = (checkInDate) => {
    if (!checkInDate) return false;
    
    const dateObj = new Date(checkInDate);
    return (
      isSameDay(dateObj, yesterday) || 
      isSameDay(dateObj, today) || 
      isSameDay(dateObj, tomorrow)
    );
  };

  // המרת התאריכים לערכים מספריים לחישוב רוחב תצוגת גאנט
  const dateToIndex = {};
  daysInRange.forEach((date, index) => {
    // השתמש בפורמט תאריך ללא שעות
    const dateStr = format(date, 'yyyy-MM-dd');
    dateToIndex[dateStr] = index;
  });

  // פונקציה להמרת תאריך לפורמט אחיד ללא שעות
  const normalizeDate = (date) => {
    if (!date) return null;
    const dateObj = new Date(date);
    // החזר תאריך בפורמט yyyy-MM-dd
    return format(dateObj, 'yyyy-MM-dd');
  };

  // טיפול בלחיצה על תא ריק בלוח
  const handleEmptyCellClick = (roomId, day) => {
    // כאשר לוחצים על תא, מפעילים את הפונקציה שתפתח חלון הזמנה חדשה
    if (onCreateBooking) {
      onCreateBooking(
        day,
        roomId,
        location
      );
    } else {
      console.log(`Empty cell clicked: Room ${roomId}, Day: ${format(day, 'yyyy-MM-dd')}`);
    }
  };

  // סטטוס צבעים להזמנות - גווני כחול
  const bookingStatusColors = {
    confirmed: {
      bgColor: `rgba(41, 128, 185, 0.2)`, // כחול עמוק
      borderColor: `#2980b9`,
      textColor: `#1a5276`
    },
    pending: {
      bgColor: `rgba(52, 152, 219, 0.2)`, // כחול בהיר
      borderColor: `#3498db`,
      textColor: `#21618c`
    },
    cancelled: {
      bgColor: `rgba(93, 173, 226, 0.2)`, // כחול בהיר יותר
      borderColor: `#5dade2`,
      textColor: `#2874a6`
    }
  };

  // צבעים מיוחדים להזמנות מבוקינג - גווני ירוק
  const bookingSourceColors = {
    booking: {
      confirmed: {
        bgColor: `rgba(39, 174, 96, 0.2)`, // ירוק עמוק
        borderColor: `#27ae60`,
        textColor: `#186a3b`
      },
      pending: {
        bgColor: `rgba(46, 204, 113, 0.2)`, // ירוק בהיר
        borderColor: `#2ecc71`,
        textColor: `#1e8449`
      },
      cancelled: {
        bgColor: `rgba(88, 214, 141, 0.2)`, // ירוק בהיר יותר
        borderColor: `#58d68d`,
        textColor: `#229954`
      }
    }
  };

  // יצירת קישור לוואטסאפ
  const createWhatsAppLink = (phoneNumber) => {
    if (!phoneNumber) return null;
    
    // ניקוי המספר מתווים שאינם ספרות
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // אם המספר מתחיל ב-0, נחליף ל-972
    let formattedNumber = cleanNumber;
    if (cleanNumber.startsWith('0')) {
      formattedNumber = `972${cleanNumber.substring(1)}`;
    }
    
    return `https://wa.me/${formattedNumber}`;
  };

  // פונקציה לזיהוי הזמנות חופפות
  const findOverlappingBookings = (currentBooking, roomBookings) => {
    const currentStart = new Date(currentBooking.checkIn);
    const currentEnd = new Date(currentBooking.checkOut);
    
    return roomBookings.filter(booking => {
      if (booking._id === currentBooking._id) return false;
      
      const bookingStart = new Date(booking.checkIn);
      const bookingEnd = new Date(booking.checkOut);
      
      // בדיקת חפיפה: הזמנות חופפות אם יש חפיפה של לפחות יום אחד
      return (
        (currentStart >= bookingStart && currentStart < bookingEnd) ||
        (currentEnd > bookingStart && currentEnd <= bookingEnd) ||
        (currentStart <= bookingStart && currentEnd >= bookingEnd)
      );
    });
  };

  // יצירת tooltip עבור הזמנות חופפות
  const createOverlappingTooltip = (mainBooking, overlappingBookings) => {
    const allBookings = [mainBooking, ...overlappingBookings];
    
    return (
      <Box sx={{ maxWidth: 350, p: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: '#e74c3c', fontWeight: 'bold' }}>
          ⚠️ {allBookings.length} הזמנות חופפות
        </Typography>
        <List dense sx={{ py: 0 }}>
          {allBookings.map((booking, index) => (
            <React.Fragment key={booking._id}>
              <ListItem 
                sx={{ 
                  px: 0, 
                  py: 1,
                  cursor: 'pointer',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.04)'
                  }
                }}
                onClick={() => onBookingClick(booking._id)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {booking.firstName} {booking.lastName}
                      </Typography>
                      {booking.source && (
                        <Chip 
                          label={booking.source} 
                          size="small" 
                          variant="outlined"
                          sx={{ height: 16, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        📅 {format(new Date(booking.checkIn), 'dd/MM')} - {format(new Date(booking.checkOut), 'dd/MM')}
                      </Typography>
                      <Typography variant="caption" display="block">
                        💰 ₪{booking.totalPrice?.toLocaleString()} • {booking.nights} לילות
                      </Typography>
                      {booking.phone && (
                        <Typography variant="caption" display="block">
                          📞 {booking.phone}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < allBookings.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
          לחץ על הזמנה לפתיחה
        </Typography>
      </Box>
    );
  };

  const renderBooking = (booking, room) => {
    // המרת תאריכים למבנה אחיד ובדיקת תקינות
    try {
      // בדיקת הזמנות חופפות לחדר זה
      const roomBookings = bookings.filter(b => {
        const bookingRoomId = b.room && typeof b.room === 'object' && b.room._id ? 
          b.room._id.toString() : 
          (b.room ? b.room.toString() : '');
        return bookingRoomId === room._id.toString();
      });
      
      const overlappingBookings = findOverlappingBookings(booking, roomBookings);
      const hasOverlap = overlappingBookings.length > 0;
      
      // תיעוד התאריכים המקוריים
      console.log(`עיבוד הזמנה מספר ${booking.bookingNumber || booking._id} - ${booking.firstName} ${booking.lastName || ''}:`);
      if (hasOverlap) {
        console.log(`🔄 נמצאו ${overlappingBookings.length} הזמנות חופפות`);
      }
      console.log('תאריכי הזמנה מקוריים:', {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        type: {
          checkIn: typeof booking.checkIn,
          checkOut: typeof booking.checkOut
        }
      });
      
      // יצירת אובייקטי תאריך בפורמט אחיד ללא התייחסות לשעות
      const checkInDate = new Date(booking.checkIn.split('T')[0]);
      const checkOutDate = new Date(booking.checkOut.split('T')[0]);
      
      // המרה לפורמט yyyy-MM-dd ללא שעות
      const checkInDateStr = format(checkInDate, 'yyyy-MM-dd');
      const checkOutDateStr = format(checkOutDate, 'yyyy-MM-dd');
      
      // חישוב מספר הלילות האמיתי של ההזמנה
      // מחושב כהפרש הימים בין צ'ק-אין לצ'ק-אאוט
      const actualNights = Math.max(1, differenceInDays(checkOutDate, checkInDate));
      
      // הדפסת לוג מפורטת לדיבוג
      console.log(`עיבוד הזמנה: ${booking._id} - ${booking.firstName} ${booking.lastName || ''}`);
      console.log('תאריכים לאחר עיבוד:', {
        checkIn: {
          date: checkInDate,
          iso: checkInDate.toISOString(),
          formatted: checkInDateStr,
        },
        checkOut: {
          date: checkOutDate,
          iso: checkOutDate.toISOString(),
          formatted: checkOutDateStr,
        },
        nights: actualNights,
        originalNights: booking.nights
      });
      
      // הוספת לוג לגבי טווח התצוגה הנוכחי
      console.log(`טווח תצוגה נוכחי: ${format(daysInRange[0], 'yyyy-MM-dd')} עד ${format(daysInRange[daysInRange.length - 1], 'yyyy-MM-dd')}`);
      
      // בדיקת תקינות תאריכים
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        console.error('תאריכי הזמנה לא תקינים:', booking._id);
        return null;
      }
      
      // מציאת האינדקס של תאריך הצ'ק-אין בטווח התאריכים המוצג
      const startIndex = dateToIndex[checkInDateStr];
      
      // מציאת האינדקס של תאריך הצ'ק-אאוט בטווח התאריכים המוצג
      const endIndex = dateToIndex[checkOutDateStr];
      
      console.log('אינדקסים לתצוגה:', {
        checkInDate: checkInDateStr,
        checkOutDate: checkOutDateStr,
        startIndex,
        endIndex,
        daysInRangeLength: daysInRange.length
      });
      
      // בדיקה אם ההזמנה חופפת עם טווח הימים המוצג
      const firstDayInRange = format(daysInRange[0], 'yyyy-MM-dd');
      const lastDayInRange = format(daysInRange[daysInRange.length - 1], 'yyyy-MM-dd');
      
      // הבדיקות השונות אם ההזמנה רלוונטית לתצוגה הנוכחית
      const isCheckInInRange = startIndex !== undefined;
      const isCheckOutInRange = endIndex !== undefined;
      
      // המרת התאריכים למחרוזות לצורך השוואה
      const checkInDateStr_obj = new Date(checkInDateStr); 
      const checkOutDateStr_obj = new Date(checkOutDateStr);
      const firstDayInRange_obj = new Date(firstDayInRange);
      const lastDayInRange_obj = new Date(lastDayInRange);
      
      // בדיקה מתוקנת אם ההזמנה מקיפה את הטווח (מתחילה לפני ומסתיימת אחרי)
      const isBookingCoveringRange = 
        checkInDateStr_obj <= firstDayInRange_obj && 
        checkOutDateStr_obj > lastDayInRange_obj;
      
      // בדיקה אם הצ'ק-אין ביום האחרון של הטווח
      const isCheckInOnLastDay = checkInDateStr === lastDayInRange;
      
      // בדיקה אם חלק מההזמנה בתוך הטווח (הצ'ק-אין לפני הטווח והצ'ק-אאוט בתוך הטווח)
      const isPartiallyInRange = 
        checkInDateStr_obj < firstDayInRange_obj && 
        checkOutDateStr_obj > firstDayInRange_obj && 
        checkOutDateStr_obj <= lastDayInRange_obj;
      
      console.log('בדיקת חפיפה עם טווח התצוגה:', {
        checkIn: checkInDateStr,
        checkOut: checkOutDateStr,
        firstDayInRange,
        lastDayInRange,
        isCheckInInRange,
        isCheckOutInRange,
        isBookingCoveringRange,
        isCheckInOnLastDay,
        isPartiallyInRange
      });
      
      // תנאי מורחב ומשופר - הזמנה מוצגת אם היא עומדת באחד התנאים:
      // 1. תאריך הצ'ק-אין בטווח התצוגה
      // 2. תאריך הצ'ק-אאוט בטווח התצוגה
      // 3. ההזמנה מקיפה את כל הטווח (מתחילה לפני ומסתיימת אחרי)
      // 4. צ'ק-אין הוא ביום האחרון של הטווח
      // 5. חלק מההזמנה נמצא בטווח
      if (!isCheckInInRange && !isCheckOutInRange && !isBookingCoveringRange && !isCheckInOnLastDay && !isPartiallyInRange) {
        console.log('הזמנה מחוץ לטווח תצוגה:', booking._id, {
          checkInDate: checkInDateStr,
          checkOutDate: checkOutDateStr,
          firstDayInRange,
          lastDayInRange,
          isCheckInInRange,
          isCheckOutInRange,
          isBookingCoveringRange,
          isCheckInOnLastDay,
          isPartiallyInRange
        });
        return null;
      }
      
      // חישוב המיקום והרוחב של ההזמנה בתצוגת RTL
      
      // 1. חישוב נקודת ההתחלה - אם הצ'ק-אין לפני טווח התצוגה, מתחילים מהיום הראשון
      const effectiveStartIndex = startIndex !== undefined ? startIndex : 0;
      
      // 2. חישוב נקודת הסיום - תלוי במספר הלילות ובטווח התצוגה
      let effectiveEndIndex;
      
      if (actualNights === 1) {
        // אם מדובר בלילה אחד, ההזמנה תופיע רק על היום של הצ'ק-אין
        effectiveEndIndex = effectiveStartIndex;
      } else {
        // אם מדובר בהזמנה של יותר מלילה אחד
        
        // בדיקה האם תאריך הצ'ק-אאוט בטווח התצוגה
        if (endIndex !== undefined) {
          // אם הצ'ק-אאוט בטווח - ההזמנה מסתיימת יום לפני הצ'ק-אאוט
          // (כי ביום הצ'ק-אאוט כבר אין לינה)
          effectiveEndIndex = endIndex > 0 ? endIndex - 1 : 0;
        } else {
          // אם הצ'ק-אאוט אחרי הטווח - ההזמנה ממשיכה עד סוף הטווח
          effectiveEndIndex = daysInRange.length - 1;
        }
        
        // וידוא שלא חורגים מגבולות התצוגה
        effectiveEndIndex = Math.min(effectiveEndIndex, daysInRange.length - 1);
        effectiveEndIndex = Math.max(effectiveEndIndex, effectiveStartIndex);
      }
      
      // 3. חישוב כמה ימים ההזמנה תתפוס בתצוגה 
      const displayDays = effectiveEndIndex - effectiveStartIndex + 1;
      
      // 4. חישוב הרוחב באחוזים מתוך הרוחב הכולל של התצוגה
      const bookingWidth = (displayDays / daysInRange.length) * 100;
      
      // 5. חישוב המיקום בתצוגה RTL (כאשר 0 הוא הקצה הימני)
      const rtlStartPosition = (daysInRange.length - effectiveStartIndex - displayDays) / daysInRange.length * 100;
      
      console.log('נתוני הצגת ההזמנה (מתוקנים):', {
        actualNights,
        displayDays,
        effectiveStartIndex,
        effectiveEndIndex,
        rtlStartPosition: `${rtlStartPosition}%`,
        bookingWidth: `${bookingWidth}%`
      });
      
      // בחירת צבע בהתאם למקור ההזמנה
      let statusColors;
      if (booking.source === 'booking' && bookingSourceColors.booking[booking.status]) {
        // הזמנה מבוקינג - צבע ירוק
        statusColors = bookingSourceColors.booking[booking.status];
      } else {
        // הזמנה רגילה - צבע כחול
        statusColors = bookingStatusColors[booking.status] || bookingStatusColors.pending;
      }
      
      // בדיקה האם תאריך הצ'ק-אין רלוונטי (אתמול, היום או מחר)
      const isRelevantDate = isCheckInRelevant(checkInDate);
      
      // בדיקה האם יש הערה להזמנה
      const hasNotes = booking.notes && booking.notes.trim().length > 0;
      
      // בדיקה האם ההזמנה לא שולמה ותאריך הצ'ק-אין עבר או שהוא היום
      const isPastOrTodayAndNotPaid = (booking.paymentStatus === 'לא שולם' || booking.paymentStatus === 'unpaid') && 
        (checkInDate <= today);
      
      console.log('בדיקת תשלום:', {
        bookingId: booking._id,
        paymentStatus: booking.paymentStatus,
        checkInDate: checkInDateStr,
        isPastOrToday: checkInDate <= today,
        isPastOrTodayAndNotPaid
      });
      
      // יצירת הרכיב עם או בלי tooltip בהתאם לחפיפה
      const bookingComponent = (
        <GanttBar
          key={booking._id}
          status={booking.status}
          startOffset={rtlStartPosition}
          length={bookingWidth}
          variant="full"
          isDragging={dragState.isDragging && dragState.draggedBooking?._id === booking._id}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, booking)}
          onDragEnd={handleDragEnd}
          onClick={() => onBookingClick(booking._id)}
          sx={{
            bgcolor: statusColors.bgColor,
            border: `1px solid ${statusColors.borderColor}`,
            color: statusColors.textColor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRadius: '6px',
            cursor: 'grab',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease-in-out'
            },
            '&:active': {
              cursor: 'grabbing'
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%'
          }}>
            {/* שם האורח */}
            <Typography variant="body2" sx={{ 
              color: `rgba(34, 34, 34, 0.9)`, 
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%'
            }}>
              {booking.firstName ? `${booking.firstName} ${booking.lastName || ''}` : 'ללא שם'}
            </Typography>
            
            {/* אייקונים - שינוי: אייקון תשלום יוצג תמיד אם התנאי מתקיים, לא רק להזמנות רלוונטיות */}
            <Box sx={{ 
              display: 'flex', 
              gap: '6px', 
              mt: 'auto', 
              alignSelf: 'flex-end',
              pt: '4px'
            }}>
              {/* אייקון תשלום חסר */}
              {isPastOrTodayAndNotPaid && (
                <Tooltip title="ההזמנה לא שולמה" arrow placement="top">
                  <Box 
                    component="span"
                    sx={{ 
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // מניעת הפעלת האירוע של ההזמנה
                    }}
                  >
                    <Typography
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#e74c3c',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        lineHeight: 1,
                      }}
                    >
                      ₪
                    </Typography>
                  </Box>
                </Tooltip>
              )}
              
              {/* אייקון הערה - יוצג רק להזמנות רלוונטיות */}
              {isRelevantDate && hasNotes && (
                <Tooltip title={booking.notes} arrow placement="top">
                  <IconButton 
                    size="small" 
                    sx={{ 
                      p: 0,
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      bgcolor: 'transparent',
                      '&:hover': { bgcolor: 'transparent' }
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // מניעת הפעלת האירוע של ההזמנה
                    }}
                  >
                    <InfoIcon 
                      sx={{ 
                        color: '#f39c12',
                        fontSize: '20px'
                      }}
                    />
                  </IconButton>
                </Tooltip>
              )}
              
              {/* אייקון וואטסאפ - יוצג רק להזמנות רלוונטיות */}
              {isRelevantDate && booking.phone && (
                <IconButton 
                  component="a"
                  href={createWhatsAppLink(booking.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small" 
                  sx={{ 
                    p: 0,
                    width: '20px',
                    height: '20px',
                    minWidth: '20px',
                    bgcolor: 'transparent',
                    '&:hover': { bgcolor: 'transparent' }
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // מניעת הפעלת האירוע של ההזמנה
                  }}
                >
                  <WhatsAppIcon 
                    sx={{ 
                      color: '#25D366',
                      fontSize: '20px'
                    }}
                  />
                </IconButton>
              )}
            </Box>
          </Box>
        </GanttBar>
      );

      // החזרת הרכיב עם או בלי tooltip
      if (hasOverlap) {
        return (
          <Tooltip
            key={booking._id}
            title={createOverlappingTooltip(booking, overlappingBookings)}
            arrow
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  maxWidth: 'none',
                  bgcolor: 'white',
                  color: 'black',
                  boxShadow: 3,
                  border: '1px solid #e0e0e0',
                  '& .MuiTooltip-arrow': {
                    color: 'white',
                    '&:before': {
                      border: '1px solid #e0e0e0'
                    }
                  }
                }
              }
            }}
          >
            {React.cloneElement(bookingComponent, {
              sx: {
                ...bookingComponent.props.sx,
                // סימון חזותי להזמנות חופפות
                border: '2px solid #e74c3c',
                boxShadow: '0 0 0 2px rgba(231, 76, 60, 0.2)',
                '&:hover': {
                  ...bookingComponent.props.sx['&:hover'],
                  boxShadow: '0 4px 8px rgba(231, 76, 60, 0.3)'
                }
              }
            })}
          </Tooltip>
        );
      }

      return bookingComponent;
    } catch (error) {
      console.error('שגיאה בעיבוד הזמנה:', error, booking);
      return null;
    }
  };

  const handleCellClick = (date, room) => {
    if (!date || !room) return;
    
    // מעבירים את כל המידע הרלוונטי ליצירת הזמנה
    onCreateBooking(
      date,
      room._id,
      room.location
    );
  };

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Paper
        sx={{
          ...STYLE_CONSTANTS.card,
          p: 0,
          overflow: 'hidden',
          width: '100%',
          minWidth: '1000px'
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            bgcolor: '#f8f8f8',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 2
          }}
        >
          {/* עמודת חדרים */}
          <Box sx={{ 
            minWidth: '100px', 
            p: 2,
            borderLeft: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              textAlign: 'center'
            }}>
              חדר
            </Typography>
          </Box>

          {/* עמודות תאריכים */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex'
          }}>
            {daysInRange.map((day, index) => (
              <Box 
                key={`date-${index}`} 
                sx={{ 
                  flex: 1,
                  p: 1,
                  textAlign: 'center',
                  borderLeft: index < daysInRange.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  ...(isToday(day) && { 
                    bgcolor: 'rgba(0, 113, 227, 0.05)',
                    borderTop: '2px solid var(--primary-color)'
                  }),
                  ...(isFridayOrSaturday(day) && { 
                    bgcolor: 'rgba(0, 0, 0, 0.02)' 
                  }),
                }}
              >
                <Typography sx={{ 
                  fontWeight: 500, 
                  color: 'text.secondary',
                  fontSize: '0.8rem'
                }}>
                  {format(day, 'EEEE', { locale: he })}
                </Typography>
                <Typography sx={{ 
                  fontWeight: 600, 
                  color: isToday(day) ? locationColors.main : 'text.primary',
                  fontSize: '0.9rem'
                }}>
                  {format(day, 'dd/MM')}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* שורות לוח הזמנים */}
        {rooms.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="subtitle2" color={colors.text.secondary}>
              לא נמצאו חדרים במיקום זה
            </Typography>
          </Box>
        ) : (
          // מיון החדרים לפי המספר שלהם בסדר עולה (כמספר שלם)
          [...rooms]
            .sort((a, b) => {
              // המרת מספר החדר למספר שלם לצורך מיון נכון
              const roomNumberA = parseInt(a.roomNumber, 10);
              const roomNumberB = parseInt(b.roomNumber, 10);
              
              // מיון בסדר עולה
              return roomNumberA - roomNumberB;
            })
            .map((room) => (
              <Box 
                key={`room-${room._id}`}
                sx={{ 
                  display: 'flex',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.01)',
                  }
                }}
              >
                {/* תא חדר */}
                <Box sx={{ 
                  minWidth: '100px', 
                  p: 2,
                  borderLeft: '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography sx={{ 
                    fontWeight: 700, 
                    fontSize: '1.1rem'
                  }}>
                    {room.roomNumber}
                  </Typography>
                </Box>

                {/* אזור הזמנות גאנט */}
                <Box sx={{ 
                  flex: 1,
                  position: 'relative',
                  display: 'flex',
                  height: '70px',
                }}>
                  {/* תאי רקע לכל יום עם תמיכה ב-drop zone */}
                  {daysInRange.map((day, dateIndex) => {
                    const isValidDropZone = dragState.isDragging;
                    const isDragOver = dragState.dragOver?.roomId === room._id && 
                      dragState.dragOver?.date === format(day, 'yyyy-MM-dd');
                      
                    return (
                      <DropZoneCell
                        key={`bg-${room._id}-${dateIndex}`}
                        isValidDropZone={isValidDropZone}
                        isDragOver={isDragOver}
                        onClick={() => handleEmptyCellClick(room._id, day)}
                        onDragOver={(e) => handleDragOver(e, room._id, day)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, room._id, day)}
                        sx={{ 
                          flex: 1,
                          borderLeft: dateIndex < daysInRange.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                          cursor: 'pointer',
                          ...(isToday(day) && { 
                            bgcolor: 'rgba(0, 113, 227, 0.03)',
                          }),
                          ...(isFridayOrSaturday(day) && { 
                            bgcolor: 'rgba(247, 151, 30, 0.03)' 
                          }),
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.04)',
                          }
                        }}
                      />
                    );
                  })}
                  
                  {/* רנדור הזמנות כסרגלי גאנט */}
                  {bookings
                    .filter(booking => {
                      // בדיקה אם ה-room הוא אובייקט עם _id או מזהה ישיר
                      const bookingRoomId = booking.room && typeof booking.room === 'object' && booking.room._id ? 
                        booking.room._id.toString() : 
                        (booking.room ? booking.room.toString() : '');
                      
                      return bookingRoomId === room._id.toString();
                    })
                    .map((booking) => renderBooking(booking, room))
                  }
                </Box>
              </Box>
            ))
        )}
      </Paper>
      
      {/* הודעות התראה */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BookingsCalendar;
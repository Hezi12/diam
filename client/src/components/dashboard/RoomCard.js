import React from 'react';
import { Card, Box, Typography, Chip, Avatar, keyframes, Divider, IconButton, Tooltip } from '@mui/material';
import { format, differenceInDays, addDays, isAfter, isBefore } from 'date-fns';
import { 
  CheckCircleOutline as CheckInIcon,
  NoMeetingRoom as CheckOutIcon,
  DoorBack as OccupiedIcon,
  MeetingRoom as EmptyIcon,
  Person as PersonIcon,
  Bedtime as BedtimeIcon,
  CalendarToday as CalendarIcon,
  WhatsApp as WhatsAppIcon,
  WarningAmber as WarningIcon,
  Input as CheckInInfoIcon
} from '@mui/icons-material';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';
import { he } from 'date-fns/locale';

// אנימציה להבהוב אייקון צ'ק-אין היום - יותר עדינה
const pulseCheckIn = keyframes`
  0%, 100% {
    color: rgba(66, 133, 244, 1);
    transform: scale(1);
  }
  
  50% {
    color: rgba(66, 133, 244, 0.85);
    transform: scale(1.05);
  }
`;

// אנימציה להבהוב אייקון "לא שולם" - מעודנת יותר
const pulseRed = keyframes`
  0%, 100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.7;
  }
`;

/**
 * קומפוננטת כרטיס חדר להצגה בדאשבורד - עם עיצוב מינימליסטי ונקי
 */
const RoomCard = ({ room, status, booking, onClick }) => {
  const colors = STYLE_CONSTANTS.colors;
  
  // צבעים עדינים יותר
  const ROOM_COLORS = {
    checkInToday: '#3367d6',  // כחול כהה יותר לצ'ק-אין היום
    checkIn: '#5177c0',       // כחול כהה יותר לצ'ק-אין
    checkOut: '#bb9944',      // צהוב-כתום כהה יותר לצ'ק-אאוט
    occupied: '#7e6fa4',      // סגול כהה יותר לחדרים מאוכלסים
    empty: '#606060',         // אפור כהה יותר לחדרים פנויים
    warning: '#cc8844',       // כתום כהה יותר
    notPaid: '#e34a6f',       // אדום כמו בסגנון המערכת
    whatsapp: '#1d8d55',      // ירוק כהה יותר לוואטסאפ
    checkInInfo: '#3388cc',   // כחול בהיר לאייקון מידע צ'ק-אין
    background: '#ffffff',    // לבן
    backgroundLight: '#f8f8f8', // אפור בהיר
    text: '#333333',          // אפור כהה מאוד לטקסט
    textLight: '#555555',     // אפור כהה לטקסט משני
    important: '#e34a6f'      // אדום לסימון חשוב
  };
  
  // מידע וצבעים לפי הסטטוס
  let statusInfo = {
    icon: <EmptyIcon fontSize="small" />,
    text: "פנוי",
    primary: ROOM_COLORS.empty,
    isSpecial: false
  };
  
  // בדיקה האם צ'ק אין היום
  const isCheckInToday = booking && 
    format(new Date(booking.checkIn), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  
  // קביעת מידע וצבעים לפי הסטטוס
  switch (status) {
    case 'check-in':
      statusInfo = {
        icon: <CheckInIcon 
          fontSize="small" 
          sx={isCheckInToday ? { 
            animation: `${pulseCheckIn} 2.5s ease-in-out infinite`,
            fontSize: '1rem'
          } : {}}
        />,
        text: "צ'ק-אין",
        primary: isCheckInToday ? ROOM_COLORS.checkInToday : ROOM_COLORS.checkIn,
        isSpecial: isCheckInToday
      };
      break;
    case 'check-out':
      statusInfo = {
        icon: <CheckOutIcon fontSize="small" />,
        text: "צ'ק-אאוט",
        primary: ROOM_COLORS.checkOut,
        isSpecial: false
      };
      break;
    case 'occupied':
      statusInfo = {
        icon: <OccupiedIcon fontSize="small" />,
        text: "מאוכלס",
        primary: ROOM_COLORS.occupied,
        isSpecial: false
      };
      break;
  }

  // חישוב מספר הלילות עבור ההזמנה
  const calculateNights = () => {
    if (!booking) return 0;
    const nights = differenceInDays(new Date(booking.checkOut), new Date(booking.checkIn));
    return Math.max(1, nights); // מחזיר לפחות 1 גם אם הערך הוא 0
  };
  
  const nights = calculateNights();

  // פונקציה עזר לפורמט תאריכים
  const formatDateHebrew = (date) => {
    return format(new Date(date), 'dd/MM', { locale: he });
  };

  // פונקציה לפתיחת ווטסאפ עם מספר הטלפון של האורח
  const openWhatsApp = (e, phoneNumber) => {
    e.stopPropagation(); // מניעת המשך הקליק לכרטיס
    if (phoneNumber) {
      // עיבוד מספר הטלפון לפורמט בינלאומי תקין
      let processedNumber = phoneNumber.replace(/\D/g, '');
      
      // אם המספר מתחיל ב-0, נסיר אותו
      if (processedNumber.startsWith('0')) {
        processedNumber = processedNumber.substring(1);
      }
      
      // אם המספר לא מתחיל ב-972 או +, נוסיף קידומת ישראל
      if (!processedNumber.startsWith('972') && !processedNumber.startsWith('+')) {
        processedNumber = '972' + processedNumber;
      }
      
      // פתיחת WhatsApp Web או האפליקציה
      try {
        window.location.href = `whatsapp://send?phone=${processedNumber}`;
        
        // כאלטרנטיבה, אם הקישור הקודם לא עבד, ננסה לפתוח את WhatsApp Web
        setTimeout(() => {
          window.open(`https://wa.me/${processedNumber}`, '_blank');
        }, 300);
      } catch (error) {
        console.error('שגיאה בפתיחת WhatsApp:', error);
        // אם הייתה שגיאה, ננסה לפתוח באמצעות הקישור הרגיל
        window.open(`https://wa.me/${processedNumber}`, '_blank');
      }
    }
  };

  // בדיקות האם יש נתונים מיוחדים בהזמנה
  const hasPhoneNumber = booking && (booking.phoneNumber || booking.phone || 
    (booking.guest && (booking.guest.phoneNumber || booking.guest.phone)) ||
    booking.customerPhone);
  
  // מספר הטלפון עצמו - בדיקה בכל מקום אפשרי
  const getPhoneNumber = () => {
    if (!booking) return null;
    return booking.phoneNumber || booking.phone || 
      (booking.guest && (booking.guest.phoneNumber || booking.guest.phone)) ||
      booking.customerPhone || '';
  };
  
  const hasNotes = booking && (booking.notes || booking.note || booking.comment || booking.comments);
  
  // האם יש סימן קריאה בהערות
  const hasExclamation = hasNotes && (
    (booking.notes && booking.notes.includes('!')) || 
    (booking.note && booking.note.includes('!')) || 
    (booking.comment && booking.comment.includes('!')) || 
    (booking.comments && booking.comments.includes('!'))
  );
  
  // שינוי התנאי - כמו ב-BookingItem
  const isNotPaid = booking && (!booking.paymentStatus || booking.paymentStatus === 'unpaid');

  // בדיקה האם היציאה מחר או ב-3 הימים הקרובים
  const isCheckoutSoon = () => {
    if (!booking) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // מאפס את השעה
    
    const tomorrow = addDays(today, 1);
    const inThreeDays = addDays(today, 3);
    
    const checkOutDate = new Date(booking.checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    
    return (
      checkOutDate.getTime() === tomorrow.getTime() || // יציאה מחר
      (checkOutDate.getTime() > today.getTime() && checkOutDate.getTime() <= inThreeDays.getTime()) // יציאה בימים הקרובים (עד 3 ימים)
    );
  };

  // הודעת יציאה מותאמת
  const getCheckoutMessage = () => {
    if (!booking) return "";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = addDays(today, 1);
    
    const checkOutDate = new Date(booking.checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    
    if (checkOutDate.getTime() === tomorrow.getTime()) {
      return "יציאה מחר";
    } else {
      // מספר הימים עד היציאה
      const daysUntilCheckout = differenceInDays(checkOutDate, today);
      return `יציאה בעוד ${daysUntilCheckout} ימים`;
    }
  };

  // פונקציה לשליחת הודעת צ'ק אין
  const sendCheckInMessage = (e) => {
    e.stopPropagation(); // מניעת המשך הקליק לכרטיס
    
    if (!booking || !room) return;
    
    let message = '';
    
    if (room.location === 'airport') {
      message = `Hello!

I'm David from the Airport Guest House—thank you for choosing to stay with us! I want to ensure you have a smooth and comfortable stay.

*✅ Self Check-in Instructions:*
When you arrive at 12 Ha'Erez Street, Or Yehuda, enter the code 1818 to access the building. Your room number is ${room.roomNumber}, and I've already unlocked it for you. Your key will be waiting inside, so you can settle in easily.

*📍 Address in Hebrew (for taxis):*
הארז 12, אור יהודה

*🚖 Important Taxi Tip:*
To ensure a fair price and avoid any issues, please take a licensed taxi from the official taxi stand at the airport. Ask the driver to use the meter and request a receipt—unfortunately, some drivers overcharge tourists, and I want to help you avoid that. If you need any advice, feel free to reach out!

*📄 VAT Exemption:*
To avoid paying VAT, kindly send me a photocopy of your passport.

🌍 If you have any questions during your stay—whether it's about the guest house, transportation, or even travel tips around Israel—feel free to reach out! As a local, I'd be happy to help. Wishing you a great time and a pleasant stay!

Warm regards,
🙂🙂🙂`;
    } else if (room.location === 'rothschild') {
      message = `רוטשילד 79 פתח תקווה
ממש ליד הכניסה לסופרמרקט "יש בשכונה" יש דלת זכוכית 
קומה 2

חדר ${room.roomNumber}

החדר פתוח ומפתח בתוך החדר

שימו לב למים חמים צריך להדליק את הדוד`;
    }
    
    // פתיחת וואטסאפ עם ההודעה המתאימה
    const phoneNumber = getPhoneNumber();
    if (phoneNumber) {
      // עיבוד מספר הטלפון לפורמט בינלאומי תקין
      let processedNumber = phoneNumber.replace(/\D/g, '');
      
      // אם המספר מתחיל ב-0, נסיר אותו
      if (processedNumber.startsWith('0')) {
        processedNumber = processedNumber.substring(1);
      }
      
      // אם המספר לא מתחיל ב-972 או +, נוסיף קידומת ישראל
      if (!processedNumber.startsWith('972') && !processedNumber.startsWith('+')) {
        processedNumber = '972' + processedNumber;
      }
      
      const encodedMessage = encodeURIComponent(message);
      
      // פתיחת WhatsApp Web או האפליקציה
      try {
        window.location.href = `whatsapp://send?phone=${processedNumber}&text=${encodedMessage}`;
        
        // כאלטרנטיבה, אם הקישור הקודם לא עבד, ננסה לפתוח את WhatsApp Web
        setTimeout(() => {
          window.open(`https://wa.me/${processedNumber}?text=${encodedMessage}`, '_blank');
        }, 300);
      } catch (error) {
        console.error('שגיאה בפתיחת WhatsApp עם הודעה:', error);
        // אם הייתה שגיאה, ננסה לפתוח באמצעות הקישור הרגיל
        window.open(`https://wa.me/${processedNumber}?text=${encodedMessage}`, '_blank');
      }
    }
  };

  return (
    <Card 
      sx={{ 
        position: 'relative',
        overflow: 'visible',
        borderRadius: 1.5,
        p: 0,
        mb: 1.5,
        cursor: 'pointer',
        bgcolor: ROOM_COLORS.background,
        boxShadow: 'none',
        maxWidth: '100%',
        height: 'auto',
        transition: 'all 0.2s ease',
        border: `1px solid ${statusInfo.primary}15`,
        borderLeft: `4px solid ${hasExclamation ? ROOM_COLORS.important : statusInfo.primary}`,
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
        }
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* שורה ראשית - מספר חדר, שם אורח וסטטוס */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 1.25,
          pb: booking ? 0.5 : 1.25
        }}>
          {/* מספר חדר ושם אורח */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              sx={{ 
                bgcolor: `${statusInfo.primary}20`,
                color: statusInfo.primary,
                fontSize: '0.8rem',
                fontWeight: 'bold',
                width: 24,
                height: 24,
                boxShadow: 'none'
              }}
            >
              {room.roomNumber}
            </Avatar>
            
            {/* שם האורח - אם יש הזמנה */}
            {booking && (
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600, 
                  color: ROOM_COLORS.text,
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '150px'
                }}
              >
                {booking.firstName} {booking.lastName}
              </Typography>
            )}
          </Box>
          
          {/* צ'יפ סטטוס */}
          <Chip
            icon={statusInfo.icon}
            label={statusInfo.text}
            size="small"
            sx={{
              bgcolor: `${statusInfo.primary}12`, // רקע שקוף יותר
              color: statusInfo.primary,
              fontWeight: 600,
              fontSize: '0.7rem',
              height: '22px',
              '& .MuiChip-icon': {
                color: 'inherit',
                fontSize: '0.9rem',
                marginRight: '4px',
                marginLeft: '-2px'
              }
            }}
          />
        </Box>
        
        {/* קו מפריד אם יש פרטי הזמנה */}
        {booking && (
          <Divider sx={{ width: '100%', opacity: 0.5 }} />
        )}
        
        {/* מידע נוסף על ההזמנה - כשיש הזמנה */}
        {booking && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.25,
            pt: 0.75
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* הודעת יציאה רק אם היציאה בימים הקרובים */}
              {isCheckoutSoon() && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: ROOM_COLORS.textLight,
                  gap: 0.5
                }}>
                  <CalendarIcon sx={{ fontSize: '0.9rem' }} />
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 500,
                    color: ROOM_COLORS.text
                  }}>
                    {getCheckoutMessage()}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {/* אייקון צ'ק-אין אוטומטי להזמנות עם צ'ק-אין היום */}
              {isCheckInToday && (
                <Tooltip title="שלח הודעת צ'ק-אין">
                  <IconButton 
                    size="small"
                    sx={{ padding: 0.5 }}
                    onClick={sendCheckInMessage}
                  >
                    <CheckInInfoIcon 
                      sx={{ 
                        fontSize: '1rem', 
                        color: ROOM_COLORS.checkInInfo,
                        animation: `${pulseCheckIn} 2.5s ease-in-out infinite`
                      }} 
                    />
                  </IconButton>
                </Tooltip>
              )}
              
              {/* אייקון לא שולם - אייקון ש״ח באדום */}
              {isNotPaid && (
                <Tooltip title="לא שולם">
                  <Box 
                    component="span"
                    sx={{ 
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    <Typography
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: ROOM_COLORS.notPaid,
                        fontWeight: 'bold',
                        fontSize: '16px',
                        lineHeight: 1,
                        animation: `${pulseRed} 2s ease-in-out infinite`
                      }}
                    >
                      ₪
                    </Typography>
                  </Box>
                </Tooltip>
              )}
              
              {/* אייקון לוואטסאפ - אם יש מספר טלפון */}
              {hasPhoneNumber && (
                <Tooltip title={getPhoneNumber()}>
                  <IconButton 
                    size="small"
                    sx={{ padding: 0.5 }}
                    onClick={(e) => openWhatsApp(e, getPhoneNumber())}
                  >
                    <WhatsAppIcon 
                      sx={{ 
                        fontSize: '1rem', 
                        color: ROOM_COLORS.whatsapp
                      }} 
                    />
                  </IconButton>
                </Tooltip>
              )}
              
              {/* אייקון הערות - אם יש */}
              {hasNotes && (
                <Tooltip title={booking.notes || booking.note || booking.comment || booking.comments}>
                  <WarningIcon 
                    sx={{ 
                      fontSize: '1rem', 
                      color: ROOM_COLORS.warning
                    }} 
                  />
                </Tooltip>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default RoomCard; 
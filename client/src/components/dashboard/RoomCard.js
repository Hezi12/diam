import React from 'react';
import { Card, Box, Typography, Chip, Avatar, keyframes, Divider, IconButton, Tooltip } from '@mui/material';
import { format, differenceInDays } from 'date-fns';
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
  CreditCardOff as NotPaidIcon
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
    checkInToday: '#4285F4',  // כחול גוגל לצ'ק-אין היום
    checkIn: '#81A4E3',       // כחול עדין יותר לצ'ק-אין
    checkOut: '#E0C178',      // צהוב-כתום עדין לצ'ק-אאוט
    occupied: '#9D93BC',      // סגול עדין לחדרים מאוכלסים
    empty: '#A0A0A0',         // אפור לחדרים פנויים
    warning: '#E0A96D',       // כתום מעודן יותר
    notPaid: '#E07F7F',       // אדום מעודן
    whatsapp: '#73C5A0',      // ירוק מעודן
    background: '#ffffff',    // לבן
    backgroundLight: '#fbfbfc', // אפור בהיר מאוד
    text: '#535353',          // אפור כהה לטקסט
    textLight: '#767676'      // אפור בינוני לטקסט משני
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
      // עיבוד מספר הטלפון - הסרת תווים מיוחדים ונרמול המספר
      const processedNumber = phoneNumber.replace(/\D/g, '');
      window.open(`https://wa.me/${processedNumber}`, '_blank');
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
  const isNotPaid = booking && (booking.paymentStatus === 'not_paid' || !booking.isPaid || 
    booking.status === 'unpaid' || booking.paymentStatus === 'unpaid');

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
        borderLeft: `3px solid ${statusInfo.primary}`,
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
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
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 500, 
                  color: ROOM_COLORS.text,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25
                }}
              >
                {booking.firstName} {booking.lastName}
              </Typography>
            )}
          </Box>
          
          {/* סטטוס החדר */}
          <Chip 
            icon={statusInfo.icon}
            label={statusInfo.text}
            size="small"
            sx={{
              bgcolor: `${statusInfo.primary}08`,
              color: statusInfo.primary,
              fontWeight: 400,
              height: 22,
              borderRadius: 1,
              fontSize: '0.7rem',
              border: 'none',
              minWidth: 70,
              '& .MuiChip-icon': {
                color: statusInfo.primary,
                fontSize: '0.8rem',
                marginRight: '2px',
                marginLeft: 0
              },
              '& .MuiChip-label': {
                padding: '0 4px',
                lineHeight: 1
              }
            }}
          />
        </Box>
        
        {/* מידע על ההזמנה - רק אם יש הזמנה */}
        {booking && (
          <>
            {/* תאריכי צ'ק-אין וצ'ק-אאוט ומספר לילות */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              alignItems: 'center', 
              justifyContent: 'space-between',
              px: 1.25,
              pb: 1,
              pt: 0.25
            }}>
              {/* תאריכי כניסה ויציאה */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                flexGrow: 1,
                minWidth: '50%',
                mr: 0.5
              }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.75rem',
                    color: ROOM_COLORS.textLight
                  }}
                >
                  {formatDateHebrew(booking.checkIn)} - {formatDateHebrew(booking.checkOut)}
                  {" "}
                  <Box component="span" sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                  }}>
                    ({nights} לילות)
                  </Box>
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexWrap: 'nowrap',
                gap: 0.5
              }}>
                {/* אייקונים פונקציונליים: ווטסאפ, הערות, תשלום */}
                {hasPhoneNumber && (
                  <Tooltip title="פתיחת וואטסאפ" arrow placement="top">
                    <IconButton 
                      size="small" 
                      onClick={(e) => openWhatsApp(e, getPhoneNumber())}
                      sx={{
                        padding: 0.25,
                        color: ROOM_COLORS.whatsapp,
                        opacity: 0.7,
                        '&:hover': { 
                          bgcolor: 'transparent',
                          opacity: 1
                        }
                      }}
                    >
                      <WhatsAppIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                )}
                
                {hasNotes && (
                  <Tooltip 
                    title={booking.notes || booking.note || booking.comment || booking.comments} 
                    arrow 
                    placement="top"
                  >
                    <IconButton 
                      size="small"
                      sx={{
                        padding: 0.25,
                        color: ROOM_COLORS.warning,
                        opacity: 0.7,
                        '&:hover': { 
                          bgcolor: 'transparent',
                          opacity: 1
                        }
                      }}
                    >
                      <WarningIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                )}
                
                {isNotPaid && (
                  <Tooltip 
                    title="התשלום טרם בוצע" 
                    arrow 
                    placement="top"
                  >
                    <IconButton 
                      size="small"
                      sx={{
                        padding: 0.25,
                        color: ROOM_COLORS.notPaid,
                        opacity: 0.7,
                        '&:hover': { 
                          bgcolor: 'transparent',
                          opacity: 1
                        }
                      }}
                    >
                      <NotPaidIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Card>
  );
};

export default RoomCard; 
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
import { STYLE_CONSTANTS } from '../../design-system/styles/StyleConstants';
import { he } from 'date-fns/locale';

// אנימציה להבהוב אייקון צ'ק-אין היום - יותר עדינה
const pulseCheckIn = keyframes`
  0%, 100% {
    color: rgba(66, 133, 244, 1);
    transform: scale(1);
  }
  
  50% {
    color: rgba(66, 133, 244, 0.85);
    transform: scale(1.1);
  }
`;

// אנימציה להבהוב אייקון "לא שולם"
const pulseRed = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
`;

// אנימציה לכפתור הסטטוס
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * קומפוננטת כרטיס חדר להצגה בדאשבורד - עם עיצוב מודרני ומשופר
 */
const RoomCard = ({ room, status, booking, onClick }) => {
  const colors = STYLE_CONSTANTS.colors;
  
  // הגדרת צבעי המערכת - צבעים עסקיים ומקצועיים
  const BUSINESS_COLORS = {
    checkInToday: '#4285F4', // כחול גוגל - צבע מודגש לצ'ק-אין היום
    checkIn: '#5B8DEF',      // כחול בהיר - לצ'ק-אין רגיל
    checkOut: '#F4B400',     // צהוב-כתום עסקי - לצ'ק-אאוט
    occupied: '#7E57C2',     // סגול עדין - לחדרים מאוכלסים
    empty: '#808080',        // אפור - לחדרים פנויים (שונה מירוק)
    warning: '#F57C00',      // כתום - לאזהרות
    notPaid: '#ea4335',      // אדום - לסימון שלא שולם
    whatsapp: '#25D366',     // ירוק ווטסאפ
    background: '#ffffff',   // לבן
    backgroundLight: '#f8f9fa', // אפור בהיר מאוד
    text: '#3c4043',         // אפור כהה לטקסט - צבע עסקי
    textLight: '#5f6368'     // אפור בינוני לטקסט משני
  };
  
  // מידע וצבעים לפי הסטטוס
  let statusInfo = {
    icon: <EmptyIcon fontSize="small" />,
    text: "פנוי",
    primary: BUSINESS_COLORS.empty,
    border: BUSINESS_COLORS.empty,
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
            fontSize: '1.05rem'
          } : {}}
        />,
        text: "צ'ק-אין",
        primary: isCheckInToday ? BUSINESS_COLORS.checkInToday : BUSINESS_COLORS.checkIn,
        border: isCheckInToday ? BUSINESS_COLORS.checkInToday : BUSINESS_COLORS.checkIn,
        isSpecial: isCheckInToday
      };
      break;
    case 'check-out':
      statusInfo = {
        icon: <CheckOutIcon fontSize="small" />,
        text: "צ'ק-אאוט",
        primary: BUSINESS_COLORS.checkOut,
        border: BUSINESS_COLORS.checkOut,
        isSpecial: false
      };
      break;
    case 'occupied':
      statusInfo = {
        icon: <OccupiedIcon fontSize="small" />,
        text: "מאוכלס",
        primary: BUSINESS_COLORS.occupied,
        border: BUSINESS_COLORS.occupied,
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
  // מספר טלפון יכול להיות באחד מכמה שדות אפשריים
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
        borderRadius: 2,
        p: 0,
        mb: 2,
        cursor: 'pointer',
        bgcolor: BUSINESS_COLORS.backgroundLight, // רקע בהיר אחיד לכל האריחים
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        maxWidth: '100%',
        height: 'auto',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderLeft: `1px solid ${statusInfo.primary}30`,
        borderTop: `1px solid ${statusInfo.primary}30`,
        borderBottom: `1px solid ${statusInfo.primary}30`,
        borderRight: `4px solid ${statusInfo.primary}`,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${statusInfo.primary}25`
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
          p: 1.5,
          pb: booking ? 0.75 : 1.5
        }}>
          {/* מספר חדר ושם אורח */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              sx={{ 
                bgcolor: statusInfo.primary,
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                width: 26,
                height: 26,
                boxShadow: `0 2px 6px ${statusInfo.primary}25`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              {room.roomNumber}
            </Avatar>
            
            {/* שם האורח - אם יש הזמנה */}
            {booking && (
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  color: BUSINESS_COLORS.text,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <PersonIcon 
                  fontSize="small" 
                  sx={{ 
                    color: statusInfo.primary, 
                    fontSize: '0.85rem',
                    marginRight: '2px'
                  }} 
                />
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
              bgcolor: 'white',
              color: statusInfo.primary,
              fontWeight: 600,
              height: 24,
              borderRadius: 12,
              fontSize: '0.72rem',
              border: `1px solid ${statusInfo.primary}`,
              boxShadow: 'none',
              animation: `${fadeIn} 0.3s ease`,
              minWidth: 82,
              '& .MuiChip-icon': {
                color: statusInfo.primary,
                fontSize: '0.85rem',
                marginRight: '4px',
                marginLeft: 0
              },
              '& .MuiChip-label': {
                padding: '0 6px',
                lineHeight: 1
              }
            }}
          />
        </Box>
        
        {/* מידע על ההזמנה - רק אם יש הזמנה */}
        {booking && (
          <>
            {/* קו הפרדה */}
            <Divider sx={{ mx: 1.5, opacity: 0.4 }} />
            
            {/* תאריכי צ'ק-אין וצ'ק-אאוט ומספר לילות */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              alignItems: 'center', 
              justifyContent: 'space-between',
              px: 1.5,
              py: 1
            }}>
              {/* תאריכי כניסה ויציאה */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                flexGrow: 1,
                minWidth: '55%',
                mr: 0.5
              }}>
                <CalendarIcon 
                  fontSize="small" 
                  sx={{ 
                    color: statusInfo.primary, 
                    fontSize: '0.9rem',
                    mr: 0.25
                  }} 
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.75rem',
                    color: BUSINESS_COLORS.textLight
                  }}
                >
                  {formatDateHebrew(booking.checkIn)} - {formatDateHebrew(booking.checkOut)}
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexWrap: 'nowrap',
                gap: 0.75
              }}>
                {/* אייקונים של אזהרות / ווטסאפ / סטטוס תשלום */}
                {/* אייקון ווטסאפ */}
                {hasPhoneNumber && (
                  <IconButton 
                    size="small" 
                    onClick={(e) => openWhatsApp(e, getPhoneNumber())}
                    sx={{
                      padding: 0.4,
                      color: BUSINESS_COLORS.whatsapp,
                      '&:hover': { 
                        bgcolor: `${BUSINESS_COLORS.whatsapp}10`,
                      }
                    }}
                  >
                    <WhatsAppIcon sx={{ fontSize: '1.1rem' }} />
                  </IconButton>
                )}
                
                {/* אייקון אזהרה להערות */}
                {hasNotes && (
                  <Tooltip 
                    title={booking.notes || booking.note || booking.comment || booking.comments} 
                    arrow 
                    placement="top"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    <IconButton 
                      size="small"
                      sx={{
                        padding: 0.4,
                        color: BUSINESS_COLORS.warning,
                        '&:hover': { 
                          bgcolor: `${BUSINESS_COLORS.warning}10`,
                        }
                      }}
                    >
                      <WarningIcon sx={{ 
                        fontSize: '1.1rem',
                        color: BUSINESS_COLORS.warning
                      }} />
                    </IconButton>
                  </Tooltip>
                )}
                
                {/* אייקון תשלום */}
                {isNotPaid && (
                  <Tooltip 
                    title="התשלום טרם בוצע" 
                    arrow 
                    placement="top"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    <IconButton 
                      size="small"
                      sx={{
                        padding: 0.4,
                        color: BUSINESS_COLORS.notPaid,
                        animation: `${pulseRed} 1.5s ease-in-out infinite`,
                        '&:hover': { 
                          bgcolor: `${BUSINESS_COLORS.notPaid}10`,
                        }
                      }}
                    >
                      <NotPaidIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Tooltip>
                )}
                
                {/* מספר לילות */}
                <Box
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'white',
                    color: statusInfo.primary,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    height: 20,
                    borderRadius: 10,
                    px: 1
                  }}
                >
                  <BedtimeIcon sx={{ 
                    fontSize: '0.78rem',
                    mr: 0.5,
                    color: statusInfo.primary
                  }} />
                  <Typography variant="caption" fontWeight={600} fontSize="0.68rem">
                    {nights} לילות
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Card>
  );
};

export default RoomCard; 
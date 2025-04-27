import React from 'react';
import { Paper, Box, Typography, CircularProgress, Badge, Divider } from '@mui/material';
import { House as RothschildIcon, Flight as AirportIcon } from '@mui/icons-material';
import { STYLE_CONSTANTS } from '../../design-system/styles/StyleConstants';
import RoomCard from './RoomCard';

/**
 * קומפוננטת אזור מיקום בדאשבורד
 */
const LocationSection = ({ 
  location, 
  rooms, 
  bookings, 
  loading, 
  onRoomClick,
  getRoomStatus
}) => {
  const colors = STYLE_CONSTANTS.colors;
  
  // צבעים לפי מיקום
  const locationColors = location === 'airport' ? colors.airport : colors.rothschild;
  const locationTitle = location === 'airport' ? 'Airport Guest House' : 'רוטשילד';
  const LocationIcon = location === 'airport' ? AirportIcon : RothschildIcon;

  // ספירה של החדרים לפי סטטוס
  const statusCounts = React.useMemo(() => {
    if (!rooms || !bookings) return { occupied: 0, empty: 0, checkIn: 0, checkOut: 0, total: 0 };
    
    const counts = {
      occupied: 0,
      empty: 0,
      'check-in': 0,
      'check-out': 0,
      total: rooms.length
    };
    
    rooms.forEach(room => {
      const { status } = getRoomStatus(room._id, bookings);
      counts[status]++;
    });
    
    return counts;
  }, [rooms, bookings, getRoomStatus]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        p: 3,
        height: 120, 
        alignItems: 'center'
      }}>
        <CircularProgress size={32} thickness={4} sx={{ color: locationColors.main }} />
      </Box>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography>אין חדרים זמינים</Typography>
      </Box>
    );
  }

  // מספר חדרים נותרים למכירה (ריקים)
  const availableRooms = statusCounts.empty;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        ...STYLE_CONSTANTS.card,
        p: 0,
        overflow: 'hidden',
        position: 'relative',
        maxWidth: '95%',
        mx: 'auto',
        mb: 3,
        border: `1px solid ${locationColors.bgLight}`,
        borderRadius: 2,
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: `linear-gradient(to right, ${locationColors.main}, ${locationColors.main}CC)`
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2,
        background: `linear-gradient(135deg, ${locationColors.bgLight}70, white)`,
        borderBottom: '1px solid rgba(0,0,0,0.05)'
      }}>
        {/* כותרת ממוקמת בצד שמאל עם אייקון */}
        <Box sx={{ 
          ml: 'auto', 
          display: 'flex',
          alignItems: 'center',
          gap: '12px' // מרווח נאה בין האייקון לטקסט
        }}>
          {/* האייקון */}
          <LocationIcon 
            sx={{ 
              color: locationColors.main,
              fontSize: '1.2rem'
            }} 
          />
          
          {/* טקסט הכותרת */}
          <Box>
            <Typography 
              variant="h6" 
              fontWeight={600} 
              sx={{ 
                color: locationColors.main,
                fontSize: '1.05rem',
                letterSpacing: '0.2px'
              }}
            >
              {locationTitle}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{
                fontSize: '0.75rem',
                opacity: 0.9
              }}
            >
              {availableRooms} חדרים נותרים
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 1.5 }}>
        {rooms.map(room => {
          // קבלת סטטוס החדר והזמנה אם יש
          const { status, booking } = getRoomStatus(room._id, bookings);
          
          return (
            <RoomCard 
              key={room._id} 
              room={room} 
              status={status}
              booking={booking}
              onClick={() => onRoomClick(status, room, booking)}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

export default LocationSection; 
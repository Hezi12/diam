import React from 'react';
import { Paper, Box, Typography, CircularProgress } from '@mui/material';
import { House as RothschildIcon, Flight as AirportIcon } from '@mui/icons-material';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';
import RoomCard from './RoomCard';

/**
 * קומפוננטת אזור מיקום בדאשבורד - עם עיצוב מינימליסטי משופר
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
        height: 100, 
        alignItems: 'center'
      }}>
        <CircularProgress size={24} thickness={4} sx={{ color: locationColors.main }} />
      </Box>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography sx={{ color: colors.text.primary, fontWeight: 500 }}>אין חדרים זמינים</Typography>
      </Box>
    );
  }

  // מספר חדרים נותרים למכירה (ריקים)
  const availableRooms = statusCounts.empty;

  return (
    <Box 
      sx={{ 
        position: 'relative',
        maxWidth: '98%',
        mx: 'auto',
        mb: 3,
      }}
    >
      {/* כותרת אזור */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 1,
        pb: 1.5,
        borderBottom: `1px solid ${locationColors.main}30`,
        mb: 1,
        maxWidth: '95%',
        mx: 'auto'
      }}>
        {/* כותרת ממוקמת בצד שמאל עם אייקון */}
        <Box sx={{ 
          ml: 'auto', 
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
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
                fontSize: '1.1rem',
                letterSpacing: '0.1px'
              }}
            >
              {locationTitle}
            </Typography>
          </Box>
        </Box>
        
        {/* מידע על חדרים זמינים */}
        <Typography 
          variant="caption" 
          sx={{
            fontSize: '0.8rem',
            mr: 1,
            color: colors.text.primary,
            fontWeight: 500
          }}
        >
          {availableRooms} חדרים זמינים
        </Typography>
      </Box>

      {/* רשימת החדרים */}
      <Box sx={{ 
        p: 0.5,
        maxWidth: '90%',
        mx: 'auto'
      }}>
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
    </Box>
  );
};

export default LocationSection; 
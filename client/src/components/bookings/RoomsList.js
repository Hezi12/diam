import React, { useMemo } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, Paper, Skeleton } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

/**
 * פונקציה לסינון חדרים מקטגוריית "Not for Sale"
 */
const filterNotForSaleRooms = (rooms) => {
  return rooms.filter(room => room.category !== 'Not for Sale');
};

/**
 * פונקציה למיון החדרים לפי מספר
 */
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

/**
 * רכיב המציג את רשימת החדרים בצד הימני של דף ההזמנות
 */
const RoomsList = ({ rooms, loading, selectedRoomId, onRoomSelect, location }) => {
  // הגדרת צבעים לפי מיקום
  const locationColors = {
    airport: {
      main: '#64d2ff',
      bgLight: 'rgba(100, 210, 255, 0.1)'
    },
    rothschild: {
      main: '#5e5ce6',
      bgLight: 'rgba(94, 92, 230, 0.1)'
    }
  };

  const currentColors = locationColors[location] || locationColors.airport;

  // מיפוי קטגוריות חדרים לצבעים
  const categoryColors = {
    'Simple': '#add8e6',           // תכלת בהיר
    'Simple with Balcony': '#87ceeb', // תכלת
    'Standard': '#b0c4de',         // כחול בהיר
    'Standard with Balcony': '#6495ed', // כחול בינוני
    'Family room': '#4169e1',       // כחול כהה
    'Not for Sale': '#808080'      // אפור
  };
  
  // פונקציה לקבלת הצבע של קטגוריית החדר
  const getCategoryColor = (category) => {
    return categoryColors[category] || '#add8e6';
  };

  // סינון ומיון החדרים
  const processedRooms = useMemo(() => {
    return sortRoomsByNumber(filterNotForSaleRooms(rooms));
  }, [rooms]);

  // יצירת מבנה היררכי של חדרים לפי קטגוריה
  const roomsByCategory = useMemo(() => {
    return processedRooms.reduce((acc, room) => {
      if (!acc[room.category]) {
        acc[room.category] = [];
      }
      acc[room.category].push(room);
      return acc;
    }, {});
  }, [processedRooms]);

  if (loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: '14px', height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
          חדרים
        </Typography>
        {[1, 2, 3, 4, 5].map((n) => (
          <Skeleton key={n} variant="rectangular" sx={{ height: 40, mb: 1, borderRadius: 1 }} />
        ))}
      </Paper>
    );
  }

  return (
    <Paper 
      sx={{ 
        p: 2, 
        borderRadius: '14px', 
        height: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
        חדרים ({processedRooms.length})
      </Typography>

      {/* הצגת החדרים לפי קטגוריה */}
      {Object.entries(roomsByCategory).map(([category, roomsInCategory]) => (
        <Box key={category} sx={{ mb: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600, 
              mb: 1, 
              color: getCategoryColor(category),
              borderBottom: `1px solid ${getCategoryColor(category)}`,
              pb: 0.5
            }}
          >
            {category}
          </Typography>

          <List disablePadding dense>
            {roomsInCategory.map(room => (
              <ListItem 
                key={room._id}
                button
                selected={selectedRoomId === room._id}
                onClick={() => onRoomSelect(room._id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: currentColors.bgLight
                  },
                  '&:hover': { 
                    bgcolor: selectedRoomId === room._id 
                      ? currentColors.bgLight 
                      : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: '32px' }}>
                  <CircleIcon sx={{
                    width: 8,
                    height: 8,
                    color: room.status ? 'success.main' : 'text.disabled'
                  }} />
                </ListItemIcon>
                <ListItemText 
                  primary={`חדר ${room.roomNumber}`}
                  primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      ))}

      {processedRooms.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          לא נמצאו חדרים במיקום זה
        </Typography>
      )}
    </Paper>
  );
};

export default RoomsList; 
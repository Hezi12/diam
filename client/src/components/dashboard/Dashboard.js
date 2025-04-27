import React, { useState } from 'react';
import { Box, CircularProgress, Alert, Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import { darken } from 'polished';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { GET_ROOMS_BY_DATE } from '../../graphql/queries/rooms';
import { DashboardDateNav } from './DashboardDateNav';
import { RoomCard } from './RoomCard';
import { EmptyState } from './EmptyState';
import { STYLE_CONSTANTS } from '../../constants/styleConstants';

const Dashboard = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [rooms, setRooms] = useState([]);

  const handleDateChange = (date) => {
    setCurrentDate(date);
  };

  const handleRoomClick = (room) => {
    router.push(`/rooms/${room.id}`);
  };

  const handleAddReservation = () => {
    router.push('/reservations/new');
  };

  const { data, error } = useQuery(GET_ROOMS_BY_DATE, {
    variables: { date: currentDate.toISOString().split('T')[0] },
    onCompleted: (data) => {
      setRooms(data.rooms);
      setLoading(false);
    },
    onError: (err) => {
      setErrorMessage(err.message);
      setLoading(false);
    }
  });

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      <DashboardDateNav currentDate={currentDate} onDateChange={handleDateChange} />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={40} />
        </Box>
      ) : errorMessage ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {errorMessage}
        </Alert>
      ) : (
        <>
          {rooms.length === 0 ? (
            <EmptyState 
              message="אין חדרים זמינים"
              secondaryMessage="לא נמצאו חדרים לתאריך זה" 
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {rooms.map(room => (
                <RoomCard 
                  key={room.id} 
                  room={room}
                  onClick={() => handleRoomClick(room)}
                />
              ))}
            </Box>
          )}
        </>
      )}
      
      <Fab 
        color="primary" 
        aria-label="הוסף הזמנה" 
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          bgcolor: STYLE_CONSTANTS.colors.accent.blue,
          '&:hover': {
            bgcolor: darken(STYLE_CONSTANTS.colors.accent.blue, 0.1)
          }
        }}
        onClick={handleAddReservation}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Dashboard; 
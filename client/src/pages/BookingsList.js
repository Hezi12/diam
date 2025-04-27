import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BookingsList = ({ location }) => {
  const navigate = useNavigate();
  // ... existing code ...
  
  return (
    // ... existing code ...
    <NewBookingForm
      open={openDialog}
      onClose={handleCloseDialog}
      onSave={handleBookingSubmit}
      rooms={rooms}
      location={location}
      editBooking={selectedBooking}
      onDelete={handleDeleteBooking}
      navigate={navigate}
    />
    // ... existing code ...
  );
}

export default BookingsList; 
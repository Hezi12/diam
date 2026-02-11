const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const moment = require('moment');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Booking = require('../models/Booking');
const Room = require('../models/Room');
const icalService = require('../services/icalService');

async function testExport() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const location = 'rothschild';
    const roomId = '1';

    console.log(`Testing export for ${location} Room ${roomId}...`);

    // Check if room exists
    const room = await Room.findOne({ roomNumber: roomId, location });
    if (!room) {
      console.log('ERROR: Room not found in DB!');
      return;
    }
    console.log('Room found:', room._id);

    // Check future bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureBookings = await Booking.find({
      roomNumber: roomId,
      location: location,
      status: { $in: ['confirmed', 'checked-in', 'pending'] },
      checkOut: { $gt: today }
    });

    console.log(`Found ${futureBookings.length} future bookings.`);
    if (futureBookings.length === 0) {
      console.log('WARNING: No future bookings found. Booking.com might reject empty calendars.');
    }

    // Generate calendar
    const icalData = await icalService.generateRoomCalendar(roomId, location);
    console.log('--- ICal Data Preview ---');
    console.log(icalData.substring(0, 500));
    console.log('-------------------------');

    if (icalData.includes('BEGIN:VEVENT')) {
      console.log('SUCCESS: Calendar contains events.');
    } else {
      console.log('WARNING: Calendar is empty (no events).');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testExport();

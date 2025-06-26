const ical = require('ical-generator').default;
const axios = require('axios');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const moment = require('moment');

class ICalService {
    constructor() {
        this.calendar = null;
    }

    /**
     * יצירת קובץ iCal לייצוא לבוקינג
     * @param {string} roomId - מזהה החדר
     * @param {string} location - מיקום (airport/rothschild)
     * @returns {string} - קובץ iCal
     */
    async generateRoomCalendar(roomId, location) {
        try {
            // יצירת לוח שנה חדש
            const calendar = ical({
                domain: 'diam-hotels.com',
                name: `DIAM-${location.toUpperCase()}-Room-${roomId}`,
                description: `זמינות חדר ${roomId} במתחם ${location === 'airport' ? 'אור יהודה' : 'רוטשילד'}`,
                timezone: 'Asia/Jerusalem',
                ttl: 3600, // עדכון כל שעה
                prodId: `//DIAM Hotels//Room ${roomId} ${location}//HE`
            });

            // שליפת כל ההזמנות לחדר זה
            const bookings = await Booking.find({
                roomNumber: roomId,
                location: location,
                status: { $in: ['confirmed', 'checked-in', 'pending'] },
                checkIn: { $gte: new Date() } // תוקן: checkInDate → checkIn
            }).sort({ checkIn: 1 }); // תוקן: checkInDate → checkIn

            // הוספת כל הזמנה כאירוע חסום
            for (const booking of bookings) {
                const event = calendar.createEvent({
                    start: moment(booking.checkIn).startOf('day').toDate(), // תוקן: checkInDate → checkIn
                    end: moment(booking.checkOut).startOf('day').toDate(),   // תוקן: checkOutDate → checkOut
                    summary: `חסום - ${booking.firstName || 'אורח'}`,
                    description: `הזמנה #${booking.bookingNumber}\nמקור: ${booking.source || 'diam'}\nסטטוס: ${booking.status}`,
                    location: `DIAM ${location.toUpperCase()}`,
                    busyStatus: 'BUSY',
                    transparency: 'OPAQUE'
                });

                // הוספת מזהה ייחודי
                event.id(`booking-${booking._id}`);
            }

            return calendar.toString();

        } catch (error) {
            console.error('שגיאה ביצירת לוח שנה iCal:', error);
            throw new Error('שגיאה ביצירת לוח השנה');
        }
    }

    /**
     * ייבוא הזמנות מקובץ iCal של בוקינג
     * @param {string} icalUrl - קישור לקובץ iCal של בוקינג
     * @param {string} roomId - מזהה החדר
     * @param {string} location - מיקום
     * @returns {Array} - רשימת הזמנות חדשות
     */
    async importBookingCalendar(icalUrl, roomId, location) {
        try {
            console.log(`מייבא הזמנות מבוקינג עבור חדר ${roomId} במיקום ${location}`);
            
            // הורדת קובץ iCal מבוקינג
            const response = await axios.get(icalUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'DIAM-Hotels-Calendar-Sync/1.0'
                }
            });

            const icalData = response.data;
            
            // פיענוח קובץ iCal
            const events = this.parseICalData(icalData);
            
            // **שלב 1: מחיקת כל ההזמנות הישנות מבוקינג לחדר זה**
            console.log(`מוחק הזמנות ישנות מבוקינג עבור חדר ${roomId}...`);
            const deletedBookings = await Booking.deleteMany({
                roomNumber: roomId,
                location: location,
                source: 'booking'
            });
            console.log(`נמחקו ${deletedBookings.deletedCount} הזמנות ישנות מבוקינג`);
            
            const newBookings = [];
            
            // **שלב 2: הוספת כל ההזמנות הנוכחיות מבוקינג**
            for (const event of events) {
                // חיפוש החדר כדי לקבל את ה-ObjectId
                const room = await Room.findOne({ roomNumber: roomId, location: location });
                if (!room) {
                    console.error(`החדר ${roomId} במיקום ${location} לא נמצא`);
                    continue;
                }

                // יצירת הזמנה חדשה מבוקינג
                const bookingNumber = await this.generateBookingNumber();
                const newBooking = new Booking({
                    bookingNumber: parseInt(bookingNumber.replace('BK', '')), // המודל מצפה למספר
                    firstName: event.summary || 'אורח מבוקינג',
                    room: room._id, // ObjectId של החדר
                    roomNumber: roomId,
                    location: location,
                    checkIn: event.start,
                    checkOut: event.end,
                    price: 0, // לא ידוע מהקובץ
                    status: 'confirmed',
                    source: 'booking',
                    paymentStatus: 'other', // בוקינג מטפל בתשלום
                    notes: `יובא מבוקינג.קום\nפרטי אירוע: ${event.description || ''}`
                });

                await newBooking.save();
                newBookings.push(newBooking);
                
                console.log(`נוצרה הזמנה חדשה מבוקינג: ${newBooking.bookingNumber}`);
            }

            console.log(`סנכרון הושלם: ${deletedBookings.deletedCount} נמחקו, ${newBookings.length} נוספו`);
            return newBookings;

        } catch (error) {
            console.error('שגיאה בייבוא מבוקינג:', error);
            throw new Error(`שגיאה בייבוא הזמנות מבוקינג: ${error.message}`);
        }
    }

    /**
     * פיענוח נתוני iCal
     * @param {string} icalData - נתוני iCal גולמיים
     * @returns {Array} - רשימת אירועים
     */
    parseICalData(icalData) {
        const events = [];
        const lines = icalData.split('\n');
        let currentEvent = null;

        for (let line of lines) {
            line = line.trim();
            
            if (line === 'BEGIN:VEVENT') {
                currentEvent = {};
            } else if (line === 'END:VEVENT' && currentEvent) {
                if (currentEvent.start && currentEvent.end) {
                    events.push(currentEvent);
                }
                currentEvent = null;
            } else if (currentEvent) {
                if (line.startsWith('DTSTART')) {
                    currentEvent.start = this.parseICalDate(line);
                } else if (line.startsWith('DTEND')) {
                    currentEvent.end = this.parseICalDate(line);
                } else if (line.startsWith('SUMMARY:')) {
                    currentEvent.summary = line.replace('SUMMARY:', '');
                } else if (line.startsWith('DESCRIPTION:')) {
                    currentEvent.description = line.replace('DESCRIPTION:', '');
                }
            }
        }

        return events;
    }

    /**
     * פיענוח תאריך iCal
     * @param {string} line - שורת תאריך
     * @returns {Date} - אובייקט תאריך
     */
    parseICalDate(line) {
        const dateStr = line.split(':')[1];
        if (dateStr.includes('T')) {
            // תאריך עם שעה
            return moment(dateStr, 'YYYYMMDDTHHmmss').toDate();
        } else {
            // תאריך בלבד
            return moment(dateStr, 'YYYYMMDD').toDate();
        }
    }

    /**
     * יצירת מספר הזמנה ייחודי
     * @returns {string} - מספר הזמנה
     */
    async generateBookingNumber() {
        const Counter = require('../models/Counter');
        
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'booking' },
                { $inc: { value: 1 } },
                { new: true, upsert: true }
            );
            
            return `BK${String(counter.value).padStart(6, '0')}`;
        } catch (error) {
            // במקרה של שגיאה, נשתמש בזמן נוכחי
            return `BK${Date.now().toString().slice(-6)}`;
        }
    }

    /**
     * סנכרון אוטומטי של כל החדרים
     * @param {Object} icalSettings - הגדרות iCal
     */
    async syncAllRooms(icalSettings) {
        console.log('מתחיל סנכרון אוטומטי של כל החדרים עם בוקינג...');
        
        try {
            for (const roomConfig of icalSettings.rooms || []) {
                if (roomConfig.bookingIcalUrl && roomConfig.enabled) {
                    await this.importBookingCalendar(
                        roomConfig.bookingIcalUrl,
                        roomConfig.roomId,
                        roomConfig.location
                    );
                    
                    // המתנה קצרה בין חדרים
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            console.log('סנכרון אוטומטי הושלם בהצלחה');
            
        } catch (error) {
            console.error('שגיאה בסנכרון אוטומטי:', error);
        }
    }
}

module.exports = new ICalService(); 
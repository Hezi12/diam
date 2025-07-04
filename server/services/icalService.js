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

            // שליפת כל ההזמנות הפעילות לחדר זה (שעדיין לא נגמרו)
            const today = new Date();
            today.setHours(0, 0, 0, 0); // תחילת היום
            
            const bookings = await Booking.find({
                roomNumber: roomId,
                location: location,
                status: { $in: ['confirmed', 'checked-in', 'pending'] },
                checkOut: { $gt: today } // כל הזמנה שעדיין לא נגמרה
            }).sort({ checkIn: 1 });

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
            
            /*
            ========== BACKUP - הקוד המקורי לפני השינוי ==========
            
            // **שלב 1: מחיקת כל ההזמנות הישנות מבוקינג לחדר זה**
            console.log(`מוחק הזמנות ישנות מבוקינג עבור חדר ${roomId}...`);
            const deletedBookings = await Booking.deleteMany({
                roomNumber: roomId,
                location: location,
                source: 'booking'
            });
            console.log(`נמחקו ${deletedBookings.deletedCount} הזמנות ישנות מבוקינג`);
            
            // המתנה קצרה למניעת race conditions
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const newBookings = [];
            
            // **שלב 2: הוספת כל ההזמנות הנוכחיות מבוקינג**
            for (const event of events) {
                // ... יצירת הזמנה חדשה עבור כל אירוע
            }
            
            ========== סוף BACKUP ==========
            */
            
            // **הלוגיקה החדשה - חכמה יותר עם UID**
            console.log('🔄 מתחיל סנכרון חכם עם זיהוי UID...');
            
            // שלב 1: איסוף כל ה-UIDs מהקובץ החדש
            const newUIDs = events.map(event => event.uid).filter(uid => uid); // מסנן UIDs ריקים
            console.log(`📋 נמצאו ${newUIDs.length} UIDs בקובץ החדש מבוקינג`);
            
            // שלב 2: מחיקת הזמנות שבוטלו בבוקינג (לא קיימות יותר)
            console.log('🗑️ מחפש הזמנות שבוטלו בבוקינג...');
            
            // חיפוש הזמנות קיימות מבוקינג
            const existingBookings = await Booking.find({
                roomNumber: roomId,
                location: location,
                source: 'booking'
            });
            
            let deletedCount = 0;
            
            // בדיקה עבור כל הזמנה קיימת - האם היא עדיין קיימת בבוקינג?
            for (const booking of existingBookings) {
                const bookingUID = this.extractUIDFromNotes(booking.notes);
                
                if (bookingUID && !newUIDs.includes(bookingUID)) {
                    // ההזמנה לא קיימת יותר בבוקינג - בוטלה
                    console.log(`❌ מוחק הזמנה מבוטלת: ${booking.bookingNumber} (UID: ${bookingUID})`);
                    await Booking.findByIdAndDelete(booking._id);
                    deletedCount++;
                } else if (!bookingUID) {
                    // הזמנה ישנה ללא UID - מוחקים אותה גם כן
                    console.log(`⚠️ מוחק הזמנה ישנה ללא UID: ${booking.bookingNumber}`);
                    await Booking.findByIdAndDelete(booking._id);
                    deletedCount++;
                }
            }
            
            console.log(`🗑️ נמחקו ${deletedCount} הזמנות מבוטלות/ישנות`);
            
            // שלב 3: הוספת הזמנות חדשות בלבד
            console.log('➕ מחפש הזמנות חדשות להוספה...');
            
            const newBookings = [];
            
            for (const event of events) {
                // בדיקה אם ההזמנה כבר קיימת לפי UID
                const eventUID = event.uid;
                if (!eventUID) {
                    console.log('⚠️ אירוע ללא UID, מדלג...');
                    continue;
                }
                
                const existingBooking = await Booking.findOne({
                    roomNumber: roomId,
                    location: location,
                    source: 'booking',
                    notes: { $regex: eventUID }
                });
                
                if (existingBooking) {
                    console.log(`✅ הזמנה קיימת (UID: ${eventUID}), משאיר ללא שינוי`);
                    continue; // הזמנה קיימת - לא נוגעים בה!
                }
                
                console.log(`🆕 הזמנה חדשה נמצאה (UID: ${eventUID}), יוצר...`);
                
                // חיפוש החדר כדי לקבל את ה-ObjectId
                const room = await Room.findOne({ roomNumber: roomId, location: location });
                if (!room) {
                    console.error(`החדר ${roomId} במיקום ${location} לא נמצא`);
                    continue;
                }

                // יצירת הזמנה חדשה מבוקינג
                const bookingNumber = await this.generateBookingNumber();
                
                // ניסיון לחלץ שם מה-SUMMARY (לעיתים יש שם אורח)
                let firstName = 'אורח מבוקינג';
                let lastName = 'Booking.com';
                
                if (event.summary) {
                    // סינון טקסטים לא רלוונטיים מבוקינג
                    const cleanSummary = event.summary
                        .replace(/CLOSED\s*-?\s*/gi, '') // הסרת "CLOSED -"
                        .replace(/Not\s+available/gi, '') // הסרת "Not available"
                        .replace(/Unavailable/gi, '') // הסרת "Unavailable"
                        .replace(/Blocked/gi, '') // הסרת "Blocked"
                        .replace(/Reserved/gi, '') // הסרת "Reserved"
                        .replace(/Maintenance/gi, '') // הסרת "Maintenance"
                        .replace(/Out\s+of\s+order/gi, '') // הסרת "Out of order"
                        .replace(/^\s*-\s*/, '') // הסרת מקף בתחילת השורה
                        .replace(/\s*-\s*$/, '') // הסרת מקף בסוף השורה
                        .replace(/\s+/g, ' ') // החלפת רווחים מרובים ברווח יחיד
                        .trim();
                    
                    console.log(`🔍 מעבד SUMMARY: "${event.summary}" -> "${cleanSummary}"`);
                    
                    if (cleanSummary && cleanSummary.length > 0) {
                        // אם יש שם נקי, נשתמש בו כשם פרטי
                        // ונשאיר "Booking.com" כשם משפחה לזיהוי
                        firstName = cleanSummary;
                        lastName = 'Booking.com';
                        
                        console.log(`✅ שם נמצא: "${firstName}" "${lastName}"`);
                    } else {
                        // אם לא נמצא שם, נשתמש בברירת מחדל
                        firstName = 'אורח מבוקינג';
                        lastName = 'Booking.com';
                        
                        console.log(`⚠️ לא נמצא שם, משתמש בברירת מחדל: "${firstName}" "${lastName}"`);
                    }
                } else {
                    console.log('⚠️ אין SUMMARY, משתמש בברירת מחדל');
                }
                
                // ניסיון לחלץ מספר הזמנה מבוקינג מה-UID או מה-DESCRIPTION
                let externalBookingNumber = '';
                if (event.uid) {
                    const bookingMatch = event.uid.match(/(\d+)/);
                    if (bookingMatch) {
                        externalBookingNumber = bookingMatch[1];
                    }
                }
                
                // חיפוש מספר הזמנה בתיאור
                if (!externalBookingNumber && event.description) {
                    const descBookingMatch = event.description.match(/booking[:\s]*(\d+)/i);
                    if (descBookingMatch) {
                        externalBookingNumber = descBookingMatch[1];
                    }
                }
                
                // יצירת הערות מפורטות
                let notes = 'יובא מבוקינג.קום';
                if (event.description) notes += `\nתיאור: ${event.description}`;
                if (event.uid) notes += `\nUID: ${event.uid}`;
                if (event.status) notes += `\nסטטוס: ${event.status}`;
                if (event.location) notes += `\nמיקום: ${event.location}`;
                if (event.organizer) notes += `\nארגן: ${event.organizer}`;
                if (event.contact) notes += `\nיצירת קשר: ${event.contact}`;

                const newBooking = new Booking({
                    bookingNumber: parseInt(bookingNumber.replace('BK', '')), // המודל מצפה למספר
                    firstName: firstName,
                    lastName: lastName,
                    room: room._id, // ObjectId של החדר
                    roomNumber: roomId,
                    location: location,
                    checkIn: event.start,
                    checkOut: event.end,
                    price: 0, // לא ידוע מהקובץ
                    status: 'confirmed',
                    source: 'booking',
                    paymentStatus: 'other', // בוקינג מטפל בתשלום
                    externalBookingNumber: externalBookingNumber,
                    notes: notes
                });

                await newBooking.save();
                newBookings.push(newBooking);
                
                console.log(`✅ נוצרה הזמנה חדשה מבוקינג: ${newBooking.bookingNumber}`);
            }

            console.log(`🎉 סנכרון חכם הושלם: ${deletedCount} נמחקו, ${newBookings.length} נוספו`);
            console.log('💡 הזמנות שנערכו ידנית נשמרו ללא שינוי');
            
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

        console.log('🔍 מתחיל פיענוח קובץ iCal...');

        for (let line of lines) {
            line = line.trim();
            
            if (line === 'BEGIN:VEVENT') {
                currentEvent = {
                    rawData: [] // אוסף של כל השורות הגולמיות לדיבוג
                };
            } else if (line === 'END:VEVENT' && currentEvent) {
                if (currentEvent.start && currentEvent.end) {
                    // הדפסת כל המידע שנמצא באירוע
                    console.log('📅 אירוע נמצא:', {
                        summary: currentEvent.summary,
                        description: currentEvent.description,
                        start: currentEvent.start,
                        end: currentEvent.end,
                        uid: currentEvent.uid,
                        status: currentEvent.status,
                        location: currentEvent.location,
                        organizer: currentEvent.organizer,
                        attendee: currentEvent.attendee,
                        contact: currentEvent.contact,
                        url: currentEvent.url,
                        categories: currentEvent.categories,
                        class: currentEvent.class,
                        rawLines: currentEvent.rawData.length > 0 ? currentEvent.rawData : 'לא נשמר'
                    });
                    events.push(currentEvent);
                }
                currentEvent = null;
            } else if (currentEvent) {
                // שמירת השורה הגולמית לדיבוג
                currentEvent.rawData.push(line);
                
                // פיענוח שדות ידועים
                if (line.startsWith('DTSTART')) {
                    currentEvent.start = this.parseICalDate(line);
                } else if (line.startsWith('DTEND')) {
                    currentEvent.end = this.parseICalDate(line);
                } else if (line.startsWith('SUMMARY:')) {
                    currentEvent.summary = line.replace('SUMMARY:', '');
                } else if (line.startsWith('DESCRIPTION:')) {
                    currentEvent.description = line.replace('DESCRIPTION:', '');
                } else if (line.startsWith('UID:')) {
                    currentEvent.uid = line.replace('UID:', '');
                } else if (line.startsWith('STATUS:')) {
                    currentEvent.status = line.replace('STATUS:', '');
                } else if (line.startsWith('LOCATION:')) {
                    currentEvent.location = line.replace('LOCATION:', '');
                } else if (line.startsWith('ORGANIZER')) {
                    currentEvent.organizer = line.replace(/ORGANIZER[^:]*:/, '');
                } else if (line.startsWith('ATTENDEE')) {
                    currentEvent.attendee = line.replace(/ATTENDEE[^:]*:/, '');
                } else if (line.startsWith('CONTACT:')) {
                    currentEvent.contact = line.replace('CONTACT:', '');
                } else if (line.startsWith('URL:')) {
                    currentEvent.url = line.replace('URL:', '');
                } else if (line.startsWith('CATEGORIES:')) {
                    currentEvent.categories = line.replace('CATEGORIES:', '');
                } else if (line.startsWith('CLASS:')) {
                    currentEvent.class = line.replace('CLASS:', '');
                }
            }
        }

        console.log(`✅ פיענוח הושלם: נמצאו ${events.length} אירועים`);
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

    /**
     * חילוץ UID מהערות ההזמנה
     * @param {string} notes - הערות ההזמנה
     * @returns {string|null} - UID או null אם לא נמצא
     */
    extractUIDFromNotes(notes) {
        if (!notes) return null;
        
        const uidMatch = notes.match(/UID:\s*([^\n\r]+)/);
        return uidMatch ? uidMatch[1].trim() : null;
    }
}

module.exports = new ICalService(); 
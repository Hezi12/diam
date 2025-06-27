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
                
                // ניסיון לחלץ שם האורח ממקורות שונים
                let firstName = 'אורח מבוקינג';
                let lastName = '';
                let guestNameFound = false;
                
                // פונקציה לחלץ שם מטקסט
                const extractNameFromText = (text) => {
                    if (!text) return null;
                    
                    // דפוסים לחיפוש שם (באנגלית ועברית)
                    const namePatterns = [
                        // שם מלא עם רווח
                        /(?:guest|name|אורח|שם)[:\s]*([A-Za-z\u0590-\u05FF]+)\s+([A-Za-z\u0590-\u05FF]+)/i,
                        // שם בתחילת השורה
                        /^([A-Za-z\u0590-\u05FF]{2,})\s+([A-Za-z\u0590-\u05FF]{2,})/,
                        // שם אחרי "for" או "עבור"
                        /(?:for|עבור)\s+([A-Za-z\u0590-\u05FF]+)\s+([A-Za-z\u0590-\u05FF]+)/i,
                        // שם בין מירכאות
                        /"([A-Za-z\u0590-\u05FF]+)\s+([A-Za-z\u0590-\u05FF]+)"/,
                        // שם אחרי נקודותיים
                        /:\s*([A-Za-z\u0590-\u05FF]+)\s+([A-Za-z\u0590-\u05FF]+)/
                    ];
                    
                    for (const pattern of namePatterns) {
                        const match = text.match(pattern);
                        if (match && match[1] && match[2]) {
                            // בדיקה שזה לא מילים כמו "not available"
                            const firstWord = match[1].toLowerCase();
                            const secondWord = match[2].toLowerCase();
                            
                            if (!['not', 'available', 'closed', 'blocked', 'maintenance'].includes(firstWord) &&
                                !['not', 'available', 'closed', 'blocked', 'maintenance'].includes(secondWord)) {
                                return { firstName: match[1], lastName: match[2] };
                            }
                        }
                    }
                    
                    // אם לא נמצא שם מלא, חפש שם בודד
                    const singleNamePatterns = [
                        /(?:guest|name|אורח|שם)[:\s]*([A-Za-z\u0590-\u05FF]{2,})/i,
                        /^([A-Za-z\u0590-\u05FF]{2,})(?:\s|$)/,
                        /"([A-Za-z\u0590-\u05FF]{2,})"/
                    ];
                    
                    for (const pattern of singleNamePatterns) {
                        const match = text.match(pattern);
                        if (match && match[1]) {
                            const word = match[1].toLowerCase();
                            if (!['not', 'available', 'closed', 'blocked', 'maintenance', 'booking', 'reservation'].includes(word)) {
                                return { firstName: match[1], lastName: '' };
                            }
                        }
                    }
                    
                    return null;
                };
                
                // 1. ניסיון לחלץ שם מה-DESCRIPTION (המקום הכי סביר)
                if (event.description && !guestNameFound) {
                    const nameFromDesc = extractNameFromText(event.description);
                    if (nameFromDesc) {
                        firstName = nameFromDesc.firstName;
                        lastName = nameFromDesc.lastName;
                        guestNameFound = true;
                        console.log('🎯 נמצא שם אורח בתיאור:', firstName, lastName);
                    }
                }
                
                // 2. ניסיון לחלץ שם מה-ORGANIZER
                if (event.organizer && !guestNameFound) {
                    // חילוץ שם מכתובת אימייל או מהפורמט CN=Name
                    const organizerPatterns = [
                        /CN=([^:;]+)/i, // Common Name in ORGANIZER field
                        /mailto:([^@]+)@/i, // Email username
                        /([A-Za-z\u0590-\u05FF]+)\s+([A-Za-z\u0590-\u05FF]+)/ // Regular name
                    ];
                    
                    for (const pattern of organizerPatterns) {
                        const match = event.organizer.match(pattern);
                        if (match && match[1]) {
                            if (match[2]) {
                                firstName = match[1];
                                lastName = match[2];
                            } else {
                                // אם יש רק שם אחד, נבדוק אם זה שם מלא
                                const fullName = match[1].trim();
                                const nameParts = fullName.split(/\s+/);
                                if (nameParts.length >= 2) {
                                    firstName = nameParts[0];
                                    lastName = nameParts.slice(1).join(' ');
                                } else {
                                    firstName = fullName;
                                    lastName = '';
                                }
                            }
                            guestNameFound = true;
                            console.log('🎯 נמצא שם אורח ב-ORGANIZER:', firstName, lastName);
                            break;
                        }
                    }
                }
                
                // 3. ניסיון לחלץ שם מה-ATTENDEE
                if (event.attendee && !guestNameFound) {
                    const nameFromAttendee = extractNameFromText(event.attendee);
                    if (nameFromAttendee) {
                        firstName = nameFromAttendee.firstName;
                        lastName = nameFromAttendee.lastName;
                        guestNameFound = true;
                        console.log('🎯 נמצא שם אורח ב-ATTENDEE:', firstName, lastName);
                    }
                }
                
                // 4. רק אם לא נמצא כלום, ננסה את ה-SUMMARY (למקרה שיש שם בכל זאת)
                if (!guestNameFound && event.summary) {
                    const nameFromSummary = extractNameFromText(event.summary);
                    if (nameFromSummary) {
                        firstName = nameFromSummary.firstName;
                        lastName = nameFromSummary.lastName;
                        guestNameFound = true;
                        console.log('🎯 נמצא שם אורח ב-SUMMARY:', firstName, lastName);
                    }
                }
                
                // 5. ניסיון לחלץ שם משדות מותאמים אישית (X-properties)
                if (!guestNameFound && event.customGuestField) {
                    const nameFromCustom = extractNameFromText(event.customGuestField);
                    if (nameFromCustom) {
                        firstName = nameFromCustom.firstName;
                        lastName = nameFromCustom.lastName;
                        guestNameFound = true;
                        console.log('🎯 נמצא שם אורח בשדה מותאם:', firstName, lastName);
                    }
                }
                
                // 6. אם עדיין לא נמצא שם, ננסה לחלץ מה-UID
                if (!guestNameFound && event.uid) {
                    // לפעמים ה-UID מכיל מידע על האורח
                    const nameFromUid = extractNameFromText(event.uid);
                    if (nameFromUid) {
                        firstName = nameFromUid.firstName;
                        lastName = nameFromUid.lastName;
                        guestNameFound = true;
                        console.log('🎯 נמצא שם אורח ב-UID:', firstName, lastName);
                    }
                }
                
                if (!guestNameFound) {
                    console.log('⚠️ לא נמצא שם אורח בשום מקום, משתמש בברירת מחדל');
                    console.log('📋 נתונים זמינים:', {
                        summary: event.summary || 'ריק',
                        description: event.description || 'ריק',
                        organizer: event.organizer || 'ריק',
                        attendee: event.attendee || 'ריק',
                        uid: event.uid || 'ריק',
                        customGuestField: event.customGuestField || 'ריק'
                    });
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
                        customGuestField: currentEvent.customGuestField,
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
                } else if (line.startsWith('X-')) {
                    // שדות מותאמים אישית (X-properties) שעלולים להכיל מידע על האורח
                    const xProperty = line.split(':');
                    if (xProperty.length >= 2) {
                        const propertyName = xProperty[0].toLowerCase();
                        const propertyValue = xProperty.slice(1).join(':');
                        
                        // שמירת שדות X- שעלולים להכיל שם אורח
                        if (propertyName.includes('guest') || 
                            propertyName.includes('name') || 
                            propertyName.includes('customer') ||
                            propertyName.includes('client')) {
                            currentEvent.customGuestField = propertyValue;
                        }
                    }
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
}

module.exports = new ICalService(); 
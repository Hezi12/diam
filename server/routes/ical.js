const express = require('express');
const router = express.Router();
const icalService = require('../services/icalService');
const ICalSettings = require('../models/ICalSettings');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// ייצוא לוח שנה לבוקינג (ציבורי - ללא אימות)
router.get('/export/:location/:roomId', async (req, res) => {
    try {
        const { location, roomId } = req.params;
        
        console.log(`בקשה לייצוא iCal: ${location}/${roomId}`);
        
        // בדיקת תקינות הפרמטרים
        if (!location || !roomId) {
            return res.status(400).json({ 
                error: 'חסרים פרמטרים נדרשים' 
            });
        }

        // בדיקה שהחדר קיים
        const room = await Room.findOne({ roomNumber: roomId, location });
        if (!room) {
            return res.status(404).json({ 
                error: 'החדר לא נמצא' 
            });
        }

        // יצירת לוח השנה
        const icalData = await icalService.generateRoomCalendar(roomId, location);
        
        // החזרת הקובץ עם הכותרות הנכונות
        res.set({
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="diam-${location}-${roomId}.ics"`,
            'Cache-Control': 'no-cache, must-revalidate',
            'Expires': new Date(Date.now() + 3600000).toISOString() // שעה
        });
        
        res.send(icalData);
        
        console.log(`ייצוא iCal הושלם בהצלחה: ${location}/${roomId}`);
        
    } catch (error) {
        console.error('שגיאה בייצוא iCal:', error);
        res.status(500).json({ 
            error: 'שגיאה בייצוא לוח השנה',
            details: error.message 
        });
    }
});

// קבלת הגדרות iCal
router.get('/settings', auth, async (req, res) => {
    try {
        const settings = await ICalSettings.find({});
        res.json(settings);
    } catch (error) {
        console.error('שגיאה בקבלת הגדרות iCal:', error);
        res.status(500).json({ 
            error: 'שגיאה בקבלת ההגדרות',
            details: error.message 
        });
    }
});

// קבלת הגדרות למיקום ספציפי
router.get('/settings/:location', auth, async (req, res) => {
    try {
        const { location } = req.params;
        
        let settings = await ICalSettings.findOne({ location });
        
        // אם לא קיימות הגדרות, נצור אותן
        if (!settings) {
            // שליפת כל החדרים במיקום
            const rooms = await Room.find({ location });
            
            settings = new ICalSettings({
                location,
                rooms: rooms.map(room => ({
                    roomId: room.roomNumber,
                    roomName: `חדר ${room.roomNumber}`,
                    enabled: false
                })),
                globalSettings: {
                    autoSyncEnabled: false,
                    syncInterval: 30,
                    notifications: {
                        email: 'diamshotels@gmail.com',
                        onNewBooking: true,
                        onSyncError: true
                    }
                }
            });
            
            await settings.save();
        }
        
        res.json(settings);
    } catch (error) {
        console.error('שגיאה בקבלת הגדרות למיקום:', error);
        res.status(500).json({ 
            error: 'שגיאה בקבלת ההגדרות',
            details: error.message 
        });
    }
});

// רענון הגדרות - יצירת חדרים חסרים
router.post('/settings/:location/refresh', auth, async (req, res) => {
    try {
        const { location } = req.params;
        
        // שליפת כל החדרים במיקום
        const rooms = await Room.find({ location });
        
        let settings = await ICalSettings.findOne({ location });
        
        if (!settings) {
            // יצירת הגדרות חדשות
            settings = new ICalSettings({
                location,
                rooms: [],
                globalSettings: {
                    autoSyncEnabled: false,
                    syncInterval: 30,
                    notifications: {
                        email: 'diamshotels@gmail.com',
                        onNewBooking: true,
                        onSyncError: true
                    }
                }
            });
        }
        
        // הוספת חדרים חסרים
        let addedRooms = 0;
        for (const room of rooms) {
            const exists = settings.rooms.some(r => r.roomId === room.roomNumber);
            if (!exists) {
                settings.rooms.push({
                    roomId: room.roomNumber,
                    roomName: `חדר ${room.roomNumber}`,
                    enabled: false,
                    bookingIcalUrl: '',
                    syncStatus: 'never',
                    importedBookings: 0
                });
                addedRooms++;
            }
        }
        
        await settings.save();
        
        res.json({
            success: true,
            message: `רענון הושלם. נוספו ${addedRooms} חדרים חדשים`,
            settings
        });
        
    } catch (error) {
        console.error('שגיאה ברענון הגדרות:', error);
        res.status(500).json({ 
            error: 'שגיאה ברענון ההגדרות',
            details: error.message 
        });
    }
});

// עדכון הגדרות iCal
router.put('/settings/:location', auth, async (req, res) => {
    try {
        const { location } = req.params;
        const updateData = req.body;
        
        let settings = await ICalSettings.findOne({ location });
        
        if (!settings) {
            // יצירת הגדרות חדשות
            settings = new ICalSettings({
                location,
                ...updateData
            });
        } else {
            // עדכון הגדרות קיימות
            Object.assign(settings, updateData);
        }
        
        await settings.save();
        
        console.log(`הגדרות iCal עודכנו למיקום ${location}`);
        res.json(settings);
        
    } catch (error) {
        console.error('שגיאה בעדכון הגדרות iCal:', error);
        res.status(500).json({ 
            error: 'שגיאה בעדכון ההגדרות',
            details: error.message 
        });
    }
});

// סנכרון ידני של חדר ספציפי
router.post('/sync/:location/:roomId', auth, async (req, res) => {
    try {
        const { location, roomId } = req.params;
        
        console.log(`מתחיל סנכרון ידני: ${location}/${roomId}`);
        
        // שליפת הגדרות החדר
        const settings = await ICalSettings.findOne({ location });
        if (!settings) {
            return res.status(404).json({ 
                error: 'לא נמצאו הגדרות למיקום זה' 
            });
        }
        
        const roomConfig = settings.getRoomConfig(roomId);
        if (!roomConfig || !roomConfig.bookingIcalUrl) {
            return res.status(400).json({ 
                error: 'לא מוגדר קישור iCal לחדר זה' 
            });
        }
        
        // עדכון סטטוס לממתין
        settings.updateSyncStatus(roomId, 'pending');
        await settings.save();
        
        try {
            // ביצוע הסנכרון
            const newBookings = await icalService.importBookingCalendar(
                roomConfig.bookingIcalUrl,
                roomId,
                location
            );
            
            // עדכון סטטוס להצלחה
            settings.updateSyncStatus(roomId, 'success', null, newBookings.length);
            await settings.save();
            
            res.json({
                success: true,
                message: `סנכרון הושלם בהצלחה`,
                newBookings: newBookings.length,
                bookings: newBookings
            });
            
        } catch (syncError) {
            // עדכון סטטוס לשגיאה
            settings.updateSyncStatus(roomId, 'error', syncError.message);
            await settings.save();
            
            throw syncError;
        }
        
    } catch (error) {
        console.error('שגיאה בסנכרון ידני:', error);
        res.status(500).json({ 
            error: 'שגיאה בסנכרון',
            details: error.message 
        });
    }
});

// סנכרון כל החדרים במיקום
// בדיקת תקינות קישור iCal
router.post('/test-url', auth, async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                error: 'נדרש קישור iCal' 
            });
        }
        
        console.log(`בודק קישור iCal: ${url}`);
        
        // ניסיון הורדת הקובץ
        const axios = require('axios');
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'DIAM-Hotels-Test/1.0'
            }
        });
        
        // פיענוח בסיסי של הקובץ
        const icalData = response.data;
        const events = icalService.parseICalData(icalData);
        
        res.json({
            success: true,
            message: 'הקישור תקין',
            events: events.length,
            sample: events.slice(0, 3).map(event => ({
                summary: event.summary,
                start: event.start,
                end: event.end
            }))
        });
        
    } catch (error) {
        console.error('שגיאה בבדיקת קישור:', error);
        res.status(400).json({
            success: false,
            error: error.code === 'ECONNABORTED' ? 'זמן קשר פג' : error.message
        });
    }
});

router.post('/sync/:location', auth, async (req, res) => {
    try {
        const { location } = req.params;
        
        console.log(`מתחיל סנכרון כל החדרים במיקום ${location}`);
        
        const settings = await ICalSettings.findOne({ location });
        if (!settings) {
            return res.status(404).json({ 
                error: 'לא נמצאו הגדרות למיקום זה' 
            });
        }
        
        const enabledRooms = settings.getEnabledRooms();
        if (enabledRooms.length === 0) {
            return res.status(400).json({ 
                error: 'אין חדרים מופעלים לסנכרון' 
            });
        }
        
        let totalNewBookings = 0;
        const results = [];
        
        for (const roomConfig of enabledRooms) {
            try {
                console.log(`מסנכרן חדר ${roomConfig.roomId}...`);
                
                const newBookings = await icalService.importBookingCalendar(
                    roomConfig.bookingIcalUrl,
                    roomConfig.roomId,
                    location
                );
                
                settings.updateSyncStatus(roomConfig.roomId, 'success', null, newBookings.length);
                totalNewBookings += newBookings.length;
                
                results.push({
                    roomId: roomConfig.roomId,
                    status: 'success',
                    newBookings: newBookings.length
                });
                
                // המתנה קצרה בין חדרים
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (roomError) {
                console.error(`שגיאה בסנכרון חדר ${roomConfig.roomId}:`, roomError);
                settings.updateSyncStatus(roomConfig.roomId, 'error', roomError.message);
                
                results.push({
                    roomId: roomConfig.roomId,
                    status: 'error',
                    error: roomError.message
                });
            }
        }
        
        await settings.save();
        
        res.json({
            success: true,
            message: `סנכרון הושלם`,
            totalNewBookings,
            results
        });
        
    } catch (error) {
        console.error('שגיאה בסנכרון כל החדרים:', error);
        res.status(500).json({ 
            error: 'שגיאה בסנכרון',
            details: error.message 
        });
    }
});

// בדיקת קישור iCal
router.post('/test-url', auth, async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                error: 'חסר קישור לבדיקה' 
            });
        }
        
        console.log(`בודק קישור iCal: ${url}`);
        
        // ניסיון הורדת הקובץ
        const axios = require('axios');
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'DIAM-Hotels-Calendar-Test/1.0'
            }
        });
        
        // בדיקה שזה באמת קובץ iCal
        const content = response.data;
        if (!content.includes('BEGIN:VCALENDAR') || !content.includes('END:VCALENDAR')) {
            return res.status(400).json({ 
                error: 'הקישור לא מחזיר קובץ iCal תקין' 
            });
        }
        
        // פיענוח והצגת מידע בסיסי
        const events = icalService.parseICalData(content);
        
        res.json({
            success: true,
            message: 'הקישור תקין!',
            info: {
                totalEvents: events.length,
                sampleEvents: events.slice(0, 3).map(event => ({
                    summary: event.summary,
                    start: event.start,
                    end: event.end
                }))
            }
        });
        
    } catch (error) {
        console.error('שגיאה בבדיקת קישור:', error);
        res.status(400).json({ 
            error: 'הקישור לא תקין או לא זמין',
            details: error.message 
        });
    }
});

// קבלת סטטוס סנכרון
router.get('/status/:location', auth, async (req, res) => {
    try {
        const { location } = req.params;
        
        const settings = await ICalSettings.findOne({ location });
        if (!settings) {
            return res.status(404).json({ 
                error: 'לא נמצאו הגדרות למיקום זה' 
            });
        }
        
        const status = {
            location,
            autoSyncEnabled: settings.globalSettings.autoSyncEnabled,
            lastUpdate: settings.updatedAt,
            rooms: settings.rooms.map(room => ({
                roomId: room.roomId,
                roomName: room.roomName,
                enabled: room.enabled,
                lastSync: room.lastSync,
                syncStatus: room.syncStatus,
                syncError: room.syncError,
                importedBookings: room.importedBookings,
                hasIcalUrl: !!room.bookingIcalUrl
            }))
        };
        
        res.json(status);
        
    } catch (error) {
        console.error('שגיאה בקבלת סטטוס:', error);
        res.status(500).json({ 
            error: 'שגיאה בקבלת הסטטוס',
            details: error.message 
        });
    }
});

// מחיקת כל ההזמנות המיובאות
router.delete('/imported-bookings/:location', auth, async (req, res) => {
    try {
        const { location } = req.params;
        const Booking = require('../models/Booking');
        
        console.log(`מתחיל מחיקת כל ההזמנות המיובאות במיקום ${location}`);
        
        // מחיקת כל ההזמנות שמקורן booking (מיובאות מ-iCal)
        const deleteResult = await Booking.deleteMany({
            location: location,
            source: 'booking'
        });
        
        console.log(`נמחקו ${deleteResult.deletedCount} הזמנות מיובאות`);
        
        // איפוס מונה ההזמנות המיובאות בהגדרות
        const settings = await ICalSettings.findOne({ location });
        if (settings) {
            settings.rooms.forEach(room => {
                room.importedBookings = 0;
                room.syncStatus = 'never';
                room.lastSync = null;
                room.syncError = null;
            });
            await settings.save();
        }
        
        res.json({
            success: true,
            message: `נמחקו ${deleteResult.deletedCount} הזמנות מיובאות`,
            deletedCount: deleteResult.deletedCount
        });
        
    } catch (error) {
        console.error('שגיאה במחיקת הזמנות מיובאות:', error);
        res.status(500).json({ 
            error: 'שגיאה במחיקת ההזמנות',
            details: error.message 
        });
    }
});

module.exports = router; 
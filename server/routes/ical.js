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

// === נתיבים חדשים ל-Expedia ===

// סנכרון Expedia לחדר ספציפי
router.post('/sync/expedia/:location/:roomId', auth, async (req, res) => {
    try {
        const { location, roomId } = req.params;
        
        console.log(`🌍 בקשת סנכרון Expedia: ${location}/${roomId}`);
        
        // קבלת הגדרות
        const settings = await ICalSettings.findOne({ location });
        if (!settings) {
            return res.status(404).json({ 
                error: 'הגדרות iCal לא נמצאו למיקום זה' 
            });
        }
        
        // חיפוש החדר
        const roomConfig = settings.getRoomConfig(roomId);
        if (!roomConfig) {
            return res.status(404).json({ 
                error: 'החדר לא נמצא בהגדרות' 
            });
        }
        
        // בדיקה שהחדר מופעל ויש קישור
        if (!roomConfig.expediaEnabled || !roomConfig.expediaIcalUrl) {
            return res.status(400).json({ 
                error: 'החדר לא מופעל עבור Expedia או שאין קישור iCal' 
            });
        }
        
        // ביצוע הסנכרון
        const newBookings = await icalService.importExpediaCalendar(
            roomConfig.expediaIcalUrl,
            roomId,
            location
        );
        
        // עדכון סטטוס
        settings.updateSyncStatus(roomId, 'expedia', 'success', null, newBookings.length);
        await settings.save();
        
        console.log(`✅ סנכרון Expedia הושלם: ${location}/${roomId} - ${newBookings.length} הזמנות חדשות`);
        
        res.json({
            success: true,
            message: `סנכרון Expedia הושלם בהצלחה`,
            newBookings: newBookings.length,
            roomId,
            location,
            platform: 'expedia'
        });
        
    } catch (error) {
        console.error('שגיאה בסנכרון Expedia:', error);
        
        // עדכון סטטוס שגיאה
        try {
            const settings = await ICalSettings.findOne({ location: req.params.location });
            if (settings) {
                settings.updateSyncStatus(req.params.roomId, 'expedia', 'error', error.message);
                await settings.save();
            }
        } catch (updateError) {
            console.error('שגיאה בעדכון סטטוס:', updateError);
        }
        
        res.status(500).json({ 
            error: 'שגיאה בסנכרון עם Expedia',
            details: error.message 
        });
    }
});

// סנכרון כל חדרי Expedia במיקום
router.post('/sync/expedia/:location', auth, async (req, res) => {
    try {
        const { location } = req.params;
        
        console.log(`🌍 בקשת סנכרון כל חדרי Expedia: ${location}`);
        
        const settings = await ICalSettings.findOne({ location });
        if (!settings) {
            return res.status(404).json({ 
                error: 'הגדרות iCal לא נמצאו למיקום זה' 
            });
        }
        
        // ביצוע הסנכרון
        const results = await icalService.syncAllRoomsForPlatform(settings, 'expedia');
        await settings.save();
        
        console.log(`✅ סנכרון כל חדרי Expedia הושלם: ${location}`);
        console.log(`   📥 ${results.totalNewBookings} הזמנות חדשות`);
        console.log(`   ✅ ${results.successfulRooms} חדרים בהצלחה`);
        console.log(`   ❌ ${results.failedRooms} חדרים נכשלו`);
        
        res.json({
            success: true,
            message: `סנכרון כל חדרי Expedia הושלם`,
            location,
            platform: 'expedia',
            results
        });
        
    } catch (error) {
        console.error('שגיאה בסנכרון כל חדרי Expedia:', error);
        res.status(500).json({ 
            error: 'שגיאה בסנכרון עם Expedia',
            details: error.message 
        });
    }
});

// סנכרון פלטפורמה ספציפית (Booking או Expedia)
router.post('/sync/:platform/:location/:roomId', auth, async (req, res) => {
    try {
        const { platform, location, roomId } = req.params;
        
        if (!['booking', 'expedia'].includes(platform)) {
            return res.status(400).json({ 
                error: 'פלטפורמה לא נתמכת. השתמש ב-booking או expedia' 
            });
        }
        
        console.log(`🔄 בקשת סנכרון ${platform}: ${location}/${roomId}`);
        
        // קבלת הגדרות
        const settings = await ICalSettings.findOne({ location });
        if (!settings) {
            return res.status(404).json({ 
                error: 'הגדרות iCal לא נמצאו למיקום זה' 
            });
        }
        
        // חיפוש החדר
        const roomConfig = settings.getRoomConfig(roomId);
        if (!roomConfig) {
            return res.status(404).json({ 
                error: 'החדר לא נמצא בהגדרות' 
            });
        }
        
        // בדיקת הפעלה וקישור לפי פלטפורמה
        let isEnabled = false;
        let icalUrl = '';
        
        if (platform === 'booking') {
            isEnabled = roomConfig.bookingEnabled;
            icalUrl = roomConfig.bookingIcalUrl;
        } else if (platform === 'expedia') {
            isEnabled = roomConfig.expediaEnabled;
            icalUrl = roomConfig.expediaIcalUrl;
        }
        
        if (!isEnabled || !icalUrl) {
            return res.status(400).json({ 
                error: `החדר לא מופעל עבור ${platform} או שאין קישור iCal` 
            });
        }
        
        // ביצוע הסנכרון
        const newBookings = await icalService.importFromPlatform(
            platform,
            icalUrl,
            roomId,
            location
        );
        
        // עדכון סטטוס
        settings.updateSyncStatus(roomId, platform, 'success', null, newBookings.length);
        await settings.save();
        
        console.log(`✅ סנכרון ${platform} הושלם: ${location}/${roomId} - ${newBookings.length} הזמנות חדשות`);
        
        res.json({
            success: true,
            message: `סנכרון ${platform} הושלם בהצלחה`,
            newBookings: newBookings.length,
            roomId,
            location,
            platform
        });
        
    } catch (error) {
        console.error(`שגיאה בסנכרון ${req.params.platform}:`, error);
        
        // עדכון סטטוס שגיאה
        try {
            const settings = await ICalSettings.findOne({ location: req.params.location });
            if (settings) {
                settings.updateSyncStatus(req.params.roomId, req.params.platform, 'error', error.message);
                await settings.save();
            }
        } catch (updateError) {
            console.error('שגיאה בעדכון סטטוס:', updateError);
        }
        
        res.status(500).json({ 
            error: `שגיאה בסנכרון עם ${req.params.platform}`,
            details: error.message 
        });
    }
});

// סנכרון כללי לפלטפורמה (Booking או Expedia)
router.post('/sync/:platform/:location', auth, async (req, res) => {
    try {
        const { platform, location } = req.params;
        
        if (!['booking', 'expedia'].includes(platform)) {
            return res.status(400).json({ 
                error: 'פלטפורמה לא נתמכת. השתמש ב-booking או expedia' 
            });
        }
        
        console.log(`🔄 בקשת סנכרון כל חדרי ${platform}: ${location}`);
        
        // קבלת הגדרות
        const settings = await ICalSettings.findOne({ location });
        if (!settings) {
            return res.status(404).json({ 
                error: 'הגדרות iCal לא נמצאו למיקום זה' 
            });
        }
        
        // ביצוע הסנכרון לפלטפורמה
        const results = await icalService.syncAllRoomsForPlatform(settings, platform);
        
        console.log(`✅ סנכרון כל חדרי ${platform} הושלם: ${location} - ${results.totalNewBookings} הזמנות חדשות`);
        
        res.json({
            success: true,
            message: `סנכרון כל חדרי ${platform === 'booking' ? 'Booking.com' : 'Expedia'} הושלם בהצלחה`,
            results: {
                totalNewBookings: results.totalNewBookings,
                successfulRooms: results.successfulRooms,
                failedRooms: results.failedRooms
            },
            location,
            platform
        });
        
    } catch (error) {
        console.error(`שגיאה בסנכרון כל חדרי ${req.params.platform}:`, error);
        res.status(500).json({ 
            error: `שגיאה בסנכרון כל החדרים`,
            details: error.message 
        });
    }
});

// בדיקת קישור iCal (משופר עבור Expedia)
router.post('/test-url-expedia', auth, async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                error: 'חסר קישור לבדיקה' 
            });
        }
        
        console.log(`בודק קישור Expedia iCal: ${url}`);
        
        // ניסיון הורדת הקובץ עם timeout ארוך יותר ל-Expedia
        const axios = require('axios');
        const response = await axios.get(url, {
            timeout: 15000, // Expedia יכול להיות יותר איטי
            headers: {
                'User-Agent': 'DIAM-Hotels-Calendar-Test/1.0-Expedia'
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
        
        // ניתוח מיוחד עבור Expedia
        const expediaAnalysis = {
            totalEvents: events.length,
            hasUIDs: events.filter(e => e.uid).length,
            futureEvents: events.filter(e => new Date(e.start) > new Date()).length,
            sampleEvents: events.slice(0, 3).map(event => ({
                summary: event.summary,
                start: event.start,
                end: event.end,
                uid: event.uid ? event.uid.substring(0, 20) + '...' : 'אין UID'
            }))
        };
        
        res.json({
            success: true,
            message: 'הקישור של Expedia תקין!',
            platform: 'expedia',
            analysis: expediaAnalysis,
            recommendations: [
                expediaAnalysis.hasUIDs > 0 ? '✅ יש UIDs - זיהוי הזמנות יעבוד מושלם' : '⚠️ אין UIDs - ייתכנו בעיות בזיהוי',
                expediaAnalysis.futureEvents > 0 ? `✅ יש ${expediaAnalysis.futureEvents} הזמנות עתידיות` : '⚠️ אין הזמנות עתידיות',
                'ℹ️ Expedia עשויה לעדכן לוח השנה כל מספר שעות'
            ]
        });
        
    } catch (error) {
        console.error('שגיאה בבדיקת קישור Expedia:', error);
        res.status(400).json({ 
            error: 'הקישור של Expedia לא תקין או לא זמין',
            details: error.message,
            platform: 'expedia',
            suggestions: [
                'ודא שהקישור נלקח מ-Expedia Partner Central',
                'בדוק שהקישור לא פג תוקף',
                'Expedia עשויה להיות יותר איטית - נסה שוב בעוד כמה דקות'
            ]
        });
    }
});

// קבלת סטטוס מפורט עבור פלטפורמה ספציפית
router.get('/status/:platform/:location', auth, async (req, res) => {
    try {
        const { platform, location } = req.params;
        
        if (!['booking', 'expedia'].includes(platform)) {
            return res.status(400).json({ 
                error: 'פלטפורמה לא נתמכת. השתמש ב-booking או expedia' 
            });
        }
        
        const settings = await ICalSettings.findOne({ location });
        if (!settings) {
            return res.status(404).json({ 
                error: 'הגדרות iCal לא נמצאו למיקום זה' 
            });
        }
        
        // חישוב סטטיסטיקות לפי פלטפורמה
        let enabledRooms = [];
        let totalBookings = 0;
        let roomsStatus = [];
        
        if (platform === 'booking') {
            enabledRooms = settings.getEnabledRoomsForBooking();
        } else if (platform === 'expedia') {
            enabledRooms = settings.getEnabledRoomsForExpedia();
        }
        
        for (const room of settings.rooms) {
            let status, lastSync, importedBookings, syncError;
            
            if (platform === 'booking') {
                status = room.bookingSyncStatus || 'never';
                lastSync = room.bookingLastSync;
                importedBookings = room.bookingImportedBookings || 0;
                syncError = room.bookingSyncError;
            } else if (platform === 'expedia') {
                status = room.expediaSyncStatus || 'never';
                lastSync = room.expediaLastSync;
                importedBookings = room.expediaImportedBookings || 0;
                syncError = room.expediaSyncError;
            }
            
            totalBookings += importedBookings;
            
            roomsStatus.push({
                roomId: room.roomId,
                roomName: room.roomName,
                enabled: platform === 'booking' ? room.bookingEnabled : room.expediaEnabled,
                status,
                lastSync,
                importedBookings,
                syncError
            });
        }
        
        res.json({
            location,
            platform,
            summary: {
                totalRooms: settings.rooms.length,
                enabledRooms: enabledRooms.length,
                totalImportedBookings: totalBookings,
                autoSyncEnabled: settings.globalSettings.autoSyncEnabled
            },
            rooms: roomsStatus,
            globalSettings: settings.globalSettings
        });
        
    } catch (error) {
        console.error('שגיאה בקבלת סטטוס:', error);
        res.status(500).json({ 
            error: 'שגיאה בקבלת סטטוס',
            details: error.message 
        });
    }
});

module.exports = router; 
const cron = require('node-cron');
const icalService = require('./icalService');
const ICalSettings = require('../models/ICalSettings');
const emailService = require('./emailService');

class CronService {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    /**
     * התחלת שירות הסנכרון האוטומטי
     */
    async start() {
        if (this.isRunning) {
            console.log('שירות הסנכרון כבר פועל');
            return;
        }

        console.log('מתחיל שירות סנכרון אוטומטי עם בוקינג...');

        // סנכרון דינמי לפי הגדרות (ברירת מחדל: כל שעתיים)
        const syncJob = cron.schedule('*/30 * * * *', async () => {
            await this.performAutoSync();
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        // סנכרון יומי בשעה 6:00 בבוקר (0 6 * * *)
        const dailySyncJob = cron.schedule('0 6 * * *', async () => {
            await this.performDailySync();
        }, {
            scheduled: false,
            timezone: 'Asia/Jerusalem'
        });

        this.jobs.set('autoSync', syncJob);
        this.jobs.set('dailySync', dailySyncJob);

        // הפעלת המשימות
        syncJob.start();
        dailySyncJob.start();

        this.isRunning = true;
        console.log('שירות הסנכרון האוטומטי הופעל בהצלחה');
        console.log('- סנכרון אוטומטי: פעיל (בודק כל 30 דקות)');
        console.log('- סנכרון יומי בשעה 6:00: פעיל');
    }

    /**
     * עצירת שירות הסנכרון
     */
    stop() {
        if (!this.isRunning) {
            console.log('שירות הסנכרון לא פועל');
            return;
        }

        console.log('עוצר שירות סנכרון אוטומטי...');

        for (const [name, job] of this.jobs) {
            job.destroy();
            console.log(`משימה ${name} נעצרה`);
        }

        this.jobs.clear();
        this.isRunning = false;
        console.log('שירות הסנכרון האוטומטי נעצר');
    }

    /**
     * סנכרון אוטומטי כל שעתיים
     */
    async performAutoSync() {
        try {
            console.log('=== מתחיל סנכרון אוטומטי ===');
            console.log(`זמן: ${new Date().toLocaleString('he-IL')}`);

            // שליפת כל ההגדרות עם סנכרון אוטומטי מופעל
            const allSettings = await ICalSettings.find({
                'globalSettings.autoSyncEnabled': true
            });

            if (allSettings.length === 0) {
                console.log('אין מיקומים עם סנכרון אוטומטי מופעל');
                return;
            }

            let totalNewBookings = 0;
            const syncResults = [];

            for (const settings of allSettings) {
                // בדיקה אם הגיע הזמן לסנכרון לפי ההגדרות
                const syncInterval = settings.globalSettings.syncInterval || 120; // ברירת מחדל: 120 דקות
                const lastSyncTime = settings.updatedAt || settings.createdAt;
                const minutesSinceLastSync = (Date.now() - lastSyncTime.getTime()) / (1000 * 60);
                
                if (minutesSinceLastSync < syncInterval) {
                    console.log(`מיקום ${settings.location}: עדיין לא הגיע הזמן לסנכרון (${Math.round(minutesSinceLastSync)}/${syncInterval} דקות)`);
                    continue;
                }
                
                console.log(`מסנכרן מיקום: ${settings.location} (${Math.round(minutesSinceLastSync)} דקות מהסנכרון האחרון)`);
                
                const enabledRooms = settings.getEnabledRooms();
                if (enabledRooms.length === 0) {
                    console.log(`אין חדרים מופעלים במיקום ${settings.location}`);
                    continue;
                }

                for (const roomConfig of enabledRooms) {
                    try {
                        console.log(`מסנכרן חדר ${roomConfig.roomId} במיקום ${settings.location}`);
                        
                        const newBookings = await icalService.importBookingCalendar(
                            roomConfig.bookingIcalUrl,
                            roomConfig.roomId,
                            settings.location
                        );

                        // עדכון סטטוס
                        settings.updateSyncStatus(roomConfig.roomId, 'success', null, newBookings.length);
                        totalNewBookings += newBookings.length;

                        syncResults.push({
                            location: settings.location,
                            roomId: roomConfig.roomId,
                            status: 'success',
                            newBookings: newBookings.length
                        });

                        if (newBookings.length > 0) {
                            console.log(`✅ נמצאו ${newBookings.length} הזמנות חדשות בחדר ${roomConfig.roomId}`);
                            
                            // שליחת התראה על הזמנות חדשות
                            if (settings.globalSettings.notifications?.onNewBooking) {
                                await this.sendNewBookingNotification(settings, roomConfig, newBookings);
                            }
                        }

                        // המתנה קצרה בין חדרים
                        await new Promise(resolve => setTimeout(resolve, 2000));

                    } catch (roomError) {
                        console.error(`❌ שגיאה בסנכרון חדר ${roomConfig.roomId}:`, roomError.message);
                        
                        settings.updateSyncStatus(roomConfig.roomId, 'error', roomError.message);
                        
                        syncResults.push({
                            location: settings.location,
                            roomId: roomConfig.roomId,
                            status: 'error',
                            error: roomError.message
                        });

                        // שליחת התראה על שגיאה
                        if (settings.globalSettings.notifications?.onSyncError) {
                            await this.sendSyncErrorNotification(settings, roomConfig, roomError);
                        }
                    }
                }

                // שמירת ההגדרות המעודכנות
                await settings.save();
            }

            console.log('=== סנכרון אוטומטי הושלם ===');
            console.log(`סה"כ הזמנות חדשות: ${totalNewBookings}`);
            console.log(`תוצאות: ${syncResults.filter(r => r.status === 'success').length} הצלחות, ${syncResults.filter(r => r.status === 'error').length} שגיאות`);

        } catch (error) {
            console.error('שגיאה כללית בסנכרון אוטומטי:', error);
        }
    }

    /**
     * סנכרון יומי מקיף בשעה 6:00
     */
    async performDailySync() {
        try {
            console.log('=== מתחיל סנכרון יומי מקיף ===');
            console.log(`זמן: ${new Date().toLocaleString('he-IL')}`);

            // סנכרון כל המיקומים (גם אלה שלא מופעלים לסנכרון אוטומטי)
            const allSettings = await ICalSettings.find({});

            for (const settings of allSettings) {
                const enabledRooms = settings.getEnabledRooms();
                if (enabledRooms.length > 0) {
                    console.log(`סנכרון יומי למיקום ${settings.location} - ${enabledRooms.length} חדרים`);
                    await this.performLocationSync(settings);
                }
            }

            console.log('=== סנכרון יומי הושלם ===');

        } catch (error) {
            console.error('שגיאה בסנכרון יומי:', error);
        }
    }

    /**
     * סנכרון מיקום ספציפי
     */
    async performLocationSync(settings) {
        const enabledRooms = settings.getEnabledRooms();
        
        for (const roomConfig of enabledRooms) {
            try {
                const newBookings = await icalService.importBookingCalendar(
                    roomConfig.bookingIcalUrl,
                    roomConfig.roomId,
                    settings.location
                );

                settings.updateSyncStatus(roomConfig.roomId, 'success', null, newBookings.length);
                
                if (newBookings.length > 0) {
                    console.log(`✅ ${settings.location}/${roomConfig.roomId}: ${newBookings.length} הזמנות חדשות`);
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`❌ ${settings.location}/${roomConfig.roomId}: ${error.message}`);
                settings.updateSyncStatus(roomConfig.roomId, 'error', error.message);
            }
        }

        await settings.save();
    }

    /**
     * שליחת התראה על הזמנות חדשות
     */
    async sendNewBookingNotification(settings, roomConfig, newBookings) {
        try {
            if (!settings.globalSettings.notifications?.email) {
                return;
            }

            const subject = `🎉 הזמנות חדשות מבוקינג - ${settings.location.toUpperCase()}`;
            
            let message = `התקבלו ${newBookings.length} הזמנות חדשות מבוקינג עבור חדר ${roomConfig.roomName}:\n\n`;
            
            newBookings.forEach((booking, index) => {
                message += `${index + 1}. הזמנה #${booking.bookingNumber}\n`;
                message += `   אורח: ${booking.guestName}\n`;
                const checkIn = new Date(booking.checkInDate || booking.checkIn);
                const checkOut = new Date(booking.checkOutDate || booking.checkOut);
                message += `   תאריכים: ${checkIn.toLocaleDateString('he-IL')} - ${checkOut.toLocaleDateString('he-IL')}\n`;
                message += `   חדר: ${roomConfig.roomName}\n\n`;
            });

            message += `זמן הסנכרון: ${new Date().toLocaleString('he-IL')}\n`;
            message += `מיקום: ${settings.location.toUpperCase()}`;

            await emailService.sendNotificationEmail(
                settings.globalSettings.notifications.email,
                subject,
                message
            );

        } catch (error) {
            console.error('שגיאה בשליחת התראה על הזמנות חדשות:', error);
        }
    }

    /**
     * שליחת התראה על שגיאת סנכרון
     */
    async sendSyncErrorNotification(settings, roomConfig, error) {
        try {
            if (!settings.globalSettings.notifications?.email) {
                return;
            }

            const subject = `⚠️ שגיאה בסנכרון בוקינג - ${settings.location.toUpperCase()}`;
            
            let message = `אירעה שגיאה בסנכרון עם בוקינג:\n\n`;
            message += `מיקום: ${settings.location.toUpperCase()}\n`;
            message += `חדר: ${roomConfig.roomName} (${roomConfig.roomId})\n`;
            message += `שגיאה: ${error.message}\n`;
            message += `זמן: ${new Date().toLocaleString('he-IL')}\n\n`;
            message += `אנא בדוק את קישור iCal ואת הגדרות הסנכרון.`;

            await emailService.sendNotificationEmail(
                settings.globalSettings.notifications.email,
                subject,
                message
            );

        } catch (emailError) {
            console.error('שגיאה בשליחת התראה על שגיאת סנכרון:', emailError);
        }
    }

    /**
     * סנכרון ידני מיידי
     */
    async performManualSync(location = null) {
        console.log('מבצע סנכרון ידני מיידי...');
        
        try {
            const query = location ? { location } : {};
            const allSettings = await ICalSettings.find(query);

            for (const settings of allSettings) {
                await this.performLocationSync(settings);
            }

            console.log('סנכרון ידני הושלם בהצלחה');
            return true;

        } catch (error) {
            console.error('שגיאה בסנכרון ידני:', error);
            return false;
        }
    }

    /**
     * קבלת סטטוס השירות
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeJobs: Array.from(this.jobs.keys()),
            nextRun: this.isRunning ? 'כל שעתיים' : 'לא פעיל'
        };
    }
}

module.exports = new CronService(); 
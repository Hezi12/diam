const cron = require('node-cron');
const icalService = require('./icalService');
const ICalSettings = require('../models/ICalSettings');

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

        console.log('מתחיל שירות סנכרון אוטומטי עם Booking.com ו-Expedia...');

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
                
                // ביצוע סנכרון לכל הפלטפורמות
                const locationResults = await this.performLocationSync(settings);
                totalNewBookings += locationResults.totalNewBookings;
                syncResults.push(...locationResults.results);

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
     * סנכרון מיקום ספציפי - מתמוך בשתי הפלטפורמות
     */
    async performLocationSync(settings) {
        const results = {
            totalNewBookings: 0,
            results: []
        };

        // סנכרון Booking.com
        console.log(`🔄 מסנכרן Booking.com עבור ${settings.location}...`);
        const bookingResults = await icalService.syncAllRoomsForPlatform(settings, 'booking');
        results.totalNewBookings += bookingResults.totalNewBookings;
        
        // הוספת תוצאות עם פלטפורמה
        bookingResults.errors.forEach(error => {
            results.results.push({
                location: settings.location,
                roomId: error.roomId,
                platform: 'booking',
                status: 'error',
                error: error.error
            });
        });

        // הוספת תוצאות הצלחה
        const bookingEnabledRooms = settings.getEnabledRoomsForBooking();
        bookingEnabledRooms.forEach(room => {
            const hasError = bookingResults.errors.find(e => e.roomId === room.roomId);
            if (!hasError) {
                results.results.push({
                    location: settings.location,
                    roomId: room.roomId,
                    platform: 'booking',
                    status: 'success',
                    newBookings: 0 // יעודכן בפועל מהנתונים
                });
            }
        });

        // המתנה בין פלטפורמות
        await new Promise(resolve => setTimeout(resolve, 2000));

        // סנכרון Expedia
        console.log(`🌍 מסנכרן Expedia עבור ${settings.location}...`);
        const expediaResults = await icalService.syncAllRoomsForPlatform(settings, 'expedia');
        results.totalNewBookings += expediaResults.totalNewBookings;
        
        // הוספת תוצאות Expedia
        expediaResults.errors.forEach(error => {
            results.results.push({
                location: settings.location,
                roomId: error.roomId,
                platform: 'expedia',
                status: 'error',
                error: error.error
            });
        });

        // הוספת תוצאות הצלחה Expedia
        const expediaEnabledRooms = settings.getEnabledRoomsForExpedia();
        expediaEnabledRooms.forEach(room => {
            const hasError = expediaResults.errors.find(e => e.roomId === room.roomId);
            if (!hasError) {
                results.results.push({
                    location: settings.location,
                    roomId: room.roomId,
                    platform: 'expedia',
                    status: 'success',
                    newBookings: 0 // יעודכן בפועל מהנתונים
                });
            }
        });

        // שליחת התראות על הזמנות חדשות
        if (results.totalNewBookings > 0) {
            await this.sendNewBookingNotification(settings, null, results.totalNewBookings, {
                booking: bookingResults.totalNewBookings,
                expedia: expediaResults.totalNewBookings
            });
        }

        console.log(`🏁 סיכום סנכרון ${settings.location}:`);
        console.log(`   📊 Booking.com: ${bookingResults.totalNewBookings} הזמנות חדשות, ${bookingResults.successfulRooms} חדרים בהצלחה, ${bookingResults.failedRooms} כשלו`);
        console.log(`   📊 Expedia: ${expediaResults.totalNewBookings} הזמנות חדשות, ${expediaResults.successfulRooms} חדרים בהצלחה, ${expediaResults.failedRooms} כשלו`);
        console.log(`   📥 סה"כ: ${results.totalNewBookings} הזמנות חדשות`);

        return results;
    }

    /**
     * שליחת התראה על הזמנות חדשות (משופרת עבור שתי הפלטפורמות)
     */
    async sendNewBookingNotification(settings, roomConfig, totalBookings, platformBreakdown = null) {
        try {
            if (platformBreakdown) {
                // התראה משולבת משתי הפלטפורמות
                console.log(`📧 התראה על ${totalBookings} הזמנות חדשות ב-${settings.location.toUpperCase()}:`);
                if (platformBreakdown.booking > 0) {
                    console.log(`   🔵 Booking.com: ${platformBreakdown.booking} הזמנות`);
                }
                if (platformBreakdown.expedia > 0) {
                    console.log(`   🌍 Expedia: ${platformBreakdown.expedia} הזמנות`);
                }
            } else {
                // התראה רגילה (תאימות לאחור)
                const bookingCount = typeof totalBookings === 'number' ? totalBookings : totalBookings.length;
                console.log(`📧 התראה על ${bookingCount} הזמנות חדשות ב-${settings.location.toUpperCase()}`);
            }
            console.log('(מערכת המיילים הוסרה זמנית)');
        } catch (error) {
            console.error('שגיאה בשליחת התראה על הזמנות חדשות:', error);
        }
    }

    /**
     * שליחת התראה על שגיאת סנכרון
     */
    async sendSyncErrorNotification(settings, roomConfig, error) {
        try {
            console.log(`⚠️ שגיאה בסנכרון ב-${settings.location.toUpperCase()}: ${error.message}`);
            console.log('(מערכת המיילים הוסרה זמנית)');
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
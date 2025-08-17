const mongoose = require('mongoose');

const icalSettingsSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
        enum: ['airport', 'rothschild'],
        description: 'מיקום המתחם'
    },
    rooms: [{
        roomId: {
            type: String,
            required: true,
            description: 'מזהה החדר'
        },
        roomName: {
            type: String,
            required: true,
            description: 'שם החדר'
        },
        enabled: {
            type: Boolean,
            default: false,
            description: 'האם הסנכרון פעיל'
        },
        // === הגדרות Booking.com ===
        bookingIcalUrl: {
            type: String,
            default: '',
            description: 'קישור iCal מבוקינג לייבוא הזמנות'
        },
        bookingEnabled: {
            type: Boolean,
            default: true,
            description: 'האם סנכרון עם Booking.com מופעל'
        },
        bookingLastSync: {
            type: Date,
            description: 'זמן סנכרון אחרון עם Booking.com'
        },
        bookingSyncStatus: {
            type: String,
            enum: ['success', 'error', 'pending', 'never'],
            default: 'never',
            description: 'סטטוס סנכרון אחרון עם Booking.com'
        },
        bookingSyncError: {
            type: String,
            description: 'הודעת שגיאה מסנכרון Booking.com'
        },
        bookingImportedBookings: {
            type: Number,
            default: 0,
            description: 'מספר הזמנות שיובאו מ-Booking.com'
        },

        // === הגדרות Expedia ===
        expediaIcalUrl: {
            type: String,
            default: '',
            description: 'קישור iCal מ-Expedia לייבוא הזמנות'
        },
        expediaEnabled: {
            type: Boolean,
            default: false,
            description: 'האם סנכרון עם Expedia מופעל'
        },
        expediaLastSync: {
            type: Date,
            description: 'זמן סנכרון אחרון עם Expedia'
        },
        expediaSyncStatus: {
            type: String,
            enum: ['success', 'error', 'pending', 'never'],
            default: 'never',
            description: 'סטטוס סנכרון אחרון עם Expedia'
        },
        expediaSyncError: {
            type: String,
            description: 'הודעת שגיאה מסנכרון Expedia'
        },
        expediaImportedBookings: {
            type: Number,
            default: 0,
            description: 'מספר הזמנות שיובאו מ-Expedia'
        },

        // === הגדרות כלליות ===
        // קישור לייצוא (משותף לכל הפלטפורמות)
        exportIcalUrl: {
            type: String,
            default: '',
            description: 'קישור iCal לייצוא (משותף לכל הפלטפורמות)'
        },
        
        // תאימות לאחור - שדות ישנים (deprecated)
        enabled: {
            type: Boolean,
            default: function() { return this.bookingEnabled || this.expediaEnabled; },
            description: 'האם החדר פעיל (תאימות לאחור)'
        },
        lastSync: {
            type: Date,
            get: function() {
                // מחזיר את הסנכרון האחרון מבין שני הפלטפורמות
                const bookingSync = this.bookingLastSync;
                const expediaSync = this.expediaLastSync;
                if (!bookingSync && !expediaSync) return null;
                if (!bookingSync) return expediaSync;
                if (!expediaSync) return bookingSync;
                return bookingSync > expediaSync ? bookingSync : expediaSync;
            },
            description: 'זמן הסנכרון האחרון (תאימות לאחור)'
        },
        syncStatus: {
            type: String,
            enum: ['success', 'error', 'pending', 'never'],
            default: 'never',
            get: function() {
                // מחזיר סטטוס משולב
                if (this.bookingSyncStatus === 'error' || this.expediaSyncStatus === 'error') return 'error';
                if (this.bookingSyncStatus === 'pending' || this.expediaSyncStatus === 'pending') return 'pending';
                if (this.bookingSyncStatus === 'success' || this.expediaSyncStatus === 'success') return 'success';
                return 'never';
            },
            description: 'סטטוס הסנכרון המשולב (תאימות לאחור)'
        },
        syncError: {
            type: String,
            get: function() {
                // מחזיר שגיאות משולבות
                const errors = [];
                if (this.bookingSyncError) errors.push(`Booking: ${this.bookingSyncError}`);
                if (this.expediaSyncError) errors.push(`Expedia: ${this.expediaSyncError}`);
                return errors.join(' | ');
            },
            description: 'הודעות שגיאה משולבות (תאימות לאחור)'
        },
        importedBookings: {
            type: Number,
            default: 0,
            get: function() {
                return (this.bookingImportedBookings || 0) + (this.expediaImportedBookings || 0);
            },
            description: 'סה"כ הזמנות שיובאו (תאימות לאחור)'
        }
    }],
    globalSettings: {
        autoSyncEnabled: {
            type: Boolean,
            default: false,
            description: 'סנכרון אוטומטי כל שעתיים'
        },
        syncInterval: {
            type: Number,
            default: 120, // דקות
            description: 'מרווח זמן בין סנכרונים (בדקות)'
        },
        notifications: {
            email: {
                type: String,
                description: 'כתובת מייל להתראות'
            },
            onNewBookingFromBooking: {
                type: Boolean,
                default: true,
                description: 'התראה על הזמנות חדשות מ-Booking.com'
            },
            onNewBookingFromExpedia: {
                type: Boolean,
                default: true,
                description: 'התראה על הזמנות חדשות מ-Expedia'
            },
            onSyncError: {
                type: Boolean,
                default: true,
                description: 'התראה על שגיאות סנכרון'
            },
            // תאימות לאחור
            onNewBooking: {
                type: Boolean,
                default: true,
                description: 'התראה על הזמנות חדשות (תאימות לאחור)'
            }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// עדכון תאריך שינוי אוטומטי
icalSettingsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // יצירת קישורי ייצוא אוטומטי
    this.rooms.forEach(room => {
        if (!room.exportIcalUrl) {
            room.exportIcalUrl = `/api/ical/export/${this.location}/${room.roomId}`;
        }
    });
    
    next();
});

// מתודות עזר
icalSettingsSchema.methods.getRoomConfig = function(roomId) {
    return this.rooms.find(room => room.roomId === roomId);
};

// עדכון סטטוס סנכרון לפי פלטפורמה
icalSettingsSchema.methods.updateSyncStatus = function(roomId, platform, status, error = null, importedCount = 0) {
    const room = this.getRoomConfig(roomId);
    if (room) {
        const now = new Date();
        
        if (platform === 'booking') {
            room.bookingSyncStatus = status;
            room.bookingLastSync = now;
            room.bookingSyncError = error;
            if (importedCount > 0) {
                room.bookingImportedBookings = (room.bookingImportedBookings || 0) + importedCount;
            }
        } else if (platform === 'expedia') {
            room.expediaSyncStatus = status;
            room.expediaLastSync = now;
            room.expediaSyncError = error;
            if (importedCount > 0) {
                room.expediaImportedBookings = (room.expediaImportedBookings || 0) + importedCount;
            }
        }
        
        // תאימות לאחור - עדכון השדות הישנים
        room.lastSync = now;
        room.syncError = error;
        if (importedCount > 0) {
            room.importedBookings = (room.importedBookings || 0) + importedCount;
        }
    }
};

// קבלת חדרים פעילים לפי פלטפורמה
icalSettingsSchema.methods.getEnabledRoomsForBooking = function() {
    return this.rooms.filter(room => 
        room.bookingEnabled && 
        room.bookingIcalUrl && 
        room.bookingIcalUrl.trim() !== ''
    );
};

icalSettingsSchema.methods.getEnabledRoomsForExpedia = function() {
    return this.rooms.filter(room => 
        room.expediaEnabled && 
        room.expediaIcalUrl && 
        room.expediaIcalUrl.trim() !== ''
    );
};

// תאימות לאחור
icalSettingsSchema.methods.getEnabledRooms = function() {
    return this.rooms.filter(room => 
        (room.bookingEnabled && room.bookingIcalUrl) || 
        (room.expediaEnabled && room.expediaIcalUrl)
    );
};

// פונקציות עזר חדשות
icalSettingsSchema.methods.hasAnyEnabledPlatform = function(roomId) {
    const room = this.getRoomConfig(roomId);
    if (!room) return false;
    return (room.bookingEnabled && room.bookingIcalUrl) || 
           (room.expediaEnabled && room.expediaIcalUrl);
};

icalSettingsSchema.methods.getActivePlatforms = function(roomId) {
    const room = this.getRoomConfig(roomId);
    if (!room) return [];
    
    const platforms = [];
    if (room.bookingEnabled && room.bookingIcalUrl) platforms.push('booking');
    if (room.expediaEnabled && room.expediaIcalUrl) platforms.push('expedia');
    return platforms;
};

module.exports = mongoose.model('ICalSettings', icalSettingsSchema); 
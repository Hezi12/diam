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
        // קישור לייבוא מבוקינג
        bookingIcalUrl: {
            type: String,
            default: '',
            description: 'קישור iCal מבוקינג לייבוא הזמנות'
        },
        // קישור לייצוא לבוקינג
        exportIcalUrl: {
            type: String,
            default: '',
            description: 'קישור iCal לייצוא לבוקינג (נוצר אוטומטי)'
        },
        lastSync: {
            type: Date,
            description: 'זמן הסנכרון האחרון'
        },
        syncStatus: {
            type: String,
            enum: ['success', 'error', 'pending', 'never'],
            default: 'never',
            description: 'סטטוס הסנכרון האחרון'
        },
        syncError: {
            type: String,
            description: 'הודעת שגיאה מהסנכרון האחרון'
        },
        importedBookings: {
            type: Number,
            default: 0,
            description: 'מספר הזמנות שיובאו'
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
            onNewBooking: {
                type: Boolean,
                default: true,
                description: 'התראה על הזמנות חדשות מבוקינג'
            },
            onSyncError: {
                type: Boolean,
                default: true,
                description: 'התראה על שגיאות סנכרון'
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

icalSettingsSchema.methods.updateSyncStatus = function(roomId, status, error = null, importedCount = 0) {
    const room = this.getRoomConfig(roomId);
    if (room) {
        room.syncStatus = status;
        room.lastSync = new Date();
        room.syncError = error;
        if (importedCount > 0) {
            room.importedBookings += importedCount;
        }
    }
};

icalSettingsSchema.methods.getEnabledRooms = function() {
    return this.rooms.filter(room => room.enabled && room.bookingIcalUrl);
};

module.exports = mongoose.model('ICalSettings', icalSettingsSchema); 
const mongoose = require('mongoose');

/**
 * מודל להגדרות האתר הציבורי
 * כולל הגדרות עבור באנרים, הודעות והתראות
 */
const PublicSiteSettingsSchema = new mongoose.Schema(
  {
    // מזהה ייחודי להגדרות (ברירת מחדל: 'default')
    settingsId: {
      type: String,
      default: 'default',
      unique: true
    },
    
    // הגדרות באנר הנחת השקה
    launchPromotionBanner: {
      // האם הבאנר פעיל
      enabled: {
        type: Boolean,
        default: true
      },
      
      // תוכן הבאנר (מתורגם)
      content: {
        he: {
          title: {
            type: String,
            default: '🎉 הנחת השקה!'
          },
          discount: {
            type: String,
            default: '15% הנחה'
          },
          description: {
            type: String,
            default: 'האתר החדש שלנו בתקופת הרצה - הנחה מיוחדת לכל הזמנה ראשונה'
          },
          limitation: {
            type: String,
            default: 'הזינו את הקופון בעמוד החיפוש וקבלו את ההנחה מיידית'
          },
          button: {
            type: String,
            default: 'הזמינו עכשיו'
          },
          couponCode: {
            type: String,
            default: 'NEW'
          },
          couponText: {
            type: String,
            default: 'קוד הקופון:'
          }
        },
        en: {
          title: {
            type: String,
            default: '🎉 Launch Discount!'
          },
          discount: {
            type: String,
            default: '15% OFF'
          },
          description: {
            type: String,
            default: 'Our new website is launching - special discount for first-time bookings'
          },
          limitation: {
            type: String,
            default: 'Enter the coupon code on the search page and get instant discount'
          },
          button: {
            type: String,
            default: 'Book Now'
          },
          couponCode: {
            type: String,
            default: 'NEW'
          },
          couponText: {
            type: String,
            default: 'Coupon Code:'
          }
        }
      },
      
      // הגדרות תצוגה
      displaySettings: {
        // באילו עמודים להציג (home, search, booking)
        showOnPages: [{
          type: String,
          enum: ['home', 'search', 'booking', 'all']
        }],
        
        // תדירות הצגה (once_per_session, always, once_per_day)
        frequency: {
          type: String,
          enum: ['once_per_session', 'always', 'once_per_day'],
          default: 'once_per_session'
        },
        
        // עיכוב בהצגה (במילישניות)
        delay: {
          type: Number,
          default: 1000
        }
      },
      
      // תאריכי תוקף
      validFrom: {
        type: Date,
        default: Date.now
      },
      validUntil: {
        type: Date
      },
      
      // מי עדכן לאחרונה
      lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      
      // הערות
      notes: {
        type: String,
        default: ''
      }
    },
    
    // הגדרות נוספות לעתיד
    maintenanceMode: {
      enabled: {
        type: Boolean,
        default: false
      },
      message: {
        he: String,
        en: String
      }
    },
    
    // הגדרות SEO כלליות
    seoDefaults: {
      metaTitle: {
        he: String,
        en: String
      },
      metaDescription: {
        he: String,
        en: String
      },
      metaKeywords: {
        he: String,
        en: String
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual - בדיקה אם באנר הנחת השקה תקף כרגע
PublicSiteSettingsSchema.virtual('launchPromotionBanner.isCurrentlyValid').get(function() {
  if (!this.launchPromotionBanner.enabled) return false;
  
  const now = new Date();
  const validFrom = this.launchPromotionBanner.validFrom;
  const validUntil = this.launchPromotionBanner.validUntil;
  
  if (validFrom && now < validFrom) return false;
  if (validUntil && now > validUntil) return false;
  
  return true;
});

// Static method - קבלת הגדרות ברירת מחדל
PublicSiteSettingsSchema.statics.getDefaultSettings = async function() {
  let settings = await this.findOne({ settingsId: 'default' });
  
  if (!settings) {
    // יצירת הגדרות ברירת מחדל אם לא קיימות
    settings = new this({
      settingsId: 'default',
      launchPromotionBanner: {
        enabled: true,
        displaySettings: {
          showOnPages: ['home'],
          frequency: 'once_per_session',
          delay: 1000
        }
      }
    });
    await settings.save();
  }
  
  return settings;
};

// Static method - עדכון הגדרת באנר ההנחה
PublicSiteSettingsSchema.statics.updateLaunchBanner = async function(updateData, userId = null) {
  const settings = await this.getDefaultSettings();
  
  // עדכון הנתונים
  if (updateData.enabled !== undefined) {
    settings.launchPromotionBanner.enabled = updateData.enabled;
  }
  
  if (updateData.content) {
    if (updateData.content.he) {
      Object.assign(settings.launchPromotionBanner.content.he, updateData.content.he);
    }
    if (updateData.content.en) {
      Object.assign(settings.launchPromotionBanner.content.en, updateData.content.en);
    }
  }
  
  if (updateData.displaySettings) {
    Object.assign(settings.launchPromotionBanner.displaySettings, updateData.displaySettings);
  }
  
  if (updateData.validFrom) {
    settings.launchPromotionBanner.validFrom = updateData.validFrom;
  }
  
  if (updateData.validUntil) {
    settings.launchPromotionBanner.validUntil = updateData.validUntil;
  }
  
  if (updateData.notes) {
    settings.launchPromotionBanner.notes = updateData.notes;
  }
  
  if (userId) {
    settings.launchPromotionBanner.lastUpdatedBy = userId;
  }
  
  await settings.save();
  return settings;
};

// Index על settingsId
PublicSiteSettingsSchema.index({ settingsId: 1 });

module.exports = mongoose.model('PublicSiteSettings', PublicSiteSettingsSchema);

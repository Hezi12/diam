import axios from 'axios';

/**
 * שירות לניהול הגדרות האתר הציבורי
 */

// קבלת הגדרות באנר הנחת השקה (ציבורי)
export const getLaunchBannerSettings = async () => {
  try {
    const response = await axios.get('/api/public-site/banner/launch');
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת הגדרות באנר הנחת השקה:', error);
    throw error;
  }
};

// קבלת כל הגדרות האתר הציבורי (מוגן)
export const getPublicSiteSettings = async () => {
  try {
    const response = await axios.get('/api/public-site/settings');
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת הגדרות האתר הציבורי:', error);
    throw error;
  }
};

// הפעלה/השבתה של באנר הנחת השקה
export const toggleLaunchBanner = async () => {
  try {
    const response = await axios.patch('/api/public-site/banner/launch/toggle');
    return response.data;
  } catch (error) {
    console.error('שגיאה בשינוי מצב באנר הנחת השקה:', error);
    throw error;
  }
};

// עדכון תוכן באנר הנחת השקה
export const updateBannerContent = async (content) => {
  try {
    const response = await axios.patch('/api/public-site/banner/launch/content', {
      content
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בעדכון תוכן באנר הנחת השקה:', error);
    throw error;
  }
};

// עדכון הגדרות תצוגה של הבאנר
export const updateBannerDisplaySettings = async (displaySettings) => {
  try {
    const response = await axios.patch('/api/public-site/banner/launch/display', {
      displaySettings
    });
    return response.data;
  } catch (error) {
    console.error('שגיאה בעדכון הגדרות תצוגה של הבאנר:', error);
    throw error;
  }
};

// קבלת הגדרות באנר ההזמנה הישירה (ציבורי)
export const getDirectBookingBannerSettings = async () => {
  try {
    const response = await axios.get('/api/public-site/banner/direct-booking');
    return response.data;
  } catch (error) {
    console.error('שגיאה בקבלת הגדרות באנר ההזמנה הישירה:', error);
    throw error;
  }
};

// עדכון הגדרות באנר ההזמנה הישירה
export const updateDirectBookingBanner = async (updateData) => {
  try {
    const response = await axios.put('/api/public-site/banner/direct-booking', updateData);
    return response.data;
  } catch (error) {
    console.error('שגיאה בעדכון הגדרות באנר ההזמנה הישירה:', error);
    throw error;
  }
};

// הפעלה/השבתה של באנר ההזמנה הישירה
export const toggleDirectBookingBanner = async () => {
  try {
    const response = await axios.patch('/api/public-site/banner/direct-booking/toggle');
    return response.data;
  } catch (error) {
    console.error('שגיאה בשינוי מצב באנר ההזמנה הישירה:', error);
    throw error;
  }
};

export default {
  getLaunchBannerSettings,
  getPublicSiteSettings,
  toggleLaunchBanner,
  updateBannerContent,
  updateBannerDisplaySettings,
  getDirectBookingBannerSettings,
  updateDirectBookingBanner,
  toggleDirectBookingBanner
};

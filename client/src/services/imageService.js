import axios from 'axios';

/**
 * שירות לטיפול בתמונות הזמנות
 */
const imageService = {
  /**
   * העלאת תמונות להזמנה
   * @param {string} bookingId - מזהה ההזמנה
   * @param {FileList|File[]} files - קבצי התמונות להעלאה
   * @returns {Promise<Object>} תוצאת ההעלאה
   */
  uploadBookingImages: async (bookingId, files) => {
    try {
      console.log(`📸 מעלה ${files.length} תמונות להזמנה ${bookingId}`);
      
      // יצירת FormData
      const formData = new FormData();
      
      // הוספת הקבצים ל-FormData
      for (let i = 0; i < Math.min(files.length, 2); i++) {
        formData.append('images', files[i]);
      }
      
      // בדיקת טוקן לפני שליחה
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Axios default auth header:', axios.defaults.headers.common['Authorization']);
      console.log('🌐 Base URL:', axios.defaults.baseURL);
      
      if (!token) {
        throw new Error('אין הרשאה - נדרשת התחברות מחדש');
      }
      
      // יצירת URL מלא למניעת בעיות routing
      const uploadUrl = `/api/bookings/${bookingId}/images`;
      console.log('📤 Upload URL:', uploadUrl);
      
      // שליחת הבקשה עם הטוקן בכותרות
      const response = await axios.post(
        uploadUrl,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}` // הוספת הטוקן ישירות
          },
          // התקדמות העלאה
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`📊 התקדמות העלאה: ${progress}%`);
          },
          // timeout מוגדל לקבצים גדולים
          timeout: 60000 // 60 שניות
        }
      );
      
      console.log('✅ תמונות הועלו בהצלחה:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ שגיאה בהעלאת תמונות:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        baseURL: axios.defaults.baseURL
      });
      
      let errorMessage = 'שגיאה בהעלאת התמונות';
      
      if (error.response?.status === 413) {
        errorMessage = 'הקבצים גדולים מדי. נסה קבצים קטנים יותר';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'בקשה לא תקינה';
      } else if (error.response?.status === 401) {
        errorMessage = 'אין הרשאה - נדרשת התחברות מחדש';
      } else if (error.response?.status === 403) {
        errorMessage = 'אין הרשאה לפעולה זו';
      } else if (error.response?.status === 404) {
        errorMessage = 'הזמנה לא נמצאה';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'הזמן הקצוב עבר - נסה קבצים קטנים יותר';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * מחיקת תמונה מהזמנה
   * @param {string} bookingId - מזהה ההזמנה
   * @param {number} imageIndex - אינדקס התמונה (0 או 1)
   * @returns {Promise<Object>} תוצאת המחיקה
   */
  deleteBookingImage: async (bookingId, imageIndex) => {
    try {
      console.log(`🗑️ מוחק תמונה ${imageIndex} מהזמנה ${bookingId}`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('אין הרשאה - נדרשת התחברות מחדש');
      }
      
      const response = await axios.delete(
        `/api/bookings/${bookingId}/images/${imageIndex}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ תמונה נמחקה בהצלחה:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ שגיאה במחיקת תמונה:', error);
      
      let errorMessage = 'שגיאה במחיקת התמונה';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * קבלת קישור לתמונה
   * @param {string} bookingId - מזהה ההזמנה
   * @param {number} imageIndex - אינדקס התמונה (0 או 1)
   * @returns {string} קישור לתמונה
   */
  getBookingImageUrl: (bookingId, imageIndex) => {
    const token = localStorage.getItem('token');
    
    // בניית URL בסיסי
    const baseUrl = `/api/bookings/${bookingId}/images/${imageIndex}`;
    
    console.log('🔗 Creating image URL:', {
      bookingId,
      imageIndex,
      hasToken: !!token,
      tokenStart: token ? token.substring(0, 10) + '...' : 'none',
      baseUrl,
      axiosBaseURL: window.axios?.defaults?.baseURL || 'undefined'
    });
    
    // בפרודקשן, ננסה לבנות URL מלא
    let fullUrl;
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // בפרודקשן - השתמש ב-API URL מהקונפיג
      const apiUrl = window.axios?.defaults?.baseURL || 'https://diam-loy6.onrender.com';
      fullUrl = `${apiUrl}${baseUrl}`;
    } else {
      // במקומי - השתמש בנתיב יחסי
      fullUrl = baseUrl;
    }
    
    // הוספת טוקן ל-URL כ-query parameter (עדיין לא אידיאלי אבל עובד)
    const finalUrl = token ? `${fullUrl}?token=${encodeURIComponent(token)}` : fullUrl;
    
    console.log('🔗 Final URL:', finalUrl);
    
    return finalUrl;
  },

  /**
   * הורדת תמונה
   * @param {string} bookingId - מזהה ההזמנה
   * @param {number} imageIndex - אינדקס התמונה (0 או 1)
   * @param {string} filename - שם הקובץ להורדה (אופציונלי)
   */
  downloadBookingImage: async (bookingId, imageIndex, filename = null) => {
    try {
      console.log(`⬇️ מוריד תמונה ${imageIndex} מהזמנה ${bookingId}`, { filename });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('אין הרשאה - נדרשת התחברות מחדש');
      }

      // בניית URL להורדה
      const downloadUrl = `/api/bookings/${bookingId}/images/${imageIndex}?download=true`;
      
      // בפרודקשן, בנה URL מלא
      let fullDownloadUrl;
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        const apiUrl = window.axios?.defaults?.baseURL || 'https://diam-loy6.onrender.com';
        fullDownloadUrl = `${apiUrl}${downloadUrl}`;
      } else {
        fullDownloadUrl = downloadUrl;
      }

      console.log('⬇️ Download URL:', fullDownloadUrl);

      // שליחת בקשה עם הרשאה מלאה
      const response = await fetch(fullDownloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = `שגיאה בהורדת התמונה: ${response.status} ${response.statusText}`;
        
        if (response.status === 401) {
          errorMessage = 'אין הרשאה - נדרשת התחברות מחדש';
        } else if (response.status === 404) {
          errorMessage = 'התמונה לא נמצאה';
        } else if (response.status === 403) {
          errorMessage = 'אין הרשאה לגשת לתמונה זו';
        }
        
        throw new Error(errorMessage);
      }

      // המרת התגובה ל-blob
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('התמונה ריקה או לא נמצאה');
      }
      
      // יצירת URL זמני לblob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // יצירת link להורדה
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || `booking-${bookingId}-image-${imageIndex + 1}`;
      
      console.log('🔗 Created download link:', { 
        download: link.download, 
        blobSize: blob.size,
        blobType: blob.type 
      });
      
      // הוספה לדום, לחיצה והסרה
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // ניקוי URL הזמני
      window.URL.revokeObjectURL(blobUrl);
      
      console.log('✅ תמונה הורדה בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה בהורדת תמונה:', error);
      console.error('🔍 Download error details:', {
        message: error.message,
        bookingId,
        imageIndex,
        filename
      });
      throw error;
    }
  },

  /**
   * בדיקת תקינות קובץ לפני העלאה
   * @param {File} file - הקובץ לבדיקה
   * @returns {Object} תוצאת הבדיקה
   */
  validateFile: (file) => {
    const result = {
      isValid: true,
      error: null
    };

    // בדיקת סוג קובץ
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      result.isValid = false;
      result.error = 'סוג קובץ לא נתמך. יש להעלות JPG, PNG, GIF או PDF';
      return result;
    }

    // בדיקת גודל קובץ (5MB מקסימום)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      result.isValid = false;
      result.error = 'הקובץ גדול מדי. גודל מקסימלי: 5MB';
      return result;
    }

    return result;
  },

  /**
   * בדיקת תקינות מספר קבצים
   * @param {FileList|File[]} files - רשימת הקבצים
   * @param {number} currentImagesCount - מספר התמונות הקיימות
   * @returns {Object} תוצאת הבדיקה
   */
  validateFilesCount: (files, currentImagesCount = 0) => {
    const result = {
      isValid: true,
      error: null
    };

    const totalImages = currentImagesCount + files.length;
    
    if (totalImages > 2) {
      result.isValid = false;
      result.error = `ניתן להעלות מקסימום 2 תמונות. כרגע יש ${currentImagesCount} תמונות קיימות`;
      return result;
    }

    return result;
  },

  /**
   * פורמט גודל קובץ לתצוגה
   * @param {number} bytes - גודל בבתים
   * @returns {string} גודל מפורמט
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * קבלת אייקון לפי סוג קובץ
   * @param {string} mimetype - סוג הקובץ
   * @returns {string} שם האייקון
   */
  getFileTypeIcon: (mimetype) => {
    if (mimetype.startsWith('image/')) {
      return 'image';
    } else if (mimetype === 'application/pdf') {
      return 'picture_as_pdf';
    }
    return 'insert_drive_file';
  }
};

export default imageService; 
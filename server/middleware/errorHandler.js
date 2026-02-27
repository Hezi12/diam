/**
 * מידלוור לטיפול בשגיאות מרכזי
 *
 * מטפל בסוגי שגיאות שונים ומחזיר תגובות מתאימות:
 * - Mongoose ValidationError: 400 עם פירוט שדות
 * - Mongoose CastError: 400 עם הודעת ID לא תקין
 * - JWT שגיאות: 401 ללא הרשאה
 * - שגיאות כלליות: 500 שגיאת שרת
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // שגיאת ולידציה של Mongoose
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });

    return res.status(400).json({
      message: 'שגיאת ולידציה',
      errors,
    });
  }

  // שגיאת CastError של Mongoose (למשל ID לא תקין)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'ID לא תקין',
    });
  }

  // שגיאות JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'אין הרשאה, טוקן לא תקין',
    });
  }

  // שגיאה כללית
  const statusCode = err.statusCode || 500;
  const response = {
    message: statusCode === 500 ? 'שגיאת שרת פנימית' : err.message,
  };

  // בסביבת פיתוח, הוסף את ה-stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

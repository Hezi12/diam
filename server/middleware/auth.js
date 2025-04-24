const jwt = require('jsonwebtoken');

// מידלוור לאימות טוקן JWT
module.exports = (req, res, next) => {
  // קבלת טוקן מהכותרת
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // בדיקה אם קיים טוקן
  if (!token) {
    return res.status(401).json({ message: 'אין הרשאה, נדרש טוקן' });
  }

  try {
    // אימות הטוקן
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // הוספת המשתמש המפוענח לבקשה
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'טוקן לא תקין' });
  }
}; 
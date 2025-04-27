/**
 * קובץ זה נועד לתמוך בקוד ישן שמתייחס לauthMiddleware ולא ל-auth
 * הוא מייבא את המודול auth ומייצא אותו בשם authMiddleware
 */

const auth = require('./auth');

// ייצוא של אותו מידלוור
module.exports = auth; 
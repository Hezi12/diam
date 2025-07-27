/**
 * קבועים לאמצעי תשלום במערכת
 */

// רשימה מלאה של כל אמצעי התשלום
export const ALL_PAYMENT_METHODS = [
  { value: 'unpaid', label: 'לא שולם' },
  { value: 'cash', label: 'מזומן' },
  { value: 'cash2', label: 'מזומן2' },
  { value: 'credit_or_yehuda', label: 'אשראי אור יהודה' },
  { value: 'credit_rothschild', label: 'אשראי רוטשילד' },
  { value: 'transfer_mizrahi', label: 'העברה מזרחי' },
  { value: 'bit_mizrahi', label: 'ביט מזרחי' },
  { value: 'paybox_mizrahi', label: 'פייבוקס מזרחי' },
  { value: 'transfer_poalim', label: 'העברה פועלים' },
  { value: 'bit_poalim', label: 'ביט פועלים' },
  { value: 'paybox_poalim', label: 'פייבוקס פועלים' },
  { value: 'other', label: 'אחר' }
];

// מיפוי לשמות בעברית
export const PAYMENT_METHOD_NAMES = {
  unpaid: 'לא שולם',
  cash: 'מזומן',
  cash2: 'מזומן2',
  credit_or_yehuda: 'אשראי אור יהודה',
  credit_rothschild: 'אשראי רוטשילד',
  transfer_mizrahi: 'העברה מזרחי',
  bit_mizrahi: 'ביט מזרחי',
  paybox_mizrahi: 'פייבוקס מזרחי',
  transfer_poalim: 'העברה פועלים',
  bit_poalim: 'ביט פועלים',
  paybox_poalim: 'פייבוקס פועלים',
  other: 'אחר'
};

// אמצעי תשלום שתמיד מוסתרים (אשראי)
export const ALWAYS_HIDDEN_PAYMENT_METHODS = [
  'credit_or_yehuda',
  'credit_rothschild'
];

// פונקציה עזר לקבלת שם אמצעי תשלום
export const getPaymentMethodName = (method) => {
  return PAYMENT_METHOD_NAMES[method] || method;
};

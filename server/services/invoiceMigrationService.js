/**
 * שירות למיגרציה והמרה של חשבוניות בין המערכת הישנה לiCount
 */
const Invoice = require('../models/Invoice');
const icountService = require('./icountService');

/**
 * המרת חשבונית פנימית למבנה הנדרש ב-iCount
 * @param {Object} invoice - חשבונית במבנה המערכת הפנימית
 * @returns {Object} - חשבונית במבנה הנדרש ב-iCount
 */
const convertToICountFormat = (invoice) => {
  // הכנת מערך פריטים במבנה שדורש iCount
  const items = invoice.items.map(item => ({
    description: item.description,
    quantity: item.quantity || 1,
    unitprice: item.unitPrice || item.totalPrice / (item.quantity || 1),
    // אם יש שדות נוספים שנדרשים ב-iCount, ניתן להוסיף אותם כאן
  }));

  // בניית אובייקט חשבונית למערכת iCount
  return {
    // פרטי לקוח
    client_name: invoice.customer.name,
    client_id: invoice.customer.identifier, // ת.ז או ח.פ אם יש
    email: invoice.customer.email,
    client_address: invoice.customer.address,
    client_phone: invoice.customer.phone,
    
    // סוג מסמך
    doctype: invoice.documentType === 'credit_invoice' ? 'creditinvoice' : 'invoice',
    
    // פרטי תשלום
    paymentdate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : undefined,
    
    // פריטים
    items,
    
    // הערות
    notes: invoice.notes,
    
    // אם יש שדות נוספים שנדרשים ב-iCount, ניתן להוסיף אותם כאן
  };
};

/**
 * עדכון חשבונית פנימית עם נתונים שהתקבלו מ-iCount
 * @param {Object} invoice - חשבונית פנימית לעדכון
 * @param {Object} icountResponse - תשובה מ-iCount
 * @returns {Object} - חשבונית מעודכנת
 */
const updateInvoiceWithICountData = (invoice, icountResponse) => {
  // עדכון פרטי החשבונית עם מידע מ-iCount
  invoice.externalSystem = {
    name: 'iCount',
    invoiceId: icountResponse.docnum,
    data: icountResponse,
    syncDate: new Date()
  };
  
  // עדכון שדות נוספים אם צריך
  invoice.notes = invoice.notes 
    ? `${invoice.notes}\nחשבונית זו סונכרנה עם iCount (מספר: ${icountResponse.docnum})`
    : `חשבונית זו סונכרנה עם iCount (מספר: ${icountResponse.docnum})`;
  
  return invoice;
};

/**
 * העברת חשבונית פנימית ל-iCount
 * @param {Object} invoice - חשבונית במערכת הפנימית 
 * @param {string} location - מיקום (airport או rothschild)
 * @returns {Promise<Object>} - חשבונית מעודכנת עם נתוני iCount
 */
const migrateInvoiceToICount = async (invoice, location = 'rothschild') => {
  try {
    // המרת החשבונית למבנה הנכון ל-iCount
    const icountInvoiceData = convertToICountFormat(invoice);
    
    // יצירת החשבונית ב-iCount
    const icountResponse = await icountService.createInvoice(location, icountInvoiceData);
    
    if (!icountResponse || !icountResponse.docnum) {
      throw new Error('לא התקבל מזהה חשבונית תקין מ-iCount');
    }
    
    // עדכון החשבונית הפנימית עם הנתונים מ-iCount
    updateInvoiceWithICountData(invoice, icountResponse);
    
    // שמירת השינויים
    await invoice.save();
    
    return invoice;
  } catch (error) {
    console.error('שגיאה בהעברת חשבונית ל-iCount:', error);
    throw error;
  }
};

/**
 * מיגרציה המונית של חשבוניות ל-iCount
 * @param {Object} filter - פילטר לבחירת החשבוניות
 * @param {string} location - מיקום (airport או rothschild)
 * @returns {Promise<Object>} - סיכום תוצאות המיגרציה
 */
const bulkMigrateInvoicesToICount = async (filter = {}, location = 'rothschild') => {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };
  
  try {
    // הוספת מסנן לחשבוניות שעדיין לא הועברו ל-iCount
    const combinedFilter = {
      ...filter,
      'externalSystem.name': { $ne: 'iCount' },
      status: 'active' // רק חשבוניות פעילות
    };
    
    // ספירת סך החשבוניות להעברה
    const total = await Invoice.countDocuments(combinedFilter);
    results.total = total;
    
    // שליפת החשבוניות להעברה
    const invoices = await Invoice.find(combinedFilter);
    
    // העברת כל חשבונית
    for (const invoice of invoices) {
      try {
        await migrateInvoiceToICount(invoice, location);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          error: err.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('שגיאה במיגרציה המונית של חשבוניות:', error);
    throw error;
  }
};

module.exports = {
  convertToICountFormat,
  updateInvoiceWithICountData,
  migrateInvoiceToICount,
  bulkMigrateInvoicesToICount
}; 
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

/**
 * יצירת חשבונית PDF
 * @param {Object} invoice - אובייקט החשבונית
 * @param {String} outputPath - נתיב השמירה (אופציונלי)
 * @returns {Promise<String>} - נתיב הקובץ שנשמר
 */
const generateInvoicePdf = async (invoice, outputPath = null) => {
  return new Promise((resolve, reject) => {
    try {
      // בדיקה שהחשבונית תקינה
      if (!invoice) {
        const error = new Error('אובייקט החשבונית הוא null או undefined');
        console.error(error);
        return reject(error);
      }
      
      console.log('מתחיל ליצור קובץ PDF עבור חשבונית', invoice.invoiceNumber || 'חדשה');
      console.log('מידע מלא על החשבונית:', JSON.stringify(invoice, null, 2));
      
      // יצירת מסמך PDF חדש
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `חשבונית ${invoice.invoiceNumber || 'חדשה'}`,
          Author: 'Diam Apartments',
          Subject: `חשבונית עבור ${invoice.customer?.name || 'לקוח'}`
        }
      });

      // הגדרת כיוון עברית מימין לשמאל
      try {
        doc.font('Hebrew').text('', 0, 0, { align: 'right' });
      } catch (fontError) {
        console.warn('שגיאה בהגדרת פונט:', fontError);
        // נמשיך בלי הגדרת הפונט
      }

      // שמירת הקובץ - אם לא צוין נתיב, נשמור בתיקיית הפרויקט
      let fileName = 'invoice_draft.pdf';
      if (invoice.invoiceNumber) {
        fileName = `invoice_${invoice.invoiceNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`;
      }
      
      // בדיקה אם אנחנו בסביבת render.com ואם כן, שימוש בתיקייה זמנית
      const isRenderEnvironment = process.env.RENDER === 'true';
      let filePath;
      
      if (outputPath) {
        filePath = outputPath;
      } else if (isRenderEnvironment) {
        // בסביבת render משתמשים בתיקייה זמנית
        filePath = path.join('/tmp', fileName);
        console.log('סביבת render זוהתה, שימוש בתיקייה זמנית:', filePath);
      } else {
        // בסביבה מקומית
        filePath = path.join(__dirname, '../', 'uploads', 'invoices', fileName);
      }
      
      console.log('נתיב קובץ PDF:', filePath);
      
      // וידוא שתיקיית היעד קיימת
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        console.log(`יוצר תיקייה: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      } else {
        console.log(`התיקייה ${dir} כבר קיימת`);
      }
      
      console.log('בדיקת הרשאות כתיבה לתיקייה:', dir);
      try {
        const testFile = path.join(dir, '.test_write_permissions');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('הרשאות כתיבה תקינות');
      } catch (permError) {
        console.error('בעיית הרשאות כתיבה בתיקייה:', permError);
      }
      
      // יצירת stream כתיבה לקובץ
      try {
        const stream = fs.createWriteStream(filePath);
        
        stream.on('error', (err) => {
          console.error('שגיאה בכתיבת קובץ PDF:', err);
          reject(err);
        });
        
        doc.pipe(stream);

        // הוספת תוכן החשבונית
        try {
          console.log('מוסיף כותרת');
          addHeader(doc, invoice);
          console.log('מוסיף פרטי חשבונית');
          addInvoiceInfo(doc, invoice);
          console.log('מוסיף פרטי לקוח');
          addCustomerInfo(doc, invoice);
          console.log('מוסיף פרטי שירות');
          addServiceDetails(doc, invoice);
          console.log('מוסיף פרטי תשלום');
          addPaymentDetails(doc, invoice);
          console.log('מוסיף תחתית');
          addFooter(doc, invoice);
          console.log('סיום הוספת תוכן');
        } catch (contentError) {
          console.error('שגיאה בהוספת תוכן לPDF:', contentError);
          console.error('פירוט השגיאה:', contentError.stack);
        }

        // סגירת המסמך - ישמור את הקובץ
        console.log('סוגר את מסמך ה-PDF');
        doc.end();

        // כשהכתיבה תסתיים, נחזיר את נתיב הקובץ
        stream.on('finish', () => {
          console.log('הקובץ נוצר בהצלחה:', filePath);
          
          // בדיקה נוספת שהקובץ אכן נוצר
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`גודל הקובץ: ${stats.size} בתים`);
            
            if (stats.size > 0) {
              console.log('הקובץ תקין ומוכן להורדה');
              resolve(filePath);
            } else {
              const error = new Error('הקובץ נוצר אך הוא ריק');
              console.error(error);
              reject(error);
            }
          } else {
            const error = new Error('הקובץ לא נמצא אחרי יצירה');
            console.error(error);
            reject(error);
          }
        });
      } catch (streamError) {
        console.error('שגיאה ביצירת stream הכתיבה:', streamError);
        reject(streamError);
      }
    } catch (error) {
      console.error('שגיאה כללית ביצירת PDF:', error);
      console.error('פירוט השגיאה:', error.stack);
      reject(error);
    }
  });
};

/**
 * הוספת כותרת לחשבונית
 * @param {PDFDocument} doc 
 * @param {Object} invoice 
 */
function addHeader(doc, invoice) {
  // כותרת עליונה
  doc.fontSize(16).text('דיאם דירות', { align: 'center' });
  
  // סוג חשבונית בהתאם לסטטוס
  let invoiceTitle = 'חשבונית מס / קבלה';
  if (invoice.relatedInvoice && !invoice.isOriginal) {
    invoiceTitle = 'חשבונית זיכוי';
  } else if (invoice.status === 'cancelled') {
    invoiceTitle = 'חשבונית מס / קבלה - מבוטלת';
  }
  
  doc.fontSize(14).text(invoiceTitle, { align: 'center' });
  
  // כתובת העסק בהתאם למיקום
  const businessAddress = invoice.location === 'airport' 
    ? 'רח\' העצמאות 35, אור יהודה' 
    : 'שד\' רוטשילד 60, תל אביב';
  
  doc.fontSize(10)
    .text(businessAddress, { align: 'center' })
    .text('עוסק מורשה: 123456789', { align: 'center' })
    .text('טלפון: 03-1234567', { align: 'center' })
    .moveDown(1);
}

/**
 * הוספת פרטי חשבונית
 * @param {PDFDocument} doc 
 * @param {Object} invoice 
 */
function addInvoiceInfo(doc, invoice) {
  // קו הפרדה
  doc.moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke()
    .moveDown(0.5);
  
  // מסגרת לפרטי החשבונית
  const boxTop = doc.y;
  doc.rect(50, boxTop, doc.page.width - 100, 60)
    .stroke();
  
  // פרטי החשבונית בתוך המסגרת
  doc.fontSize(10)
    .text(`מספר חשבונית: ${invoice.invoiceNumber}`, doc.page.width - 200, boxTop + 10, { align: 'right', width: 150 })
    .text(`תאריך: ${moment(invoice.issueDate).format('DD/MM/YYYY')}`, doc.page.width - 200, boxTop + 25, { align: 'right', width: 150 })
    .text(`מספר הזמנה: ${invoice.booking?.bookingNumber || ''}`, doc.page.width - 200, boxTop + 40, { align: 'right', width: 150 });
  
  doc.moveDown(2);
}

/**
 * הוספת פרטי לקוח
 * @param {PDFDocument} doc 
 * @param {Object} invoice 
 */
function addCustomerInfo(doc, invoice) {
  // כותרת
  doc.fontSize(12).text('פרטי לקוח', { align: 'right' }).moveDown(0.5);
  
  // פרטי הלקוח
  doc.fontSize(10)
    .text(`שם: ${invoice.customer.name}`, { align: 'right' });
  
  // הצגת ת.ז. או דרכון לפי סוג הלקוח
  if (invoice.isTourist && invoice.customer.passportNumber) {
    doc.text(`דרכון: ${invoice.customer.passportNumber}`, { align: 'right' });
  } else if (invoice.customer.idNumber) {
    doc.text(`ת.ז.: ${invoice.customer.idNumber}`, { align: 'right' });
  }
  
  // פרטים נוספים אם קיימים
  if (invoice.customer.address) {
    doc.text(`כתובת: ${invoice.customer.address}`, { align: 'right' });
  }
  
  if (invoice.customer.phone) {
    doc.text(`טלפון: ${invoice.customer.phone}`, { align: 'right' });
  }
  
  if (invoice.customer.email) {
    doc.text(`אימייל: ${invoice.customer.email}`, { align: 'right' });
  }
  
  doc.moveDown(1);
}

/**
 * הוספת פרטי השירות
 * @param {PDFDocument} doc 
 * @param {Object} invoice 
 */
function addServiceDetails(doc, invoice) {
  // כותרת
  doc.fontSize(12).text('פרטי השירות', { align: 'right' }).moveDown(0.5);
  
  // טבלת כותרות
  const tableTop = doc.y;
  doc.fontSize(10);
  
  // ציור טבלה - כותרות
  doc.rect(50, tableTop, doc.page.width - 100, 20).stroke();
  doc.text('תיאור', doc.page.width - 70, tableTop + 5, { align: 'right', width: 150 });
  doc.text('מתאריך', doc.page.width - 220, tableTop + 5, { align: 'center', width: 80 });
  doc.text('עד תאריך', doc.page.width - 300, tableTop + 5, { align: 'center', width: 80 });
  doc.text('לילות', doc.page.width - 350, tableTop + 5, { align: 'center', width: 50 });
  doc.text('חדר', 70, tableTop + 5, { align: 'left', width: 50 });
  
  // תוכן הטבלה
  const rowHeight = 25;
  const rowTop = tableTop + 20;
  
  // ציור שורה
  doc.rect(50, rowTop, doc.page.width - 100, rowHeight).stroke();
  
  // נתוני השירות
  doc.text(
    invoice.serviceDetails.description, 
    doc.page.width - 70, 
    rowTop + 5, 
    { align: 'right', width: 150 }
  );
  
  doc.text(
    moment(invoice.serviceDetails.fromDate).format('DD/MM/YYYY'), 
    doc.page.width - 220, 
    rowTop + 5, 
    { align: 'center', width: 80 }
  );
  
  doc.text(
    moment(invoice.serviceDetails.toDate).format('DD/MM/YYYY'), 
    doc.page.width - 300, 
    rowTop + 5, 
    { align: 'center', width: 80 }
  );
  
  doc.text(
    invoice.serviceDetails.nights.toString(), 
    doc.page.width - 350, 
    rowTop + 5, 
    { align: 'center', width: 50 }
  );
  
  doc.text(
    invoice.serviceDetails.roomNumber, 
    70, 
    rowTop + 5, 
    { align: 'left', width: 50 }
  );
  
  doc.moveDown(1.5);
}

/**
 * הוספת פרטי תשלום
 * @param {PDFDocument} doc 
 * @param {Object} invoice 
 */
function addPaymentDetails(doc, invoice) {
  // כותרת
  doc.fontSize(12).text('פרטי תשלום', { align: 'right' }).moveDown(0.5);
  
  // טבלת סיכום תשלום
  const summaryTop = doc.y;
  const summaryWidth = 200;
  const summaryLeft = doc.page.width - 50 - summaryWidth;
  
  // מסגרת לסיכום התשלום
  doc.rect(summaryLeft, summaryTop, summaryWidth, 100).stroke();
  
  // פרטי התשלום
  doc.fontSize(10)
    .text('סה"כ לפני מע"מ:', summaryLeft + summaryWidth - 10, summaryTop + 10, { align: 'right', width: 120 })
    .text(`₪${formatNumber(invoice.paymentDetails.subtotal)}`, summaryLeft + 10, summaryTop + 10, { align: 'left', width: 70 });
  
  // הנחה אם יש
  if (invoice.paymentDetails.discount > 0) {
    doc.text('הנחה:', summaryLeft + summaryWidth - 10, summaryTop + 30, { align: 'right', width: 120 })
      .text(`₪${formatNumber(invoice.paymentDetails.discount)}`, summaryLeft + 10, summaryTop + 30, { align: 'left', width: 70 });
  }
  
  // מע"מ רק אם זה לא תייר
  if (!invoice.isTourist && invoice.paymentDetails.vatAmount > 0) {
    doc.text(`מע"מ ${invoice.paymentDetails.vatRate}%:`, summaryLeft + summaryWidth - 10, summaryTop + 50, { align: 'right', width: 120 })
      .text(`₪${formatNumber(invoice.paymentDetails.vatAmount)}`, summaryLeft + 10, summaryTop + 50, { align: 'left', width: 70 });
  } else {
    // אם זה תייר, נציין שזה ללא מע"מ
    doc.text('מע"מ לתיירים: פטור', summaryLeft + summaryWidth - 10, summaryTop + 50, { align: 'right', width: 150 });
  }
  
  // סה"כ כולל מע"מ
  doc.text('סה"כ לתשלום:', summaryLeft + summaryWidth - 10, summaryTop + 70, { align: 'right', width: 120 })
    .text(`₪${formatNumber(invoice.paymentDetails.total)}`, summaryLeft + 10, summaryTop + 70, { align: 'left', width: 70 });
  
  // אמצעי תשלום
  doc.moveDown(6);
  doc.text(`אמצעי תשלום: ${getPaymentMethodText(invoice.paymentDetails.paymentMethod)}`, { align: 'right' });
  
  // הערות אם יש
  if (invoice.notes) {
    doc.moveDown(1);
    doc.fontSize(10).text('הערות:', { align: 'right' }).moveDown(0.2);
    doc.text(invoice.notes, { align: 'right' });
  }
}

/**
 * הוספת תחתית המסמך
 * @param {PDFDocument} doc 
 * @param {Object} invoice 
 */
function addFooter(doc, invoice) {
  const pageHeight = doc.page.height;
  const footerTop = pageHeight - 100;
  
  // קו הפרדה
  doc.moveTo(50, footerTop)
    .lineTo(doc.page.width - 50, footerTop)
    .stroke();
  
  // טקסט בתחתית החשבונית
  doc.fontSize(10)
    .text('המסמך הופק על ידי מערכת ניהול חשבוניות דיאם דירות', 50, footerTop + 20, { align: 'center', width: doc.page.width - 100 })
    .text('© כל הזכויות שמורות', 50, footerTop + 50, { align: 'center', width: doc.page.width - 100 });
}

/**
 * פורמט למספרים בחשבונית
 * @param {Number} num 
 * @returns {String}
 */
function formatNumber(num) {
  return num.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * המרת קוד אמצעי תשלום לטקסט בעברית
 * @param {String} method 
 * @returns {String}
 */
function getPaymentMethodText(method) {
  const methodMap = {
    'cash': 'מזומן',
    'credit_card': 'כרטיס אשראי',
    'bank_transfer': 'העברה בנקאית',
    'bit': 'ביט',
    'paybox': 'פייבוקס',
    'other': 'אחר'
  };
  
  return methodMap[method] || 'אחר';
}

module.exports = {
  generateInvoicePdf
}; 
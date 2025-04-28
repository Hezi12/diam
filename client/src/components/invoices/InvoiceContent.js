import React, { useEffect, useState } from 'react';
import { 
  Paper, 
  Typography, 
  Grid, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Box,
  Divider 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { formatNumber } from '../../utils/formatUtils';
import logo from '../../assets/logo.png'; // וודא שיש לוגו במיקום הזה

// סטיילד קומפוננטס לעיצוב החשבונית
const InvoicePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2),
  border: '1px solid #ddd',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  backgroundColor: '#fff',
  width: '210mm', // A4 width
  minHeight: '297mm', // A4 height
  position: 'relative',
  boxSizing: 'border-box',
  pageBreakAfter: 'always',
  '@media print': {
    boxShadow: 'none',
    margin: 0,
  }
}));

const LogoContainer = styled(Box)({
  marginBottom: '20px',
  '& img': {
    maxWidth: '200px',
    maxHeight: '80px',
  }
});

const Label = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.text.secondary,
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  display: 'flex',
  justifyContent: 'space-between',
}));

const CustomDivider = styled(Divider)({
  margin: '20px 0',
});

const CustomTableCell = styled(TableCell)(({ theme, align }) => ({
  borderBottom: '1px solid #ddd',
  padding: theme.spacing(1.5),
  textAlign: align || 'right',
  fontWeight: theme.typography.fontWeightRegular,
}));

const CustomTableHeadCell = styled(CustomTableCell)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  fontWeight: theme.typography.fontWeightBold,
}));

const InvoiceContent = ({ 
  invoiceData, 
  isReceipt = false,
  isEnglish = false 
}) => {
  const [companyDetails, setCompanyDetails] = useState({
    name: 'דיאם חשבוניות בע״מ',
    address: 'רחוב ראשי 123, תל אביב',
    phone: '03-1234567',
    email: 'info@diam-invoices.co.il',
    website: 'www.diam-invoices.co.il',
    vat: '123456789',
  });

  // חישוב הסכומים
  const subtotal = invoiceData?.items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
  const vatAmount = subtotal * 0.17; // מע״מ 17%
  const total = subtotal + vatAmount;

  // הכנת התאריכים בפורמט מתאים
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(isEnglish ? 'en-US' : 'he-IL');
  };

  const documentTitle = isReceipt 
    ? (isEnglish ? 'RECEIPT' : 'קבלה') 
    : (isEnglish ? 'TAX INVOICE' : 'חשבונית מס');

  useEffect(() => {
    // כאן אתה יכול לקרוא את פרטי החברה מה-API או מקובץ הגדרות
    // לדוגמה:
    // fetchCompanyDetails().then(data => setCompanyDetails(data));
  }, []);

  return (
    <InvoicePaper dir={isEnglish ? "ltr" : "rtl"}>
      <HeaderSection>
        <Box>
          <LogoContainer>
            <img src={logo} alt="Company Logo" />
          </LogoContainer>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
            {companyDetails.name}
          </Typography>
          <Typography variant="body2">
            {companyDetails.address}
          </Typography>
          <Typography variant="body2">
            {companyDetails.phone}
          </Typography>
          <Typography variant="body2">
            {companyDetails.email}
          </Typography>
          <Typography variant="body2">
            {companyDetails.website}
          </Typography>
          <Typography variant="body2">
            {isEnglish ? 'VAT: ' : 'ע.מ/ח.פ: '}{companyDetails.vat}
          </Typography>
        </Box>

        <Box style={{ textAlign: isEnglish ? 'left' : 'right' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
            {documentTitle}
          </Typography>
          <Box sx={{ mb: 1 }}>
            <Label>
              {isEnglish ? 'Invoice #:' : 'מספר חשבונית:'}
            </Label>
            <Typography>{invoiceData?.invoiceNumber}</Typography>
          </Box>
          <Box sx={{ mb: 1 }}>
            <Label>
              {isEnglish ? 'Issue Date:' : 'תאריך הנפקה:'}
            </Label>
            <Typography>{formatDate(invoiceData?.issueDate)}</Typography>
          </Box>
          <Box sx={{ mb: 1 }}>
            <Label>
              {isEnglish ? 'Due Date:' : 'תאריך תשלום:'}
            </Label>
            <Typography>{formatDate(invoiceData?.dueDate)}</Typography>
          </Box>
        </Box>
      </HeaderSection>

      <CustomDivider />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          {isEnglish ? 'BILLED TO:' : 'לכבוד:'}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {invoiceData?.customer?.name || 'לקוח כללי'}
        </Typography>
        {invoiceData?.customer?.address && (
          <Typography variant="body2">
            {invoiceData.customer.address}
          </Typography>
        )}
        {invoiceData?.customer?.email && (
          <Typography variant="body2">
            {invoiceData.customer.email}
          </Typography>
        )}
        {invoiceData?.customer?.vat && (
          <Typography variant="body2">
            {isEnglish ? 'VAT: ' : 'ע.מ/ח.פ: '}{invoiceData.customer.vat}
          </Typography>
        )}
      </Box>

      <Box sx={{ mb: 4, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <CustomTableHeadCell align={isEnglish ? 'left' : 'right'}>
                {isEnglish ? 'Description' : 'תיאור'}
              </CustomTableHeadCell>
              <CustomTableHeadCell align="center">
                {isEnglish ? 'Quantity' : 'כמות'}
              </CustomTableHeadCell>
              <CustomTableHeadCell align="center">
                {isEnglish ? 'Unit Price' : 'מחיר יחידה'}
              </CustomTableHeadCell>
              <CustomTableHeadCell align="center">
                {isEnglish ? 'Amount' : 'סכום'}
              </CustomTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceData?.items?.map((item, index) => (
              <TableRow key={index}>
                <CustomTableCell align={isEnglish ? 'left' : 'right'}>
                  {item.description}
                </CustomTableCell>
                <CustomTableCell align="center">
                  {item.quantity}
                </CustomTableCell>
                <CustomTableCell align="center">
                  ₪{formatNumber(item.price)}
                </CustomTableCell>
                <CustomTableCell align="center">
                  ₪{formatNumber(item.quantity * item.price)}
                </CustomTableCell>
              </TableRow>
            ))}
            {(!invoiceData?.items || invoiceData.items.length === 0) && (
              <TableRow>
                <CustomTableCell colSpan={4} align="center">
                  {isEnglish ? 'No items' : 'אין פריטים'}
                </CustomTableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <Box sx={{ textAlign: isEnglish ? 'left' : 'right', mb: 4 }}>
        <Grid container spacing={1} justifyContent={isEnglish ? 'flex-end' : 'flex-start'}>
          <Grid item xs={8} md={9}></Grid>
          <Grid item xs={4} md={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Label>{isEnglish ? 'Subtotal:' : 'סכום ביניים:'}</Label>
              <Typography>₪{formatNumber(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Label>{isEnglish ? 'VAT (17%):' : 'מע"מ (17%):'}</Label>
              <Typography>₪{formatNumber(vatAmount)}</Typography>
            </Box>
            <CustomDivider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {isEnglish ? 'TOTAL:' : 'סה"כ לתשלום:'}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                ₪{formatNumber(total)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <CustomDivider />

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="textSecondary">
          {isEnglish ? 'Thank you for your business!' : 'תודה על העסקה!'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {isEnglish ? 
            'This document was generated automatically and is valid without signature.' : 
            'מסמך זה הופק אוטומטית ותקף ללא חתימה.'}
        </Typography>
      </Box>
    </InvoicePaper>
  );
};

export default InvoiceContent; 
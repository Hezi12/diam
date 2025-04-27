import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Receipt as ReceiptIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AttachMoney as PaymentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import invoiceService from '../../services/invoiceService';
import LoadingButton from '../common/LoadingButton';

/**
 * תפריט פעולות לחשבונית
 * @param {Object} props - פרופים של הקומפוננטה
 * @param {Object} props.invoice - נתוני החשבונית
 * @param {Function} props.onStatusChange - פונקציה לטיפול בשינוי סטטוס
 * @param {Function} props.onRefresh - פונקציה לריענון הנתונים
 */
const InvoiceActions = ({ invoice, onStatusChange, onRefresh }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  // דיאלוג לביטול חשבונית
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // דיאלוג לשליחת חשבונית במייל
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState(invoice?.customer?.email || '');

  // פתיחת התפריט
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // סגירת התפריט
  const handleClose = () => {
    setAnchorEl(null);
  };

  /**
   * מעבר לעריכת החשבונית
   */
  const handleEdit = () => {
    handleClose();
    navigate(`/invoices/edit/${invoice._id}`);
  };

  /**
   * פתיחת דיאלוג ביטול חשבונית
   */
  const handleCancelDialogOpen = () => {
    setCancelDialogOpen(true);
    handleClose();
  };

  /**
   * סגירת דיאלוג ביטול חשבונית
   */
  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
    setCancelReason('');
  };

  /**
   * ביטול החשבונית
   */
  const handleCancelInvoice = async () => {
    try {
      setLoading(true);
      await invoiceService.cancelInvoice(invoice._id, cancelReason);
      enqueueSnackbar('החשבונית בוטלה בהצלחה', { variant: 'success' });
      onStatusChange && onStatusChange('cancelled');
      onRefresh && onRefresh();
    } catch (error) {
      console.error('שגיאה בביטול חשבונית:', error);
      enqueueSnackbar(`שגיאה בביטול החשבונית: ${error.message || 'אירעה שגיאה לא ידועה'}`, { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
      handleCancelDialogClose();
    }
  };

  /**
   * פתיחת דיאלוג שליחת מייל
   */
  const handleEmailDialogOpen = () => {
    setEmailDialogOpen(true);
    handleClose();
  };

  /**
   * סגירת דיאלוג שליחת מייל
   */
  const handleEmailDialogClose = () => {
    setEmailDialogOpen(false);
  };

  /**
   * שליחת החשבונית במייל
   */
  const handleSendEmail = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      enqueueSnackbar('נא להזין כתובת מייל תקינה', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await invoiceService.emailInvoice(invoice._id, emailAddress);
      enqueueSnackbar('החשבונית נשלחה בהצלחה', { variant: 'success' });
    } catch (error) {
      console.error('שגיאה בשליחת החשבונית במייל:', error);
      enqueueSnackbar(`שגיאה בשליחת החשבונית: ${error.message || 'אירעה שגיאה לא ידועה'}`, { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
      handleEmailDialogClose();
    }
  };

  /**
   * הפקת קבלה על חשבונית
   */
  const handleIssueReceipt = () => {
    handleClose();
    // כאן יבוא הקוד להפקת קבלה
    enqueueSnackbar('פונקציונליות בפיתוח', { variant: 'info' });
  };

  /**
   * הדפסת החשבונית
   */
  const handlePrint = () => {
    handleClose();
    window.print();
  };

  /**
   * מעבר לדף תשלומים
   */
  const handlePayment = () => {
    handleClose();
    navigate(`/invoices/${invoice._id}/payment`);
  };

  return (
    <>
      <Box>
        <Button
          variant="outlined"
          endIcon={<ExpandMoreIcon />}
          onClick={handleClick}
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl)}
        >
          פעולות
        </Button>
        <Menu
          id="invoice-actions-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleEdit} disabled={invoice?.status === 'cancelled'}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="עריכה" />
          </MenuItem>
          
          <MenuItem onClick={handlePrint}>
            <ListItemIcon>
              <PrintIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="הדפסה" />
          </MenuItem>
          
          <MenuItem onClick={handleEmailDialogOpen}>
            <ListItemIcon>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="שליחה במייל" />
          </MenuItem>
          
          <MenuItem onClick={handlePayment} disabled={invoice?.status === 'cancelled' || invoice?.status === 'paid'}>
            <ListItemIcon>
              <PaymentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="תשלום" />
          </MenuItem>
          
          <MenuItem onClick={handleIssueReceipt} disabled={invoice?.status === 'cancelled' || invoice?.status !== 'paid'}>
            <ListItemIcon>
              <ReceiptIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="הפקת קבלה" />
          </MenuItem>
          
          <MenuItem onClick={handleCancelDialogOpen} disabled={invoice?.status === 'cancelled'}>
            <ListItemIcon>
              <CancelIcon fontSize="small" style={{ color: '#f44336' }} />
            </ListItemIcon>
            <ListItemText primary="ביטול חשבונית" primaryTypographyProps={{ style: { color: '#f44336' } }} />
          </MenuItem>
        </Menu>
      </Box>

      {/* דיאלוג לביטול חשבונית */}
      <Dialog open={cancelDialogOpen} onClose={handleCancelDialogClose}>
        <DialogTitle>ביטול חשבונית</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך לבטל את החשבונית? פעולה זו אינה ניתנת לביטול.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="סיבת הביטול"
            type="text"
            fullWidth
            variant="outlined"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose} color="primary">
            ביטול
          </Button>
          <LoadingButton
            loading={loading}
            onClick={handleCancelInvoice}
            color="error"
            variant="contained"
          >
            בטל חשבונית
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* דיאלוג לשליחת חשבונית במייל */}
      <Dialog open={emailDialogOpen} onClose={handleEmailDialogClose}>
        <DialogTitle>שליחת חשבונית במייל</DialogTitle>
        <DialogContent>
          <DialogContentText>
            הזן את כתובת המייל אליה תרצה לשלוח את החשבונית
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="כתובת מייל"
            type="email"
            fullWidth
            variant="outlined"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEmailDialogClose} color="primary">
            ביטול
          </Button>
          <LoadingButton
            loading={loading}
            onClick={handleSendEmail}
            color="primary"
            variant="contained"
          >
            שלח
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvoiceActions; 
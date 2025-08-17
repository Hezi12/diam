import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentsIcon from '@mui/icons-material/Payments';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { format } from 'date-fns';
import { STYLE_CONSTANTS, getBookingStatusColors } from '../../styles/StyleConstants';

/**
 * רכיב לייצוג הזמנה בודדת בטבלת ההזמנות
 */
const BookingItem = ({ booking, onClick, location = 'airport' }) => {
  const colors = STYLE_CONSTANTS.colors;
  const statusColors = getBookingStatusColors(colors);

  // צבעים מיוחדים לפי מקור ההזמנה
  const bookingSourceColors = {
    booking: {
      confirmed: {
        bgColor: `rgba(39, 174, 96, 0.1)`,
        borderColor: `#27ae60`,
        textColor: `#186a3b`,
        icon: <CheckCircleIcon fontSize="small" sx={{ color: '#186a3b' }} />
      },
      pending: {
        bgColor: `rgba(46, 204, 113, 0.1)`,
        borderColor: `#2ecc71`,
        textColor: `#1e8449`,
        icon: <PendingIcon fontSize="small" sx={{ color: '#1e8449' }} />
      },
      cancelled: {
        bgColor: `rgba(88, 214, 141, 0.1)`,
        borderColor: `#58d68d`,
        textColor: `#229954`,
        icon: <CancelIcon fontSize="small" sx={{ color: '#229954' }} />
      }
    },
    expedia: {
      confirmed: {
        bgColor: `rgba(255, 107, 53, 0.1)`,
        borderColor: `#ff6b35`,
        textColor: `#cc4a1f`,
        icon: <CheckCircleIcon fontSize="small" sx={{ color: '#cc4a1f' }} />
      },
      pending: {
        bgColor: `rgba(255, 107, 53, 0.08)`,
        borderColor: `#ff6b35`,
        textColor: `#cc4a1f`,
        icon: <PendingIcon fontSize="small" sx={{ color: '#cc4a1f' }} />
      },
      cancelled: {
        bgColor: `rgba(255, 107, 53, 0.05)`,
        borderColor: `#ff8a5b`,
        textColor: `#b8431c`,
        icon: <CancelIcon fontSize="small" sx={{ color: '#b8431c' }} />
      }
    }
  };

  // הגדרות צבעים לפי סטטוס הזמנה
  const bookingStatusColors = {
    confirmed: {
      bgColor: statusColors.confirmed.bgColor,
      borderColor: statusColors.confirmed.borderColor,
      textColor: statusColors.confirmed.textColor,
      icon: <CheckCircleIcon fontSize="small" sx={{ color: statusColors.confirmed.textColor }} />
    },
    pending: {
      bgColor: statusColors.pending.bgColor,
      borderColor: statusColors.pending.borderColor,
      textColor: statusColors.pending.textColor,
      icon: <PendingIcon fontSize="small" sx={{ color: statusColors.pending.textColor }} />
    },
    cancelled: {
      bgColor: statusColors.cancelled.bgColor,
      borderColor: statusColors.cancelled.borderColor,
      textColor: statusColors.cancelled.textColor,
      icon: <CancelIcon fontSize="small" sx={{ color: statusColors.cancelled.textColor }} />
    },
    completed: {
      bgColor: `rgba(${colors[location].main.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
      borderColor: colors[location].main,
      textColor: colors[location].main,
      icon: <AssignmentTurnedInIcon fontSize="small" sx={{ color: colors[location].main }} />
    }
  };

  // הגדרת אייקונים לפי סטטוס תשלום
  const paymentStatusIcons = {
    unpaid: <HelpOutlineIcon fontSize="small" sx={{ color: colors.accent.orange }} />,
    cash: <PaymentsIcon fontSize="small" sx={{ color: colors.accent.green }} />,
    credit_or_yehuda: <CreditCardIcon fontSize="small" sx={{ color: colors.accent.green }} />,
    credit_rothschild: <CreditCardIcon fontSize="small" sx={{ color: colors.accent.green }} />,
    transfer_mizrahi: <AccountBalanceIcon fontSize="small" sx={{ color: colors.accent.green }} />,
    bit_mizrahi: <PaymentsIcon fontSize="small" sx={{ color: colors.accent.green }} />,
    paybox_mizrahi: <PaymentsIcon fontSize="small" sx={{ color: colors.accent.green }} />,
    transfer_poalim: <AccountBalanceIcon fontSize="small" sx={{ color: colors.accent.green }} />,
    bit_poalim: <PaymentsIcon fontSize="small" sx={{ color: colors.accent.green }} />,
    paybox_poalim: <PaymentsIcon fontSize="small" sx={{ color: colors.accent.green }} />,
    other: <AttachMoneyIcon fontSize="small" sx={{ color: colors.accent.green }} />
  };

  // הגדרת טקסט לפי סטטוס תשלום
  const paymentStatusText = {
    unpaid: 'לא שולם',
    cash: 'מזומן',
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

  // הגדרת טקסט לפי סטטוס הזמנה
  const bookingStatusText = {
    confirmed: 'מאושר',
    pending: 'בהמתנה',
    cancelled: 'בוטל',
    completed: 'הושלם'
  };

  // בחירת צבע בהתאם למקור ההזמנה
  let itemStatusColors;
  if (booking.source === 'booking' && bookingSourceColors.booking[booking.status]) {
    // הזמנה מבוקינג - צבע ירוק
    itemStatusColors = bookingSourceColors.booking[booking.status];
  } else if (booking.source === 'expedia' && bookingSourceColors.expedia[booking.status]) {
    // הזמנה מ-Expedia - צבע כתום-אדום
    itemStatusColors = bookingSourceColors.expedia[booking.status];
  } else {
    // הזמנה רגילה - צבע כחול
    itemStatusColors = bookingStatusColors[booking.status] || bookingStatusColors.pending;
  }

  return (
    <Box 
      sx={{ 
        p: 1.5, 
        borderRadius: '10px', 
        bgcolor: itemStatusColors.bgColor,
        border: '1px solid',
        borderColor: itemStatusColors.borderColor,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 3px 10px rgba(0,0,0,0.08)'
        },
        position: 'relative'
      }}
      onClick={() => onClick(booking._id)}
    >
      <Typography 
        variant="subtitle2" 
        noWrap 
        sx={{ 
          fontWeight: 500,
          maxWidth: 'calc(100% - 28px)', // מאפשר מקום לאייקון סטטוס תשלום
          color: itemStatusColors.textColor
        }}
      >
        {booking.guestName}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: itemStatusColors.textColor,
              mr: 0.5
            }}
          />
          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
            {bookingStatusText[booking.status]}
          </Typography>
        </Box>

        <Typography 
          variant="caption" 
          sx={{ 
            color: colors.text.secondary,
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          {booking.nights} 
          <Box component="span" sx={{ mx: 0.5 }}>
            לילות
          </Box>
        </Typography>
      </Box>

      {/* אייקון סטטוס תשלום */}
      <Tooltip title={paymentStatusText[booking.paymentStatus] || 'לא שולם'} arrow placement="top">
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 8, 
            left: 8,
            opacity: 0.8
          }}
        >
          {paymentStatusIcons[booking.paymentStatus] || paymentStatusIcons.unpaid}
        </Box>
      </Tooltip>
    </Box>
  );
};

export default BookingItem; 
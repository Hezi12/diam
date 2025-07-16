import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { usePublicTranslation } from '../../contexts/PublicLanguageContext';

const LaunchPromotionBanner = () => {
  const [open, setOpen] = useState(true);
  const t = usePublicTranslation();

  const handleClose = () => {
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          border: '1px solid #f1f5f9',
          textAlign: 'center',
          position: 'relative'
        }
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          color: '#64748b',
          bgcolor: '#f8fafc',
          width: 32,
          height: 32,
          '&:hover': {
            bgcolor: '#e2e8f0',
            color: '#475569'
          }
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <DialogTitle sx={{ pb: 2, pt: 4, px: 4 }}>
        <Typography variant="h5" component="h2" sx={{ 
          fontWeight: 700,
          color: '#1e293b',
          fontSize: '1.5rem',
          lineHeight: 1.3
        }}>
          {t('promotion.title')}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 1 }}>
        <Box sx={{ 
          mb: 3,
          p: 3,
          bgcolor: '#f8fafc',
          borderRadius: 2,
          border: '2px solid #64748b'
        }}>
          <Typography variant="h2" component="div" sx={{ 
            fontWeight: 800, 
            color: '#334155',
            fontSize: '3rem',
            lineHeight: 1,
            mb: 1
          }}>
            {t('promotion.discount')}
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ 
          mb: 3, 
          fontSize: '1.1rem',
          color: '#475569',
          fontWeight: 500,
          lineHeight: 1.6
        }}>
          {t('promotion.description')}
        </Typography>

        {/* קופון מעוצב */}
        <Box sx={{
          bgcolor: '#ffffff',
          color: '#334155',
          borderRadius: 2,
          p: 3,
          mb: 3,
          border: '2px dashed #64748b',
          position: 'relative',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <Typography variant="body2" sx={{ 
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.9rem',
            mb: 1
          }}>
            {t('promotion.couponText')}
          </Typography>
          <Typography variant="h4" component="div" sx={{ 
            fontWeight: 800, 
            color: '#334155',
            fontSize: '2rem',
            fontFamily: 'monospace',
            letterSpacing: '0.2em'
          }}>
            {t('promotion.couponCode')}
          </Typography>
        </Box>

        <Box sx={{
          bgcolor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: 2,
          p: 2,
          mb: 2
        }}>
          <Typography variant="body2" sx={{ 
            color: '#475569',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            {t('promotion.limitation')}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 4, px: 4 }}>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            bgcolor: '#64748b',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem',
            px: 6,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(100, 116, 139, 0.3)',
            '&:hover': {
              bgcolor: '#475569',
              boxShadow: '0 6px 20px rgba(100, 116, 139, 0.4)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          {t('promotion.button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LaunchPromotionBanner; 
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Divider
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
          bgcolor: '#f0f9ff',
          borderRadius: 2,
          border: '2px solid #0ea5e9'
        }}>
          <Typography variant="h2" component="div" sx={{ 
            fontWeight: 800, 
            color: '#0ea5e9',
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

        <Box sx={{
          bgcolor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 2,
          p: 2,
          mb: 2
        }}>
          <Typography variant="body2" sx={{ 
            color: '#92400e',
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
            bgcolor: '#0ea5e9',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem',
            px: 6,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)',
            '&:hover': {
              bgcolor: '#0284c7',
              boxShadow: '0 6px 20px rgba(14, 165, 233, 0.4)',
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
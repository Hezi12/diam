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
          borderRadius: 2,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          position: 'relative'
        }
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'white',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.2)'
          }
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogTitle sx={{ pb: 1, pt: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          {t('promotion.title')}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h3" component="div" sx={{ 
            fontWeight: 'bold', 
            color: '#FFD700',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            {t('promotion.discount')}
          </Typography>
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', my: 2 }} />

        <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem' }}>
          {t('promotion.description')}
        </Typography>

        <Typography variant="body2" sx={{ 
          color: 'rgba(255,255,255,0.9)',
          fontStyle: 'italic',
          fontSize: '0.9rem'
        }}>
          {t('promotion.limitation')}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            bgcolor: '#FFD700',
            color: '#333',
            fontWeight: 'bold',
            px: 4,
            py: 1,
            '&:hover': {
              bgcolor: '#FFC107'
            }
          }}
        >
          {t('promotion.button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LaunchPromotionBanner; 
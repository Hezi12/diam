import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, IconButton, Button,
  DialogTitle, DialogContent, DialogActions, Divider,
  useMediaQuery, useTheme, styled
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { getHebrewInputStyle } from '../../styles/StyleConstants';

import RoomBasicInfoSection from './RoomBasicInfoSection';
import RoomPricesSection from './RoomPricesSection';
import RoomOccupancySection from './RoomOccupancySection';
import RoomDetailsSection from './RoomDetailsSection';
import RoomImagesSection from './RoomImagesSection';
import RoomStatusSection from './RoomStatusSection';

// סטייל מותאם עבור טקסט בעברית מימין לשמאל
const RTLBox = styled(Box)({
  direction: 'rtl',
  textAlign: 'right'
});

const CompactDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3.5, 2.5),
  '& .MuiFormControl-root': {
    marginBottom: theme.spacing(1.5)
  },
  '& .MuiTypography-subtitle1': {
    fontSize: '0.92rem',
    fontWeight: 500,
    color: '#333',
    marginBottom: theme.spacing(0.5),
    paddingRight: theme.spacing(1)
  },
  '& .MuiGrid-item': {
    paddingTop: theme.spacing(0.5)
  },
  '& .MuiInputLabel-root': {
    right: '1.75rem',
    left: 'auto',
    transformOrigin: 'right top',
    color: '#555',
    fontSize: '0.95rem'
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(0, -9px) scale(0.78)'
  },
  '& .MuiInputBase-root': {
    textAlign: 'right',
    color: '#333',
    fontSize: '0.95rem',
    direction: 'rtl'
  },
  '& .MuiSelect-select': {
    paddingRight: '14px',
    paddingLeft: '12px',
    textAlign: 'right',
    direction: 'rtl'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    textAlign: 'right'
  },
  '& .MuiFormLabel-root': {
    right: 0,
    transformOrigin: 'top right'
  },
  '& input::placeholder, & textarea::placeholder': {
    textAlign: 'right',
    direction: 'rtl',
  },
  '& .MuiInputAdornment-root': {
    marginLeft: '0',
    marginRight: 'auto'
  },
  '& .MuiOutlinedInput-multiline': {
    padding: 0,
    '& textarea': {
      padding: '10px 14px',
      textAlign: 'right'
    }
  }
}));

const SectionBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
  marginTop: theme.spacing(2),
  padding: theme.spacing(2.5, 2.5, 2, 2.5),
  border: '1px solid rgba(0, 0, 0, 0.04)',
  borderRadius: '12px',
  position: 'relative',
  backgroundColor: 'rgba(0, 0, 0, 0.01)',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
  '&:hover': {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    backgroundColor: 'rgba(0, 0, 0, 0.005)',
  },
  '& .section-title': {
    position: 'absolute',
    top: '-14px',
    right: '14px',
    backgroundColor: '#fff',
    padding: '3px 10px',
    fontWeight: 500,
    fontSize: '0.92rem',
    color: '#1d1d1f',
    borderRadius: '6px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
    zIndex: 1
  }
}));

const CompactTextField = styled(Box)(({ theme }) => {
  const hebrewInputStyleObj = getHebrewInputStyle('10px');
  
  return {
    '& .MuiInputBase-root': {
      fontSize: '0.95rem',
      direction: 'rtl'
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.92rem',
      right: '1.75rem',
      left: 'auto',
      transformOrigin: 'top right',
      color: '#555'
    },
    '& .MuiInputLabel-shrink': {
      transform: 'translate(0, -9px) scale(0.78)'
    },
    '& .MuiOutlinedInput-notchedOutline': {
      fontSize: '0.9rem',
      textAlign: 'right'
    },
    '& .MuiFormControlLabel-root': {
      marginRight: 0,
      marginLeft: 'auto'
    },
    '& .MuiInputAdornment-root': {
      marginLeft: 0,
      marginRight: 'auto'
    },
    '& .MuiFormHelperText-root': {
      color: '#555',
      fontSize: '0.8rem'
    },
    '& label.Mui-focused': {
      color: '#0071e3'
    },
    '& .MuiSelect-select': {
      fontSize: '0.95rem',
      textAlign: 'right',
      paddingRight: '14px',
      paddingLeft: '12px',
      direction: 'rtl'
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      '&.Mui-focused fieldset': {
        borderColor: '#0071e3'
      },
      '&:hover fieldset': {
        borderColor: 'rgba(0, 113, 227, 0.4)'
      }
    },
    '& .MuiInputBase-input': {
      textAlign: 'right',
      paddingLeft: '14px',
      paddingRight: '14px',
      direction: 'rtl'
    },
    '& input::placeholder, & textarea::placeholder': {
      textAlign: 'right',
      direction: 'rtl',
    },
    '& .MuiOutlinedInput-multiline': {
      padding: 0,
      '& textarea': {
        padding: '10px 14px',
        textAlign: 'right'
      }
    },
    ...hebrewInputStyleObj
  };
});

const RoomForm = ({ room, isEdit, viewOnly, onSave, onCancel }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    roomNumber: '',
    category: 'Simple',
    basePriceNoVat: '',
    basePriceWithVat: '',
    fridayPriceNoVat: '',
    fridayPriceWithVat: '',
    baseOccupancy: 2,
    maxOccupancy: 2,
    extraGuestCharge: 0,
    description: '',
    amenities: '',
    images: [],
    status: true
  });
  
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  
  useEffect(() => {
    if (room) {
      // המרת הנתונים מהחדר לפורמט של הטופס
      const expanded = {
        roomNumber: room.roomNumber || '',
        category: room.category || 'Simple',
        basePriceNoVat: room.basePrice || '',
        basePriceWithVat: room.vatPrice || '',
        fridayPriceNoVat: room.fridayPrice || room.basePrice || '',
        fridayPriceWithVat: room.fridayVatPrice || room.vatPrice || '',
        baseOccupancy: room.baseOccupancy || 2,
        maxOccupancy: room.maxOccupancy || 2,
        extraGuestCharge: room.extraGuestCharge || 0,
        description: room.description || '',
        amenities: room.amenities ? (Array.isArray(room.amenities) ? room.amenities.join(', ') : room.amenities) : '',
        images: room.images || [],
        status: room.status !== undefined ? room.status : true
      };
      
      setFormData(expanded);
      setImagePreview(room.images || []);
    }
  }, [room]);
  
  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    
    // חישוב אוטומטי של מחירים עם/בלי מע"מ
    if (name === 'basePriceNoVat') {
      const withVat = parseFloat((parseFloat(value || 0) * 1.18).toFixed(2));
      setFormData((prev) => ({ ...prev, basePriceWithVat: withVat || '' }));
    } else if (name === 'basePriceWithVat') {
      const noVat = parseFloat((parseFloat(value || 0) / 1.18).toFixed(2));
      setFormData((prev) => ({ ...prev, basePriceNoVat: noVat || '' }));
    } else if (name === 'fridayPriceNoVat') {
      const withVat = parseFloat((parseFloat(value || 0) * 1.18).toFixed(2));
      setFormData((prev) => ({ ...prev, fridayPriceWithVat: withVat || '' }));
    } else if (name === 'fridayPriceWithVat') {
      const noVat = parseFloat((parseFloat(value || 0) / 1.18).toFixed(2));
      setFormData((prev) => ({ ...prev, fridayPriceNoVat: noVat || '' }));
    }
  };
  
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // יצירת תצוגות מקדימות
    const filePreviews = files.map(file => URL.createObjectURL(file));
    
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreview((prev) => [...prev, ...filePreviews]);
  };
  
  const handleRemoveImage = (index) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // הכנת הנתונים לשליחה
    const processedData = {
      roomNumber: formData.roomNumber,
      category: formData.category,
      basePrice: parseFloat(formData.basePriceNoVat) || 0,
      vatPrice: parseFloat(formData.basePriceWithVat) || 0,
      fridayPrice: parseFloat(formData.fridayPriceNoVat) || 0,
      fridayVatPrice: parseFloat(formData.fridayPriceWithVat) || 0,
      baseOccupancy: parseInt(formData.baseOccupancy, 10) || 2,
      maxOccupancy: parseInt(formData.maxOccupancy, 10) || 2,
      extraGuestCharge: parseInt(formData.extraGuestCharge, 10) || 0,
      description: formData.description,
      amenities: formData.amenities.split(',').map(item => item.trim()).filter(item => item),
      images: imagePreview,
      status: formData.status
    };
    
    onSave(processedData);
  };
  
  return (
    <>
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        backgroundColor: '#f5f5f7',
        p: 2.5,
        pb: 3,
        minHeight: 'auto',
        direction: 'rtl'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 500, 
            textAlign: 'right', 
            color: '#1d1d1f',
            fontSize: '1.1rem'
          }}
        >
          {viewOnly ? `צפייה בחדר ${formData.roomNumber}` : 
           isEdit ? `עריכת חדר ${formData.roomNumber}` : 'הוספת חדר חדש'}
        </Typography>
        <IconButton 
          onClick={onCancel} 
          size="small" 
          sx={{ 
            p: 0.7, 
            color: 'var(--text-secondary)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)'
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <CompactDialogContent>
        <RTLBox>
          <CompactTextField>
            <form onSubmit={handleSubmit}>
              <SectionBox>
                <Typography className="section-title">פרטי חדר</Typography>
                <Grid container spacing={2} sx={{ pt: 0.5 }}>
                  <RoomBasicInfoSection 
                    formData={formData} 
                    onChange={handleChange}
                    viewOnly={viewOnly}
                  />
                </Grid>
              </SectionBox>
              
              <SectionBox>
                <Typography className="section-title">מחירים</Typography>
                <Grid container spacing={2} sx={{ pt: 0.5 }}>
                  <RoomPricesSection 
                    formData={formData} 
                    onChange={handleChange}
                    viewOnly={viewOnly}
                  />
                </Grid>
              </SectionBox>
              
              <SectionBox>
                <Typography className="section-title">תפוסת אורחים</Typography>
                <Grid container spacing={2} sx={{ pt: 0.5 }}>
                  <RoomOccupancySection 
                    formData={formData} 
                    onChange={handleChange}
                    viewOnly={viewOnly}
                  />
                </Grid>
              </SectionBox>
              
              <SectionBox>
                <Typography className="section-title">פרטים נוספים</Typography>
                <Grid container spacing={2} sx={{ pt: 0.5 }}>
                  <RoomDetailsSection 
                    formData={formData} 
                    onChange={handleChange}
                    viewOnly={viewOnly}
                  />
                </Grid>
              </SectionBox>
              
              <SectionBox>
                <Typography className="section-title">תמונות</Typography>
                <Grid container spacing={2} sx={{ pt: 0.5 }}>
                  <RoomImagesSection 
                    imagePreview={imagePreview}
                    viewOnly={viewOnly}
                    onUpload={handleImageUpload}
                    onRemove={handleRemoveImage}
                  />
                </Grid>
              </SectionBox>
              
              <SectionBox>
                <Typography className="section-title">סטטוס</Typography>
                <Grid container spacing={2} sx={{ pt: 0.5 }}>
                  <RoomStatusSection 
                    formData={formData} 
                    onChange={handleChange}
                    viewOnly={viewOnly}
                  />
                </Grid>
              </SectionBox>
            </form>
          </CompactTextField>
        </RTLBox>
      </CompactDialogContent>
      
      <DialogActions sx={{ 
        px: 2.5, 
        py: 2, 
        borderTop: '1px solid rgba(0, 0, 0, 0.06)', 
        direction: 'rtl', 
        justifyContent: 'flex-start',
        bgcolor: '#f5f5f7'
      }}>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          sx={{ 
            bgcolor: '#0071e3', 
            '&:hover': { bgcolor: '#0062c3' },
            borderRadius: '10px',
            fontSize: '0.95rem',
            py: 1,
            px: 3,
            mr: 1.5,
            fontWeight: 500,
            boxShadow: 'none',
            color: 'white',
            minWidth: '120px',
          }}
          style={{ display: viewOnly ? 'none' : 'inline-flex' }}
        >
          {isEdit ? 'שמור שינויים' : 'צור חדר'}
        </Button>
        
        <Button 
          onClick={onCancel} 
          variant="outlined"
          sx={{ 
            borderRadius: '10px', 
            fontSize: '0.95rem', 
            py: 1,
            px: 3,
            borderColor: 'rgba(0, 0, 0, 0.15)',
            color: '#1d1d1f',
            fontWeight: 500,
            minWidth: '80px',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.3)',
              bgcolor: 'rgba(0, 0, 0, 0.03)'
            }
          }}
        >
          {viewOnly ? 'סגור' : 'ביטול'}
        </Button>
      </DialogActions>
    </>
  );
};

export default RoomForm; 
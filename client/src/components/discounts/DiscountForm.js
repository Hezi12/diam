import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Autocomplete,
  Alert,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import axios from 'axios';

/**
 * טופס יצירה ועריכה של הנחות
 */
const DiscountForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  discount = null, 
  isEdit = false,
  defaultLocation = null 
}) => {
  
  // State נתוני הטופס
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    location: defaultLocation || 'both',
    validityType: 'unlimited',
    validFrom: null,
    validUntil: null,
    lastMinuteSettings: {
      daysBeforeArrival: 3,
      includeArrivalDay: true
    },
    restrictions: {
      minNights: 1,
      maxNights: null,
      minGuests: 1,
      maxGuests: null,
      validDaysOfWeek: [],
      applicableForTourists: true,
      applicableForIsraelis: true
    },
    priority: 0,
    combinable: false,
    usageLimit: {
      maxUses: null
    },
    isActive: true
  });

  // State נתונים חיצוניים
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // אפקט טעינה ראשונית
  useEffect(() => {
    if (open) {
      // אם זה עריכה, נטען את הנתונים הקיימים
      if (isEdit && discount) {
        setFormData({
          name: discount.name || '',
          description: discount.description || '',
          discountType: discount.discountType || 'percentage',
          discountValue: discount.discountValue || 10,
          location: discount.location || 'both',
          validityType: discount.validityType || 'unlimited',
          validFrom: discount.validFrom ? new Date(discount.validFrom) : null,
          validUntil: discount.validUntil ? new Date(discount.validUntil) : null,
          lastMinuteSettings: {
            daysBeforeArrival: discount.lastMinuteSettings?.daysBeforeArrival || 3,
            includeArrivalDay: discount.lastMinuteSettings?.includeArrivalDay !== false
          },
          restrictions: {
            minNights: discount.restrictions?.minNights || 1,
            maxNights: discount.restrictions?.maxNights || null,
            minGuests: discount.restrictions?.minGuests || 1,
            maxGuests: discount.restrictions?.maxGuests || null,
            validDaysOfWeek: discount.restrictions?.validDaysOfWeek || [],
            applicableForTourists: discount.restrictions?.applicableForTourists !== false,
            applicableForIsraelis: discount.restrictions?.applicableForIsraelis !== false
          },
          priority: discount.priority || 0,
          combinable: discount.combinable || false,
          usageLimit: {
            maxUses: discount.usageLimit?.maxUses || null
          },
          isActive: discount.isActive !== false
        });
      }
    }
  }, [open, isEdit, discount]);

  // פונקציות טיפול בשינויים
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // הסרת שגיאה של השדה שהשתנה
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRestrictionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      restrictions: {
        ...prev.restrictions,
        [field]: value
      }
    }));
  };

  const handleLastMinuteChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      lastMinuteSettings: {
        ...prev.lastMinuteSettings,
        [field]: value
      }
    }));
  };

  // ולידציה
  const validateForm = () => {
    const newErrors = {};

    // שם ההנחה
    if (!formData.name.trim()) {
      newErrors.name = 'שם ההנחה נדרש';
    }

    // ערך ההנחה
    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = 'ערך ההנחה חייב להיות חיובי';
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'הנחה באחוזים לא יכולה לעלות על 100%';
    }

    // תאריכים לטווח תאריכים
    if (formData.validityType === 'date_range') {
      if (!formData.validFrom) {
        newErrors.validFrom = 'תאריך התחלה נדרש';
      }
      if (!formData.validUntil) {
        newErrors.validUntil = 'תאריך סיום נדרש';
      }
      if (formData.validFrom && formData.validUntil && formData.validFrom >= formData.validUntil) {
        newErrors.validUntil = 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // שליחת הטופס
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // הכנת הנתונים לשליחה
    const dataToSubmit = {
      ...formData,
      restrictions: {
        ...formData.restrictions,
        maxNights: formData.restrictions.maxNights || undefined,
        maxGuests: formData.restrictions.maxGuests || undefined
      },
      usageLimit: {
        ...formData.usageLimit,
        maxUses: formData.usageLimit.maxUses || undefined
      }
    };

    onSubmit(dataToSubmit);
  };

  // איפוס הטופס
  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      location: defaultLocation || 'both',
      validityType: 'unlimited',
      validFrom: null,
      validUntil: null,
      lastMinuteSettings: {
        daysBeforeArrival: 3,
        includeArrivalDay: true
      },
      restrictions: {
        minNights: 1,
        maxNights: null,
        minGuests: 1,
        maxGuests: null,
        validDaysOfWeek: [],
        applicableForTourists: true,
        applicableForIsraelis: true
      },
      priority: 0,
      combinable: false,
      usageLimit: {
        maxUses: null
      },
      isActive: true
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'עריכת הנחה' : 'הנחה חדשה'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* פרטים בסיסיים */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="שם ההנחה"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="תיאור"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            {/* סוג וערך ההנחה */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>סוג הנחה</InputLabel>
                <Select
                  value={formData.discountType}
                  onChange={(e) => handleChange('discountType', e.target.value)}
                >
                  <MenuItem value="percentage">אחוזים</MenuItem>
                  <MenuItem value="fixed_amount">סכום קבוע</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ערך ההנחה"
                type="number"
                value={formData.discountValue}
                onChange={(e) => handleChange('discountValue', parseFloat(e.target.value) || 0)}
                error={!!errors.discountValue}
                helperText={errors.discountValue}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {formData.discountType === 'percentage' ? '%' : '₪'}
                    </InputAdornment>
                  )
                }}
                required
              />
            </Grid>

            {/* מיקום */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>מיקום</InputLabel>
                <Select
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                >
                  <MenuItem value="airport">שדה התעופה</MenuItem>
                  <MenuItem value="rothschild">רוטשילד</MenuItem>
                  <MenuItem value="both">שני המיקומים</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* סוג תוקף */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>סוג תוקף</InputLabel>
                <Select
                  value={formData.validityType}
                  onChange={(e) => handleChange('validityType', e.target.value)}
                >
                  <MenuItem value="unlimited">ללא הגבלת זמן</MenuItem>
                  <MenuItem value="date_range">טווח תאריכים</MenuItem>
                  <MenuItem value="last_minute">רגע אחרון</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* תאריכים - רק אם נבחר טווח תאריכים */}
            {formData.validityType === 'date_range' && (
              <>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                    <DatePicker
                      label="תאריך התחלה"
                      value={formData.validFrom}
                      onChange={(date) => handleChange('validFrom', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.validFrom}
                          helperText={errors.validFrom}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                    <DatePicker
                      label="תאריך סיום"
                      value={formData.validUntil}
                      onChange={(date) => handleChange('validUntil', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.validUntil}
                          helperText={errors.validUntil}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
              </>
            )}

            {/* הגדרות רגע אחרון - רק אם נבחר רגע אחרון */}
            {formData.validityType === 'last_minute' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ימים לפני הגעה"
                  type="number"
                  value={formData.lastMinuteSettings.daysBeforeArrival}
                  onChange={(e) => handleLastMinuteChange('daysBeforeArrival', parseInt(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">ימים</InputAdornment>
                  }}
                />
              </Grid>
            )}

            {/* הגבלות בסיסיות */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="מספר לילות מינימלי"
                type="number"
                value={formData.restrictions.minNights}
                onChange={(e) => handleRestrictionChange('minNights', parseInt(e.target.value) || 1)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="מספר אורחים מינימלי"
                type="number"
                value={formData.restrictions.minGuests}
                onChange={(e) => handleRestrictionChange('minGuests', parseInt(e.target.value) || 1)}
              />
            </Grid>

            {/* הגדרות מתקדמות */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="עדיפות"
                type="number"
                value={formData.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
                helperText="0-10, ככל שהמספר גבוה יותר העדיפות גבוהה יותר"
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="מספר שימושים מקסימלי"
                type="number"
                value={formData.usageLimit.maxUses || ''}
                onChange={(e) => handleChange('usageLimit', { 
                  ...formData.usageLimit, 
                  maxUses: parseInt(e.target.value) || null 
                })}
                helperText="השארה ריק = ללא הגבלה"
              />
            </Grid>

            {/* מתגים */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.combinable}
                      onChange={(e) => handleChange('combinable', e.target.checked)}
                    />
                  }
                  label="ניתן לשילוב עם הנחות אחרות"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.restrictions.applicableForTourists}
                      onChange={(e) => handleRestrictionChange('applicableForTourists', e.target.checked)}
                    />
                  }
                  label="חל על תיירים"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.restrictions.applicableForIsraelis}
                      onChange={(e) => handleRestrictionChange('applicableForIsraelis', e.target.checked)}
                    />
                  }
                  label="חל על ישראלים"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleChange('isActive', e.target.checked)}
                    />
                  }
                  label="פעיל"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          ביטול
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {isEdit ? 'עדכון' : 'יצירה'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscountForm; 
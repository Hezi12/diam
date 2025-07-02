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
  Chip,
  Autocomplete,
  Alert,
  Divider,
  Slider,
  InputAdornment,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  LocalOffer as DiscountIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import axios from 'axios';

/**
 * טופס מתקדם ליצירה ועריכה של הנחות
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
    applicableRooms: [],
    applicableCategories: [],
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
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // קטגוריות חדרים
  const roomCategories = [
    'Simple',
    'Simple with Balcony',
    'Standard',
    'Standard with Balcony',
    'Family room'
  ];

  // ימי השבוע
  const daysOfWeek = [
    { value: 0, label: 'ראשון' },
    { value: 1, label: 'שני' },
    { value: 2, label: 'שלישי' },
    { value: 3, label: 'רביעי' },
    { value: 4, label: 'חמישי' },
    { value: 5, label: 'שישי' },
    { value: 6, label: 'שבת' }
  ];

  // טעינת חדרים
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('שגיאה בטעינת חדרים:', error);
    } finally {
      setLoading(false);
    }
  };

  // אפקט טעינה ראשונית
  useEffect(() => {
    if (open) {
      fetchRooms();
      
      // אם זה עריכה, נטען את הנתונים הקיימים
      if (isEdit && discount) {
        setFormData({
          name: discount.name || '',
          description: discount.description || '',
          discountType: discount.discountType || 'percentage',
          discountValue: discount.discountValue || 10,
          location: discount.location || 'both',
          applicableRooms: discount.applicableRooms || [],
          applicableCategories: discount.applicableCategories || [],
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

    // הגבלות לילות
    if (formData.restrictions.maxNights && 
        formData.restrictions.minNights > formData.restrictions.maxNights) {
      newErrors.maxNights = 'מספר לילות מקסימלי חייב להיות גדול מהמינימום';
    }

    // הגבלות אורחים
    if (formData.restrictions.maxGuests && 
        formData.restrictions.minGuests > formData.restrictions.maxGuests) {
      newErrors.maxGuests = 'מספר אורחים מקסימלי חייב להיות גדול מהמינימום';
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
      // ניקוי ערכים null ו-undefined
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
      applicableRooms: [],
      applicableCategories: [],
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

  // סינון חדרים לפי מיקום נבחר
  const getFilteredRooms = () => {
    if (formData.location === 'both') {
      return rooms;
    }
    return rooms.filter(room => room.location === formData.location);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="lg" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DiscountIcon color="primary" />
          {isEdit ? 'עריכת הנחה' : 'הנחה חדשה'}
        </DialogTitle>

        <DialogContent sx={{ overflow: 'auto' }}>
          <Box sx={{ mt: 2 }}>
            
            {/* פרטים בסיסיים */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" />
                  פרטים בסיסיים
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
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

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>מיקום</InputLabel>
                      <Select
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        label="מיקום"
                      >
                        <MenuItem value="airport">שדה התעופה</MenuItem>
                        <MenuItem value="rothschild">רוטשילד</MenuItem>
                        <MenuItem value="both">שני המיקומים</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="תיאור ההנחה"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>סוג הנחה</InputLabel>
                      <Select
                        value={formData.discountType}
                        onChange={(e) => handleChange('discountType', e.target.value)}
                        label="סוג הנחה"
                      >
                        <MenuItem value="percentage">אחוזים</MenuItem>
                        <MenuItem value="fixed_amount">סכום קבוע</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
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
                </Grid>
              </CardContent>
            </Card>

            {/* חדרים וקטגוריות */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  חדרים וקטגוריות
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      multiple
                      options={getFilteredRooms()}
                      getOptionLabel={(room) => `${room.roomNumber} - ${room.category}`}
                      value={formData.applicableRooms}
                      onChange={(e, newValue) => handleChange('applicableRooms', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="חדרים ספציפיים"
                          helperText="השארה ריק = כל החדרים"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            label={option.roomNumber}
                            {...getTagProps({ index })}
                            key={option._id}
                            size="small"
                          />
                        ))
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      multiple
                      options={roomCategories}
                      value={formData.applicableCategories}
                      onChange={(e, newValue) => handleChange('applicableCategories', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="קטגוריות חדרים"
                          helperText="השארה ריק = כל הקטגוריות"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            label={option}
                            {...getTagProps({ index })}
                            key={index}
                            size="small"
                          />
                        ))
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* תוקף ההנחה */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="primary" />
                  תוקף ההנחה
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>סוג תוקף</InputLabel>
                      <Select
                        value={formData.validityType}
                        onChange={(e) => handleChange('validityType', e.target.value)}
                        label="סוג תוקף"
                      >
                        <MenuItem value="unlimited">ללא הגבלת זמן</MenuItem>
                        <MenuItem value="date_range">טווח תאריכים</MenuItem>
                        <MenuItem value="last_minute">רגע אחרון</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* טווח תאריכים */}
                  {formData.validityType === 'date_range' && (
                    <>
                      <Grid item xs={12} md={6}>
                        <DatePicker
                          label="תאריך התחלה"
                          value={formData.validFrom}
                          onChange={(newValue) => handleChange('validFrom', newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              error={!!errors.validFrom}
                              helperText={errors.validFrom}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <DatePicker
                          label="תאריך סיום"
                          value={formData.validUntil}
                          onChange={(newValue) => handleChange('validUntil', newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              error={!!errors.validUntil}
                              helperText={errors.validUntil}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  {/* הגדרות רגע אחרון */}
                  {formData.validityType === 'last_minute' && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="ימים לפני הגעה"
                          type="number"
                          value={formData.lastMinuteSettings.daysBeforeArrival}
                          onChange={(e) => handleLastMinuteChange('daysBeforeArrival', parseInt(e.target.value) || 0)}
                          helperText="ההנחה תופעל כשמספר הימים עד ההגעה קטן או שווה למספר זה"
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.lastMinuteSettings.includeArrivalDay}
                              onChange={(e) => handleLastMinuteChange('includeArrivalDay', e.target.checked)}
                            />
                          }
                          label="כולל יום הגעה"
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* הגבלות */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon color="primary" />
                  הגבלות (אופציונלי)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="מספר לילות מינימלי"
                      type="number"
                      value={formData.restrictions.minNights}
                      onChange={(e) => handleRestrictionChange('minNights', parseInt(e.target.value) || 1)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="מספר לילות מקסימלי"
                      type="number"
                      value={formData.restrictions.maxNights || ''}
                      onChange={(e) => handleRestrictionChange('maxNights', parseInt(e.target.value) || null)}
                      helperText="השארה ריק = ללא הגבלה"
                      error={!!errors.maxNights}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="מספר אורחים מינימלי"
                      type="number"
                      value={formData.restrictions.minGuests}
                      onChange={(e) => handleRestrictionChange('minGuests', parseInt(e.target.value) || 1)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="מספר אורחים מקסימלי"
                      type="number"
                      value={formData.restrictions.maxGuests || ''}
                      onChange={(e) => handleRestrictionChange('maxGuests', parseInt(e.target.value) || null)}
                      helperText="השארה ריק = ללא הגבלה"
                      error={!!errors.maxGuests}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      ימים בשבוע (השארה ריק = כל הימים)
                    </Typography>
                    <Autocomplete
                      multiple
                      options={daysOfWeek}
                      getOptionLabel={(day) => day.label}
                      value={daysOfWeek.filter(day => formData.restrictions.validDaysOfWeek.includes(day.value))}
                      onChange={(e, newValue) => 
                        handleRestrictionChange('validDaysOfWeek', newValue.map(day => day.value))
                      }
                      renderInput={(params) => (
                        <TextField {...params} placeholder="כל הימים" />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            label={option.label}
                            {...getTagProps({ index })}
                            key={option.value}
                            size="small"
                          />
                        ))
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.restrictions.applicableForTourists}
                          onChange={(e) => handleRestrictionChange('applicableForTourists', e.target.checked)}
                        />
                      }
                      label="חל על תיירים"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.restrictions.applicableForIsraelis}
                          onChange={(e) => handleRestrictionChange('applicableForIsraelis', e.target.checked)}
                        />
                      }
                      label="חל על ישראלים"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* הגדרות מתקדמות */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon color="primary" />
                  הגדרות מתקדמות
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography gutterBottom>עדיפות ({formData.priority})</Typography>
                    <Slider
                      value={formData.priority}
                      onChange={(e, newValue) => handleChange('priority', newValue)}
                      min={0}
                      max={10}
                      marks={[
                        { value: 0, label: 'נמוכה' },
                        { value: 5, label: 'בינונית' },
                        { value: 10, label: 'גבוהה' }
                      ]}
                      step={1}
                      valueLabelDisplay="auto"
                    />
                    <FormHelperText>
                      הנחות עם עדיפות גבוהה יותר יותר יחושבו קודם
                    </FormHelperText>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="מספר שימושים מקסימלי"
                      type="number"
                      value={formData.usageLimit.maxUses || ''}
                      onChange={(e) => handleChange('usageLimit', { 
                        maxUses: parseInt(e.target.value) || null 
                      })}
                      helperText="השארה ריק = ללא הגבלה"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.combinable}
                            onChange={(e) => handleChange('combinable', e.target.checked)}
                          />
                        }
                        label="ניתן לשילוב"
                      />
                      <FormHelperText>
                        האם ניתן לשלב הנחה זו עם הנחות אחרות
                      </FormHelperText>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleChange('isActive', e.target.checked)}
                        />
                      }
                      label="הנחה פעילה"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* הזהרות ומידע */}
            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                יש שגיאות בטופס. אנא בדוק את השדות המסומנים באדום.
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {isEdit ? 'עדכון' : 'יצירה'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default DiscountForm; 
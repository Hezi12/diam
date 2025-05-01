import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Typography,
  Box,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Card,
  FormGroup,
  FormControlLabel,
  Switch,
  Grid,
  Checkbox,
  Dialog as ConfirmDialog,
  DialogTitle as ConfirmDialogTitle,
  DialogContent as ConfirmDialogContent,
  DialogActions as ConfirmDialogActions,
  Alert
} from '@mui/material';
import { 
  Close as CloseIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarTodayIcon,
  Hotel as HotelIcon,
  Info as InfoIcon,
  ErrorOutline as ErrorOutlineIcon,
  DateRange as DateRangeIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';
import { format, isValid } from 'date-fns';
import axios from 'axios';
import bookingService from '../../services/bookingService';

/**
 * רכיב דיאלוג חיפוש הזמנות
 */
const BookingSearchDialog = ({ 
  open, 
  onClose, 
  searchQuery, 
  onSearchChange, 
  location,
  isSearching = false,
  onBookingClick
}) => {
  const [localQuery, setLocalQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  // מצבים חדשים לחיפוש לפי טווח תאריכים
  const [showDateRangeSearch, setShowDateRangeSearch] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // מצבים חדשים למחיקה מרובה
  const [selectedBookings, setSelectedBookings] = useState({});
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isDeletingBookings, setIsDeletingBookings] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const colors = STYLE_CONSTANTS.colors;
  const locationColors = colors[location] || colors.airport;

  // עדכון ערך החיפוש המקומי כאשר הדיאלוג נפתח
  useEffect(() => {
    if (open) {
      setLocalQuery(searchQuery || '');
      setHasSearched(!!searchQuery);
      setSelectedBookings({});
      setDeleteError(null);
      setDeleteSuccess(false);
    }
  }, [open, searchQuery]);

  // ביצוע חיפוש לאחר שהמשתמש הקליד
  useEffect(() => {
    const searchBookings = async () => {
      if (!hasSearched) return;
      
      // אם אין מחרוזת חיפוש וגם לא חיפוש לפי תאריכים, אין טעם לחפש
      if (!localQuery.trim() && (!showDateRangeSearch || !startDate || !endDate)) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      
      try {
        // הכנת הפרמטרים לחיפוש
        const query = localQuery.trim() || null;
        const dateStartParam = showDateRangeSearch && startDate ? startDate : null;
        const dateEndParam = showDateRangeSearch && endDate ? endDate : null;
        
        console.log('מבצע חיפוש עם הפרמטרים:', {
          query,
          location,
          startDate: dateStartParam,
          endDate: dateEndParam,
          isDateSearch: showDateRangeSearch
        });
        
        // חיפוש הזמנות באמצעות השירות
        const results = await bookingService.searchBookings(
          query,
          location,
          dateStartParam,
          dateEndParam
        );
        
        console.log(`התקבלו ${results.length} תוצאות חיפוש`);
        setSearchResults(results);
        // איפוס בחירות קודמות כשמתקבלות תוצאות חדשות
        setSelectedBookings({});
      } catch (error) {
        console.error('שגיאה בחיפוש הזמנות:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchBookings();
  }, [localQuery, location, hasSearched, showDateRangeSearch, startDate, endDate]);

  // טיפול בשינוי טקסט החיפוש
  const handleInputChange = (e) => {
    setLocalQuery(e.target.value);
  };

  // טיפול בשינוי תאריך התחלה
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  // טיפול בשינוי תאריך סיום
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  // טיפול בשינוי מצב חיפוש לפי תאריכים
  const handleToggleDateRangeSearch = () => {
    setShowDateRangeSearch(!showDateRangeSearch);
  };

  // טיפול בשליחת החיפוש
  const handleSearch = () => {
    // בדיקת תקינות התאריכים אם חיפוש לפי תאריכים מופעל
    if (showDateRangeSearch) {
      const startDateObj = startDate ? new Date(startDate) : null;
      const endDateObj = endDate ? new Date(endDate) : null;
      
      if (!startDate || !endDate || !isValid(startDateObj) || !isValid(endDateObj)) {
        alert('יש להזין תאריך התחלה ותאריך סיום תקינים');
        return;
      }
      
      if (startDateObj > endDateObj) {
        alert('תאריך ההתחלה חייב להיות לפני תאריך הסיום');
        return;
      }
    }
    
    onSearchChange(localQuery);
    setHasSearched(true);
  };

  // טיפול בלחיצה על Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // טיפול בניקוי החיפוש
  const handleClear = () => {
    setLocalQuery('');
    setStartDate('');
    setEndDate('');
    onSearchChange('');
    setSearchResults([]);
    setHasSearched(false);
    setSelectedBookings({});
  };

  // טיפול בלחיצה על הזמנה
  const handleBookingClick = (bookingId) => {
    // סגירת חלון החיפוש ומעבר להזמנה הנבחרת
    onClose();
    
    // קריאה לפונקציה שמטפלת בפתיחת חלון עריכת הזמנה
    if (onBookingClick) {
      onBookingClick(bookingId);
    }
  };

  // טיפול בסימון/ביטול סימון של הזמנה
  const handleBookingSelect = (booking) => {
    setSelectedBookings(prev => {
      const newSelected = { ...prev };
      if (newSelected[booking._id]) {
        delete newSelected[booking._id];
      } else {
        newSelected[booking._id] = booking;
      }
      return newSelected;
    });
  };

  // טיפול בסימון/ביטול סימון של כל ההזמנות
  const handleSelectAll = () => {
    if (Object.keys(selectedBookings).length === searchResults.length) {
      // אם כל ההזמנות כבר מסומנות, בטל את הסימון
      setSelectedBookings({});
    } else {
      // אחרת, סמן את כל ההזמנות
      const newSelected = {};
      searchResults.forEach(booking => {
        newSelected[booking._id] = booking;
      });
      setSelectedBookings(newSelected);
    }
  };

  // טיפול בפתיחת דיאלוג אישור מחיקה
  const handleOpenDeleteConfirm = () => {
    setIsConfirmDialogOpen(true);
  };

  // טיפול בסגירת דיאלוג אישור מחיקה
  const handleCloseDeleteConfirm = () => {
    setIsConfirmDialogOpen(false);
  };

  // טיפול במחיקת ההזמנות שנבחרו
  const handleDeleteSelected = async () => {
    setIsDeletingBookings(true);
    setDeleteError(null);
    setDeleteSuccess(false);

    try {
      const bookingIds = Object.keys(selectedBookings);
      console.log(`מוחק ${bookingIds.length} הזמנות:`, bookingIds);

      // מחיקת כל ההזמנות שנבחרו
      const deletePromises = bookingIds.map(id => bookingService.deleteBooking(id));
      await Promise.all(deletePromises);

      // עדכון רשימת התוצאות - הסרת ההזמנות שנמחקו
      setSearchResults(prev => prev.filter(booking => !selectedBookings[booking._id]));
      setSelectedBookings({});
      setDeleteSuccess(true);
      
      // סגירת הדיאלוג לאחר מחיקה מוצלחת
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('שגיאה במחיקת הזמנות:', error);
      setDeleteError('אירעה שגיאה במחיקת ההזמנות. אנא נסה שנית.');
    } finally {
      setIsDeletingBookings(false);
    }
  };

  // רנדור פריט הזמנה ברשימת תוצאות החיפוש
  const renderBookingItem = (booking) => (
    <Card
      key={booking._id}
      sx={{
        mb: 2,
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Box sx={{ 
        p: 2,
        borderRight: `3px solid ${
          booking.status === 'confirmed' ? colors.accent.green :
          booking.status === 'pending' ? colors.accent.orange :
          booking.status === 'cancelled' ? colors.accent.red :
          locationColors.main
        }`,
        display: 'flex'
      }}>
        <Box sx={{ pl: 1, pr: 2 }}>
          <Checkbox
            checked={!!selectedBookings[booking._id]}
            onChange={() => handleBookingSelect(booking)}
            onClick={(e) => e.stopPropagation()}
            sx={{
              color: locationColors.main,
              '&.Mui-checked': {
                color: locationColors.main,
              }
            }}
          />
        </Box>
        
        <Box
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => handleBookingClick(booking._id)}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {booking.firstName} {booking.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {booking.room && booking.room.roomNumber ? `חדר ${booking.room.roomNumber}` : 'חדר לא מוגדר'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary', ml: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {format(new Date(booking.checkIn), 'dd/MM/yyyy')}
                {' - '}
                {format(new Date(booking.checkOut), 'dd/MM/yyyy')}
              </Typography>
            </Box>
            
            {booking.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', ml: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {booking.phone}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Card>
  );

  // חישוב מספר ההזמנות שנבחרו
  const selectedCount = Object.keys(selectedBookings).length;
  // האם כל ההזמנות נבחרו
  const isAllSelected = selectedCount > 0 && selectedCount === searchResults.length;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: locationColors.bgLight,
            p: 2,
            pb: 2
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 500, 
              color: locationColors.main,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <SearchIcon sx={{ marginLeft: 1, fontSize: '1.2rem' }} />
            חיפוש הזמנות
          </Typography>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={onClose} 
            aria-label="close"
            size="small"
            sx={{
              color: colors.text.secondary
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 3 }}>
          {deleteSuccess && (
            <Alert 
              severity="success" 
              sx={{ mb: 2 }}
              onClose={() => setDeleteSuccess(false)}
            >
              ההזמנות נמחקו בהצלחה
            </Alert>
          )}
          
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2
            }}
          >
            <Typography variant="body2" color="text.secondary">
              חפש הזמנות לפי שם אורח, מספר טלפון, אימייל, או מספר חדר
            </Typography>
            
            <TextField
              autoFocus
              fullWidth
              variant="outlined"
              placeholder="הקלד טקסט לחיפוש..."
              value={localQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: isLoading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} color="inherit" />
                  </InputAdornment>
                ) : localQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="נקה חיפוש"
                      onClick={handleClear}
                      edge="end"
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  direction: 'rtl'
                },
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                  direction: 'rtl',
                  caretColor: locationColors.main
                }
              }}
            />
            
            {/* הוספת חיפוש לפי טווח תאריכים */}
            <Box sx={{ mt: 1 }}>
              <FormGroup>
                <FormControlLabel 
                  control={
                    <Switch 
                      checked={showDateRangeSearch} 
                      onChange={handleToggleDateRangeSearch}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: locationColors.main,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                          }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: locationColors.main
                        }
                      }}
                    />
                  } 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DateRangeIcon sx={{ mr: 1, fontSize: '1rem' }} />
                      <Typography variant="body2">חיפוש לפי טווח תאריכים</Typography>
                    </Box>
                  }
                />
              </FormGroup>
              
              {showDateRangeSearch && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="מתאריך"
                        type="date"
                        variant="outlined"
                        value={startDate}
                        onChange={handleStartDateChange}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px'
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="עד תאריך"
                        type="date"
                        variant="outlined"
                        value={endDate}
                        onChange={handleEndDateChange}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Box>
          
          <Box 
            sx={{ 
              mt: 2,
              textAlign: 'right',
              color: colors.text.secondary
            }}
          >
            <Typography variant="caption">
              * ניתן לחפש מספר מילות מפתח בו-זמנית, מופרדות ברווח
            </Typography>
          </Box>

          {/* אזור תוצאות החיפוש */}
          {hasSearched && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={30} sx={{ color: locationColors.main }} />
                </Box>
              ) : searchResults.length > 0 ? (
                <Box>
                  <Box sx={{ 
                    mb: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                      נמצאו {searchResults.length} תוצאות
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {selectedCount > 0 && (
                        <Button
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={handleOpenDeleteConfirm}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          מחק ({selectedCount})
                        </Button>
                      )}
                      
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isAllSelected}
                            indeterminate={selectedCount > 0 && selectedCount < searchResults.length}
                            onChange={handleSelectAll}
                            sx={{
                              color: locationColors.main,
                              '&.Mui-checked': {
                                color: locationColors.main,
                              },
                              '&.MuiCheckbox-indeterminate': {
                                color: locationColors.main,
                              }
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2">
                            בחר הכל
                          </Typography>
                        }
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ maxHeight: '300px', overflow: 'auto', pr: 1 }}>
                    {searchResults.map(booking => renderBookingItem(booking))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  py: 4, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  color: colors.text.secondary
                }}>
                  <ErrorOutlineIcon sx={{ fontSize: 40, mb: 1, color: colors.text.secondary }} />
                  <Typography>לא נמצאו תוצאות תואמות לחיפוש</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <Divider />
        
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            onClick={handleClear}
            sx={{ 
              color: colors.text.secondary,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            נקה
          </Button>
          <Box>
            <Button 
              onClick={onClose}
              sx={{ 
                color: colors.text.secondary,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500,
                mr: 1
              }}
            >
              ביטול
            </Button>
            <Button 
              onClick={handleSearch}
              variant="contained"
              sx={{ 
                bgcolor: locationColors.main,
                '&:hover': {
                  bgcolor: locationColors.main,
                  filter: 'brightness(0.9)'
                },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: 'none'
              }}
              disabled={isLoading}
            >
              חפש
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* דיאלוג אישור מחיקה */}
      <ConfirmDialog
        open={isConfirmDialogOpen}
        onClose={handleCloseDeleteConfirm}
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <ConfirmDialogTitle 
          sx={{ 
            backgroundColor: colors.accent.red,
            color: 'white',
            p: 2
          }}
        >
          אישור מחיקת הזמנות
        </ConfirmDialogTitle>
        
        <ConfirmDialogContent sx={{ p: 3, pt: 3 }}>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          
          <Typography>
            האם אתה בטוח שברצונך למחוק {selectedCount} הזמנות?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1, fontWeight: 500 }}>
            שים לב: פעולה זו אינה ניתנת לביטול!
          </Typography>
        </ConfirmDialogContent>
        
        <ConfirmDialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={handleCloseDeleteConfirm}
            sx={{ 
              color: colors.text.secondary,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleDeleteSelected}
            variant="contained"
            color="error"
            disabled={isDeletingBookings}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: 'none'
            }}
            startIcon={isDeletingBookings ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {isDeletingBookings ? 'מוחק...' : 'מחק הזמנות'}
          </Button>
        </ConfirmDialogActions>
      </ConfirmDialog>
    </>
  );
};

export default BookingSearchDialog; 
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Button,
  Collapse,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  LocalOffer as DiscountIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  MonetizationOn as MoneyIcon,
  TrendingDown as SavingsIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import DiscountService from '../../services/discountService';

/**
 * קלקולטור מחירים מתקדם עם תמיכה בהנחות
 */
const PriceCalculatorWithDiscounts = ({
  room,
  checkIn,
  checkOut,
  guests = 1,
  isTourist = false,
  location,
  onPriceCalculated,
  showDiscountDetails = true,
  showDiscountBadges = false,
  allowDiscountSelection = false
}) => {
  
  // State נתונים
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [priceData, setPriceData] = useState(null);
  const [applicableDiscounts, setApplicableDiscounts] = useState([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [showDiscounts, setShowDiscounts] = useState(false);
  const [discountDetailsOpen, setDiscountDetailsOpen] = useState(false);
  
  // חישוב מספר הלילות
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return differenceInDays(new Date(checkOut), new Date(checkIn));
  }, [checkIn, checkOut]);

  // חישוב מחיר בסיסי
  const calculateBasePrice = useMemo(() => {
    if (!room || !nights) return 0;
    
    return DiscountService.calculateBasePrice({
      room,
      checkIn,
      checkOut,
      nights,
      guests,
      isTourist
    });
  }, [room, checkIn, checkOut, nights, guests, isTourist]);

  // טעינת הנחות ישימות
  const loadApplicableDiscounts = async () => {
    if (!room || !checkIn || !checkOut || nights <= 0) {
      console.log('🚫 PriceCalculatorWithDiscounts: לא נטענו הנחות - חסרים פרמטרים:', { room: !!room, checkIn, checkOut, nights });
      setApplicableDiscounts([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('🔍 PriceCalculatorWithDiscounts: מחפש הנחות ישימות:', {
        location,
        roomId: room._id,
        roomCategory: room.category,
        checkIn,
        checkOut,
        nights,
        guests,
        isTourist
      });

      const discounts = await DiscountService.getApplicableDiscounts({
        location,
        roomId: room._id,
        roomCategory: room.category,
        checkIn,
        checkOut,
        nights,
        guests,
        isTourist
      });

      console.log('✅ PriceCalculatorWithDiscounts: נמצאו הנחות ישימות:', discounts);

      setApplicableDiscounts(discounts);
      
      // בחירה אוטומטית של ההנחה הטובה ביותר אם לא מותר לבחור ידנית
      if (!allowDiscountSelection && discounts.length > 0) {
        console.log('🎯 PriceCalculatorWithDiscounts: נבחרה הנחה אוטומטית:', discounts[0]);
        setSelectedDiscounts([discounts[0]._id]);
      }

    } catch (err) {
      console.error('❌ PriceCalculatorWithDiscounts: שגיאה בטעינת הנחות:', err);
      setError('שגיאה בטעינת הנחות זמינות');
    } finally {
      setLoading(false);
    }
  };

  // חישוב מחיר סופי עם הנחות
  const calculateFinalPrice = async () => {
    if (!room || !checkIn || !checkOut || nights <= 0) {
      console.log('🚫 calculateFinalPrice: מגדיר מחיר 0 - חסרים פרמטרים');
      setPriceData({
        originalPrice: 0,
        totalDiscount: 0,
        finalPrice: 0,
        appliedDiscounts: [],
        savings: 0,
        savingsPercentage: 0
      });
      return;
    }

    try {
      const originalPrice = calculateBasePrice;
      console.log('💰 calculateFinalPrice: מחיר מקורי מחושב:', originalPrice);
      
      if (selectedDiscounts.length === 0) {
        console.log('⚪ calculateFinalPrice: אין הנחות נבחרות, מחזיר מחיר מקורי');
        const priceResult = {
          originalPrice,
          totalDiscount: 0,
          finalPrice: originalPrice,
          appliedDiscounts: [],
          savings: 0,
          savingsPercentage: 0
        };
        setPriceData(priceResult);
        onPriceCalculated?.(priceResult);
        return;
      }

      console.log('🎯 calculateFinalPrice: מחשב מחיר עם הנחות:', selectedDiscounts);

      const priceResult = await DiscountService.calculatePriceWithDiscounts({
        originalPrice,
        location,
        roomId: room._id,
        roomCategory: room.category,
        checkIn,
        checkOut,
        nights,
        guests,
        isTourist,
        selectedDiscountIds: selectedDiscounts
      });

      console.log('✅ calculateFinalPrice: תוצאת חישוב עם הנחות:', priceResult);

      setPriceData(priceResult);
      onPriceCalculated?.(priceResult);

    } catch (err) {
      console.error('❌ calculateFinalPrice: שגיאה בחישוב מחיר:', err);
      setError('שגיאה בחישוב המחיר הסופי');
    }
  };

  // אפקטים
  useEffect(() => {
    loadApplicableDiscounts();
  }, [room?._id, checkIn, checkOut, nights, guests, isTourist, location]);

  useEffect(() => {
    calculateFinalPrice();
  }, [selectedDiscounts, room?._id, checkIn, checkOut, nights, guests, isTourist]);

  // פונקציות טיפול באירועים
  const handleDiscountToggle = (discountId) => {
    if (!allowDiscountSelection) return;
    
    setSelectedDiscounts(prev => {
      const discount = applicableDiscounts.find(d => d._id === discountId);
      
      if (prev.includes(discountId)) {
        // הסרת ההנחה
        return prev.filter(id => id !== discountId);
      } else {
        // הוספת ההנחה
        if (discount && !discount.combinable) {
          // הנחה לא ניתנת לשילוב - מחליפה את כל ההנחות
          return [discountId];
        } else {
          // הנחה ניתנת לשילוב
          return [...prev, discountId];
        }
      }
    });
  };

  const handleRefreshDiscounts = () => {
    loadApplicableDiscounts();
  };

  // רינדור הנחות זמינות
  const renderAvailableDiscounts = () => {
    if (applicableDiscounts.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            אין הנחות זמינות להזמנה זו
          </Typography>
        </Box>
      );
    }

    return (
      <List dense>
        {applicableDiscounts.map((discount) => (
          <ListItem key={discount._id} sx={{ px: 0 }}>
            <ListItemIcon>
              <DiscountIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {discount.name}
                  </Typography>
                  <Chip
                    label={discount.discountType === 'percentage' ? 
                      `${discount.discountValue}%` : 
                      `₪${discount.discountValue}`
                    }
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Box>
                  {discount.description && (
                    <Typography variant="caption" color="text.secondary">
                      {discount.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    {discount.validityType === 'last_minute' && (
                      <Chip
                        icon={<ScheduleIcon />}
                        label="רגע אחרון"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                    {discount.restrictions && (
                      <Chip
                        icon={<SecurityIcon />}
                        label="הגבלות"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              }
            />
            {allowDiscountSelection && (
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedDiscounts.includes(discount._id)}
                    onChange={() => handleDiscountToggle(discount._id)}
                    color="primary"
                  />
                }
                label=""
                sx={{ ml: 1 }}
              />
            )}
          </ListItem>
        ))}
      </List>
    );
  };

  // רינדור פירוט הנחות מיושמות
  const renderAppliedDiscounts = () => {
    if (!priceData?.appliedDiscounts?.length) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'success.main' }}>
          הנחות שחושבו:
        </Typography>
        <List dense>
          {priceData.appliedDiscounts.map((discount, index) => (
            <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <DiscountIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={discount.name}
                secondary={`${discount.type === 'percentage' ? `${discount.value}%` : `₪${discount.value}`} → חיסכון: ₪${discount.amount}`}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  if (!room || !checkIn || !checkOut) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          בחר חדר ותאריכים לחישוב מחיר
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* חלק מחיר ראשי */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon color="primary" />
            חישוב מחיר
          </Typography>
          
          {applicableDiscounts.length > 0 && (
            <Tooltip title="רענון הנחות">
              <IconButton size="small" onClick={handleRefreshDiscounts} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* פירוט בסיסי */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {`${nights} לילות • ${guests} ${guests === 1 ? 'אורח' : 'אורחים'} • ${isTourist ? 'תייר' : 'ישראלי'}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(checkIn), 'dd/MM/yyyy', { locale: he })} - {format(new Date(checkOut), 'dd/MM/yyyy', { locale: he })}
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {priceData && !loading && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">מחיר מקורי:</Typography>
              <Typography variant="body2">₪{priceData.originalPrice}</Typography>
            </Box>

            {priceData.totalDiscount > 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="success.main">הנחה:</Typography>
                  <Typography variant="body2" color="success.main">-₪{priceData.totalDiscount}</Typography>
                </Box>

                <Divider sx={{ my: 1 }} />
              </>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">מחיר סופי:</Typography>
              <Typography variant="h6" color="primary.main">₪{priceData.finalPrice}</Typography>
            </Box>

            {priceData.savings > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SavingsIcon color="success" />
                <Typography variant="body2" color="success.main">
                  חיסכון של ₪{priceData.savings} ({priceData.savingsPercentage}%)
                </Typography>
                {showDiscountBadges && (
                  <Chip
                    label="הנחה פעילה!"
                    color="success"
                    size="small"
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
            )}

            {renderAppliedDiscounts()}
          </Box>
        )}
      </Paper>

      {/* הנחות זמינות */}
      {showDiscountDetails && applicableDiscounts.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DiscountIcon color="primary" />
              הנחות זמינות ({applicableDiscounts.length})
            </Typography>
            
            <IconButton 
              size="small" 
              onClick={() => setShowDiscounts(!showDiscounts)}
            >
              {showDiscounts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showDiscounts}>
            <Box sx={{ mt: 2 }}>
              {renderAvailableDiscounts()}
              
              {allowDiscountSelection && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    * ניתן לבחור הנחות ידנית או לתת למערכת לבחור את הטובה ביותר
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* דיאלוג פרטי הנחה */}
      <Dialog open={discountDetailsOpen} onClose={() => setDiscountDetailsOpen(false)}>
        <DialogTitle>פרטי הנחה</DialogTitle>
        <DialogContent>
          <Typography>פרטים מפורטים על ההנחה...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountDetailsOpen(false)}>סגירה</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PriceCalculatorWithDiscounts; 
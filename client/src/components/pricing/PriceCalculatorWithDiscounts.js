import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  DialogActions,
  Badge
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
  Refresh as RefreshIcon,
  CardGiftcard as CouponIcon
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import DiscountService from '../../services/discountService';
import { usePublicTranslation } from '../../contexts/PublicLanguageContext';

/**
 * קלקולטור מחירים מתקדם עם תמיכה בהנחות וקופונים
 */
const PriceCalculatorWithDiscounts = React.memo(({
  room,
  checkIn,
  checkOut,
  guests = 1,
  isTourist = false,
  location,
  couponCode = '', // פרמטר חדש לקופון
  onPriceCalculated,
  showDiscountDetails = true,
  showDiscountBadges = false,
  allowDiscountSelection = false,
  nights,
  compact = false,
  style = {}
}) => {
  const t = usePublicTranslation();
  
  // State נתונים
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [priceData, setPriceData] = useState(null);
  const [applicableDiscounts, setApplicableDiscounts] = useState([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [showDiscounts, setShowDiscounts] = useState(false);
  const [discountDetailsOpen, setDiscountDetailsOpen] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(null); // מידע על הנחת קופון
  const [couponError, setCouponError] = useState('');
  
  // חישוב מספר הלילות עם useMemo להימנעות מחישוב מיותר
  const calculatedNights = useMemo(() => {
    if (nights) return nights; // אם nights מועבר כ-prop
    if (!checkIn || !checkOut) return 0;
    return differenceInDays(new Date(checkOut), new Date(checkIn));
  }, [checkIn, checkOut, nights]);

  // ערכים פרימיטיביים למניעת rerenders
  const roomId = room?._id;
  const roomCategory = room?.category;
  const checkInStr = checkIn?.toString();
  const checkOutStr = checkOut?.toString();
  const normalizedCouponCode = couponCode?.trim().toUpperCase();

  // חישוב מחיר בסיסי - פונקציה פשוטה ללא dependencies
  const calculateBasePrice = useCallback((params = {}) => {
    const roomToUse = params.room || room;
    const nightsToUse = params.nights || calculatedNights;
    const checkInToUse = params.checkIn || checkIn;
    const checkOutToUse = params.checkOut || checkOut;
    const guestsToUse = params.guests || guests;
    const isTouristToUse = params.isTourist || isTourist;
    
    if (!roomToUse || !nightsToUse) return 0;
    
    return DiscountService.calculateBasePrice({
      room: roomToUse,
      checkIn: checkInToUse,
      checkOut: checkOutToUse,
      nights: nightsToUse,
      guests: guestsToUse,
      isTourist: isTouristToUse
    });
  }, [room, calculatedNights, checkIn, checkOut, guests, isTourist]);

  // פונקציה עזר לטיפול בקופונים
  const processCouponDiscounts = useCallback(async (couponCode) => {
    try {
      const couponDiscounts = await DiscountService.getApplicableDiscountsWithCoupon({
        location,
        roomId,
        roomCategory,
        checkIn,
        checkOut,
        nights: calculatedNights,
        guests,
        isTourist
      }, couponCode);

      if (couponDiscounts.length > 0) {
        console.log('✅ נמצאו הנחות עם קופון:', couponDiscounts);
        setApplicableDiscounts(couponDiscounts);
        
        // מציאת הנחת הקופון
        const couponDiscount = couponDiscounts.find(d => d.couponRequired);
        if (couponDiscount) {
          setCouponDiscount(couponDiscount);
        }
        
        // בחירה אוטומטית של הנחות לשילוב
        const selectedIds = selectDiscountsForCombination(couponDiscounts);
        setSelectedDiscounts(selectedIds);
        
        console.log('✅ נבחרו הנחות לשילוב:', selectedIds);
        return { success: true };
      } else {
        setCouponError('הקופון לא תקף להזמנה זו או שפג תוקפו');
        return { success: false };
      }
    } catch (error) {
      console.error('❌ שגיאה בחיפוש קופון:', error);
      setCouponError('שגיאה בבדיקת הקופון');
      return { success: false };
    }
  }, [location, roomId, roomCategory, checkIn, checkOut, calculatedNights, guests, isTourist]);

  // פונקציה עזר לבחירת הנחות לשילוב
  const selectDiscountsForCombination = useCallback((discounts) => {
    const selectedIds = [];
    
    // בחירת הנחת קופון
    const couponDiscount = discounts.find(d => d.couponRequired);
    if (couponDiscount) {
      selectedIds.push(couponDiscount._id);
    }
    
    // בחירת הנחות רגילות שניתן לשלב
    const combinableRegularDiscounts = discounts.filter(d => 
      !d.couponRequired && d.combinable
    );
    
    if (combinableRegularDiscounts.length > 0) {
      // בחירת ההנחה הטובה ביותר
      selectedIds.push(combinableRegularDiscounts[0]._id);
    }
    
    return selectedIds;
  }, []);

  // טעינת הנחות ישימות - עם תמיכה בקופונים
  const loadApplicableDiscounts = useCallback(async () => {
    if (!roomId || !checkInStr || !checkOutStr || calculatedNights <= 0) {
      console.log('🚫 PriceCalculatorWithDiscounts: לא נטענו הנחות - חסרים פרמטרים:', { room: !!roomId, checkIn: checkInStr, checkOut: checkOutStr, nights: calculatedNights });
      setApplicableDiscounts([]);
      setCouponDiscount(null);
      setCouponError('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setCouponError('');

      console.log('🔍 PriceCalculatorWithDiscounts: מחפש הנחות ישימות:', {
        location,
        roomId,
        roomCategory,
        checkIn,
        checkOut,
        nights: calculatedNights,
        guests,
        isTourist,
        couponCode: normalizedCouponCode
      });

      // אם יש קופון, נחפש הנחות ספציפיות לקופון
      if (normalizedCouponCode) {
        const couponResult = await processCouponDiscounts(normalizedCouponCode);
        if (couponResult.success) {
          return;
        }
      }

      // חיפוש הנחות רגילות אם אין קופון או הקופון לא תקף
      const discounts = await DiscountService.getApplicableDiscounts({
        location,
        roomId,
        roomCategory,
        checkIn,
        checkOut,
        nights: calculatedNights,
        guests,
        isTourist
      });

      console.log('✅ PriceCalculatorWithDiscounts: נמצאו הנחות רגילות:', discounts);

      setApplicableDiscounts(discounts);
      setCouponDiscount(null);
      
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
  }, [roomId, checkInStr, checkOutStr, calculatedNights, guests, isTourist, location, allowDiscountSelection, roomCategory, normalizedCouponCode]);

  // חישוב מחיר סופי עם הנחות - עם תמיכה בקופונים
  const calculateFinalPrice = useCallback(async () => {
    if (!roomId || !checkInStr || !checkOutStr || calculatedNights <= 0) {
      console.log('🚫 calculateFinalPrice: מגדיר מחיר 0 - חסרים פרמטרים');
      const priceResult = {
        originalPrice: 0,
        totalDiscount: 0,
        finalPrice: 0,
        appliedDiscounts: [],
        savings: 0,
        savingsPercentage: 0
      };
      setPriceData(priceResult);
      onPriceCalculated?.(priceResult);
      return;
    }

    try {
      // חישוב מחיר בסיסי באמצעות הפונקציה המקומית
      const originalPrice = calculateBasePrice();
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

      // חישוב מחיר עם הנחות - עם קופון אם קיים
      const priceResult = await DiscountService.calculatePriceWithDiscounts({
        originalPrice,
        location,
        roomId,
        roomCategory,
        checkIn,
        checkOut,
        nights: calculatedNights,
        guests,
        isTourist,
        selectedDiscountIds: selectedDiscounts
      }, normalizedCouponCode);

      console.log('✅ calculateFinalPrice: תוצאת חישוב עם הנחות:', priceResult);

      setPriceData(priceResult);
      onPriceCalculated?.(priceResult);

    } catch (err) {
      console.error('❌ calculateFinalPrice: שגיאה בחישוב מחיר:', err);
      setError('שגיאה בחישוב המחיר הסופי');
    }
  }, [selectedDiscounts, roomId, checkInStr, checkOutStr, calculatedNights, guests, isTourist, location, roomCategory, calculateBasePrice, onPriceCalculated, normalizedCouponCode]);

  // אפקט לטעינת הנחות - רק כשהפרמטרים העיקריים משתנים
  useEffect(() => {
    loadApplicableDiscounts();
  }, [loadApplicableDiscounts]);

  // אפקט נפרד לחישוב מחיר כשההנחות הנבחרות משתנות
  useEffect(() => {
    calculateFinalPrice();
  }, [calculateFinalPrice]);

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

  // רינדור מידע על קופון
  const renderCouponInfo = () => {
    if (!normalizedCouponCode) return null;

    return (
      <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: couponError ? 'error.main' : couponDiscount ? 'success.main' : 'primary.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CouponIcon sx={{ color: couponError ? 'error.main' : couponDiscount ? 'success.main' : 'primary.main' }} />
          <Typography variant="subtitle2">
            קופון: {normalizedCouponCode}
          </Typography>
        </Box>
        
        {couponError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {couponError}
          </Alert>
        )}
        
        {couponDiscount && (
          <Alert severity="success" sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>{couponDiscount.name}</strong> - {couponDiscount.discountType === 'percentage' ? `${couponDiscount.discountValue}%` : `${couponDiscount.discountValue}₪`} הנחה
            </Typography>
            {couponDiscount.description && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {couponDiscount.description}
              </Typography>
            )}
          </Alert>
        )}
      </Paper>
    );
  };

  // רינדור הנחות זמינות
  const renderAvailableDiscounts = () => {
    if (applicableDiscounts.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {normalizedCouponCode ? 'לא נמצאו הנחות זמינות עם הקופון' : 'אין הנחות זמינות להזמנה זו'}
          </Typography>
        </Box>
      );
    }

    return (
      <List dense>
        {applicableDiscounts.map((discount) => (
          <ListItem key={discount._id} sx={{ px: 0 }}>
            <ListItemIcon>
              <Badge 
                badgeContent={discount.couponRequired ? '🎫' : null}
                color="primary"
                sx={{ 
                  '& .MuiBadge-badge': { 
                    fontSize: '0.6rem',
                    backgroundColor: 'transparent',
                    color: 'inherit'
                  }
                }}
              >
                <DiscountIcon color="primary" />
              </Badge>
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
                    color={discount.couponRequired ? 'success' : 'primary'}
                    variant="outlined"
                  />
                  {discount.couponRequired && (
                    <Chip
                      label={`קופון: ${discount.couponCode}`}
                      size="small"
                      color="success"
                      variant="filled"
                      sx={{ fontFamily: 'monospace' }}
                    />
                  )}
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
                <Badge 
                  badgeContent={discount.couponCode ? '🎫' : null}
                  color="success"
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.5rem',
                      backgroundColor: 'transparent',
                      color: 'inherit'
                    }
                  }}
                >
                  <DiscountIcon color="success" fontSize="small" />
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{discount.name}</Typography>
                    {discount.couponCode && (
                      <Chip
                        label={discount.couponCode}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
                secondary={`${discount.type === 'percentage' ? `${discount.value}%` : `₪${discount.value}`} → ${t('common.savings')}${discount.amount}`}
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
      {/* מידע על קופון */}
      {renderCouponInfo()}

      {/* חלק מחיר ראשי */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon color="primary" />
            חישוב מחיר
            {normalizedCouponCode && (
              <Badge badgeContent="🎫" color="primary">
                <Box />
              </Badge>
            )}
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
            {`${calculatedNights} לילות • ${guests} ${guests === 1 ? 'אורח' : 'אורחים'} • ${isTourist ? 'תייר' : 'ישראלי'}`}
            {normalizedCouponCode && (
              <Typography component="span" sx={{ ml: 1, color: 'success.main', fontWeight: 'medium' }}>
                • קופון: {normalizedCouponCode}
              </Typography>
            )}
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
                  <Typography variant="body2" color="success.main">
                    הנחה{normalizedCouponCode ? ' (קופון)' : ''}:
                  </Typography>
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
                  {t('common.savingsOf')}{priceData.savings} ({priceData.savingsPercentage}%)
                </Typography>
                {showDiscountBadges && (
                  <Chip
                    label={normalizedCouponCode ? 'קופון פעיל!' : 'הנחה פעילה!'}
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
      {showDiscountDetails && (applicableDiscounts.length > 0 || normalizedCouponCode) && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DiscountIcon color="primary" />
              {normalizedCouponCode ? 'הנחת קופון' : `הנחות זמינות (${applicableDiscounts.length})`}
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
});

export default PriceCalculatorWithDiscounts; 
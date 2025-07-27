import { useFilter } from '../contexts/FilterContext';

/**
 * Hook פשוט שמחזיר className להסתרה/הצגה מיידית
 * גישה מינימליסטית - רק CSS classes
 */
export const useFilterCSS = () => {
  const { isFilterActive, shouldHideBooking, shouldHidePaymentMethod } = useFilter();

  /**
   * מחזיר className מתאים לאלמנט הזמנה
   */
  const getBookingClassName = (booking) => {
    if (!booking) return 'filter-show';
    return shouldHideBooking(booking) ? 'filter-hide' : 'filter-show';
  };

  /**
   * מחזיר className מתאים לאלמנט הזמנה (flex)
   */
  const getBookingClassNameFlex = (booking) => {
    if (!booking) return 'filter-show-flex';
    return shouldHideBooking(booking) ? 'filter-hide' : 'filter-show-flex';
  };

  /**
   * מחזיר className מתאים לשיטת תשלום
   */
  const getPaymentMethodClassName = (paymentMethod) => {
    return shouldHidePaymentMethod(paymentMethod) ? 'filter-hide' : 'filter-show';
  };

  /**
   * בדיקה פשוטה אם להציג אלמנט
   */
  const shouldShow = (booking) => {
    return !shouldHideBooking(booking);
  };

  return {
    isFilterActive,
    getBookingClassName,
    getBookingClassNameFlex,
    getPaymentMethodClassName,
    shouldShow
  };
};

export default useFilterCSS;

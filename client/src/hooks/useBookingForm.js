import { useState, useMemo } from 'react';
import { addDays, differenceInDays } from 'date-fns';

/**
 * Default initial form data for a new booking.
 */
const getDefaultFormData = () => ({
  // Guest details
  firstName: '',
  lastName: '',
  phone: '',
  email: '',

  // Booking details
  room: '',
  checkIn: new Date(),
  checkOut: addDays(new Date(), 1),
  nights: 1,
  isTourist: false,
  guests: 2,
  code: '',

  // Pricing
  price: 0,
  pricePerNight: 0,
  pricePerNightNoVat: 0,

  // Payment
  paymentStatus: 'unpaid',
  paymentAmount: 0,
  discount: 0,
  creditCard: {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  },

  // Additional details
  source: 'direct',
  externalBookingNumber: '',
  notes: '',
  reviewHandled: false,
  passportImageHandled: false,
});

/**
 * Custom hook for managing common booking form state and logic.
 *
 * Encapsulates:
 *  - Form state (firstName, lastName, phone, email, dates, nights, guests, price, notes, etc.)
 *  - Date / nights calculation helpers
 *  - Generic field change handler
 *  - Tourist status toggle
 *  - Form validation
 *
 * @param {Object} initialData - Optional initial values to merge with defaults.
 * @returns {Object} Form state, setters, and helper functions.
 */
const useBookingForm = (initialData = {}) => {
  // ---- state ----------------------------------------------------------------

  const [formData, setFormData] = useState(() => ({
    ...getDefaultFormData(),
    ...initialData,
  }));

  const [errors, setErrors] = useState({});

  // ---- date / nights helpers ------------------------------------------------

  /**
   * Calculate the number of nights between two dates using UTC days.
   * Always returns at least 1.
   *
   * @param {Date|string} checkIn
   * @param {Date|string} checkOut
   * @returns {number}
   */
  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 1;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diff = differenceInDays(end, start);
    return Math.max(1, diff);
  };

  /**
   * Generic field change handler – works with standard input onChange events.
   *
   * @param {Event} e
   */
  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  /**
   * Handle check-in date change.
   * If the new check-in is on or after the current check-out the check-out
   * is pushed to one day after the new check-in (nights = 1). Otherwise the
   * nights are recalculated from the existing check-out.
   *
   * @param {Date} date
   */
  const handleCheckInChange = (date) => {
    const newCheckIn = new Date(date);
    newCheckIn.setHours(0, 0, 0, 0);

    setFormData((prev) => {
      let newCheckOut = prev.checkOut;
      let newNights = prev.nights;

      if (newCheckIn >= prev.checkOut) {
        // Check-in moved past check-out – reset to 1 night.
        newCheckOut = addDays(newCheckIn, 1);
        newNights = 1;
      } else {
        const checkOutDate = new Date(prev.checkOut);
        checkOutDate.setHours(0, 0, 0, 0);
        newNights = Math.max(1, differenceInDays(checkOutDate, newCheckIn));
      }

      return {
        ...prev,
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        nights: newNights,
      };
    });
  };

  /**
   * Handle check-out date change.
   * If the chosen date is on or before check-in the check-out is set to one
   * day after check-in (nights = 1). Otherwise nights are recalculated.
   *
   * @param {Date} date
   */
  const handleCheckOutChange = (date) => {
    const newCheckOut = new Date(date);
    newCheckOut.setHours(0, 0, 0, 0);

    setFormData((prev) => {
      const checkInDate = new Date(prev.checkIn);
      checkInDate.setHours(0, 0, 0, 0);

      const daysDiff = differenceInDays(newCheckOut, checkInDate);

      if (daysDiff <= 0) {
        // Check-out is not after check-in – force 1 night.
        return {
          ...prev,
          checkOut: addDays(checkInDate, 1),
          nights: 1,
        };
      }

      return {
        ...prev,
        checkOut: newCheckOut,
        nights: Math.max(1, daysDiff),
      };
    });
  };

  /**
   * Handle a change in the "nights" text field.
   * Recalculates check-out based on check-in + nights.
   *
   * @param {Event} e
   */
  const handleNightsChange = (e) => {
    const nights = parseInt(e.target.value, 10) || 0;

    if (nights <= 0) {
      setErrors((prev) => ({ ...prev, nights: 'Number of nights must be greater than 0' }));
      return;
    }

    setFormData((prev) => {
      const checkInDate = new Date(prev.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      const newCheckOut = addDays(checkInDate, nights);

      return {
        ...prev,
        nights,
        checkOut: newCheckOut,
      };
    });

    // Clear any previous nights error.
    setErrors((prev) => ({ ...prev, nights: undefined }));
  };

  /**
   * Toggle the tourist (isTourist) flag on the form.
   *
   * @param {Event} e – a checkbox / switch onChange event.
   */
  const handleTouristToggle = (e) => {
    const isTourist = e.target.checked;

    setFormData((prev) => ({
      ...prev,
      isTourist,
    }));
  };

  // ---- validation -----------------------------------------------------------

  /**
   * Validate required booking fields.
   * Sets errors state and returns true when the form is valid.
   *
   * @returns {boolean}
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.room) newErrors.room = 'Room is required';
    if (!formData.checkIn) newErrors.checkIn = 'Check-in date is required';
    if (!formData.checkOut) newErrors.checkOut = 'Check-out date is required';

    // Email format (only if provided).
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Check-out must be after check-in.
    if (formData.checkIn && formData.checkOut && formData.checkIn >= formData.checkOut) {
      newErrors.checkOut = 'Check-out must be after check-in';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---- derived state --------------------------------------------------------

  /**
   * Derived boolean – true when the current formData passes validation
   * without side-effects (errors state is NOT updated).
   */
  const isValid = useMemo(() => {
    if (!formData.firstName) return false;
    if (!formData.room) return false;
    if (!formData.checkIn) return false;
    if (!formData.checkOut) return false;
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) return false;
    if (formData.checkIn && formData.checkOut && formData.checkIn >= formData.checkOut) return false;
    return true;
  }, [formData.firstName, formData.room, formData.checkIn, formData.checkOut, formData.email]);

  // ---- public API -----------------------------------------------------------

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    calculateNights,
    handleFieldChange,
    handleCheckInChange,
    handleCheckOutChange,
    handleNightsChange,
    handleTouristToggle,
    validateForm,
    isValid,
  };
};

export default useBookingForm;

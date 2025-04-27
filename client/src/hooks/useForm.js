import { useState, useCallback } from 'react';

/**
 * הוק מותאם לניהול מצב והתנהגות טפסים
 * 
 * @param {Object} initialValues - ערכים התחלתיים של השדות בטופס
 * @param {Function} [onSubmit] - פונקציה שתופעל בשליחת הטופס
 * @param {Function} [validateForm] - פונקציה לבדיקת תקינות הטופס
 * @returns {Object} אובייקט עם מצב הטופס ופונקציות ניהול
 */
const useForm = (initialValues, onSubmit, validateForm) => {
  const [values, setValues] = useState(initialValues || {});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * טיפול בשינוי ערך בשדה
   * @param {Event} e - אירוע השינוי
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    // טיפול בשדות מסוג checkbox
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValues((prevValues) => ({
      ...prevValues,
      [name]: fieldValue,
    }));
    
    // סימון השדה כנגוע
    setTouched((prevTouched) => ({
      ...prevTouched,
      [name]: true,
    }));
  }, []);

  /**
   * טיפול בשינוי ערך ידני
   * @param {string} name - שם השדה
   * @param {any} value - הערך החדש
   */
  const setFieldValue = useCallback((name, value) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    
    // סימון השדה כנגוע
    setTouched((prevTouched) => ({
      ...prevTouched,
      [name]: true,
    }));
  }, []);

  /**
   * הגדרת שגיאה ידנית
   * @param {string} name - שם השדה
   * @param {string} errorMessage - הודעת השגיאה
   */
  const setFieldError = useCallback((name, errorMessage) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: errorMessage,
    }));
  }, []);

  /**
   * איפוס הטופס לערכים ההתחלתיים
   */
  const resetForm = useCallback(() => {
    setValues(initialValues || {});
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * בדיקת תקינות הטופס
   * @returns {boolean} האם הטופס תקין
   */
  const validate = useCallback(() => {
    if (typeof validateForm !== 'function') {
      return true;
    }

    const newErrors = validateForm(values);
    setErrors(newErrors || {});
    
    // הטופס תקין אם אין שגיאות
    return Object.keys(newErrors || {}).length === 0;
  }, [values, validateForm]);

  /**
   * טיפול בשליחת הטופס
   * @param {Event} e - אירוע השליחה
   */
  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      
      // סימון כל השדות כנגועים
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // בדיקת תקינות
      const isValid = validate();
      
      if (isValid && typeof onSubmit === 'function') {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, onSubmit, validate]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    validate,
  };
};

export default useForm; 
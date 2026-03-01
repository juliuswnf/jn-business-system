import { useState } from 'react';

const validators = {
  required: (value, fieldName) => value?.trim() ? null : `${fieldName} is required`,
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email address',
  minLength: (min) => (value) => value?.length >= min ? null : `Minimum ${min} characters required`,
  maxLength: (max) => (value) => value?.length <= max ? null : `Maximum ${max} characters allowed`,
  number: (value) => !isNaN(value) && value !== '' ? null : 'Must be a number',
  phone: (value) => /^[+]?[\d\s\-()]{10,}$/.test(value?.replace(/\s/g, '')) ? null : 'Invalid phone number',
  url: (value) => /^https?:\/\/.+/.test(value) ? null : 'Invalid URL',
  matches: (pattern) => (value) => pattern.test(value) ? null : 'Invalid format',
  custom: (fn) => fn
};

export const useFormValidation = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationRules, setValidationRules] = useState({});

  const validate = (field = null) => {
    const fieldsToValidate = field ? { [field]: validationRules[field] } : validationRules;
    const newErrors = {};

    Object.keys(fieldsToValidate).forEach((fieldName) => {
      const rules = fieldsToValidate[fieldName];
      const value = values[fieldName];

      for (const rule of rules) {
        let error = null;
        if (typeof rule === 'function') {
          error = rule(value);
        } else if (typeof rule === 'object') {
          const { type, ...config } = rule;
          const validator = validators[type];
          if (validator) {
            error = config.value ? validator(config.value)(value) : validator(value, config.fieldName);
          }
        }

        if (error) {
          newErrors[fieldName] = error;
          break;
        }
      }
    });

    if (field) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
    } else {
      setErrors(newErrors);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: fieldValue
    }));

    if (touched[name]) {
      validate(name);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));
    validate(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const setFieldValue = (name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const setFieldError = (name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  };

  const setRules = (rules) => {
    setValidationRules(rules);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setRules,
    validate,
    reset: () => {
      setValues(initialValues);
      setErrors({});
      setTouched({});
    }
  };
};

export default useFormValidation;

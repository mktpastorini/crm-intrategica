
import { useState, useCallback } from 'react';

export function usePhoneMask() {
  const formatPhone = useCallback((value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Apply Brazilian phone mask
    if (cleaned.length <= 10) {
      // Fixed phone: (11) 1234-5678
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Mobile phone: (11) 91234-5678
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  }, []);

  const handlePhoneChange = useCallback((
    value: string, 
    onChange: (value: string) => void
  ) => {
    const formatted = formatPhone(value);
    onChange(formatted);
  }, [formatPhone]);

  return { formatPhone, handlePhoneChange };
}

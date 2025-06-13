
export const inputValidation = {
  // Sanitize HTML input to prevent XSS
  sanitizeHtml: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // Validate email format
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number (Brazilian format)
  validatePhone: (phone: string): boolean => {
    const phoneRegex = /^(?:\+55|55)?(?:\(?\d{2}\)?)?\s?9?\d{4}[-\s]?\d{4}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  },

  // Validate URL format
  validateUrl: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },

  // Validate webhook URL specifically
  validateWebhookUrl: (url: string): boolean => {
    if (!url) return true; // Allow empty URLs
    
    if (!inputValidation.validateUrl(url)) return false;
    
    // Additional webhook-specific validations
    const urlObj = new URL(url);
    
    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
      ) {
        return false;
      }
    }
    
    return true;
  },

  // Validate WhatsApp number format
  validateWhatsAppNumber: (number: string): boolean => {
    if (!number) return true; // Allow empty numbers
    const cleanNumber = number.replace(/\D/g, '');
    // Should be 13 digits (55 + 11 digits) or 11 digits for Brazilian numbers
    return cleanNumber.length === 11 || cleanNumber.length === 13;
  },

  // General string length validation
  validateLength: (input: string, min: number, max: number): boolean => {
    return input.length >= min && input.length <= max;
  },

  // Validate required fields
  validateRequired: (value: any): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  }
};

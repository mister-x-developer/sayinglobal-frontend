/**
 * Validation utilities for SAYIN GLOBAL
 */

/**
 * Validate phone number (Uzbekistan format)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+998[0-9]{9}$/
  return phoneRegex.test(phone)
}

/**
 * Validate verification code (5 digits)
 */
export function validateCode(code: string): boolean {
  const codeRegex = /^[0-9]{5}$/
  return codeRegex.test(code)
}

/**
 * Validate price
 */
export function validatePrice(price: number): boolean {
  return price > 0 && price < 1000000000000
}

/**
 * Validate image file
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, WEBP image formats are accepted' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must not exceed 5MB' }
  }
  
  return { valid: true }
}

/**
 * Validate text length
 */
export function validateLength(text: string, min: number, max: number): boolean {
  return text.length >= min && text.length <= max
}

/**
 * Sanitize HTML (basic)
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Password validation utility with comprehensive security checks
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

// Common weak passwords and dictionary words to block
const COMMON_PASSWORDS = new Set([
  'password', 'Password', 'PASSWORD', 'password123', 'Password123',
  'qwerty', 'QWERTY', 'Qwerty123', 'qwerty123',
  'admin', 'Admin', 'ADMIN', 'admin123', 'Admin123',
  'letmein', 'welcome', 'Welcome', 'Welcome123',
  '123456', '12345678', '123456789', '1234567890',
  'abc123', 'Abc123', 'ABC123',
  'monkey', 'dragon', 'master', 'sunshine',
  'princess', 'password1', 'trustno1', 'starwars',
  'iloveyou', 'Iloveyou', 'baseball', 'football',
  'superman', 'batman', 'michael', 'shadow'
]);

// Common dictionary words to check against
const DICTIONARY_WORDS = new Set([
  'hello', 'world', 'computer', 'internet', 'security',
  'summer', 'winter', 'spring', 'autumn', 'coffee',
  'secret', 'access', 'system', 'public', 'private'
]);

/**
 * Validates password against security best practices
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strengthScore = 0;

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    strengthScore += 1;
    if (password.length >= 12) strengthScore += 1;
    if (password.length >= 16) strengthScore += 1;
  }

  // Maximum length check (prevent DoS attacks via bcrypt)
  if (password.length > 72) {
    errors.push('Password must not exceed 72 characters');
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    strengthScore += 1;
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    strengthScore += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    strengthScore += 1;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>?/)');
  } else {
    strengthScore += 1;
  }

  // Check for common passwords
  const passwordLower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(password) || COMMON_PASSWORDS.has(passwordLower)) {
    errors.push('Password is too common. Please choose a more unique password');
    strengthScore = 0;
  }

  // Check for dictionary words (case-insensitive)
  for (const word of DICTIONARY_WORDS) {
    if (passwordLower.includes(word)) {
      errors.push(`Password contains a common word ("${word}"). Please use a less predictable password`);
      strengthScore = Math.max(0, strengthScore - 2);
      break;
    }
  }

  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    errors.push('Password contains sequential characters. Please avoid patterns like "abc" or "123"');
    strengthScore = Math.max(0, strengthScore - 1);
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password contains too many repeated characters');
    strengthScore = Math.max(0, strengthScore - 1);
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (strengthScore >= 6) {
    strength = 'strong';
  } else if (strengthScore >= 4) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Checks if password contains easily recognizable patterns
 */
export function containsEasyPatterns(password: string): boolean {
  const patterns = [
    /qwerty/i,
    /asdfgh/i,
    /zxcvbn/i,
    /12345/,
    /password/i,
    /admin/i,
    /user/i,
    /login/i,
    /welcome/i
  ];

  return patterns.some(pattern => pattern.test(password));
}

/**
 * Generate password strength indicator text
 */
export function getPasswordStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'Weak - Your password needs improvement';
    case 'medium':
      return 'Medium - Your password is acceptable but could be stronger';
    case 'strong':
      return 'Strong - Your password meets all security requirements';
  }
}

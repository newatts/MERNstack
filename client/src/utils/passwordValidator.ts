/**
 * Client-side password validation utility
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    noCommon: boolean;
    noSequential: boolean;
  };
}

const COMMON_PASSWORDS = new Set([
  'password', 'Password', 'PASSWORD', 'password123', 'Password123',
  'qwerty', 'QWERTY', 'Qwerty123', 'qwerty123',
  'admin', 'Admin', 'ADMIN', 'admin123', 'Admin123',
  'letmein', 'welcome', 'Welcome', 'Welcome123',
  '123456', '12345678', '123456789', '1234567890',
  'abc123', 'Abc123', 'ABC123'
]);

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strengthScore = 0;

  // Check criteria
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommon: !COMMON_PASSWORDS.has(password) && !COMMON_PASSWORDS.has(password.toLowerCase()),
    noSequential: !/(?:abc|bcd|cde|012|123|234|345|456|567|678|789)/i.test(password)
  };

  // Generate errors and calculate strength
  if (!checks.length) {
    errors.push('Must be at least 8 characters long');
  } else {
    strengthScore += 1;
    if (password.length >= 12) strengthScore += 1;
  }

  if (!checks.uppercase) {
    errors.push('Must contain at least one uppercase letter (A-Z)');
  } else {
    strengthScore += 1;
  }

  if (!checks.lowercase) {
    errors.push('Must contain at least one lowercase letter (a-z)');
  } else {
    strengthScore += 1;
  }

  if (!checks.number) {
    errors.push('Must contain at least one number (0-9)');
  } else {
    strengthScore += 1;
  }

  if (!checks.special) {
    errors.push('Must contain at least one special character (!@#$%^&*...)');
  } else {
    strengthScore += 1;
  }

  if (!checks.noCommon) {
    errors.push('Password is too common - choose something more unique');
    strengthScore = 0;
  }

  if (!checks.noSequential) {
    errors.push('Avoid sequential characters (abc, 123, etc.)');
    strengthScore = Math.max(0, strengthScore - 1);
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Avoid too many repeated characters');
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
    strength,
    checks
  };
}

export function getStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-600';
    case 'medium':
      return 'text-yellow-600';
    case 'strong':
      return 'text-green-600';
  }
}

export function getStrengthBgColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-600';
    case 'medium':
      return 'bg-yellow-600';
    case 'strong':
      return 'bg-green-600';
  }
}

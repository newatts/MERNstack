import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { toast } from 'react-hot-toast';
import { validatePassword, getStrengthColor, getStrengthBgColor } from '@/utils/passwordValidator';
import { useCaptcha } from '@/hooks/useCaptcha';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<ReturnType<typeof validatePassword> | null>(null);
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  const navigate = useNavigate();
  const { config: captchaConfig, executeRecaptcha, loading: captchaLoading } = useCaptcha();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate password in real-time
    if (name === 'password') {
      setPasswordValidation(validatePassword(value));
      setShowPasswordHints(value.length > 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      toast.error('Please fix password requirements before continuing');
      setShowPasswordHints(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Execute reCAPTCHA if enabled
      let captchaToken: string | undefined;
      if (captchaConfig?.enabled && captchaConfig?.onSignup) {
        captchaToken = (await executeRecaptcha('signup')) || undefined;
        if (!captchaToken) {
          toast.error('Failed to verify captcha. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      await authService.signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        captchaToken
      });

      toast.success('Account created! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: any) {
      console.error('Signup failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input"
                  placeholder="John"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
              />

              {/* Password Strength Indicator */}
              {showPasswordHints && passwordValidation && (
                <div className="mt-2 space-y-2">
                  {/* Strength Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthBgColor(passwordValidation.strength)}`}
                        style={{
                          width: passwordValidation.strength === 'weak' ? '33%' :
                                 passwordValidation.strength === 'medium' ? '66%' : '100%'
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getStrengthColor(passwordValidation.strength)}`}>
                      {passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}
                    </span>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="text-xs space-y-1">
                    <div className={passwordValidation.checks.length ? 'text-green-600' : 'text-gray-500'}>
                      {passwordValidation.checks.length ? '✓' : '○'} At least 8 characters
                    </div>
                    <div className={passwordValidation.checks.uppercase ? 'text-green-600' : 'text-gray-500'}>
                      {passwordValidation.checks.uppercase ? '✓' : '○'} One uppercase letter
                    </div>
                    <div className={passwordValidation.checks.lowercase ? 'text-green-600' : 'text-gray-500'}>
                      {passwordValidation.checks.lowercase ? '✓' : '○'} One lowercase letter
                    </div>
                    <div className={passwordValidation.checks.number ? 'text-green-600' : 'text-gray-500'}>
                      {passwordValidation.checks.number ? '✓' : '○'} One number
                    </div>
                    <div className={passwordValidation.checks.special ? 'text-green-600' : 'text-gray-500'}>
                      {passwordValidation.checks.special ? '✓' : '○'} One special character (!@#$%...)
                    </div>
                    <div className={passwordValidation.checks.noCommon ? 'text-green-600' : 'text-red-500'}>
                      {passwordValidation.checks.noCommon ? '✓' : '✗'} Not a common password
                    </div>
                    <div className={passwordValidation.checks.noSequential ? 'text-green-600' : 'text-red-500'}>
                      {passwordValidation.checks.noSequential ? '✓' : '✗'} No sequential patterns
                    </div>
                  </div>

                  {/* Error Messages */}
                  {!passwordValidation.isValid && passwordValidation.errors.length > 0 && (
                    <div className="text-xs text-red-600 mt-2">
                      {passwordValidation.errors[0]}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || captchaLoading}
              className="w-full btn btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          {/* reCAPTCHA notice */}
          {captchaConfig?.enabled && captchaConfig?.onSignup && (
            <div className="text-xs text-gray-500 text-center">
              This site is protected by reCAPTCHA and the Google{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                Terms of Service
              </a>{' '}
              apply.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface CaptchaConfig {
  enabled: boolean;
  onSignup: boolean;
  onLogin: boolean;
  siteKey: string | null;
}

interface UseCaptchaReturn {
  config: CaptchaConfig | null;
  loading: boolean;
  executeRecaptcha: (action: string) => Promise<string | null>;
  isRecaptchaLoaded: boolean;
}

declare global {
  interface Window {
    grecaptcha: any;
  }
}

let scriptLoaded = false;
let scriptLoading = false;
const scriptLoadCallbacks: ((loaded: boolean) => void)[] = [];

/**
 * Load reCAPTCHA v3 script dynamically
 */
function loadRecaptchaScript(siteKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    // If already loaded, resolve immediately
    if (scriptLoaded && window.grecaptcha) {
      resolve(true);
      return;
    }

    // If currently loading, add to callback queue
    if (scriptLoading) {
      scriptLoadCallbacks.push(resolve);
      return;
    }

    scriptLoading = true;

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src^="https://www.google.com/recaptcha/api.js"]'
    );

    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for grecaptcha to be ready
      const checkReady = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          clearInterval(checkReady);
          window.grecaptcha.ready(() => {
            scriptLoaded = true;
            scriptLoading = false;
            resolve(true);
            // Call all queued callbacks
            scriptLoadCallbacks.forEach((cb) => cb(true));
            scriptLoadCallbacks.length = 0;
          });
        }
      }, 100);
    };

    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
      scriptLoading = false;
      resolve(false);
      scriptLoadCallbacks.forEach((cb) => cb(false));
      scriptLoadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
}

/**
 * Hook for managing reCAPTCHA integration
 */
export function useCaptcha(): UseCaptchaReturn {
  const [config, setConfig] = useState<CaptchaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);

  // Fetch captcha configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get('/admin/settings/captcha-config');
        const captchaConfig = response.data as CaptchaConfig;
        setConfig(captchaConfig);

        // Load reCAPTCHA script if enabled and siteKey is available
        if (captchaConfig.enabled && captchaConfig.siteKey) {
          const loaded = await loadRecaptchaScript(captchaConfig.siteKey);
          setIsRecaptchaLoaded(loaded);
        }
      } catch (error) {
        console.error('Failed to fetch captcha config:', error);
        setConfig({
          enabled: false,
          onSignup: false,
          onLogin: false,
          siteKey: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  /**
   * Execute reCAPTCHA and get token
   */
  const executeRecaptcha = async (action: string): Promise<string | null> => {
    if (!config?.enabled || !config.siteKey || !isRecaptchaLoaded) {
      return null;
    }

    try {
      if (!window.grecaptcha) {
        console.error('reCAPTCHA not loaded');
        return null;
      }

      const token = await window.grecaptcha.execute(config.siteKey, { action });
      return token;
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      return null;
    }
  };

  return {
    config,
    loading,
    executeRecaptcha,
    isRecaptchaLoaded
  };
}

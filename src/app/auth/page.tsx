'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const returnUrl = searchParams.get('returnUrl');
  const ingredientsParam = searchParams.get('ingredients');

  // Store pending ingredients in sessionStorage before auth
  useEffect(() => {
    if (ingredientsParam) {
      sessionStorage.setItem('pendingIngredients', ingredientsParam);
    }
  }, [ingredientsParam]);

  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (mode === 'signup') {
      if (username.length < 3 || username.length > 20) {
        newErrors.username = 'Username must be 3-20 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        newErrors.username = 'Only letters, numbers, and underscores';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setLoading(true);

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });
      if (signUpError) {
        setErrors({ general: signUpError.message });
        setLoading(false);
        return;
      }

      // Auto sign-in immediately (bypass email verification)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setErrors({ general: signInError.message });
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .upsert({ id: user.id, username, avatar_url: null });
      }

      setSuccessMessage('Account created! Welcome to Test Kitchen OS 🎉');
      setTimeout(() => {
        router.push(returnUrl || '/');
        router.refresh();
      }, 1200);
      return;
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrors({ general: error.message });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push(returnUrl || '/');
    router.refresh();
  }

  if (successMessage) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <p className="text-xl font-semibold text-foreground">{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1
            className="text-2xl font-bold text-foreground mb-1"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            Welcome to Test Kitchen OS
          </h1>
        </div>

        <div className="bg-cream-100 rounded-2xl shadow-sm border border-cream-300/50 p-8">
          {/* Pill tabs */}
          <div className="flex bg-cream-200 rounded-full p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-warm-gray hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-warm-gray hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta text-[16px]"
                  placeholder="chefname"
                  required
                />
                {errors.username && (
                  <p className="text-red-600 text-xs mt-1">{errors.username}</p>
                )}
                <p className="text-warm-gray text-xs mt-1">3-20 characters, letters, numbers, underscores</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                placeholder="you@example.com"
                required
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                placeholder="••••••••"
                required
              />
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password}</p>
              )}
              <p className="text-warm-gray text-xs mt-1">Minimum 8 characters</p>
            </div>

            {errors.general && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {errors.general}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta text-white px-4 py-3 rounded-xl font-semibold hover:bg-terracotta-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px] text-[16px]"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-warm-gray mt-6">
            {mode === 'signin' ? (
              <>
                New here?{' '}
                <button
                  onClick={() => { setMode('signup'); setErrors({}); }}
                  className="text-terracotta font-medium hover:underline"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('signin'); setErrors({}); }}
                  className="text-terracotta font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

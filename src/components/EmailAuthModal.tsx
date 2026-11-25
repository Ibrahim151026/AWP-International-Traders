import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { CheckCircle2, Eye, EyeOff, Lock, Mail, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, isAdminEmail } from '../lib/firebase';

interface EmailAuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onAuthenticated: (email: string | null, emailVerified: boolean) => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

function mapFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  const msg = err instanceof Error ? err.message : String(err);

  if (code.includes('operation-not-allowed') || msg.includes('OPERATION_NOT_ALLOWED')) {
    return 'Email/Password sign-in is not enabled yet in Firebase Console. Open Firebase Console -> Authentication -> Sign-in method -> Email/Password and enable it.';
  }
  if (
    code.includes('invalid-credential') ||
    code.includes('wrong-password') ||
    code.includes('user-not-found')
  ) {
    return 'Invalid email or password. If you have not registered this email yet, switch to the Sign Up tab to create your account first.';
  }
  if (code.includes('email-already-in-use')) {
    return 'An account with this email already exists. Please sign in with your password.';
  }
  if (code.includes('weak-password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  return msg || 'Authentication failed. Please try again.';
}

export function EmailAuthModal({
  isOpen,
  initialMode = 'signin',
  onClose,
  onAuthenticated,
}: EmailAuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setInfoMsg('');
      setPendingVerification(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, cleanEmail);
        setInfoMsg(`Password reset instructions sent to ${cleanEmail}.`);
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }

      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (fullName.trim()) {
          await updateProfile(cred.user, { displayName: fullName.trim() });
        }
        await sendEmailVerification(cred.user);
        setPendingVerification(true);
        setInfoMsg(
          `Account created for ${cleanEmail}. A verification email has been sent—click the link in your inbox, then click "I've Verified — Continue".`
        );
        onAuthenticated(cred.user.email, cred.user.emailVerified);
        return;
      }

      // mode === 'signin'
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      if (!cred.user.emailVerified) {
        setPendingVerification(true);
        setInfoMsg(
          `Signed in as ${cleanEmail}, but your email is not verified yet. Please click the verification link in your inbox (or resend below).`
        );
        onAuthenticated(cred.user.email, false);
        return;
      }

      onAuthenticated(cred.user.email, true);
      onClose();
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setErrorMsg('');
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setInfoMsg(`Verification email re-sent to ${auth.currentUser.email}.`);
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    setErrorMsg('');
    setLoading(true);
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      if (auth.currentUser.emailVerified) {
        setPendingVerification(false);
        onAuthenticated(auth.currentUser.email, true);
        onClose();
      } else {
        setErrorMsg('Email is not verified yet. Please click the verification link sent to your inbox first.');
      }
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-auth-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="email-auth-title" className="font-display text-base font-bold text-slate-900">
              {mode === 'signin'
                ? 'Log In with Email & Password'
                : mode === 'signup'
                  ? 'Sign Up with Email & Password'
                  : 'Reset Account Password'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Clients &amp; website owner sign in exclusively with email and password. Already have an account? Log in below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="inline-flex w-full p-1 bg-slate-100 rounded-lg mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setInfoMsg('');
                setPendingVerification(false);
              }}
              className={`flex-1 py-2 rounded-md transition-colors cursor-pointer ${
                mode === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setInfoMsg('');
                setPendingVerification(false);
              }}
              className={`flex-1 py-2 rounded-md transition-colors cursor-pointer ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {pendingVerification ? (
            <div className="space-y-4">
              {infoMsg && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-950 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  {errorMsg}
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCheckVerification}
                  className="w-full py-2.5 px-4 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Checking...' : "I've Verified — Continue"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResendVerification}
                  className="w-full py-2 px-4 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Resend Verification Email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company or Full Name
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. AWP International Traders"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                {isAdminEmail(email.trim()) && (
                  <p className="mt-1 text-[11px] font-medium text-blue-700">
                    Recognized as primary website owner email.
                  </p>
                )}
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('reset');
                          setErrorMsg('');
                          setInfoMsg('');
                        }}
                        className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 leading-relaxed">
                  {errorMsg}
                </div>
              )}

              {infoMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  {infoMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Log In'
                    : mode === 'signup'
                      ? 'Sign Up & Verify Email'
                      : 'Send Password Reset Link'}
              </button>

              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Back to Sign In
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

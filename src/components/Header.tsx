import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { TranslationBundle } from '../i18n/translations';

export type ActiveView = 'storefront' | 'portal' | 'admin';

interface HeaderProps {
  t: TranslationBundle;
  activeView: ActiveView;
  isSignedIn: boolean;
  isAdmin: boolean;
  onNavigateSection: (sectionId: string) => void;
  onChangeView: (view: ActiveView) => void;
  onSignIn: (mode?: 'signin' | 'signup', source?: 'header' | 'portal' | 'order') => void;
  onSignOut: () => void;
}

export function Header({
  t,
  activeView,
  isSignedIn,
  isAdmin,
  onNavigateSection,
  onChangeView,
  onSignIn,
  onSignOut,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileOpen(false);
    if (activeView !== 'storefront') {
      onChangeView('storefront');
      setTimeout(() => onNavigateSection(sectionId), 60);
    } else {
      onNavigateSection(sectionId);
    }
  };

  const handlePrimaryAction = () => {
    setMobileOpen(false);
    if (!isSignedIn) {
      onSignIn('signin', 'header');
      return;
    }
    if (activeView === 'storefront') {
      onChangeView(isAdmin ? 'admin' : 'portal');
    } else {
      onSignOut();
    }
  };

  const primaryLabel = !isSignedIn
    ? t.nav.signIn
    : activeView === 'storefront'
      ? isAdmin
        ? t.nav.dashboard
        : t.nav.portal
      : t.nav.signOut;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onChangeView('storefront')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          {t.brandName}
        </button>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => handleNavClick('catalog')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.catalog}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNavClick('upload-product')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.nav.upload}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleNavClick('tracking')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.tracking}
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('inquiry')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.inquiry}
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              if (!isSignedIn) {
                onSignIn('signin', 'portal');
              } else {
                onChangeView('portal');
              }
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'portal' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            {t.nav.portal}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onChangeView('admin');
              }}
              className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'admin' ? 'text-slate-900 font-semibold underline' : ''
              }`}
            >
              {t.nav.dashboard}
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="hidden md:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-6 py-4 space-y-3">
          <button
            type="button"
            onClick={() => handleNavClick('catalog')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700"
          >
            {t.nav.catalog}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNavClick('upload-product')}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700"
            >
              {t.nav.upload}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleNavClick('tracking')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700"
          >
            {t.nav.tracking}
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('inquiry')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700"
          >
            {t.nav.inquiry}
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              if (!isSignedIn) onSignIn('signin', 'portal');
              else onChangeView('portal');
            }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700"
          >
            {t.nav.portal}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onChangeView('admin');
              }}
              className="block w-full text-left py-2 text-sm font-semibold text-blue-700"
            >
              {t.nav.dashboard}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 rounded-lg text-center"
          >
            {primaryLabel}
          </button>
        </div>
      )}
    </header>
  );
}

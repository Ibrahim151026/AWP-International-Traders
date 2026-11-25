import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Globe2, Search, Ship, Trash2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HERO_IMAGE_URL, INITIAL_SHIPMENTS } from '../data/seedData';
import { LANGUAGE_LABELS, type TranslationBundle } from '../i18n/translations';
import { db } from '../lib/firebase';
import type {
  BuyingHouseContent,
  ClientAccount,
  Incoterm,
  LanguageCode,
  Product,
  ShipmentStage,
  ShipmentTracking,
} from '../types';
import { getProductImages, INCOTERMS_OPTIONS, sanitizeId } from '../utils/exportReports';
import { ProductModal } from './ProductModal';
import { ProductUploadSection } from './ProductUploadSection';
import { SafeImage } from './SafeImage';

function CatalogCardGallery({
  product,
  onOpenDetail,
}: {
  product: Product;
  onOpenDetail: () => void;
}) {
  const images = getProductImages(product);
  const [idx, setIdx] = useState(0);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);
  const safeIdx = idx < images.length ? idx : 0;

  return (
    <div className="border-b border-slate-200 bg-slate-100">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden select-none cursor-pointer"
        onClick={() => {
          if (didSwipeRef.current) {
            didSwipeRef.current = false;
            return;
          }
          onOpenDetail();
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
          didSwipeRef.current = false;
        }}
        onTouchEnd={(e) => {
          if (!swipeStartRef.current || images.length <= 1) return;
          const touch = e.changedTouches[0];
          const dx = touch.clientX - swipeStartRef.current.x;
          const dy = touch.clientY - swipeStartRef.current.y;
          swipeStartRef.current = null;
          if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
            didSwipeRef.current = true;
            setIdx((prev) =>
              dx < 0 ? (prev + 1) % images.length : (prev - 1 + images.length) % images.length
            );
          }
        }}
      >
        <SafeImage
          src={images[safeIdx] || ''}
          alt={product.name}
          fallbackLabel={product.name}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label={`Previous photo of ${product.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setIdx((prev) => (prev - 1 + images.length) % images.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900 touch-manipulation cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={`Next photo of ${product.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setIdx((prev) => (prev + 1) % images.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900 touch-manipulation cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[11px] font-mono tabular-nums">
              {safeIdx + 1} / {images.length}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="px-2.5 py-2 bg-white border-t border-slate-200 grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {images.map((url, thumbIdx) => (
            <button
              key={`${thumbIdx}-${url.slice(0, 18)}`}
              type="button"
              onClick={() => setIdx(thumbIdx)}
              aria-label={`View photo ${thumbIdx + 1} of ${product.name}`}
              className={`aspect-[4/3] rounded overflow-hidden border touch-manipulation cursor-pointer ${
                thumbIdx === safeIdx
                  ? 'border-blue-700 ring-2 ring-blue-700/25'
                  : 'border-slate-200 opacity-75 hover:opacity-100'
              }`}
            >
              <SafeImage src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SHIPMENT_STAGE_ORDER: ShipmentStage[] = [
  'order_confirmed',
  'customs_cleared',
  'vessel_loaded',
  'ocean_transit',
  'port_arrival',
  'customs_released',
  'delivered',
];

interface StorefrontViewProps {
  t: TranslationBundle;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  products: Product[];
  buyingHouseContent: BuyingHouseContent;
  whatsappNumber: string;
  isSignedIn: boolean;
  isAdmin: boolean;
  clientProfile: ClientAccount | null;
  prefilledTrackingId?: string;
  onSignIn: (mode?: 'signin' | 'signup', source?: 'header' | 'portal' | 'order') => void;
  onOpenAdminPanel?: () => void;
  onEditBuyingHouseContent?: () => void;
  onPublishProduct: (product: Product, isNew: boolean) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onPlaceOrder: (payload: {
    product: Product;
    quantity: number;
    incoterms: Incoterm;
    destinationPort: string;
    notes: string;
  }) => Promise<void>;
  onSubmitInquiry: (payload: {
    companyName: string;
    contactName: string;
    email: string;
    country: string;
    destinationPort: string;
    productInterest: string;
    estimatedVolume: string;
    incoterms: Incoterm;
    message: string;
  }) => Promise<void>;
}

export function StorefrontView({
  t,
  language,
  onChangeLanguage,
  products,
  buyingHouseContent,
  whatsappNumber,
  isSignedIn,
  isAdmin,
  clientProfile,
  prefilledTrackingId,
  onSignIn,
  onOpenAdminPanel,
  onEditBuyingHouseContent,
  onPublishProduct,
  onDeleteProduct,
  onPlaceOrder,
  onSubmitInquiry,
}: StorefrontViewProps) {
  // Catalog filters & AI autocorrect state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmDeleteCardId, setConfirmDeleteCardId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiCorrection, setAiCorrection] = useState<{
    originalQuery: string;
    correctedQuery: string;
    hasTypo: boolean;
    matchedProductIds: string[];
    reason: string;
  } | null>(null);

  // Shipment Tracker state
  const [trackingInput, setTrackingInput] = useState(prefilledTrackingId || 'MRD-2026-8841');
  const [activeTrackingQuery, setActiveTrackingQuery] = useState(prefilledTrackingId || 'MRD-2026-8841');
  const [liveShipment, setLiveShipment] = useState<ShipmentTracking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Inquiry Form state
  const [inqCompany, setInqCompany] = useState(clientProfile?.companyName || '');
  const [inqContact, setInqContact] = useState(clientProfile?.contactName || '');
  const [inqEmail, setInqEmail] = useState(clientProfile?.email || '');
  const [inqCountry, setInqCountry] = useState(clientProfile?.country || '');
  const [inqPort, setInqPort] = useState(clientProfile?.destinationPort || '');
  const [inqProduct, setInqProduct] = useState('');
  const [inqVolume, setInqVolume] = useState('');
  const [inqIncoterms, setInqIncoterms] = useState<Incoterm>(clientProfile?.preferredIncoterms || 'FOB');
  const [inqMessage, setInqMessage] = useState('');
  const [inqSubmitting, setInqSubmitting] = useState(false);
  const [inqSuccess, setInqSuccess] = useState(false);
  const [inqError, setInqError] = useState('');

  useEffect(() => {
    if (prefilledTrackingId) {
      setTrackingInput(prefilledTrackingId);
      setActiveTrackingQuery(prefilledTrackingId);
    }
  }, [prefilledTrackingId]);

  useEffect(() => {
    if (clientProfile) {
      if (!inqCompany) setInqCompany(clientProfile.companyName);
      if (!inqContact) setInqContact(clientProfile.contactName);
      if (!inqEmail) setInqEmail(clientProfile.email);
      if (!inqCountry) setInqCountry(clientProfile.country);
      if (!inqPort) setInqPort(clientProfile.destinationPort);
    }
  }, [clientProfile]);

  // Real-time Firestore shipment subscription
  useEffect(() => {
    const cleanId = sanitizeId(activeTrackingQuery.toUpperCase());
    if (!cleanId) {
      setLiveShipment(null);
      return;
    }

    setTrackingLoading(true);
    const ref = doc(db, 'shipments', cleanId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setLiveShipment(snap.data() as ShipmentTracking);
        } else {
          const sample = INITIAL_SHIPMENTS.find(
            (s) => s.trackingNumber.toUpperCase() === cleanId
          );
          setLiveShipment(sample || null);
        }
        setTrackingLoading(false);
      },
      () => {
        const sample = INITIAL_SHIPMENTS.find(
          (s) => s.trackingNumber.toUpperCase() === cleanId
        );
        setLiveShipment(sample || null);
        setTrackingLoading(false);
      }
    );

    return () => unsub();
  }, [activeTrackingQuery]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ['ALL', ...unique];
  }, [products]);

  const directFilteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const catMatch = selectedCategory === 'ALL' || p.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.hsCode.toLowerCase().includes(q) ||
        p.originPort.toLowerCase().includes(q) ||
        p.certifications.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, selectedCategory]);

  const nameSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [products, searchQuery]);

  const runAiAutocorrect = async (queryText: string) => {
    const clean = queryText.trim();
    if (clean.length < 2) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/search/autocorrect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: clean,
          catalogNames: products.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
          })),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        correctedQuery?: string;
        hasTypo?: boolean;
        matchedProductIds?: string[];
        reason?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'AI search autocorrect failed.');
      }
      setAiCorrection({
        originalQuery: clean,
        correctedQuery: data.correctedQuery || clean,
        hasTypo: Boolean(data.hasTypo),
        matchedProductIds: Array.isArray(data.matchedProductIds) ? data.matchedProductIds : [],
        reason: data.reason || '',
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach AI search service.');
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-trigger AI autocorrect when a query >= 3 chars yields zero direct matches
  useEffect(() => {
    const clean = searchQuery.trim();
    setAiError('');
    if (!clean) {
      setAiCorrection(null);
      return;
    }
    if (aiCorrection && aiCorrection.originalQuery !== clean) {
      setAiCorrection(null);
    }
    if (clean.length >= 3 && directFilteredProducts.length === 0) {
      const timer = setTimeout(() => {
        void runAiAutocorrect(clean);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, directFilteredProducts.length]);

  const filteredProducts = useMemo(() => {
    if (directFilteredProducts.length > 0) return directFilteredProducts;
    if (aiCorrection && aiCorrection.matchedProductIds.length > 0) {
      const idSet = new Set(aiCorrection.matchedProductIds);
      return products.filter(
        (p) =>
          (idSet.has(p.id) || idSet.has(p.sku)) &&
          (selectedCategory === 'ALL' || p.category === selectedCategory)
      );
    }
    return [];
  }, [directFilteredProducts, aiCorrection, products, selectedCategory]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTrackingQuery(trackingInput.trim().toUpperCase());
  };

  const handleInquiryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInqError('');
    setInqSubmitting(true);
    try {
      await onSubmitInquiry({
        companyName: inqCompany.trim(),
        contactName: inqContact.trim(),
        email: inqEmail.trim(),
        country: inqCountry.trim(),
        destinationPort: inqPort.trim(),
        productInterest: inqProduct.trim(),
        estimatedVolume: inqVolume.trim(),
        incoterms: inqIncoterms,
        message: inqMessage.trim(),
      });
      setInqSuccess(true);
      setInqMessage('');
      setInqVolume('');
    } catch (err) {
      setInqError(err instanceof Error ? err.message : 'Unable to submit inquiry.');
    } finally {
      setInqSubmitting(false);
    }
  };

  const jumpToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentStageIndex = liveShipment
    ? SHIPMENT_STAGE_ORDER.indexOf(liveShipment.currentStage)
    : -1;

  return (
    <main className="bg-slate-50">
      {/* Section 1: Hero & Multilingual Utility Bar */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-6 pt-8 pb-12 lg:pt-12 lg:pb-16">
          {/* Above-the-fold Multilingual Switcher + Regional Context */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-slate-200/80">
            <p className="text-xs font-medium text-slate-600">{t.hero.regionLabel}</p>

            <div className="flex items-center gap-2" role="group" aria-label="Language selection">
              <Globe2 className="w-4 h-4 text-slate-500" />
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
                {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onChangeLanguage(code)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      language === code
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2-Column Split Hero */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <h1 className="font-display text-[clamp(2.25rem,3.6vw,3.35rem)] font-bold leading-[1.1] tracking-tight text-slate-900 text-balance">
                {t.hero.headline}
              </h1>
              <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-xl">
                {t.hero.subheadline}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => jumpToSection('catalog')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{t.hero.primaryCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => jumpToSection('tracking')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{t.hero.secondaryCta}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] lg:min-h-[380px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <SafeImage
                  src={HERO_IMAGE_URL}
                  alt="International maritime container shipping port and export terminal"
                  fallbackLabel="AWP International Traders Port"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Full-width 4-column Capability Strip */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-slate-200">
            {t.hero.stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Searchable Export Product Catalog */}
      <section id="catalog" className="py-16 lg:py-20 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                {t.catalog.heading}
              </h2>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">{t.catalog.subheading}</p>
            </div>

            {/* Product Name Search & AI Autocorrect Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearchFocused(false);
                void runAiAutocorrect(searchQuery);
              }}
              className="w-full lg:w-[480px] relative"
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.catalog.searchPlaceholder}
                    aria-label={t.catalog.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={aiLoading || searchQuery.trim().length < 2}
                  className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {aiLoading ? '...' : t.catalog.smartSearchBtn}
                </button>
              </div>

              {/* Instant Product Name Autocomplete Dropdown */}
              {searchFocused && nameSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                  {nameSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchQuery(item.name);
                        setSearchFocused(false);
                        setSelectedProduct(item);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-900 truncate">{item.name}</span>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">{item.sku}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Interactive Category Filter Bar */}
          <div className="mt-7 flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat === 'ALL' ? t.catalog.allCategories : cat}
              </button>
            ))}
          </div>

          {/* AI Autocorrect Status / Banner */}
          {aiLoading && (
            <div className="mt-5 px-4 py-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
              Checking product names & spelling for &ldquo;{searchQuery.trim()}&rdquo;...
            </div>
          )}

          {aiError && (
            <div className="mt-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {aiError}
            </div>
          )}

          {aiCorrection && !aiLoading && (
            <div className="mt-5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-slate-800">
              <div>
                <span>{t.catalog.autocorrectPrefix} </span>
                <span className="font-semibold text-slate-900">
                  &ldquo;{aiCorrection.correctedQuery}&rdquo;
                </span>
                {aiCorrection.hasTypo && (
                  <span className="text-slate-600">
                    {' '}
                    ({t.catalog.autocorrectFrom} &ldquo;{aiCorrection.originalQuery}&rdquo;)
                  </span>
                )}
                {aiCorrection.reason && (
                  <span className="text-slate-600"> · {aiCorrection.reason}</span>
                )}
              </div>
              {aiCorrection.correctedQuery.toLowerCase() !== searchQuery.trim().toLowerCase() && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(aiCorrection.correctedQuery);
                    setAiCorrection(null);
                  }}
                  className="font-semibold text-blue-800 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.catalog.applyCorrectionBtn}
                </button>
              )}
            </div>
          )}

          {/* 3-Column Product Grid */}
          {products.length === 0 ? (
            <div className="mt-10 bg-white border border-slate-200 rounded-xl p-12 text-center">
              <h3 className="text-base font-semibold text-slate-900">
                {t.catalog.noProductsYetTitle}
              </h3>
              <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
                {isAdmin
                  ? t.catalog.noProductsYetBody
                  : 'Products added by the website owner will appear here. Use the trade inquiry form below to request custom sourcing.'}
              </p>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => jumpToSection('upload-product')}
                  className="mt-5 px-5 py-2.5 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 cursor-pointer"
                >
                  {t.catalog.goToUploadBtn}
                </button>
              ) : !isSignedIn ? (
                <button
                  type="button"
                  onClick={() => onSignIn('signin', 'header')}
                  className="mt-5 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  {t.nav.signIn}
                </button>
              ) : null}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-10 bg-white border border-slate-200 rounded-xl p-12 text-center">
              <h3 className="text-base font-semibold text-slate-900">{t.catalog.emptyTitle}</h3>
              <p className="mt-2 text-sm text-slate-600">{t.catalog.emptyBody}</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="mt-5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <CatalogCardGallery
                    product={product}
                    onOpenDetail={() => setSelectedProduct(product)}
                  />

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Clean unboxed metadata with typographic separators */}
                      <div className="text-xs text-slate-500 font-mono truncate">
                        {product.sku} · HS {product.hsCode} · {product.originPort}
                      </div>

                      <h3 className="mt-2 font-display text-base font-semibold text-slate-900 leading-snug">
                        {product.name}
                      </h3>

                      {product.productQuality && (
                        <div className="mt-1.5 text-xs font-medium text-blue-800">
                          {t.catalog.qualityLabel}: {product.productQuality}
                        </div>
                      )}

                      <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="text-[11px] text-slate-500 block">{t.catalog.fobLabel}</span>
                          <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                            {product.leastAmount !== undefined &&
                            product.highestAmount !== undefined &&
                            product.highestAmount > product.leastAmount
                              ? `$${product.leastAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} – $${product.highestAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                              : `$${product.fobPriceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">/ {product.unit}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block">{t.catalog.qtyRangeLabel}</span>
                          <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                            {Math.max(1, product.leastQuantity ?? product.moq).toLocaleString('en-US')}
                            {product.highestQuantity &&
                            product.highestQuantity >= (product.leastQuantity ?? product.moq)
                              ? ` – ${product.highestQuantity.toLocaleString('en-US')}`
                              : '+'}{' '}
                            {product.unit}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                        <span
                          className={
                            product.availability === 'in_stock'
                              ? 'font-medium text-emerald-700'
                              : product.availability === 'made_to_order'
                                ? 'font-medium text-amber-700'
                                : 'font-medium text-red-700'
                          }
                        >
                          {t.catalog.availability[product.availability]}
                        </span>
                        <span className="font-mono tabular-nums">
                          {t.catalog.leadTimeLabel}: {product.leadTimeDays} {t.catalog.daysSuffix}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="flex-1 py-2.5 px-4 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {t.catalog.inspectButton}
                        </button>
                        {isAdmin && (
                          confirmDeleteCardId === product.id ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={deletingCardId === product.id}
                                onClick={async () => {
                                  setDeletingCardId(product.id);
                                  try {
                                    await onDeleteProduct(product.id);
                                    setConfirmDeleteCardId(null);
                                  } finally {
                                    setDeletingCardId(null);
                                  }
                                }}
                                className="px-2.5 py-2.5 bg-red-700 text-white text-xs font-semibold rounded-lg hover:bg-red-800 disabled:opacity-50 cursor-pointer"
                              >
                                {deletingCardId === product.id ? '...' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                disabled={deletingCardId === product.id}
                                onClick={() => setConfirmDeleteCardId(null)}
                                className="px-2.5 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              aria-label={`Delete ${product.name}`}
                              onClick={() => setConfirmDeleteCardId(product.id)}
                              className="px-3 py-2.5 border border-red-200 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-50 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 2.2: The Model / About Our Buying House */}
      <section
        id="about-model"
        className="py-20 lg:py-28 bg-white border-b border-slate-200"
      >
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              {buyingHouseContent.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-[1.15]">
              {buyingHouseContent.headline}
            </h2>
            <div className="mt-7 space-y-6 text-base sm:text-[17px] text-slate-700 leading-[1.8]">
              <p>{buyingHouseContent.paragraph1}</p>
              <p>{buyingHouseContent.paragraph2}</p>
            </div>
            {isAdmin && onEditBuyingHouseContent && (
              <div className="mt-8 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onEditBuyingHouseContent}
                  className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  Edit this section in Admin Panel
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2.5: Owner-Only Product Upload Section */}
      {isAdmin && (
        <ProductUploadSection
          t={t}
          products={products}
          isSignedIn={isSignedIn}
          isAdmin={isAdmin}
          onSignIn={onSignIn}
          onPublishProduct={onPublishProduct}
          onDeleteProduct={onDeleteProduct}
          onJumpToCatalog={() => jumpToSection('catalog')}
        />
      )}

      {/* Section 3: Integrated Real-Time Shipment Tracking */}
      <section id="tracking" className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              {t.tracking.heading}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{t.tracking.subheading}</p>
          </div>

          <form onSubmit={handleTrackSubmit} className="mt-7 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder={t.tracking.placeholder}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Ship className="w-4 h-4" />
              <span>{t.tracking.trackButton}</span>
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{t.tracking.samplesLabel}</span>
            {INITIAL_SHIPMENTS.map((sample) => (
              <button
                key={sample.trackingNumber}
                type="button"
                onClick={() => {
                  setTrackingInput(sample.trackingNumber);
                  setActiveTrackingQuery(sample.trackingNumber);
                }}
                className="font-mono font-medium text-blue-700 hover:underline cursor-pointer"
              >
                {sample.trackingNumber}
              </button>
            ))}
          </div>

          {/* Live Tracking Card */}
          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6 lg:p-8">
            {trackingLoading ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Synchronizing cargo telemetry...
              </div>
            ) : !liveShipment ? (
              <div className="py-10 text-center">
                <h3 className="text-base font-semibold text-slate-900">{t.tracking.notFoundTitle}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{t.tracking.notFoundBody}</p>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                      {liveShipment.trackingNumber}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 font-mono">
                      {liveShipment.orderNumber} · {liveShipment.incoterms} · {liveShipment.originPort} →{' '}
                      {liveShipment.destinationPort}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">{t.tracking.etaLabel}</span>
                    <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                      {liveShipment.etaDate}
                    </span>
                  </div>
                </div>

                {/* 7-Stage Progress Stepper */}
                <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {SHIPMENT_STAGE_ORDER.map((stage, idx) => {
                    const completed = idx <= currentStageIndex;
                    const active = idx === currentStageIndex;
                    return (
                      <div key={stage} className="flex flex-col">
                        <div
                          className={`h-2 rounded-full transition-colors ${
                            completed ? 'bg-blue-700' : 'bg-slate-200'
                          }`}
                        />
                        <span
                          className={`mt-2 text-xs leading-tight ${
                            active
                              ? 'font-bold text-blue-800'
                              : completed
                                ? 'font-medium text-slate-900'
                                : 'text-slate-400'
                          }`}
                        >
                          {t.tracking.stages[stage]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Metadata Grid */}
                <dl className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-200 text-xs">
                  <div>
                    <dt className="text-slate-500">{t.tracking.carrierLabel}</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{liveShipment.carrier}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t.tracking.vesselLabel}</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{liveShipment.vesselName}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t.tracking.containerLabel}</dt>
                    <dd className="mt-1 font-mono font-semibold text-slate-900 tabular-nums">
                      {liveShipment.containerNo}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{t.tracking.weightLabel}</dt>
                    <dd className="mt-1 font-mono font-semibold text-slate-900 tabular-nums">
                      {liveShipment.weightKg.toLocaleString('en-US')} kg
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-4">
                    <span className="text-xs text-slate-500 block">{t.tracking.locationLabel}</span>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {liveShipment.currentLocation}
                    </p>
                  </div>
                  <div className="lg:col-span-8">
                    <span className="text-xs text-slate-500 block">{t.tracking.logTitle}</span>
                    <ul className="mt-2 space-y-2">
                      {liveShipment.milestoneLog.map((entry, idx) => (
                        <li
                          key={idx}
                          className="text-xs font-mono text-slate-700 py-1.5 border-b border-slate-200/70 last:border-b-0"
                        >
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 4: International Trade Inquiry (RFQ) Form */}
      <section id="inquiry" className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              {t.inquiry.heading}
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{t.inquiry.subheading}</p>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-semibold text-slate-900 tracking-wide">
                {t.inquiry.docsTitle}
              </h3>
              <ul className="mt-4 space-y-3">
                {t.inquiry.docsList.map((docItem) => (
                  <li key={docItem} className="text-sm text-slate-700 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span>{docItem}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8">
              {inqSuccess ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                  <h3 className="mt-4 font-display text-xl font-bold text-slate-900">
                    {t.inquiry.successTitle}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                    {t.inquiry.successBody}
                  </p>
                  <button
                    type="button"
                    onClick={() => setInqSuccess(false)}
                    className="mt-6 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    {t.inquiry.anotherButton}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInquiryFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t.inquiry.companyLabel}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={160}
                        value={inqCompany}
                        onChange={(e) => setInqCompany(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t.inquiry.contactLabel}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={120}
                        value={inqContact}
                        onChange={(e) => setInqContact(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t.inquiry.emailLabel}
                      </label>
                      <input
                        type="email"
                        required
                        maxLength={160}
                        value={inqEmail}
                        onChange={(e) => setInqEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t.inquiry.countryLabel}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={inqCountry}
                        onChange={(e) => setInqCountry(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t.inquiry.portLabel}
                      </label>
                      <input
                        type="text"
                        maxLength={120}
                        value={inqPort}
                        onChange={(e) => setInqPort(e.target.value)}
                        placeholder="e.g. Hamburg, DE"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t.inquiry.productLabel}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={160}
                        value={inqProduct}
                        onChange={(e) => setInqProduct(e.target.value)}
                        placeholder="SKU or category"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t.inquiry.volumeLabel}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={inqVolume}
                        onChange={(e) => setInqVolume(e.target.value)}
                        placeholder="e.g. 200 Units / Q4"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t.inquiry.incotermsLabel}
                      </label>
                      <select
                        value={inqIncoterms}
                        onChange={(e) => setInqIncoterms(e.target.value as Incoterm)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                      >
                        {INCOTERMS_OPTIONS.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      {t.inquiry.messageLabel}
                    </label>
                    <textarea
                      rows={3}
                      required
                      maxLength={2000}
                      value={inqMessage}
                      onChange={(e) => setInqMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>

                  {inqError && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                      {inqError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={inqSubmitting}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {inqSubmitting ? t.inquiry.submittingButton : t.inquiry.submitButton}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="font-display text-base font-bold text-white">{t.brandName}</div>
            <p className="mt-1 text-xs text-slate-400 max-w-md">{t.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onChangeLanguage(code)}
                className={`cursor-pointer ${
                  language === code ? 'text-white font-semibold underline' : 'text-slate-400 hover:text-white'
                }`}
              >
                {LANGUAGE_LABELS[code]}
              </button>
            ))}
            {onOpenAdminPanel && (
              <>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={onOpenAdminPanel}
                  className="text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer"
                >
                  {t.nav.dashboard}
                </button>
              </>
            )}
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{t.footer.rights}</span>
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          t={t}
          whatsappNumber={whatsappNumber}
          isSignedIn={isSignedIn}
          isAdmin={isAdmin}
          clientProfile={clientProfile}
          onClose={() => setSelectedProduct(null)}
          onSignIn={(mode) => onSignIn(mode || 'signin', 'order')}
          onDeleteProduct={onDeleteProduct}
          onPlaceOrder={onPlaceOrder}
          onJumpToInquiry={(prodName) => {
            setInqProduct(prodName);
            jumpToSection('inquiry');
          }}
        />
      )}
    </main>
  );
}

import { CheckCircle2, ChevronLeft, ChevronRight, Lock, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TranslationBundle } from '../i18n/translations';
import type { ClientAccount, Incoterm, Product } from '../types';
import { buildWhatsAppUrl, getProductImages, INCOTERMS_OPTIONS } from '../utils/exportReports';
import { WhatsAppIcon } from './FloatingWhatsAppButton';
import { SafeImage } from './SafeImage';

interface ProductModalProps {
  product: Product;
  t: TranslationBundle;
  whatsappNumber: string;
  isSignedIn: boolean;
  isAdmin?: boolean;
  clientProfile: ClientAccount | null;
  onClose: () => void;
  onSignIn: (mode?: 'signin' | 'signup') => void;
  onDeleteProduct?: (productId: string) => Promise<void>;
  onPlaceOrder: (payload: {
    product: Product;
    quantity: number;
    incoterms: Incoterm;
    destinationPort: string;
    notes: string;
  }) => Promise<void>;
  onJumpToInquiry: (productName: string) => void;
}

export function ProductModal({
  product,
  t,
  whatsappNumber,
  isSignedIn,
  isAdmin,
  clientProfile,
  onClose,
  onSignIn,
  onDeleteProduct,
  onPlaceOrder,
  onJumpToInquiry,
}: ProductModalProps) {
  const minQty = Math.max(1, product.leastQuantity ?? product.moq);
  const maxQty =
    product.highestQuantity && product.highestQuantity >= minQty
      ? product.highestQuantity
      : undefined;
  const [quantity, setQuantity] = useState<number>(minQty);
  const [incoterms, setIncoterms] = useState<Incoterm>(clientProfile?.preferredIncoterms || 'FOB');
  const [destinationPort, setDestinationPort] = useState<string>(
    clientProfile?.destinationPort || 'Rotterdam, NL'
  );
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const images = getProductImages(product);
  const safeImgIdx = activeImgIdx < images.length ? activeImgIdx : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (images.length > 1 && e.key === 'ArrowLeft') {
        setActiveImgIdx((prev) => (prev - 1 + images.length) % images.length);
      } else if (images.length > 1 && e.key === 'ArrowRight') {
        setActiveImgIdx((prev) => (prev + 1) % images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose]);

  const safeQty = maxQty
    ? Math.min(maxQty, Math.max(minQty, quantity || minQty))
    : Math.max(minQty, quantity || minQty);
  const subtotalUsd = safeQty * product.fobPriceUsd;
  const freightMultiplier = incoterms === 'EXW' ? 0 : incoterms === 'FOB' ? 0.04 : incoterms === 'DDP' ? 0.11 : 0.075;
  const freightUsd = Math.round(subtotalUsd * freightMultiplier);
  const totalUsd = subtotalUsd + freightUsd;

  const whatsappInquiryUrl = buildWhatsAppUrl(
    whatsappNumber,
    `Hello Meridian Export Group, I would like to inquire about "${product.name}" (SKU: ${product.sku}). Please share bulk pricing, MOQ, and lead time details.`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      onSignIn('signin');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      await onPlaceOrder({
        product,
        quantity: safeQty,
        incoterms,
        destinationPort: destinationPort.trim() || 'Rotterdam, NL',
        notes: notes.trim(),
      });
      setOrderDone(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="text-xs font-mono text-slate-500">
            {product.sku} · {product.category} · HS {product.hsCode}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Product Image Gallery & Technical Specs */}
          <div className="lg:col-span-6 p-6 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-white border border-slate-200 select-none"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
              }}
              onTouchEnd={(e) => {
                if (!swipeStartRef.current || images.length <= 1) return;
                const touch = e.changedTouches[0];
                const dx = touch.clientX - swipeStartRef.current.x;
                const dy = touch.clientY - swipeStartRef.current.y;
                swipeStartRef.current = null;
                if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
                  setActiveImgIdx((prev) =>
                    dx < 0 ? (prev + 1) % images.length : (prev - 1 + images.length) % images.length
                  );
                }
              }}
            >
              <SafeImage
                src={images[safeImgIdx] || ''}
                alt={`${product.name}${images.length > 1 ? ` — photo ${safeImgIdx + 1}` : ''}`}
                fallbackLabel={product.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() =>
                      setActiveImgIdx((prev) => (prev - 1 + images.length) % images.length)
                    }
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900 touch-manipulation cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => setActiveImgIdx((prev) => (prev + 1) % images.length)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900 touch-manipulation cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded bg-slate-900/75 text-white text-[11px] font-mono tabular-nums">
                    {safeImgIdx + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-2.5 space-y-1.5">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {images.map((url, idx) => (
                    <button
                      key={`${idx}-${url.slice(0, 20)}`}
                      type="button"
                      onClick={() => setActiveImgIdx(idx)}
                      aria-label={`Select photo ${idx + 1} of ${images.length}`}
                      className={`aspect-[4/3] rounded overflow-hidden border bg-white touch-manipulation cursor-pointer transition-all ${
                        idx === safeImgIdx
                          ? 'border-blue-700 ring-2 ring-blue-700/30'
                          : 'border-slate-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <SafeImage
                        src={url}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Photo {safeImgIdx + 1} of {images.length} · Swipe photo or tap thumbnails to switch views
                </p>
              </div>
            )}

            <h2 id="product-modal-title" className="mt-5 font-display text-xl font-bold text-slate-900">
              {product.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{product.description}</p>

            <div className="mt-6">
              <h3 className="text-xs font-semibold text-slate-900 tracking-wide">
                {t.productModal.specsTitle}
              </h3>
              <dl className="mt-3 divide-y divide-slate-200 border-t border-b border-slate-200 text-xs">
                {product.productQuality && (
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500">{t.productModal.quality}</dt>
                    <dd className="font-semibold text-slate-900 text-right">{product.productQuality}</dd>
                  </div>
                )}
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">{t.productModal.qtyRange}</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {minQty.toLocaleString('en-US')}
                    {maxQty ? ` – ${maxQty.toLocaleString('en-US')}` : '+'} {product.unit}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">{t.productModal.hsCode}</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">{product.hsCode}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">{t.productModal.originPort}</dt>
                  <dd className="font-medium text-slate-900">{product.originPort}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">{t.productModal.leadTime}</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {product.leadTimeDays} {t.catalog.daysSuffix}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">{t.productModal.weight}</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">{product.weightKg} kg</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">{t.productModal.dimensions}</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">{product.dimensions}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">{t.productModal.certifications}</dt>
                  <dd className="font-medium text-slate-900 text-right">{product.certifications}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right: Contiguous Purchase / Order Module */}
          <div className="lg:col-span-6 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs text-slate-500 block">{t.catalog.fobLabel}</span>
                  <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {product.leastAmount !== undefined &&
                    product.highestAmount !== undefined &&
                    product.highestAmount > product.leastAmount
                      ? `$${product.leastAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} – $${product.highestAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : `$${product.fobPriceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5">/ {product.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">{t.catalog.qtyRangeLabel}</span>
                  <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {minQty.toLocaleString('en-US')}
                    {maxQty ? ` – ${maxQty.toLocaleString('en-US')}` : '+'} {product.unit}
                  </span>
                </div>
              </div>

              {orderDone ? (
                <div className="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-950">{t.productModal.orderSuccessMsg}</p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900 cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : !isSignedIn ? (
                <div className="mt-6 space-y-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {t.productModal.authRequiredTitle}
                        </h3>
                        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                          {t.productModal.authRequiredBody}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2.5">
                      <button
                        type="button"
                        onClick={() => onSignIn('signin')}
                        className="w-full py-2.5 px-4 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
                      >
                        {t.productModal.loginExistingBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSignIn('signup')}
                        className="w-full py-2.5 px-4 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        {t.productModal.createAccountBtn}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onJumpToInquiry(product.name);
                      }}
                      className="w-full py-2.5 px-4 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {t.productModal.requestQuoteBtn}
                    </button>
                    <a
                      href={whatsappInquiryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <WhatsAppIcon className="w-4 h-4 shrink-0" />
                      <span>Inquire on WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">{t.productModal.orderBoxTitle}</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t.productModal.quantityLabel}
                      </label>
                      <input
                        type="number"
                        min={minQty}
                        max={maxQty}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t.productModal.incotermsLabel}
                      </label>
                      <select
                        value={incoterms}
                        onChange={(e) => setIncoterms(e.target.value as Incoterm)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
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
                      {t.productModal.destPortLabel}
                    </label>
                    <input
                      type="text"
                      value={destinationPort}
                      onChange={(e) => setDestinationPort(e.target.value)}
                      maxLength={120}
                      placeholder="e.g. Rotterdam, NL"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      {t.productModal.notesLabel}
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={500}
                      placeholder="Mill certificates, pallet markings, customs broker details..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t.productModal.subtotalLabel}</span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">
                        ${subtotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        {t.productModal.freightEstLabel} ({incoterms})
                      </span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">
                        ${freightUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                      <span>{t.productModal.totalEstLabel}</span>
                      <span className="font-mono tabular-nums">
                        ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                      {errorMsg}
                    </p>
                  )}

                  <div className="space-y-2.5 pt-1">
                    <button
                      type="submit"
                      disabled={submitting || product.availability === 'out_of_stock'}
                      className="w-full py-2.5 px-4 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {submitting ? 'Submitting...' : t.productModal.placeOrderBtn}
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onJumpToInquiry(product.name);
                        }}
                        className="w-full py-2.5 px-4 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {t.productModal.requestQuoteBtn}
                      </button>
                      <a
                        href={whatsappInquiryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                      >
                        <WhatsAppIcon className="w-4 h-4 shrink-0" />
                        <span>Inquire on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </form>
              )}

              {isAdmin && onDeleteProduct && (
                <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">Owner catalog control</span>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={async () => {
                          setDeleting(true);
                          setErrorMsg('');
                          try {
                            await onDeleteProduct(product.id);
                            onClose();
                          } catch (err) {
                            setErrorMsg(
                              err instanceof Error ? err.message : 'Unable to delete product.'
                            );
                            setDeleting(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-700 text-white text-xs font-semibold rounded-lg hover:bg-red-800 disabled:opacity-50 cursor-pointer"
                      >
                        {deleting ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Upload</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

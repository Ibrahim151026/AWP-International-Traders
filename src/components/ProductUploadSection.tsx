import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { TranslationBundle } from '../i18n/translations';
import type { Product } from '../types';
import {
  compressImageToDataUrl,
  getProductImages,
  parseImageUrlList,
  sanitizeId,
  suggestGarmentHsCode,
} from '../utils/exportReports';
import { SafeImage } from './SafeImage';

interface ProductUploadSectionProps {
  t: TranslationBundle;
  products: Product[];
  isSignedIn: boolean;
  isAdmin: boolean;
  onSignIn: () => void;
  onPublishProduct: (product: Product, isNew: boolean) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onJumpToCatalog: () => void;
}

export function ProductUploadSection({
  t,
  products,
  isSignedIn,
  isAdmin,
  onSignIn,
  onPublishProduct,
  onDeleteProduct,
  onJumpToCatalog,
}: ProductUploadSectionProps) {
  const [productName, setProductName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [leastAmount, setLeastAmount] = useState('');
  const [highestAmount, setHighestAmount] = useState('');
  const [leastQuantity, setLeastQuantity] = useState('');
  const [highestQuantity, setHighestQuantity] = useState('');
  const [productQuality, setProductQuality] = useState('');
  const [category, setCategory] = useState('Clothing & Apparel');
  const [hsCode, setHsCode] = useState(() =>
    suggestGarmentHsCode('', 'Clothing & Apparel', '').code
  );
  const [hsCodeManuallyEdited, setHsCodeManuallyEdited] = useState(false);
  const [unit, setUnit] = useState('Pieces');
  const [images, setImages] = useState<string[]>([]);
  const [pendingImageUrl, setPendingImageUrl] = useState('');
  const [previewIdx, setPreviewIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [publishedName, setPublishedName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedNotice, setDeletedNotice] = useState('');
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  if (!isSignedIn || !isAdmin) {
    return null;
  }

  const parsedLeast = Math.max(0, Number(leastAmount) || 0);
  const parsedHighest = Math.max(0, Number(highestAmount) || 0);
  const parsedLeastQty = Math.max(1, Number(leastQuantity) || 1);
  const parsedHighestQty = Math.max(parsedLeastQty, Number(highestQuantity) || parsedLeastQty);

  const handleImageFilesChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg('');
    const remaining = 6 - images.length;
    if (remaining <= 0) {
      setErrorMsg('Maximum 6 pictures per product reached. Remove one before adding more.');
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    const added: string[] = [];
    for (const file of selected) {
      try {
        const dataUrl = await compressImageToDataUrl(file);
        if (dataUrl.length <= 350000) {
          added.push(dataUrl);
        } else {
          setErrorMsg(`Skipped ${file.name}: compressed file exceeds size limit.`);
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : `Unable to process ${file.name}.`);
      }
    }
    if (added.length > 0) {
      setImages((prev) => [...prev, ...added].slice(0, 6));
    }
    if (files.length > remaining) {
      setErrorMsg(`Added ${added.length} picture(s). Maximum 6 pictures allowed per product.`);
    }
  };

  const handleAddUrl = () => {
    const raw = pendingImageUrl.trim();
    if (!raw) return;
    setErrorMsg('');
    if (images.length >= 6) {
      setErrorMsg('Maximum 6 pictures per product reached.');
      return;
    }
    const parsedUrls = parseImageUrlList(raw);
    const candidates = parsedUrls.length > 0 ? parsedUrls : [raw];
    const next = [...images];
    let addedCount = 0;
    for (const url of candidates) {
      if (next.length >= 6) break;
      if (!next.includes(url)) {
        next.push(url);
        addedCount++;
      }
    }
    if (addedCount > 0) {
      setImages(next);
    }
    if (candidates.length > addedCount && next.length >= 6) {
      setErrorMsg('Added up to 6 pictures maximum per product.');
    }
    setPendingImageUrl('');
  };

  const handleSetCover = (idx: number) => {
    if (idx <= 0 || idx >= images.length) return;
    setImages((prev) => {
      const target = prev[idx];
      return [target, ...prev.filter((_, i) => i !== idx)];
    });
    setPreviewIdx(0);
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setPreviewIdx((curr) => (curr >= next.length ? Math.max(0, next.length - 1) : curr));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPublishedName('');

    if (!isSignedIn) {
      onSignIn();
      return;
    }

    if (!isAdmin) {
      setErrorMsg(t.uploadSection.adminOnlyNotice);
      return;
    }

    const cleanName = productName.trim();
    const cleanDetails = productDetails.trim();
    const pendingRaw = pendingImageUrl.trim();
    const pendingList = pendingRaw
      ? parseImageUrlList(pendingRaw).length > 0
        ? parseImageUrlList(pendingRaw)
        : [pendingRaw]
      : [];
    const finalImages = [...images];
    for (const url of pendingList) {
      if (finalImages.length >= 6) break;
      if (!finalImages.includes(url)) finalImages.push(url);
    }

    if (!cleanName || !cleanDetails) {
      setErrorMsg('Please enter both a product name and product details.');
      return;
    }

    if (finalImages.length === 0) {
      setErrorMsg(t.uploadSection.imageRequiredNotice);
      return;
    }

    if (leastAmount === '' || highestAmount === '' || parsedHighest < parsedLeast) {
      setErrorMsg('Highest amount must be greater than or equal to the least amount.');
      return;
    }

    const rawLeastQty = Number(leastQuantity);
    const rawHighestQty = Number(highestQuantity);
    if (leastQuantity === '' || highestQuantity === '' || rawLeastQty < 1 || rawHighestQty < rawLeastQty) {
      setErrorMsg('Highest quantity must be greater than or equal to least quantity (minimum 1).');
      return;
    }

    const cleanQuality = productQuality.trim();
    if (!cleanQuality) {
      setErrorMsg('Please specify the product quality grade.');
      return;
    }

    const cleanHsCode = hsCode.trim().slice(0, 32);
    if (!cleanHsCode) {
      setErrorMsg('Please enter or auto-detect an HS Code before saving.');
      return;
    }

    const generatedSku =
      sanitizeId(
        `AWP-${cleanName.slice(0, 12).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`
      ) || `AWP-${Date.now()}`;

    const newProduct: Product = {
      id: generatedSku,
      sku: generatedSku,
      name: cleanName.slice(0, 160),
      category: category.trim() || 'Clothing & Apparel',
      hsCode: cleanHsCode,
      description: cleanDetails.slice(0, 2000),
      fobPriceUsd: parsedHighest,
      leastAmount: parsedLeast,
      highestAmount: parsedHighest,
      leastQuantity: rawLeastQty,
      highestQuantity: rawHighestQty,
      productQuality: cleanQuality.slice(0, 160),
      moq: rawLeastQty,
      unit: unit.trim() || 'Pieces',
      originPort: 'Chattogram, BD',
      leadTimeDays: 14,
      weightKg: 12,
      dimensions: '40 x 30 x 30 cm',
      certifications: 'OEKO-TEX Standard 100, ISO 9001',
      availability: 'in_stock',
      imageUrl: finalImages[0],
      images: finalImages,
    };

    setSubmitting(true);
    try {
      await onPublishProduct(newProduct, true);
      setPublishedName(cleanName);
      setProductName('');
      setProductDetails('');
      setLeastAmount('');
      setHighestAmount('');
      setLeastQuantity('');
      setHighestQuantity('');
      setProductQuality('');
      setHsCode(suggestGarmentHsCode('', category, '').code);
      setHsCodeManuallyEdited(false);
      setImages([]);
      setPendingImageUrl('');
      setPreviewIdx(0);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload product.');
    } finally {
      setSubmitting(false);
    }
  };

  const safePreviewIdx = previewIdx < images.length ? previewIdx : 0;

  return (
    <section id="upload-product" className="py-16 lg:py-20 bg-white border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            {t.uploadSection.heading}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{t.uploadSection.subheading}</p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Upload Form */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  {t.uploadSection.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={productName}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setProductName(nextName);
                    if (!hsCodeManuallyEdited) {
                      setHsCode(suggestGarmentHsCode(nextName, category, productDetails).code);
                    }
                  }}
                  placeholder={t.uploadSection.namePlaceholder}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    {t.uploadSection.imageLabel} ({images.length}/6)
                  </label>
                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setImages([]);
                        setPreviewIdx(0);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t.uploadSection.clearImageBtn}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-stretch">
                  <label className="sm:col-span-5 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-dashed border-slate-300 rounded-lg hover:border-blue-700 transition-colors cursor-pointer text-xs font-semibold text-slate-800">
                    <ImagePlus className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="truncate">{t.uploadSection.chooseImageBtn}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        void handleImageFilesChange(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <div className="sm:col-span-7 flex gap-2">
                    <input
                      type="text"
                      value={pendingImageUrl}
                      onChange={(e) => setPendingImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                      placeholder={t.uploadSection.imageUrlPlaceholder}
                      className="flex-1 min-w-0 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      disabled={!pendingImageUrl.trim() || images.length >= 6}
                      className="px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {t.uploadSection.addUrlBtn}
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Select multiple photos from phone gallery or paste multiple URLs separated by commas (Front View, Back View, Fabric Close-up, Stitching Detail).
                </p>

                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {images.map((url, idx) => (
                      <div
                        key={`${idx}-${url.slice(0, 24)}`}
                        className={`relative group bg-white border rounded-lg overflow-hidden ${
                          idx === safePreviewIdx
                            ? 'border-blue-700 ring-2 ring-blue-700/20'
                            : 'border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewIdx(idx)}
                          className="block w-full aspect-[4/3] overflow-hidden cursor-pointer"
                        >
                          <SafeImage
                            src={url}
                            alt={`Product picture ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          aria-label={`Remove picture ${idx + 1}`}
                          className="absolute top-1 right-1 w-6 h-6 rounded bg-slate-900/80 text-white flex items-center justify-center hover:bg-red-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="px-1.5 py-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          {idx === 0 ? (
                            <span className="font-semibold text-blue-700">
                              {t.uploadSection.coverLabel}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetCover(idx)}
                              className="font-medium text-slate-600 hover:text-blue-700 underline cursor-pointer"
                            >
                              {t.uploadSection.setCoverBtn}
                            </button>
                          )}
                          <span className="font-mono text-slate-400">#{idx + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  {t.uploadSection.detailsLabel}
                </label>
                <textarea
                  rows={3}
                  required
                  maxLength={2000}
                  value={productDetails}
                  onChange={(e) => {
                    const nextDetails = e.target.value;
                    setProductDetails(nextDetails);
                    if (!hsCodeManuallyEdited) {
                      setHsCode(suggestGarmentHsCode(productName, category, nextDetails).code);
                    }
                  }}
                  placeholder={t.uploadSection.detailsPlaceholder}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    {t.uploadSection.leastQtyLabel}
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={leastQuantity}
                    onChange={(e) => setLeastQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-mono text-sm tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    {t.uploadSection.highestQtyLabel}
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={highestQuantity}
                    onChange={(e) => setHighestQuantity(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-mono text-sm tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  {t.uploadSection.qualityLabel}
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={productQuality}
                  onChange={(e) => setProductQuality(e.target.value)}
                  placeholder={t.uploadSection.qualityPlaceholder}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    {t.uploadSection.leastAmountLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={leastAmount}
                    onChange={(e) => setLeastAmount(e.target.value)}
                    placeholder="e.g. 6.50"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-mono text-sm tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    {t.uploadSection.highestAmountLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={highestAmount}
                    onChange={(e) => setHighestAmount(e.target.value)}
                    placeholder="e.g. 12.90"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-mono text-sm tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t.uploadSection.categoryLabel}
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={category}
                    onChange={(e) => {
                      const nextCat = e.target.value;
                      setCategory(nextCat);
                      if (!hsCodeManuallyEdited) {
                        setHsCode(suggestGarmentHsCode(productName, nextCat, productDetails).code);
                      }
                    }}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t.uploadSection.unitLabel}
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      HS Code (Editable)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setHsCodeManuallyEdited(false);
                        setHsCode(
                          suggestGarmentHsCode(productName, category, productDetails).code
                        );
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Auto-Detect</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={32}
                    value={hsCode}
                    onChange={(e) => {
                      setHsCodeManuallyEdited(true);
                      setHsCode(e.target.value);
                    }}
                    placeholder="e.g. 6109.10.00"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 -mt-2">
                Auto-suggested tariff:{' '}
                <span className="font-mono font-semibold text-slate-700">
                  {suggestGarmentHsCode(productName, category, productDetails).code}
                </span>{' '}
                ({suggestGarmentHsCode(productName, category, productDetails).label}) — double-check or edit above before publishing.
              </p>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              {publishedName && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      &ldquo;{publishedName}&rdquo; {t.uploadSection.successNotice}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onJumpToCatalog}
                    className="font-semibold text-emerald-800 underline cursor-pointer"
                  >
                    {t.uploadSection.viewInCatalogBtn}
                  </button>
                </div>
              )}

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {!isSignedIn
                      ? t.uploadSection.signInBtn
                      : submitting
                        ? 'Publishing...'
                        : t.uploadSection.submitBtn}
                  </span>
                </button>
                {isSignedIn && !isAdmin && (
                  <span className="text-xs text-slate-600">{t.uploadSection.adminOnlyNotice}</span>
                )}
              </div>
            </form>
          </div>

          {/* Live Listing Preview */}
          <div className="lg:col-span-5">
            <div className="text-xs font-semibold text-slate-600 mb-3">
              {t.uploadSection.previewTitle}
            </div>
            <article className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div
                className="relative aspect-[4/3] w-full bg-slate-100 border-b border-slate-200 overflow-hidden select-none"
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
                    setPreviewIdx((prev) =>
                      dx < 0 ? (prev + 1) % images.length : (prev - 1 + images.length) % images.length
                    );
                  }
                }}
              >
                <SafeImage
                  src={images[safePreviewIdx] || ''}
                  alt={productName || 'Uploaded product preview'}
                  fallbackLabel={t.uploadSection.emptyImagePreview}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous preview photo"
                      onClick={() =>
                        setPreviewIdx((prev) => (prev - 1 + images.length) % images.length)
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900 touch-manipulation cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next preview photo"
                      onClick={() => setPreviewIdx((prev) => (prev + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900 touch-manipulation cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[11px] font-mono tabular-nums">
                      {safePreviewIdx + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {images.map((url, idx) => (
                    <button
                      key={`prev-${idx}-${url.slice(0, 16)}`}
                      type="button"
                      onClick={() => setPreviewIdx(idx)}
                      className={`aspect-[4/3] rounded overflow-hidden border cursor-pointer ${
                        idx === safePreviewIdx
                          ? 'border-blue-700 ring-2 ring-blue-700/25'
                          : 'border-slate-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <SafeImage src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div className="p-5">
                <div className="text-xs font-mono text-slate-500">
                  {category || 'Clothing & Apparel'} · HS {hsCode || '6205.20.00'} ·{' '}
                  {productQuality.trim() || t.uploadSection.qualityPlaceholder}
                </div>
                <h3 className="mt-2 font-display text-base font-semibold text-slate-900">
                  {productName.trim() || t.uploadSection.namePlaceholder}
                </h3>
                <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {productDetails.trim() || t.uploadSection.detailsPlaceholder}
                </p>

                <div className="mt-4 text-xs text-slate-700 font-mono tabular-nums">
                  {t.catalog.qtyRangeLabel}: {parsedLeastQty.toLocaleString('en-US')} –{' '}
                  {parsedHighestQty.toLocaleString('en-US')} {unit || 'Pieces'}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 flex items-baseline justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      {t.uploadSection.rangeLabel}
                    </span>
                    <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                      ${parsedLeast.toLocaleString('en-US', { minimumFractionDigits: 2 })} – $
                      {Math.max(parsedLeast, parsedHighest).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">/ {unit || 'Pieces'}</span>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Manage & Delete Uploaded Products */}
        {products.length > 0 && (
          <div className="mt-10 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Manage Uploaded Products ({products.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Delete any uploaded product listing from the live catalog whenever needed.
                </p>
              </div>
              {deletedNotice && (
                <div className="text-xs font-semibold text-emerald-800">{deletedNotice}</div>
              )}
            </div>
            <div className="divide-y divide-slate-200 bg-white">
              {products.map((prod) => {
                const imgs = getProductImages(prod);
                const isConfirming = confirmDeleteId === prod.id;
                const isDeleting = deletingId === prod.id;
                return (
                  <div
                    key={prod.id}
                    className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-10 rounded overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                        <SafeImage
                          src={imgs[0] || ''}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {prod.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono truncate">
                          {prod.sku} · {prod.category}
                          {imgs.length > 1 ? ` · ${imgs.length} photos` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isConfirming ? (
                        <>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={async () => {
                              setDeletingId(prod.id);
                              setErrorMsg('');
                              setDeletedNotice('');
                              try {
                                await onDeleteProduct(prod.id);
                                setConfirmDeleteId(null);
                                setDeletedNotice(`"${prod.name}" deleted from catalog.`);
                              } catch (err) {
                                setErrorMsg(
                                  err instanceof Error ? err.message : 'Unable to delete product.'
                                );
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            className="px-3 py-1.5 bg-red-700 text-white text-xs font-semibold rounded-lg hover:bg-red-800 disabled:opacity-50 cursor-pointer"
                          >
                            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setDeletedNotice('');
                            setConfirmDeleteId(prod.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  LayoutDashboard,
  Mail,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LANGUAGE_LABELS, type TranslationBundle } from '../i18n/translations';
import type {
  BuyingHouseContent,
  ClientAccount,
  ClientStatus,
  ContactInquiry,
  CreditTier,
  ExportOrder,
  Incoterm,
  InquiryStatus,
  LanguageCode,
  OrderStatus,
  Product,
  ProductAvailability,
  ShipmentStage,
  ShipmentTracking,
} from '../types';
import {
  buildWhatsAppUrl,
  compressImageToDataUrl,
  downloadBulkProductTemplate,
  exportOrdersToCsv,
  exportOrdersToPdf,
  getProductImages,
  INCOTERMS_OPTIONS,
  parseBulkSpecFile,
  parseImageUrlList,
  sanitizeId,
  sanitizeWhatsAppNumber,
  suggestGarmentHsCode,
} from '../utils/exportReports';
import { AdminSummaryCharts } from './AdminSummaryCharts';
import { WhatsAppIcon } from './FloatingWhatsAppButton';
import { SafeImage } from './SafeImage';

import { DEFAULT_BUYING_HOUSE_CONTENT, DEFAULT_WHATSAPP_NUMBER } from '../data/seedData';

type AdminTab =
  | 'overview'
  | 'products'
  | 'bulk'
  | 'orders'
  | 'clients'
  | 'inquiries'
  | 'content'
  | 'reports'
  | 'settings';

interface AdminDashboardViewProps {
  t: TranslationBundle;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  adminEmail: string;
  initialTab?: AdminTab;
  products: Product[];
  orders: ExportOrder[];
  shipments: ShipmentTracking[];
  clients: ClientAccount[];
  inquiries: ContactInquiry[];
  buyingHouseContent: BuyingHouseContent;
  whatsappNumber: string;
  onSaveProduct: (product: Product, isNew: boolean) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onBulkPublishProducts: (products: Product[]) => Promise<void>;
  onUpdateOrderAndShipment: (payload: {
    order: ExportOrder;
    newStatus: OrderStatus;
    trackingNumber: string;
    shipment?: {
      originPort: string;
      destinationPort: string;
      carrier: string;
      vesselName: string;
      containerNo: string;
      weightKg: number;
      currentStage: ShipmentStage;
      currentLocation: string;
      etaDate: string;
      newLogEntry: string;
    };
  }) => Promise<void>;
  onUpdateClientAccount: (
    clientId: string,
    updates: { status: ClientStatus; creditTier: CreditTier; accountNotes: string }
  ) => Promise<void>;
  onUpdateInquiryStatus: (inquiryId: string, status: InquiryStatus) => Promise<void>;
  onDeleteInquiry: (inquiryId: string) => Promise<void>;
  onSaveBuyingHouseContent: (content: BuyingHouseContent) => Promise<void>;
  onSaveWhatsAppNumber: (whatsappNumber: string) => Promise<void>;
  onBackToStorefront: () => void;
  onSwitchToClientPortal: () => void;
}

const SHIPMENT_STAGES: ShipmentStage[] = [
  'order_confirmed',
  'customs_cleared',
  'vessel_loaded',
  'ocean_transit',
  'port_arrival',
  'customs_released',
  'delivered',
];

const ORDER_STATUSES: OrderStatus[] = [
  'pending_review',
  'confirmed',
  'customs_dispatch',
  'in_transit',
  'delivered',
  'cancelled',
];

function extractDateMs(ts: unknown): number {
  if (!ts) return Date.now();
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  if (ts instanceof Date) return ts.getTime();
  const parsed = Date.parse(String(ts));
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

export function AdminDashboardView({
  t,
  language,
  onChangeLanguage,
  adminEmail,
  initialTab = 'overview',
  products,
  orders,
  shipments,
  clients,
  inquiries,
  buyingHouseContent,
  whatsappNumber,
  onSaveProduct,
  onDeleteProduct,
  onBulkPublishProducts,
  onUpdateOrderAndShipment,
  onUpdateClientAccount,
  onUpdateInquiryStatus,
  onDeleteInquiry,
  onSaveBuyingHouseContent,
  onSaveWhatsAppNumber,
  onBackToStorefront,
  onSwitchToClientPortal,
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [toastMsg, setToastMsg] = useState('');

  // Editorial "The Model / Buying House" Editor state
  const [modelEyebrow, setModelEyebrow] = useState(buyingHouseContent.eyebrow);
  const [modelHeadline, setModelHeadline] = useState(buyingHouseContent.headline);
  const [modelParagraph1, setModelParagraph1] = useState(buyingHouseContent.paragraph1);
  const [modelParagraph2, setModelParagraph2] = useState(buyingHouseContent.paragraph2);
  const [savingModelContent, setSavingModelContent] = useState(false);

  // WhatsApp Business Settings state
  const [whatsappInput, setWhatsappInput] = useState(whatsappNumber);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setModelEyebrow(buyingHouseContent.eyebrow);
    setModelHeadline(buyingHouseContent.headline);
    setModelParagraph1(buyingHouseContent.paragraph1);
    setModelParagraph2(buyingHouseContent.paragraph2);
  }, [buyingHouseContent]);

  useEffect(() => {
    setWhatsappInput(whatsappNumber);
  }, [whatsappNumber]);

  // Product Editor Modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [hsCodeManuallyEdited, setHsCodeManuallyEdited] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [modalImageUrlInput, setModalImageUrlInput] = useState('');
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [modalConfirmDelete, setModalConfirmDelete] = useState(false);

  // Bulk Upload state
  const [stagedProducts, setStagedProducts] = useState<Product[]>([]);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ fileName: string; baseName: string; dataUrl: string; matchedSku: string }>
  >([]);
  const [bulkError, setBulkError] = useState('');
  const [bulkPublishing, setBulkPublishing] = useState(false);

  // Order & Shipment Drawer state
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [managingOrder, setManagingOrder] = useState<ExportOrder | null>(null);
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus>('confirmed');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editCarrier, setEditCarrier] = useState('Maersk Line');
  const [editVessel, setEditVessel] = useState('MV Maersk Elba');
  const [editContainer, setEditContainer] = useState('MSKU-904218-4');
  const [editOriginPort, setEditOriginPort] = useState('Hamburg, DE');
  const [editWeightKg, setEditWeightKg] = useState(1200);
  const [editStage, setEditStage] = useState<ShipmentStage>('order_confirmed');
  const [editLocation, setEditLocation] = useState('Export Terminal');
  const [editEta, setEditEta] = useState('2026-12-10');
  const [newLogNote, setNewLogNote] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  // Client Management state
  const [clientSearch, setClientSearch] = useState('');
  const [editingClient, setEditingClient] = useState<ClientAccount | null>(null);
  const [clientStatusEdit, setClientStatusEdit] = useState<ClientStatus>('active');
  const [clientTierEdit, setClientTierEdit] = useState<CreditTier>('Standard');
  const [clientNotesEdit, setClientNotesEdit] = useState('');

  // Reports filter state
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'confirmed_active' | OrderStatus>('all');
  const [reportIncotermFilter, setReportIncotermFilter] = useState<'all' | Incoterm>('all');
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.hsCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  const reportOrders = useMemo(() => {
    return orders.filter((o) => {
      if (reportStatusFilter === 'confirmed_active') {
        if (o.status === 'cancelled' || o.status === 'pending_review') return false;
      } else if (reportStatusFilter !== 'all' && o.status !== reportStatusFilter) {
        return false;
      }
      if (reportIncotermFilter !== 'all' && o.incoterms !== reportIncotermFilter) {
        return false;
      }
      const ms = extractDateMs(o.createdAt);
      if (reportFromDate) {
        const fromMs = Date.parse(reportFromDate);
        if (!Number.isNaN(fromMs) && ms < fromMs) return false;
      }
      if (reportToDate) {
        const toMs = Date.parse(reportToDate) + 86400000;
        if (!Number.isNaN(toMs) && ms > toMs) return false;
      }
      return true;
    });
  }, [orders, reportStatusFilter, reportIncotermFilter, reportFromDate, reportToDate]);

  const reportTotals = useMemo(() => {
    const subtotal = reportOrders.reduce((s, o) => s + o.subtotalUsd, 0);
    const freight = reportOrders.reduce((s, o) => s + o.freightUsd, 0);
    const total = reportOrders.reduce((s, o) => s + o.totalUsd, 0);
    return { subtotal, freight, total };
  }, [reportOrders]);

  const openNewProductModal = () => {
    setIsNewProduct(true);
    setHsCodeManuallyEdited(false);
    setModalImageUrlInput('');
    setModalConfirmDelete(false);
    const initialCategory = 'Clothing & Apparel';
    const autoHs = suggestGarmentHsCode('', initialCategory, '').code;
    setEditingProduct({
      id: '',
      sku: '',
      name: '',
      category: initialCategory,
      hsCode: autoHs,
      description: '',
      fobPriceUsd: 12,
      leastAmount: 10,
      highestAmount: 18,
      moq: 50,
      leastQuantity: 50,
      highestQuantity: 5000,
      productQuality: 'Export Grade A+ (220 GSM)',
      unit: 'Pieces',
      originPort: 'Chattogram, BD',
      leadTimeDays: 21,
      weightKg: 12,
      dimensions: '60 x 40 x 40 cm',
      certifications: 'OEKO-TEX Standard 100, ISO 9001',
      availability: 'in_stock',
      imageUrl: '',
      images: [],
    });
  };

  const openEditProductModal = (prod: Product) => {
    setIsNewProduct(false);
    setHsCodeManuallyEdited(Boolean(prod.hsCode && prod.hsCode.trim().length > 0));
    setModalImageUrlInput('');
    setModalConfirmDelete(false);
    const leastQty = prod.leastQuantity ?? prod.moq;
    const highestQty = prod.highestQuantity ?? Math.max(leastQty, 1000);
    const images = getProductImages(prod);
    const fallbackHs = suggestGarmentHsCode(prod.name, prod.category, prod.description).code;
    setEditingProduct({
      ...prod,
      hsCode: prod.hsCode?.trim() || fallbackHs,
      leastAmount: prod.leastAmount ?? prod.fobPriceUsd,
      highestAmount: prod.highestAmount ?? prod.fobPriceUsd,
      leastQuantity: leastQty,
      highestQuantity: highestQty,
      productQuality: prod.productQuality ?? '',
      imageUrl: images[0] || '',
      images,
    });
  };

  const handleProductImagesUpload = async (files: FileList | null) => {
    if (!editingProduct || !files || files.length === 0) return;
    const current = getProductImages(editingProduct);
    const remaining = 6 - current.length;
    if (remaining <= 0) {
      showToast('Maximum 6 pictures per product reached. Remove one first.');
      return;
    }
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      try {
        const dataUrl = await compressImageToDataUrl(file);
        if (dataUrl.length <= 350000) {
          added.push(dataUrl);
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : `Image compression failed for ${file.name}`);
      }
    }
    if (added.length > 0) {
      const next = [...current, ...added].slice(0, 6);
      setEditingProduct({
        ...editingProduct,
        images: next,
        imageUrl: next[0] || '',
      });
    }
  };

  const handleAddModalImageUrl = () => {
    if (!editingProduct) return;
    const raw = modalImageUrlInput.trim();
    if (!raw) return;
    const current = getProductImages(editingProduct);
    if (current.length >= 6) {
      showToast('Maximum 6 pictures per product reached.');
      return;
    }
    const parsedUrls = parseImageUrlList(raw);
    const candidates = parsedUrls.length > 0 ? parsedUrls : [raw];
    const next = [...current];
    let addedCount = 0;
    for (const url of candidates) {
      if (next.length >= 6) break;
      if (!next.includes(url)) {
        next.push(url);
        addedCount++;
      }
    }
    if (addedCount > 0) {
      setEditingProduct({
        ...editingProduct,
        images: next,
        imageUrl: next[0] || '',
      });
    }
    if (candidates.length > addedCount && next.length >= 6) {
      showToast('Added up to 6 pictures maximum per product.');
    }
    setModalImageUrlInput('');
  };

  const handleSetModalCoverImage = (idx: number) => {
    if (!editingProduct) return;
    const current = getProductImages(editingProduct);
    if (idx <= 0 || idx >= current.length) return;
    const next = [current[idx], ...current.filter((_, i) => i !== idx)];
    setEditingProduct({
      ...editingProduct,
      images: next,
      imageUrl: next[0] || '',
    });
  };

  const handleRemoveModalImage = (idx: number) => {
    if (!editingProduct) return;
    const current = getProductImages(editingProduct);
    const next = current.filter((_, i) => i !== idx);
    setEditingProduct({
      ...editingProduct,
      images: next,
      imageUrl: next[0] || '',
    });
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const cleanSku = sanitizeId(editingProduct.sku);
    if (!cleanSku) {
      showToast('Valid alphanumeric SKU is required.');
      return;
    }
    const leastAmt = Math.max(0, Number(editingProduct.leastAmount ?? editingProduct.fobPriceUsd));
    const highestAmt = Math.max(0, Number(editingProduct.highestAmount ?? editingProduct.fobPriceUsd));
    if (highestAmt < leastAmt) {
      showToast('Highest amount must be greater than or equal to least amount.');
      return;
    }
    const leastQty = Math.max(1, Math.floor(Number(editingProduct.leastQuantity ?? editingProduct.moq)));
    const highestQty = Math.floor(Number(editingProduct.highestQuantity ?? leastQty));
    if (highestQty < leastQty) {
      showToast('Highest quantity must be greater than or equal to least quantity.');
      return;
    }
    const cleanQuality = (editingProduct.productQuality || '').trim();
    if (!cleanQuality) {
      showToast('Please specify the product quality grade.');
      return;
    }
    const cleanHsCode = (editingProduct.hsCode || '').trim().slice(0, 32);
    if (!cleanHsCode) {
      showToast('HS Code is required before saving.');
      return;
    }
    const currentImages = getProductImages(editingProduct);
    const pendingRaw = modalImageUrlInput.trim();
    const pendingList = pendingRaw
      ? parseImageUrlList(pendingRaw).length > 0
        ? parseImageUrlList(pendingRaw)
        : [pendingRaw]
      : [];
    const finalImages = [...currentImages];
    for (const url of pendingList) {
      if (finalImages.length >= 6) break;
      if (!finalImages.includes(url)) finalImages.push(url);
    }

    setSavingProduct(true);
    try {
      await onSaveProduct(
        {
          ...editingProduct,
          id: isNewProduct ? cleanSku : editingProduct.id,
          sku: cleanSku,
          leastAmount: leastAmt,
          highestAmount: highestAmt,
          leastQuantity: leastQty,
          highestQuantity: highestQty,
          moq: leastQty,
          hsCode: cleanHsCode,
          productQuality: cleanQuality,
          imageUrl: finalImages[0] || '',
          images: finalImages,
        },
        isNewProduct
      );
      setEditingProduct(null);
      setModalImageUrlInput('');
      showToast(isNewProduct ? `Product ${cleanSku} uploaded to catalog.` : `Product ${cleanSku} updated.`);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleBulkSpecFileChange = async (file: File) => {
    setBulkError('');
    try {
      const text = await file.text();
      const parsed = parseBulkSpecFile(text, file.name, '');
      if (parsed.length === 0) {
        setBulkError('No valid product rows found. Ensure sku and name columns are populated.');
        return;
      }
      setStagedProducts(parsed);
      showToast(`Staged ${parsed.length} product specifications from ${file.name}.`);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Unable to parse bulk specification file.');
    }
  };

  const handleBulkImagesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBulkError('');
    const results: Array<{ fileName: string; baseName: string; dataUrl: string; matchedSku: string }> = [];
    const knownSkus = [
      ...products.map((p) => p.sku.toUpperCase()),
      ...stagedProducts.map((p) => p.sku.toUpperCase()),
    ];

    for (const file of Array.from(files)) {
      try {
        const dataUrl = await compressImageToDataUrl(file);
        const baseName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
        const matched =
          knownSkus.find(
            (sku) => baseName === sku || baseName.startsWith(`${sku}_`) || baseName.startsWith(`${sku}-`)
          ) || '';
        results.push({ fileName: file.name, baseName, dataUrl, matchedSku: matched });
      } catch {
        setBulkError(`Skipped unreadable image: ${file.name}`);
      }
    }

    const nextUploaded = [...uploadedImages, ...results];
    setUploadedImages(nextUploaded);

    // Auto-apply matched images (up to 6 per SKU) to stagedProducts
    if (results.some((r) => r.matchedSku)) {
      setStagedProducts((prev) =>
        prev.map((sp) => {
          const hits = results
            .filter((r) => r.matchedSku === sp.sku.toUpperCase())
            .map((r) => r.dataUrl);
          if (hits.length === 0) return sp;
          const combined = Array.from(new Set([...getProductImages(sp), ...hits])).slice(0, 6);
          return { ...sp, imageUrl: combined[0] || sp.imageUrl, images: combined };
        })
      );
    }
    showToast(`Processed ${results.length} product image(s) for assignment.`);
  };

  const assignImageToSku = (imgIndex: number, targetSku: string) => {
    const img = uploadedImages[imgIndex];
    if (!img) return;
    setUploadedImages((prev) =>
      prev.map((item, idx) => (idx === imgIndex ? { ...item, matchedSku: targetSku } : item))
    );
    if (targetSku) {
      setStagedProducts((prev) =>
        prev.map((sp) => {
          if (sp.sku !== targetSku) return sp;
          const combined = Array.from(new Set([...getProductImages(sp), img.dataUrl])).slice(0, 6);
          return { ...sp, imageUrl: combined[0] || sp.imageUrl, images: combined };
        })
      );
    }
  };

  const handleCommitBulkBatch = async () => {
    setBulkPublishing(true);
    setBulkError('');
    try {
      const imagesBySku = new Map<string, string[]>();
      for (const img of uploadedImages) {
        if (!img.matchedSku) continue;
        const arr = imagesBySku.get(img.matchedSku) || [];
        if (!arr.includes(img.dataUrl) && arr.length < 6) {
          arr.push(img.dataUrl);
        }
        imagesBySku.set(img.matchedSku, arr);
      }

      const stagedWithImages = stagedProducts.map((sp) => {
        const assigned = imagesBySku.get(sp.sku) || [];
        const combined = Array.from(new Set([...getProductImages(sp), ...assigned])).slice(0, 6);
        return {
          ...sp,
          imageUrl: combined[0] || sp.imageUrl,
          images: combined,
        };
      });

      const stagedSkuSet = new Set(stagedWithImages.map((s) => s.sku));
      const existingUpdates: Product[] = [];
      for (const [sku, imgs] of imagesBySku.entries()) {
        if (stagedSkuSet.has(sku) || imgs.length === 0) continue;
        const existingProd = products.find((p) => p.sku === sku);
        if (existingProd) {
          const combined = Array.from(new Set([...getProductImages(existingProd), ...imgs])).slice(0, 6);
          existingUpdates.push({
            ...existingProd,
            imageUrl: combined[0] || existingProd.imageUrl,
            images: combined,
          });
        }
      }

      const batch = [...stagedWithImages, ...existingUpdates];
      if (batch.length === 0) {
        setBulkError('Stage a CSV/JSON specification file or assign uploaded images to SKUs first.');
        setBulkPublishing(false);
        return;
      }
      await onBulkPublishProducts(batch);
      setStagedProducts([]);
      setUploadedImages([]);
      showToast(`Published ${batch.length} product record(s) to live catalog.`);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk publish failed.');
    } finally {
      setBulkPublishing(false);
    }
  };

  const openOrderDrawer = (order: ExportOrder) => {
    setManagingOrder(order);
    setEditOrderStatus(order.status);
    const existingShipment = shipments.find((s) => s.trackingNumber === order.trackingNumber);
    const suggestedTracking =
      order.trackingNumber || `MRD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
    setEditTrackingNumber(suggestedTracking);
    setEditCarrier(existingShipment?.carrier || 'Maersk Line');
    setEditVessel(existingShipment?.vesselName || 'MV AWP Voyager');
    setEditContainer(existingShipment?.containerNo || 'MSKU-842910-2');
    setEditOriginPort(existingShipment?.originPort || 'Hamburg, DE');
    setEditWeightKg(existingShipment?.weightKg || order.quantity * 12);
    setEditStage(existingShipment?.currentStage || 'order_confirmed');
    setEditLocation(existingShipment?.currentLocation || 'Origin Export Warehouse');
    setEditEta(existingShipment?.etaDate || '2026-12-12');
    setNewLogNote('');
  };

  const handleSaveOrderAndShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingOrder) return;
    setSavingOrder(true);
    try {
      const cleanTracking = sanitizeId(editTrackingNumber.toUpperCase());
      await onUpdateOrderAndShipment({
        order: managingOrder,
        newStatus: editOrderStatus,
        trackingNumber: cleanTracking,
        shipment: cleanTracking
          ? {
              originPort: editOriginPort.trim(),
              destinationPort: managingOrder.destinationPort,
              carrier: editCarrier.trim(),
              vesselName: editVessel.trim(),
              containerNo: editContainer.trim(),
              weightKg: Number(editWeightKg) || 0,
              currentStage: editStage,
              currentLocation: editLocation.trim(),
              etaDate: editEta.trim(),
              newLogEntry: newLogNote.trim(),
            }
          : undefined,
      });
      setManagingOrder(null);
      showToast(`Updated order ${managingOrder.orderNumber} and shipment telemetry.`);
    } finally {
      setSavingOrder(false);
    }
  };

  const openClientEditor = (c: ClientAccount) => {
    setEditingClient(c);
    setClientStatusEdit(c.status);
    setClientTierEdit(c.creditTier);
    setClientNotesEdit(c.accountNotes);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    await onUpdateClientAccount(editingClient.uid, {
      status: clientStatusEdit,
      creditTier: clientTierEdit,
      accountNotes: clientNotesEdit.trim(),
    });
    setEditingClient(null);
    showToast(`Updated client account for ${editingClient.companyName}.`);
  };

  const handleSaveModelSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelEyebrow.trim() || !modelHeadline.trim() || !modelParagraph1.trim() || !modelParagraph2.trim()) {
      showToast('Please fill in the eyebrow label, headline, and both paragraphs.');
      return;
    }
    setSavingModelContent(true);
    try {
      await onSaveBuyingHouseContent({
        eyebrow: modelEyebrow.trim(),
        headline: modelHeadline.trim(),
        paragraph1: modelParagraph1.trim(),
        paragraph2: modelParagraph2.trim(),
      });
      showToast('Homepage "The Model / About Our Buying House" section updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save section changes.');
    } finally {
      setSavingModelContent(false);
    }
  };

  const handleSaveWhatsAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeWhatsAppNumber(whatsappInput);
    if (cleaned.length < 7 || cleaned.length > 20) {
      showToast('Enter a valid phone number with country code (7–20 digits, no + or spaces).');
      return;
    }
    setSavingWhatsApp(true);
    try {
      await onSaveWhatsAppNumber(cleaned);
      setWhatsappInput(cleaned);
      showToast(`WhatsApp Business number updated to ${cleaned}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save WhatsApp Business number.');
    } finally {
      setSavingWhatsApp(false);
    }
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Customizer', icon: Package },
    { id: 'bulk', label: 'Bulk Upload & Media', icon: Upload },
    { id: 'orders', label: 'Incoming Orders', icon: ShoppingCart },
    { id: 'clients', label: 'Client Accounts', icon: Users },
    { id: 'inquiries', label: 'Trade Inquiries', icon: Mail },
    { id: 'content', label: 'Buying House / About', icon: FileText },
    { id: 'reports', label: 'Sales Reports (CSV/PDF)', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const allAssignableSkus = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => map.set(p.sku, p.name));
    stagedProducts.forEach((p) => map.set(p.sku, p.name));
    return Array.from(map.entries());
  }, [products, stagedProducts]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Sidebar (260px on desktop) */}
      <aside className="lg:w-[260px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 flex flex-col justify-between">
        <div>
          <div className="px-3 py-2">
            <div className="text-xs font-bold text-slate-900">Private Admin / Owner Panel</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Owner-only catalog &amp; operations</div>
          </div>
          <nav className="mt-2 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block pt-6 mt-6 border-t border-slate-200 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_LABELS[code]}
                </option>
              ))}
            </select>
          </div>
          <div className="text-[11px] text-slate-500 truncate">{adminEmail}</div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onBackToStorefront}
              className="w-full py-2 px-3 text-left text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Customer Panel · Storefront
            </button>
            <button
              type="button"
              onClick={onSwitchToClientPortal}
              className="w-full py-2 px-3 text-left text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Customer Panel · Buyer View
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Contextual Top Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs font-medium text-slate-500">
            Private Admin Panel /{' '}
            <span className="text-slate-900 font-semibold">
              {navItems.find((i) => i.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToStorefront}
              className="lg:hidden px-3 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Customer Panel
            </button>
            <button
              type="button"
              onClick={openNewProductModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload / Add Product</span>
            </button>
          </div>
        </div>

        <div className="p-6 lg:p-8 max-w-[1200px]">
          {toastMsg && (
            <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{toastMsg}</span>
              </div>
              <button type="button" onClick={() => setToastMsg('')} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <AdminSummaryCharts
                t={t}
                products={products}
                orders={orders}
                inquiries={inquiries}
                clients={clients}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onFilterOrdersByStatus={(status) => setOrderStatusFilter(status)}
                onFilterProductsByCategory={(category) => setProductSearch(category)}
                onOpenNewProduct={openNewProductModal}
              />

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Recent Incoming Customer Orders</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Manage All Orders
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Buyer Company</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4 text-right">Total (USD)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {orders.slice(0, 6).map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                            {o.orderNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-800">{o.companyName}</td>
                          <td className="py-3 px-4 text-slate-600 truncate max-w-[220px]">
                            {o.productName}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                            ${o.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {t.orderStatuses[o.status]}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openOrderDrawer(o)}
                              className="font-semibold text-blue-700 hover:underline cursor-pointer"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT LISTINGS */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Filter listings by SKU, name, HS code..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('bulk')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Bulk Upload Specs & Images</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">SKU / Port</th>
                        <th className="py-3 px-4">Quality</th>
                        <th className="py-3 px-4 text-right">Qty (Least – Highest)</th>
                        <th className="py-3 px-4 text-right">Amount (USD)</th>
                        <th className="py-3 px-4">Availability</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {filteredProducts.map((prod) => {
                        const leastQty = prod.leastQuantity ?? prod.moq;
                        const highestQty = prod.highestQuantity;
                        const prodImages = getProductImages(prod);
                        return (
                          <tr key={prod.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-9 rounded overflow-hidden border border-slate-200 shrink-0">
                                  <SafeImage
                                    src={prodImages[0] || ''}
                                    alt={prod.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900">{prod.name}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {prod.category}
                                    {prodImages.length > 1 ? ` · ${prodImages.length} photos` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700 tabular-nums">
                              <div>{prod.sku}</div>
                              <div className="text-[11px] font-sans text-slate-500">{prod.originPort}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate">
                              {prod.productQuality || '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                              {highestQty && highestQty >= leastQty
                                ? `${leastQty.toLocaleString('en-US')} – ${highestQty.toLocaleString('en-US')} ${prod.unit}`
                                : `${leastQty.toLocaleString('en-US')}+ ${prod.unit}`}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                              {prod.leastAmount !== undefined &&
                              prod.highestAmount !== undefined &&
                              prod.highestAmount > prod.leastAmount
                                ? `$${prod.leastAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} – $${prod.highestAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                : `$${prod.fobPriceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700">
                              {t.catalog.availability[prod.availability]}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap space-x-3">
                              <button
                                type="button"
                                onClick={() => openEditProductModal(prod)}
                                className="font-semibold text-blue-700 hover:underline cursor-pointer"
                              >
                                Customize / Edit
                              </button>
                              {confirmDeleteProductId === prod.id ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={deletingProductId === prod.id}
                                    onClick={async () => {
                                      setDeletingProductId(prod.id);
                                      try {
                                        await onDeleteProduct(prod.id);
                                        setConfirmDeleteProductId(null);
                                        showToast(`Deleted ${prod.name} (${prod.sku}) from catalog.`);
                                      } catch (err) {
                                        showToast(
                                          err instanceof Error
                                            ? err.message
                                            : 'Unable to delete product.'
                                        );
                                      } finally {
                                        setDeletingProductId(null);
                                      }
                                    }}
                                    className="px-2 py-1 bg-red-700 text-white text-[11px] font-semibold rounded hover:bg-red-800 disabled:opacity-50 cursor-pointer"
                                  >
                                    {deletingProductId === prod.id ? '...' : 'Confirm'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={deletingProductId === prod.id}
                                    onClick={() => setConfirmDeleteProductId(null)}
                                    className="px-2 py-1 border border-slate-300 text-slate-700 text-[11px] font-semibold rounded hover:bg-slate-50 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProductId(prod.id)}
                                  aria-label={`Delete ${prod.name}`}
                                  className="text-red-700 hover:text-red-900 font-semibold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BULK UPLOAD SPECS & IMAGES */}
          {activeTab === 'bulk' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bulk Spec CSV/JSON Importer */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="text-sm font-bold text-slate-900">
                    1. Bulk Product Specifications (CSV or JSON)
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Import multiple SKUs, HS tariff codes, FOB prices, weights, dimensions, and certifications at once.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={downloadBulkProductTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV Template</span>
                    </button>
                  </div>

                  <label className="mt-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-600 transition-colors cursor-pointer bg-slate-50">
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-800">
                      Click to select .csv or .json specification sheet
                    </span>
                    <span className="mt-1 text-[11px] text-slate-500">
                      Columns: sku, name, category, hsCode, fobPriceUsd, moq, unit, originPort, leadTimeDays, weightKg, dimensions
                    </span>
                    <input
                      type="file"
                      accept=".csv,.json,text/csv,application/json"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleBulkSpecFileChange(file);
                      }}
                    />
                  </label>
                </div>

                {/* Bulk Image Uploader */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="text-sm font-bold text-slate-900">
                    2. Bulk Product Image Uploader
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Select multiple JPG, PNG, or WebP files. Images matching a SKU filename (e.g. MRD-PMP-420.jpg) link automatically, or assign them manually below.
                  </p>

                  <label className="mt-5 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-600 transition-colors cursor-pointer bg-slate-50">
                    <ImagePlus className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-800">
                      Select multiple product images
                    </span>
                    <span className="mt-1 text-[11px] text-slate-500">
                      Auto-optimized to 760px JPEG for rapid international catalog delivery
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => void handleBulkImagesSelect(e.target.files)}
                    />
                  </label>
                </div>
              </div>

              {bulkError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">
                  {bulkError}
                </div>
              )}

              {/* Uploaded Images SKU Assignment Grid */}
              {uploadedImages.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-slate-900">
                    Processed Product Images ({uploadedImages.length})
                  </h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                        <img
                          src={img.dataUrl}
                          alt={img.fileName}
                          className="w-16 h-12 object-cover rounded border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-slate-800 truncate">{img.fileName}</div>
                          <select
                            value={img.matchedSku}
                            onChange={(e) => assignImageToSku(idx, e.target.value)}
                            className="mt-1.5 w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                          >
                            <option value="">Assign to SKU...</option>
                            {allAssignableSkus.map(([sku, name]) => (
                              <option key={sku} value={sku}>
                                {sku} — {name.slice(0, 26)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staged Specifications Preview Table */}
              {stagedProducts.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Staged Specification Batch ({stagedProducts.length} items)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStagedProducts([])}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Clear Staging
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                          <th className="py-2.5 px-4">Image</th>
                          <th className="py-2.5 px-4">SKU</th>
                          <th className="py-2.5 px-4">Product Name</th>
                          <th className="py-2.5 px-4">HS Code</th>
                          <th className="py-2.5 px-4 text-right">FOB Price</th>
                          <th className="py-2.5 px-4 text-right">MOQ</th>
                          <th className="py-2.5 px-4">Origin Port</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {stagedProducts.map((sp) => (
                          <tr key={sp.sku}>
                            <td className="py-2.5 px-4">
                              <SafeImage
                                src={getProductImages(sp)[0] || ''}
                                alt={sp.name}
                                fallbackLabel="No image"
                                className="w-12 h-9 object-cover rounded border border-slate-200"
                              />
                            </td>
                            <td className="py-2.5 px-4 font-mono font-semibold">{sp.sku}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-900">{sp.name}</td>
                            <td className="py-2.5 px-4 font-mono">{sp.hsCode}</td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                              ${sp.fobPriceUsd.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                              {sp.moq} {sp.unit}
                            </td>
                            <td className="py-2.5 px-4">{sp.originPort}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(stagedProducts.length > 0 || uploadedImages.some((i) => i.matchedSku)) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={bulkPublishing}
                    onClick={handleCommitBulkBatch}
                    className="px-6 py-3 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                  >
                    {bulkPublishing ? 'Publishing to Firestore...' : 'Publish Batch to Live Catalog'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INCOMING ORDERS & SHIPMENT UPDATES */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                    orderStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All ({orders.length})
                </button>
                {ORDER_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                      orderStatusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {t.orderStatuses[st]}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Client / Destination</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4 text-right">Qty</th>
                        <th className="py-3 px-4 text-right">Total (USD)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Tracking Ref</th>
                        <th className="py-3 px-4 text-right">Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                            {o.orderNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{o.companyName}</div>
                            <div className="text-[11px] text-slate-500">
                              {o.incoterms} · {o.destinationPort}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">{o.productName}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{o.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                            ${o.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {t.orderStatuses[o.status]}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {o.trackingNumber || '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openOrderDrawer(o)}
                              className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-md hover:bg-blue-700 cursor-pointer"
                            >
                              Manage & Track
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLIENT ACCOUNTS */}
          {activeTab === 'clients' && (
            <div className="space-y-5">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search clients by company, country, email..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                        <th className="py-3 px-4">Company & Contact</th>
                        <th className="py-3 px-4">Country / Port</th>
                        <th className="py-3 px-4">Tax / EORI ID</th>
                        <th className="py-3 px-4">Credit Tier</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4 text-right">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredClients.map((c) => (
                        <tr key={c.uid} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{c.companyName}</div>
                            <div className="text-[11px] text-slate-500">
                              {c.contactName} · {c.email}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {c.country} · {c.destinationPort || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{c.taxId || '—'}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{c.creditTier}</td>
                          <td className="py-3 px-4 capitalize text-slate-700">
                            {c.status.replace(/_/g, ' ')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openClientEditor(c)}
                              className="font-semibold text-blue-700 hover:underline cursor-pointer"
                            >
                              Edit Terms
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TRADE INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {inquiries.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-600">
                  No incoming trade inquiries yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {inq.companyName} — {inq.productInterest}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {inq.contactName} ({inq.email}) · {inq.country} · {inq.destinationPort || 'Port TBD'} ·{' '}
                          {inq.estimatedVolume} · {inq.incoterms}
                        </div>
                        <p className="mt-2 text-xs text-slate-700 max-w-3xl">{inq.message}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <select
                          value={inq.status}
                          onChange={(e) => onUpdateInquiryStatus(inq.id, e.target.value as InquiryStatus)}
                          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                        >
                          <option value="new">New</option>
                          <option value="in_review">In Review</option>
                          <option value="quoted">Quoted</option>
                          <option value="archived">Archived</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => onDeleteInquiry(inq.id)}
                          aria-label="Delete inquiry"
                          className="p-1.5 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SALES REPORTS (CSV & PDF EXPORT) */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Export Accounting & Sales Ledger
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                      Filter confirmed and dispatched orders by date range, status, or Incoterms, then export directly for ERP or tax accounting.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        exportOrdersToCsv(
                          reportOrders,
                          `${reportStatusFilter} / ${reportIncotermFilter}`
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        exportOrdersToPdf(
                          reportOrders,
                          `${reportStatusFilter} / ${reportIncotermFilter}`
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Export PDF Ledger</span>
                    </button>
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Order Status Scope
                    </label>
                    <select
                      value={reportStatusFilter}
                      onChange={(e) =>
                        setReportStatusFilter(
                          e.target.value as 'all' | 'confirmed_active' | OrderStatus
                        )
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="all">All Orders</option>
                      <option value="confirmed_active">Confirmed & Fulfilled Only</option>
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {t.orderStatuses[st]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Incoterms Filter
                    </label>
                    <select
                      value={reportIncotermFilter}
                      onChange={(e) => setReportIncotermFilter(e.target.value as 'all' | Incoterm)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="all">All Incoterms</option>
                      {INCOTERMS_OPTIONS.map((term) => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={reportFromDate}
                      onChange={(e) => setReportFromDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={reportToDate}
                      onChange={(e) => setReportToDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Accounting Totals Strip */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-slate-200">
                  <div>
                    <span className="text-xs text-slate-500">Merchandise Subtotal (FOB)</span>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                      ${reportTotals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Freight & Insurance Billed</span>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                      ${reportTotals.freight.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Gross Invoice Total ({reportOrders.length} orders)</span>
                    <div className="mt-1 font-mono text-lg font-bold text-blue-800 tabular-nums">
                      ${reportTotals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Terms / Port</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                        <th className="py-3 px-4 text-right">Freight</th>
                        <th className="py-3 px-4 text-right">Total (USD)</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                            {o.orderNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-800">{o.companyName}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {o.incoterms} · {o.destinationPort}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            ${o.subtotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            ${o.freightUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                            ${o.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4">{t.orderStatuses[o.status]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BUYING HOUSE / MODEL EDITORIAL SECTION EDITOR */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      The Model / About Our Buying House
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                      Edit the eyebrow label, headline, and paragraphs displayed right below the Product Catalog on the homepage. Changes save directly to Firestore for all visitors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onBackToStorefront();
                      setTimeout(() => {
                        document.getElementById('about-model')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="px-3.5 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                  >
                    View Section on Homepage
                  </button>
                </div>

                <form onSubmit={handleSaveModelSection} className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="model-eyebrow-input"
                      className="block text-xs font-semibold text-slate-800 mb-1.5"
                    >
                      Eyebrow Label (Uppercase Gold / Amber)
                    </label>
                    <input
                      id="model-eyebrow-input"
                      type="text"
                      required
                      maxLength={80}
                      value={modelEyebrow}
                      onChange={(e) => setModelEyebrow(e.target.value)}
                      placeholder="THE MODEL"
                      className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="model-headline-input"
                      className="block text-xs font-semibold text-slate-800 mb-1.5"
                    >
                      Section Headline
                    </label>
                    <input
                      id="model-headline-input"
                      type="text"
                      required
                      maxLength={200}
                      value={modelHeadline}
                      onChange={(e) => setModelHeadline(e.target.value)}
                      placeholder="What is a Buying House in Bangladesh?"
                      className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="model-p1-input"
                      className="block text-xs font-semibold text-slate-800 mb-1.5"
                    >
                      Paragraph 1
                    </label>
                    <textarea
                      id="model-p1-input"
                      rows={5}
                      required
                      maxLength={3000}
                      value={modelParagraph1}
                      onChange={(e) => setModelParagraph1(e.target.value)}
                      className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                    <div className="mt-1 text-[11px] text-slate-400 font-mono text-right">
                      {modelParagraph1.length} / 3000
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="model-p2-input"
                      className="block text-xs font-semibold text-slate-800 mb-1.5"
                    >
                      Paragraph 2
                    </label>
                    <textarea
                      id="model-p2-input"
                      rows={5}
                      required
                      maxLength={3000}
                      value={modelParagraph2}
                      onChange={(e) => setModelParagraph2(e.target.value)}
                      className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                    <div className="mt-1 text-[11px] text-slate-400 font-mono text-right">
                      {modelParagraph2.length} / 3000
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={savingModelContent}
                      className="px-5 py-3 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 touch-manipulation cursor-pointer"
                    >
                      {savingModelContent ? 'Saving Changes...' : 'Save Section Changes'}
                    </button>
                    <button
                      type="button"
                      disabled={savingModelContent}
                      onClick={() => {
                        setModelEyebrow(DEFAULT_BUYING_HOUSE_CONTENT.eyebrow);
                        setModelHeadline(DEFAULT_BUYING_HOUSE_CONTENT.headline);
                        setModelParagraph1(DEFAULT_BUYING_HOUSE_CONTENT.paragraph1);
                        setModelParagraph2(DEFAULT_BUYING_HOUSE_CONTENT.paragraph2);
                        showToast('Restored default Meridian Export Group text. Click Save to publish.');
                      }}
                      className="px-4 py-3 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 touch-manipulation cursor-pointer"
                    >
                      Reset to Default Text
                    </button>
                  </div>
                </form>
              </div>

              {/* Live Editorial Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-5">
                  Live Homepage Preview
                </div>
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                    {modelEyebrow || DEFAULT_BUYING_HOUSE_CONTENT.eyebrow}
                  </p>
                  <h3 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                    {modelHeadline || DEFAULT_BUYING_HOUSE_CONTENT.headline}
                  </h3>
                  <div className="mt-5 space-y-5 text-sm sm:text-base text-slate-700 leading-[1.8]">
                    <p>{modelParagraph1 || DEFAULT_BUYING_HOUSE_CONTENT.paragraph1}</p>
                    <p>{modelParagraph2 || DEFAULT_BUYING_HOUSE_CONTENT.paragraph2}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SETTINGS (WHATSAPP BUSINESS NUMBER) */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 max-w-2xl">
                <div className="pb-5 border-b border-slate-200">
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Admin Panel Settings
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Manage your live WhatsApp Business contact number saved in Firebase. Updates immediately apply to the floating chat button on every page and all product inquiry buttons.
                  </p>
                </div>

                <form onSubmit={handleSaveWhatsAppSettings} className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="whatsapp-number-input"
                      className="block text-xs font-semibold text-slate-800 mb-1.5"
                    >
                      WhatsApp Business Number
                    </label>
                    <input
                      id="whatsapp-number-input"
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={24}
                      value={whatsappInput}
                      onChange={(e) => setWhatsappInput(e.target.value)}
                      placeholder="8801897280968"
                      className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-lg font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Format: Country code + phone number with no plus sign or spaces (e.g.{' '}
                      <span className="font-mono font-semibold text-slate-700">8801897280968</span>). Any spaces or + signs are stripped automatically.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-1.5">
                    <div className="text-slate-500 font-medium">Active WhatsApp Chat Link</div>
                    <div className="font-mono text-slate-900 break-all">
                      {buildWhatsAppUrl(whatsappInput)}
                    </div>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={savingWhatsApp}
                      className="px-5 py-3 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 touch-manipulation cursor-pointer"
                    >
                      {savingWhatsApp ? 'Saving...' : 'Save WhatsApp Number'}
                    </button>
                    <a
                      href={buildWhatsAppUrl(whatsappInput)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-3 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold rounded-lg transition-colors touch-manipulation"
                    >
                      <WhatsAppIcon className="w-4 h-4 shrink-0" />
                      <span>Test WhatsApp Link</span>
                    </a>
                    <button
                      type="button"
                      disabled={savingWhatsApp}
                      onClick={() => {
                        setWhatsappInput(DEFAULT_WHATSAPP_NUMBER);
                        showToast(`Reset to ${DEFAULT_WHATSAPP_NUMBER}. Click Save to apply.`);
                      }}
                      className="px-4 py-3 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 touch-manipulation cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {isNewProduct ? 'Upload & Customize Product' : `Customize & Update ${editingProduct.sku}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductForm} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    disabled={!isNewProduct}
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    placeholder="e.g. AWP-POLO-101"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.category}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      setEditingProduct((prev) => {
                        if (!prev) return prev;
                        const nextHs = hsCodeManuallyEdited
                          ? prev.hsCode
                          : suggestGarmentHsCode(prev.name, nextCategory, prev.description).code;
                        return { ...prev, category: nextCategory, hsCode: nextHs };
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setEditingProduct((prev) => {
                        if (!prev) return prev;
                        const nextHs = hsCodeManuallyEdited
                          ? prev.hsCode
                          : suggestGarmentHsCode(nextName, prev.category, prev.description).code;
                        return { ...prev, name: nextName, hsCode: nextHs };
                      });
                    }}
                    placeholder="e.g. Heavyweight Pique Polo Shirt"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Product Quality</label>
                  <input
                    type="text"
                    required
                    list="admin-quality-grade-presets"
                    value={editingProduct.productQuality ?? ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, productQuality: e.target.value })
                    }
                    placeholder="e.g. Export Grade A+ (220 GSM)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <datalist id="admin-quality-grade-presets">
                    <option value="Export Grade A+ (220 GSM)" />
                    <option value="100% Combed Ring-Spun Cotton" />
                    <option value="OEKO-TEX Certified Export Grade" />
                    <option value="Heavyweight 320 GSM Fleece" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Least Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingProduct.leastQuantity ?? editingProduct.moq}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        leastQuantity: val,
                        moq: val,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Highest Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={
                      editingProduct.highestQuantity ??
                      (editingProduct.leastQuantity ?? editingProduct.moq)
                    }
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        highestQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block font-medium text-slate-700">HS Code</label>
                    <button
                      type="button"
                      onClick={() => {
                        const suggested = suggestGarmentHsCode(
                          editingProduct.name,
                          editingProduct.category,
                          editingProduct.description
                        );
                        setHsCodeManuallyEdited(false);
                        setEditingProduct({ ...editingProduct, hsCode: suggested.code });
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
                    value={editingProduct.hsCode}
                    onChange={(e) => {
                      setHsCodeManuallyEdited(true);
                      setEditingProduct({ ...editingProduct, hsCode: e.target.value });
                    }}
                    placeholder="e.g. 6109.10.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <span>
                  Suggested tariff:{' '}
                  <span className="font-mono font-semibold text-slate-900">
                    {
                      suggestGarmentHsCode(
                        editingProduct.name,
                        editingProduct.category,
                        editingProduct.description
                      ).code
                    }
                  </span>{' '}
                  (
                  {
                    suggestGarmentHsCode(
                      editingProduct.name,
                      editingProduct.category,
                      editingProduct.description
                    ).label
                  }
                  )
                </span>
                <span className="text-slate-500">
                  {hsCodeManuallyEdited
                    ? 'Manual edit active — click Auto-Detect to regenerate'
                    : 'Auto-updating from product name & category'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">FOB Unit Price (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={editingProduct.fobPriceUsd}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, fobPriceUsd: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Least Amount (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={editingProduct.leastAmount ?? editingProduct.fobPriceUsd}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, leastAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Highest Amount (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={editingProduct.highestAmount ?? editingProduct.fobPriceUsd}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, highestAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Origin Port</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.originPort}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, originPort: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingProduct.leadTimeDays}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, leadTimeDays: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    required
                    value={editingProduct.weightKg}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, weightKg: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Availability</label>
                  <select
                    value={editingProduct.availability}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        availability: e.target.value as ProductAvailability,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="in_stock">Ready for Dispatch</option>
                    <option value="made_to_order">Made to Order</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Dimensions</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.dimensions}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, dimensions: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Certifications</label>
                  <input
                    type="text"
                    value={editingProduct.certifications}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, certifications: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={editingProduct.description}
                  onChange={(e) => {
                    const nextDesc = e.target.value;
                    setEditingProduct((prev) => {
                      if (!prev) return prev;
                      const nextHs = hsCodeManuallyEdited
                        ? prev.hsCode
                        : suggestGarmentHsCode(prev.name, prev.category, nextDesc).code;
                      return { ...prev, description: nextDesc, hsCode: nextHs };
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-slate-700">
                    Product Pictures ({getProductImages(editingProduct).length}/6)
                  </label>
                  {getProductImages(editingProduct).length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({ ...editingProduct, imageUrl: '', images: [] })
                      }
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-800 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer">
                    <ImagePlus className="w-3.5 h-3.5 text-blue-700" />
                    <span>Upload Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        void handleProductImagesUpload(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    value={modalImageUrlInput}
                    onChange={(e) => setModalImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddModalImageUrl();
                      }
                    }}
                    placeholder="Paste image URL(s), separated by commas (https://...)"
                    className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddModalImageUrl}
                    disabled={!modalImageUrlInput.trim() || getProductImages(editingProduct).length >= 6}
                    className="px-3 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                  >
                    Add URL(s)
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select multiple garment photos from your phone gallery at once (Front View, Back View, Fabric Close-up, Stitching Detail) or paste multiple URLs.
                </p>

                {getProductImages(editingProduct).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {getProductImages(editingProduct).map((url, idx) => (
                      <div
                        key={`${idx}-${url.slice(0, 20)}`}
                        className={`relative border rounded-lg overflow-hidden bg-slate-50 ${
                          idx === 0 ? 'border-blue-700 ring-1 ring-blue-700/20' : 'border-slate-200'
                        }`}
                      >
                        <SafeImage
                          src={url}
                          alt={`${editingProduct.name || 'Product'} photo ${idx + 1}`}
                          className="w-full aspect-[4/3] object-cover"
                        />
                        <button
                          type="button"
                          aria-label={`Remove photo ${idx + 1}`}
                          onClick={() => handleRemoveModalImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded bg-slate-900/80 text-white flex items-center justify-center hover:bg-red-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="px-1.5 py-1 bg-white border-t border-slate-100 flex items-center justify-between text-[10px]">
                          {idx === 0 ? (
                            <span className="font-semibold text-blue-700">Cover</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetModalCoverImage(idx)}
                              className="text-slate-600 hover:text-blue-700 underline cursor-pointer"
                            >
                              Set Cover
                            </button>
                          )}
                          <span className="font-mono text-slate-400">#{idx + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                <div>
                  {!isNewProduct && editingProduct.id && (
                    modalConfirmDelete ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={deletingProductId === editingProduct.id}
                          onClick={async () => {
                            const targetId = editingProduct.id;
                            const targetName = editingProduct.name;
                            setDeletingProductId(targetId);
                            try {
                              await onDeleteProduct(targetId);
                              setEditingProduct(null);
                              setModalConfirmDelete(false);
                              showToast(`Deleted ${targetName} from catalog.`);
                            } catch (err) {
                              showToast(
                                err instanceof Error ? err.message : 'Unable to delete product.'
                              );
                            } finally {
                              setDeletingProductId(null);
                            }
                          }}
                          className="px-3.5 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 disabled:opacity-50 cursor-pointer"
                        >
                          {deletingProductId === editingProduct.id
                            ? 'Deleting...'
                            : 'Confirm Delete'}
                        </button>
                        <button
                          type="button"
                          disabled={deletingProductId === editingProduct.id}
                          onClick={() => setModalConfirmDelete(false)}
                          className="px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setModalConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-200 text-red-700 rounded-lg font-semibold hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Product</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="px-5 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 cursor-pointer"
                  >
                    {savingProduct ? 'Saving...' : 'Save Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order & Real-Time Shipment Control Drawer */}
      {managingOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Manage Order {managingOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-600">
                  {managingOrder.companyName} · {managingOrder.destinationPort}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingOrder(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderAndShipment} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Order Status</label>
                  <select
                    value={editOrderStatus}
                    onChange={(e) => setEditOrderStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {t.orderStatuses[st]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={editTrackingNumber}
                    onChange={(e) => setEditTrackingNumber(e.target.value)}
                    placeholder="e.g. MRD-2026-8841"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <div className="font-semibold text-slate-900 mb-3">
                  Live Shipment Telemetry & Milestones
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Shipment Stage</label>
                    <select
                      value={editStage}
                      onChange={(e) => setEditStage(e.target.value as ShipmentStage)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {SHIPMENT_STAGES.map((stg) => (
                        <option key={stg} value={stg}>
                          {t.tracking.stages[stg]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">ETA Date</label>
                    <input
                      type="date"
                      value={editEta}
                      onChange={(e) => setEditEta(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Carrier</label>
                    <input
                      type="text"
                      value={editCarrier}
                      onChange={(e) => setEditCarrier(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Vessel Name</label>
                    <input
                      type="text"
                      value={editVessel}
                      onChange={(e) => setEditVessel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Container No.</label>
                    <input
                      type="text"
                      value={editContainer}
                      onChange={(e) => setEditContainer(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Origin Port</label>
                    <input
                      type="text"
                      value={editOriginPort}
                      onChange={(e) => setEditOriginPort(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      min={0}
                      value={editWeightKg}
                      onChange={(e) => setEditWeightKg(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block font-medium text-slate-700 mb-1">Current Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="mt-3">
                  <label className="block font-medium text-slate-700 mb-1">
                    Append Tracking Milestone Note (optional)
                  </label>
                  <input
                    type="text"
                    value={newLogNote}
                    onChange={(e) => setNewLogNote(e.target.value)}
                    placeholder="e.g. Customs clearance completed at Rotterdam Terminal"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setManagingOrder(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOrder}
                  className="px-5 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 cursor-pointer"
                >
                  {savingOrder ? 'Saving...' : 'Save Order & Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Credit & Status Editor Modal */}
      {editingClient && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-display text-base font-bold text-slate-900">
                {editingClient.companyName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveClient} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                <select
                  value={clientStatusEdit}
                  onChange={(e) => setClientStatusEdit(e.target.value as ClientStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="active">Active</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Credit & Payment Tier</label>
                <select
                  value={clientTierEdit}
                  onChange={(e) => setClientTierEdit(e.target.value as CreditTier)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Standard">Standard (Prepaid / TT)</option>
                  <option value="Net-30">Net-30 Corporate Credit</option>
                  <option value="LC-Verified">LC-Verified (Letter of Credit)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Internal Account Notes</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={clientNotesEdit}
                  onChange={(e) => setClientNotesEdit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 cursor-pointer"
                >
                  Save Client Terms
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExportOrder, Incoterm, Product, ProductAvailability } from '../types';

function csvEscape(val: string | number): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDateYmd(ts: unknown): string {
  if (!ts) return new Date().toISOString().slice(0, 10);
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
  }
  if (ts instanceof Date) return ts.toISOString().slice(0, 10);
  return String(ts).slice(0, 10);
}

export function exportOrdersToCsv(orders: ExportOrder[], reportLabel: string): void {
  const headers = [
    'Order Number',
    'Date',
    'Client Company',
    'Client Email',
    'Destination Country',
    'Destination Port',
    'Incoterms',
    'SKU',
    'Product',
    'Quantity',
    'Unit Price (USD)',
    'Subtotal (USD)',
    'Freight (USD)',
    'Total (USD)',
    'Status',
    'Tracking Number',
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    formatDateYmd(o.createdAt),
    o.companyName,
    o.clientEmail,
    o.country,
    o.destinationPort,
    o.incoterms,
    o.productSku,
    o.productName,
    o.quantity,
    o.unitPriceUsd.toFixed(2),
    o.subtotalUsd.toFixed(2),
    o.freightUsd.toFixed(2),
    o.totalUsd.toFixed(2),
    o.status,
    o.trackingNumber || 'Unassigned',
  ]);

  const totalSubtotal = orders.reduce((acc, o) => acc + o.subtotalUsd, 0);
  const totalFreight = orders.reduce((acc, o) => acc + o.freightUsd, 0);
  const grandTotal = orders.reduce((acc, o) => acc + o.totalUsd, 0);

  rows.push([
    'TOTAL',
    reportLabel,
    `${orders.length} Orders`,
    '',
    '',
    '',
    '',
    '',
    '',
    orders.reduce((acc, o) => acc + o.quantity, 0),
    '',
    totalSubtotal.toFixed(2),
    totalFreight.toFixed(2),
    grandTotal.toFixed(2),
    '',
    '',
  ]);

  const csvContent = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `awp-international-traders-sales-ledger-${dateStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportOrdersToPdf(orders: ExportOrder[], reportLabel: string): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const dateStamp = new Date().toISOString().slice(0, 10);

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 74, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('AWP International Traders — Sales & Accounting Ledger', 40, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`Report Scope: ${reportLabel}   |   Generated: ${dateStamp}   |   Currency: USD`, 40, 56);

  // Summary metrics
  const totalSubtotal = orders.reduce((acc, o) => acc + o.subtotalUsd, 0);
  const totalFreight = orders.reduce((acc, o) => acc + o.freightUsd, 0);
  const grandTotal = orders.reduce((acc, o) => acc + o.totalUsd, 0);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Orders Included: ${orders.length}`, 40, 100);
  doc.text(`FOB Merchandise Subtotal: $${totalSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 200, 100);
  doc.text(`Freight & Insurance: $${totalFreight.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 430, 100);
  doc.text(`Gross Export Revenue: $${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 620, 100);

  autoTable(doc, {
    startY: 118,
    head: [[
      'Order #',
      'Date',
      'Client Company',
      'Destination',
      'Terms',
      'SKU',
      'Qty',
      'Subtotal',
      'Freight',
      'Total (USD)',
      'Status',
    ]],
    body: orders.map((o) => [
      o.orderNumber,
      formatDateYmd(o.createdAt),
      o.companyName,
      `${o.destinationPort}`,
      o.incoterms,
      o.productSku,
      String(o.quantity),
      `$${o.subtotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${o.freightUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${o.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      o.status.replace(/_/g, ' '),
    ]),
    styles: {
      fontSize: 8.5,
      cellPadding: 6,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right', fontStyle: 'bold' },
    },
  });

  doc.save(`awp-international-traders-sales-ledger-${dateStamp}.pdf`);
}

export function downloadBulkProductTemplate(): void {
  const headers = [
    'sku',
    'name',
    'category',
    'hsCode',
    'fobPriceUsd',
    'leastAmount',
    'highestAmount',
    'leastQuantity',
    'highestQuantity',
    'productQuality',
    'moq',
    'unit',
    'originPort',
    'leadTimeDays',
    'weightKg',
    'dimensions',
    'certifications',
    'availability',
    'description',
  ];
  const sampleRows = [
    [
      'AWP-TEE-220',
      'Heavyweight 220 GSM Combed Cotton Crewneck T-Shirt',
      'Knitwear & T-Shirts',
      '6109.10.00',
      '6.50',
      '4.80',
      '6.50',
      '100',
      '10000',
      'Export Grade A+ (220 GSM Ring-Spun)',
      '100',
      'Pieces',
      'Chattogram, BD',
      '21',
      '14.5',
      '60 x 40 x 38 cm',
      'OEKO-TEX Standard 100, WRAP, ISO 9001',
      'in_stock',
      '100% ring-spun combed organic cotton jersey, pre-shrunk, export carton packed in assorted S-XXL ratios.',
    ],
    [
      'AWP-DNM-140',
      '14oz Selvedge Stretch Denim Jacket',
      'Denim & Outerwear',
      '6201.92.00',
      '18.90',
      '15.20',
      '18.90',
      '50',
      '5000',
      'Premium Mill-Certified (14oz Denim)',
      '50',
      'Pieces',
      'Chattogram, BD',
      '30',
      '22.0',
      '62 x 42 x 40 cm',
      'BSCI, OEKO-TEX Standard 100',
      'made_to_order',
      '98% cotton 2% elastane enzyme-washed denim jacket with custom branded metal shanks and polybag packing.',
    ],
  ];

  const csvContent = [headers, ...sampleRows].map((r) => r.map(csvEscape).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'awp-bulk-product-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function sanitizeId(raw: string): string {
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function sanitizeWhatsAppNumber(raw: string): string {
  return raw.replace(/\D+/g, '').slice(0, 20);
}

export function buildWhatsAppUrl(phoneDigits: string, message?: string): string {
  const cleanDigits = sanitizeWhatsAppNumber(phoneDigits) || '8801897280968';
  if (message && message.trim().length > 0) {
    return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message.trim())}`;
  }
  return `https://wa.me/${cleanDigits}`;
}

export function parseImageUrlList(raw: string): string[] {
  return raw
    .split(/[\r\n,;|]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && (/^https?:\/\//i.test(item) || item.startsWith('data:image/')));
}

export function getProductImages(
  product: Pick<Product, 'imageUrl' | 'images' | 'imageUrls'>
): string[] {
  const list: string[] = [];
  const pushUnique = (val?: string) => {
    const clean = (val || '').trim();
    if (clean && !list.includes(clean) && list.length < 6) {
      list.push(clean);
    }
  };
  if (Array.isArray(product.images)) {
    product.images.forEach(pushUnique);
  } else if (Array.isArray(product.imageUrls)) {
    product.imageUrls.forEach(pushUnique);
  }
  pushUnique(product.imageUrl);
  return list;
}

export interface HsCodeSuggestion {
  code: string;
  label: string;
}

export function suggestGarmentHsCode(
  name: string,
  category = '',
  description = ''
): HsCodeSuggestion {
  const combined = `${name} ${category} ${description}`.toLowerCase();

  if (/\b(baby|infant|toddler|newborn|onesie|romper)\b/.test(combined)) {
    return /\b(woven|denim|poplin|oxford)\b/.test(combined)
      ? { code: '6209.20.00', label: "Babies' Woven Cotton Garments" }
      : { code: '6111.20.00', label: "Babies' Knitted Cotton Garments" };
  }
  if (/\b(sock|socks|hosiery|stocking)\b/.test(combined)) {
    return { code: '6115.95.00', label: 'Cotton Knitted Socks & Hosiery' };
  }
  if (/\b(cap|hat|beanie|headwear|headgear)\b/.test(combined)) {
    return { code: '6505.00.00', label: 'Knitted or Woven Headgear & Caps' };
  }
  if (/\b(towel|terry|linen|bedsheet|bedding)\b/.test(combined)) {
    return { code: '6302.60.00', label: 'Cotton Terry & Household Textile Articles' };
  }
  if (/\b(polo|pique)\b/.test(combined)) {
    return /\b(women|ladies|female|girl)\b/.test(combined)
      ? { code: '6106.10.00', label: "Women's Knitted Cotton Polo Shirts" }
      : { code: '6105.10.00', label: "Men's / Unisex Knitted Cotton Polo Shirts" };
  }
  if (/\b(t-shirt|tshirt|tee|singlet|tank top|vest|crewneck|jersey)\b/.test(combined)) {
    return /\b(polyester|synthetic|nylon|spandex|dry-fit|dri-fit)\b/.test(combined)
      ? { code: '6109.90.00', label: 'Knitted Synthetic / Blend T-Shirts' }
      : { code: '6109.10.00', label: 'Knitted Cotton T-Shirts & Singlets' };
  }
  if (/\b(hoodie|sweatshirt|fleece|pullover|sweater|cardigan|knitwear|jumper)\b/.test(combined)) {
    return /\b(acrylic|polyester|wool|nylon|synthetic)\b/.test(combined)
      ? { code: '6110.30.00', label: 'Man-Made Fiber Sweaters & Hoodies' }
      : { code: '6110.20.00', label: 'Cotton Sweatshirts, Hoodies & Pullovers' };
  }
  if (/\b(tracksuit|track suit|jogger|activewear|sportswear|athletic|legging|gym)\b/.test(combined)) {
    return /\b(polyester|nylon|spandex|synthetic)\b/.test(combined)
      ? { code: '6112.12.00', label: 'Synthetic Knitted Tracksuits & Activewear' }
      : { code: '6112.11.00', label: 'Cotton Knitted Tracksuits & Activewear' };
  }
  if (/\b(denim|jean|jeans|chino|trouser|pant|pants|cargo|short|shorts)\b/.test(combined)) {
    return /\b(women|ladies|female|girl)\b/.test(combined)
      ? { code: '6204.62.00', label: "Women's Cotton Denim & Woven Trousers" }
      : { code: '6203.42.00', label: "Men's Cotton Denim Jeans & Trousers" };
  }
  if (/\b(jacket|coat|parka|puffer|windbreaker|outerwear|anorak|raincoat|shell)\b/.test(combined)) {
    if (/\b(blazer|suit jacket|sport coat)\b/.test(combined)) {
      return { code: '6203.32.00', label: 'Woven Cotton Suit Jackets & Blazers' };
    }
    return /\b(polyester|nylon|synthetic|waterproof|softshell)\b/.test(combined)
      ? { code: '6201.93.00', label: 'Man-Made Fiber Outerwear & Jackets' }
      : { code: '6201.92.00', label: 'Cotton Outerwear & Denim Jackets' };
  }
  if (/\b(dress|gown|skirt|frock)\b/.test(combined)) {
    return /\b(knit|knitted|jersey)\b/.test(combined)
      ? { code: '6104.42.00', label: "Women's Knitted Cotton Dresses" }
      : { code: '6204.42.00', label: "Women's Woven Cotton Dresses" };
  }
  if (/\b(blouse|tunic)\b/.test(combined)) {
    return { code: '6206.30.00', label: "Women's Woven Cotton Shirts & Blouses" };
  }
  if (/\b(shirt|oxford|poplin|flannel|chambray|twill|woven)\b/.test(combined)) {
    return /\b(women|ladies|female|girl)\b/.test(combined)
      ? { code: '6206.30.00', label: "Women's Woven Cotton Shirts" }
      : { code: '6205.20.00', label: "Men's Woven Cotton Shirts" };
  }
  if (/\b(knit)\b/.test(combined)) {
    return { code: '6109.10.00', label: 'General Knitted Cotton Apparel' };
  }

  return { code: '6205.20.00', label: 'Standard Woven Cotton Apparel' };
}

export function parseBulkSpecFile(content: string, fileName: string, defaultImage: string): Product[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  if (fileName.toLowerCase().endsWith('.json') || trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as Array<Partial<Product>>;
    if (!Array.isArray(parsed)) throw new Error('JSON file must contain an array of product objects.');
    return parsed
      .filter((item) => item.sku && item.name)
      .map((item) => {
        const cleanSku = sanitizeId(String(item.sku));
        const avail: ProductAvailability =
          item.availability === 'made_to_order' || item.availability === 'out_of_stock'
            ? item.availability
            : 'in_stock';
        const rawSource = Array.isArray(item.images)
          ? item.images
          : Array.isArray(item.imageUrls)
            ? item.imageUrls
            : [];
        const rawImgs = rawSource.map((u) => String(u).trim()).filter(Boolean).slice(0, 6);
        const primaryImg = rawImgs[0] || String(item.imageUrl || defaultImage);
        const images = rawImgs.length > 0 ? rawImgs : primaryImg ? [primaryImg] : [];
        const nameStr = String(item.name).slice(0, 160);
        const catStr = String(item.category || 'Clothing & Apparel').slice(0, 80);
        const descStr = String(item.description || 'Export-grade apparel specification listing.').slice(0, 2000);
        const autoHs = suggestGarmentHsCode(nameStr, catStr, descStr).code;
        return {
          id: cleanSku,
          sku: cleanSku,
          name: nameStr,
          category: catStr,
          hsCode: String(item.hsCode || autoHs).slice(0, 32),
          description: descStr,
          fobPriceUsd: Math.max(0, Number(item.fobPriceUsd ?? item.highestAmount ?? item.leastAmount) || 0),
          leastAmount: Math.max(0, Number(item.leastAmount ?? item.fobPriceUsd) || 0),
          highestAmount: Math.max(
            Number(item.leastAmount ?? item.fobPriceUsd) || 0,
            Number(item.highestAmount ?? item.fobPriceUsd) || 0
          ),
          leastQuantity: Math.max(1, Number(item.leastQuantity ?? item.moq) || 1),
          highestQuantity: Math.max(
            Math.max(1, Number(item.leastQuantity ?? item.moq) || 1),
            Number(item.highestQuantity ?? item.moq) || 1000
          ),
          productQuality: String(item.productQuality || 'Export Grade A').slice(0, 160),
          moq: Math.max(1, Number(item.leastQuantity ?? item.moq) || 1),
          unit: String(item.unit || 'Pieces').slice(0, 40),
          originPort: String(item.originPort || 'Rotterdam, NL').slice(0, 100),
          leadTimeDays: Math.max(1, Number(item.leadTimeDays) || 14),
          weightKg: Math.max(0, Number(item.weightKg) || 1),
          dimensions: String(item.dimensions || '40 x 30 x 30 cm').slice(0, 80),
          certifications: String(item.certifications || 'ISO 9001').slice(0, 200),
          availability: avail,
          imageUrl: primaryImg,
          images,
        };
      });
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error('CSV file must include a header row and at least one product row.');

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (key: string) => headers.indexOf(key.toLowerCase());

  const products: Product[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const get = (key: string, fallback = '') => {
      const pos = idx(key);
      return pos >= 0 && cols[pos] !== undefined ? cols[pos] : fallback;
    };
    const rawSku = get('sku');
    const rawName = get('name');
    if (!rawSku || !rawName) continue;
    const cleanSku = sanitizeId(rawSku);
    const rawAvail = get('availability', 'in_stock');
    const availability: ProductAvailability =
      rawAvail === 'made_to_order' || rawAvail === 'out_of_stock' ? rawAvail : 'in_stock';
    const rawImageList = (get('images') || get('imageUrls') || get('imageUrl', defaultImage) || defaultImage)
      .split(/[|;]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    const primaryImg = rawImageList[0] || defaultImage;
    const catStr = get('category', 'Clothing & Apparel').slice(0, 80);
    const descStr = get('description', 'Export-grade apparel specification listing.').slice(0, 2000);
    const autoHs = suggestGarmentHsCode(rawName, catStr, descStr).code;

    products.push({
      id: cleanSku,
      sku: cleanSku,
      name: rawName.slice(0, 160),
      category: catStr,
      hsCode: get('hsCode', autoHs).slice(0, 32),
      description: descStr,
      fobPriceUsd: Math.max(0, Number(get('fobPriceUsd', get('highestAmount', '0'))) || 0),
      leastAmount: Math.max(0, Number(get('leastAmount', get('fobPriceUsd', '0'))) || 0),
      highestAmount: Math.max(
        Number(get('leastAmount', get('fobPriceUsd', '0'))) || 0,
        Number(get('highestAmount', get('fobPriceUsd', '0'))) || 0
      ),
      leastQuantity: Math.max(1, Number(get('leastQuantity', get('moq', '1'))) || 1),
      highestQuantity: Math.max(
        Math.max(1, Number(get('leastQuantity', get('moq', '1'))) || 1),
        Number(get('highestQuantity', get('moq', '1000'))) || 1000
      ),
      productQuality: get('productQuality', 'Export Grade A').slice(0, 160),
      moq: Math.max(1, Number(get('leastQuantity', get('moq', '1'))) || 1),
      unit: get('unit', 'Pieces').slice(0, 40),
      originPort: get('originPort', 'Hamburg, DE').slice(0, 100),
      leadTimeDays: Math.max(1, Number(get('leadTimeDays', '14')) || 14),
      weightKg: Math.max(0, Number(get('weightKg', '10')) || 10),
      dimensions: get('dimensions', '40 x 30 x 30 cm').slice(0, 80),
      certifications: get('certifications', 'ISO 9001').slice(0, 200),
      availability,
      imageUrl: primaryImg,
      images: rawImageList.length > 0 ? rawImageList : primaryImg ? [primaryImg] : [],
    });
  }

  return products;
}

export async function compressImageToDataUrl(file: File, maxDim = 680, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Invalid image file: ${file.name}`));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const INCOTERMS_OPTIONS: Incoterm[] = ['FOB', 'CIF', 'EXW', 'DDP', 'CFR'];

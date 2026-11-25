import { ArrowRight, BarChart3, Clock, Mail, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { TranslationBundle } from '../i18n/translations';
import type {
  ClientAccount,
  ContactInquiry,
  ExportOrder,
  InquiryStatus,
  OrderStatus,
  Product,
} from '../types';

export type DashboardTimeframe = 'all' | '30d' | '7d';
export type CategoryMetricMode = 'revenue' | 'units' | 'demand';

interface AdminSummaryChartsProps {
  t: TranslationBundle;
  products: Product[];
  orders: ExportOrder[];
  inquiries: ContactInquiry[];
  clients: ClientAccount[];
  onNavigateTab: (tab: 'products' | 'orders' | 'inquiries' | 'clients') => void;
  onFilterOrdersByStatus: (status: 'all' | OrderStatus) => void;
  onFilterProductsByCategory: (category: string) => void;
  onOpenNewProduct: () => void;
}

function parseTimestampMs(ts: unknown): number | null {
  if (!ts) return null;
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toDate' in ts &&
    typeof (ts as { toDate: () => Date }).toDate === 'function'
  ) {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'seconds' in ts &&
    typeof (ts as { seconds: number }).seconds === 'number'
  ) {
    return (ts as { seconds: number }).seconds * 1000;
  }
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  const parsed = Date.parse(String(ts));
  return Number.isNaN(parsed) ? null : parsed;
}

function inferCategoryFromText(text: string, knownCategories: string[]): string {
  const lower = text.toLowerCase();
  for (const cat of knownCategories) {
    if (lower.includes(cat.toLowerCase())) return cat;
  }
  if (/\b(knit|knitwear|hoodie|fleece|sweater|cardigan|polo|tee|t-shirt|jersey)\b/.test(lower)) {
    return 'Knitwear';
  }
  if (/\b(denim|jean|chambray|indigo|twill)\b/.test(lower)) {
    return 'Denim';
  }
  if (/\b(woven|shirt|oxford|poplin|chino|trouser|pant|blazer|suit)\b/.test(lower)) {
    return 'Woven Apparel';
  }
  if (/\b(jacket|coat|parka|puffer|outerwear|windbreaker|shell)\b/.test(lower)) {
    return 'Outerwear';
  }
  if (/\b(active|sport|jogger|legging|athletic|gym)\b/.test(lower)) {
    return 'Activewear';
  }
  return 'Other Garments';
}

const ORDER_STATUS_META: Record<
  OrderStatus,
  { color: string; bgClass: string; textClass: string; shortLabel: string }
> = {
  pending_review: {
    color: '#D97706',
    bgClass: 'bg-amber-600',
    textClass: 'text-amber-700',
    shortLabel: 'Pending Review',
  },
  confirmed: {
    color: '#1D4ED8',
    bgClass: 'bg-blue-700',
    textClass: 'text-blue-700',
    shortLabel: 'Confirmed',
  },
  customs_dispatch: {
    color: '#0F766E',
    bgClass: 'bg-teal-700',
    textClass: 'text-teal-700',
    shortLabel: 'Customs Dispatch',
  },
  in_transit: {
    color: '#4338CA',
    bgClass: 'bg-indigo-700',
    textClass: 'text-indigo-700',
    shortLabel: 'In Transit',
  },
  delivered: {
    color: '#16A34A',
    bgClass: 'bg-emerald-600',
    textClass: 'text-emerald-700',
    shortLabel: 'Delivered',
  },
  cancelled: {
    color: '#94A3B8',
    bgClass: 'bg-slate-400',
    textClass: 'text-slate-500',
    shortLabel: 'Cancelled',
  },
};

const INQUIRY_STATUS_META: Array<{
  status: InquiryStatus;
  label: string;
  barColor: string;
}> = [
  { status: 'new', label: 'New', barColor: '#1D4ED8' },
  { status: 'in_review', label: 'In Review', barColor: '#D97706' },
  { status: 'quoted', label: 'Quoted', barColor: '#16A34A' },
  { status: 'archived', label: 'Archived', barColor: '#94A3B8' },
];

export function AdminSummaryCharts({
  t,
  products,
  orders,
  inquiries,
  clients,
  onNavigateTab,
  onFilterOrdersByStatus,
  onFilterProductsByCategory,
  onOpenNewProduct,
}: AdminSummaryChartsProps) {
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>('all');
  const [categoryMetric, setCategoryMetric] = useState<CategoryMetricMode>('revenue');
  const [hoveredBucketIdx, setHoveredBucketIdx] = useState<number | null>(null);
  const [hoveredOrderStatus, setHoveredOrderStatus] = useState<OrderStatus | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const nowMs = useMemo(() => Date.now(), [orders.length, inquiries.length]);

  const cutoffMs = useMemo(() => {
    if (timeframe === '7d') return nowMs - 7 * 86400000;
    if (timeframe === '30d') return nowMs - 30 * 86400000;
    return null;
  }, [timeframe, nowMs]);

  const filteredOrders = useMemo(() => {
    if (!cutoffMs) return orders;
    return orders.filter((o) => {
      const ms = parseTimestampMs(o.createdAt);
      return ms === null ? true : ms >= cutoffMs;
    });
  }, [orders, cutoffMs]);

  const filteredInquiries = useMemo(() => {
    if (!cutoffMs) return inquiries;
    return inquiries.filter((inq) => {
      const ms = parseTimestampMs(inq.createdAt);
      return ms === null ? true : ms >= cutoffMs;
    });
  }, [inquiries, cutoffMs]);

  // Core KPI Calculations
  const nonCancelledOrders = useMemo(
    () => filteredOrders.filter((o) => o.status !== 'cancelled'),
    [filteredOrders]
  );

  const totalRevenue = useMemo(
    () => nonCancelledOrders.reduce((sum, o) => sum + o.totalUsd, 0),
    [nonCancelledOrders]
  );

  const totalUnitsOrdered = useMemo(
    () => nonCancelledOrders.reduce((sum, o) => sum + o.quantity, 0),
    [nonCancelledOrders]
  );

  const pendingOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'pending_review'),
    [filteredOrders]
  );

  const pendingOrdersValue = useMemo(
    () => pendingOrders.reduce((sum, o) => sum + o.totalUsd, 0),
    [pendingOrders]
  );

  const activePipelineCount = useMemo(
    () =>
      filteredOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,
    [filteredOrders]
  );

  const inquiryStatusCounts = useMemo(() => {
    const counts: Record<InquiryStatus, number> = {
      new: 0,
      in_review: 0,
      quoted: 0,
      archived: 0,
    };
    for (const inq of filteredInquiries) {
      counts[inq.status] = (counts[inq.status] || 0) + 1;
    }
    return counts;
  }, [filteredInquiries]);

  // 1. Time-Series Buckets for Inquiries vs Pending Orders vs Confirmed/Fulfilled Orders
  const timeBuckets = useMemo(() => {
    const end = new Date(nowMs);
    interface Bucket {
      key: string;
      label: string;
      startMs: number;
      endMs: number;
      inquiriesCount: number;
      pendingOrdersCount: number;
      activeOrdersCount: number;
    }

    const buckets: Bucket[] = [];

    if (timeframe === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(end);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const startMs = d.getTime();
        const endMs = startMs + 86400000;
        buckets.push({
          key: `d-${i}`,
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          startMs,
          endMs,
          inquiriesCount: 0,
          pendingOrdersCount: 0,
          activeOrdersCount: 0,
        });
      }
    } else if (timeframe === '30d') {
      // 5 intervals of 6 days each
      for (let i = 4; i >= 0; i--) {
        const endDay = new Date(end);
        endDay.setHours(23, 59, 59, 999);
        endDay.setDate(endDay.getDate() - i * 6);
        const endMs = endDay.getTime() + 1;
        const startDay = new Date(endMs - 6 * 86400000);
        startDay.setHours(0, 0, 0, 0);
        const startMs = startDay.getTime();
        buckets.push({
          key: `w-${i}`,
          label: `${startDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          startMs,
          endMs,
          inquiriesCount: 0,
          pendingOrdersCount: 0,
          activeOrdersCount: 0,
        });
      }
    } else {
      // Last 6 calendar months
      for (let i = 5; i >= 0; i--) {
        const start = new Date(end.getFullYear(), end.getMonth() - i, 1);
        const next = new Date(end.getFullYear(), end.getMonth() - i + 1, 1);
        buckets.push({
          key: `m-${start.getFullYear()}-${start.getMonth()}`,
          label: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          startMs: start.getTime(),
          endMs: next.getTime(),
          inquiriesCount: 0,
          pendingOrdersCount: 0,
          activeOrdersCount: 0,
        });
      }
    }

    const assignToBucket = (ms: number | null): Bucket => {
      if (ms !== null) {
        for (const b of buckets) {
          if (ms >= b.startMs && ms < b.endMs) return b;
        }
        if (ms < buckets[0].startMs) return buckets[0];
      }
      return buckets[buckets.length - 1];
    };

    for (const inq of filteredInquiries) {
      const b = assignToBucket(parseTimestampMs(inq.createdAt));
      b.inquiriesCount += 1;
    }

    for (const ord of filteredOrders) {
      if (ord.status === 'cancelled') continue;
      const b = assignToBucket(parseTimestampMs(ord.createdAt));
      if (ord.status === 'pending_review') {
        b.pendingOrdersCount += 1;
      } else {
        b.activeOrdersCount += 1;
      }
    }

    return buckets;
  }, [timeframe, nowMs, filteredInquiries, filteredOrders]);

  const maxBucketValue = useMemo(() => {
    let peak = 1;
    for (const b of timeBuckets) {
      peak = Math.max(peak, b.inquiriesCount, b.pendingOrdersCount, b.activeOrdersCount);
    }
    return peak;
  }, [timeBuckets]);

  // 2. Order Status Distribution (Donut Chart)
  const orderStatusBreakdown = useMemo(() => {
    const statuses: OrderStatus[] = [
      'pending_review',
      'confirmed',
      'customs_dispatch',
      'in_transit',
      'delivered',
      'cancelled',
    ];
    return statuses.map((status) => {
      const matching = filteredOrders.filter((o) => o.status === status);
      const valueUsd = matching.reduce((sum, o) => sum + o.totalUsd, 0);
      return {
        status,
        label: t.orderStatuses[status] || ORDER_STATUS_META[status].shortLabel,
        count: matching.length,
        valueUsd,
        sharePct: filteredOrders.length > 0 ? (matching.length / filteredOrders.length) * 100 : 0,
        color: ORDER_STATUS_META[status].color,
      };
    });
  }, [filteredOrders, t]);

  const donutSegments = useMemo(() => {
    const total = filteredOrders.length;
    if (total === 0) return [];
    const radius = 78;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return orderStatusBreakdown
      .filter((item) => item.count > 0)
      .map((item) => {
        const fraction = item.count / total;
        const length = fraction * circumference;
        const seg = {
          ...item,
          circumference,
          dashArray: `${Math.max(length - 2, 1)} ${circumference}`,
          dashOffset: -offset,
        };
        offset += length;
        return seg;
      });
  }, [orderStatusBreakdown, filteredOrders.length]);

  // 3. Top-Performing Garment Categories
  const categoryStats = useMemo(() => {
    const productById = new Map<string, Product>();
    const productBySku = new Map<string, Product>();
    const knownCategories = new Set<string>();

    for (const prod of products) {
      productById.set(prod.id, prod);
      productBySku.set(prod.sku.toUpperCase(), prod);
      if (prod.category?.trim()) knownCategories.add(prod.category.trim());
    }

    const knownCategoryList = Array.from(knownCategories);

    interface CategoryAggregate {
      category: string;
      revenueUsd: number;
      unitsOrdered: number;
      orderCount: number;
      pendingCount: number;
      inquiryCount: number;
      skuCount: number;
      topProduct: string;
      topProductRevenue: number;
    }

    const map = new Map<string, CategoryAggregate>();
    const ensureCat = (category: string): CategoryAggregate => {
      const existing = map.get(category);
      if (existing) return existing;
      const created: CategoryAggregate = {
        category,
        revenueUsd: 0,
        unitsOrdered: 0,
        orderCount: 0,
        pendingCount: 0,
        inquiryCount: 0,
        skuCount: 0,
        topProduct: '',
        topProductRevenue: -1,
      };
      map.set(category, created);
      return created;
    };

    for (const prod of products) {
      const catName = prod.category?.trim() || 'Other Garments';
      const entry = ensureCat(catName);
      entry.skuCount += 1;
      if (!entry.topProduct) entry.topProduct = prod.name;
    }

    for (const ord of filteredOrders) {
      if (ord.status === 'cancelled') continue;
      const matchedProd =
        productById.get(ord.productId) || productBySku.get(ord.productSku.toUpperCase());
      const catName =
        matchedProd?.category?.trim() ||
        inferCategoryFromText(ord.productName || '', knownCategoryList);
      const entry = ensureCat(catName);
      entry.revenueUsd += ord.totalUsd;
      entry.unitsOrdered += ord.quantity;
      entry.orderCount += 1;
      if (ord.status === 'pending_review') {
        entry.pendingCount += 1;
      }
      if (ord.totalUsd > entry.topProductRevenue) {
        entry.topProductRevenue = ord.totalUsd;
        entry.topProduct = ord.productName;
      }
    }

    for (const inq of filteredInquiries) {
      const interest = (inq.productInterest || '').toLowerCase();
      let matchedCategory = '';
      for (const prod of products) {
        if (
          interest.includes(prod.name.toLowerCase()) ||
          interest.includes(prod.sku.toLowerCase()) ||
          interest.includes(prod.category.toLowerCase())
        ) {
          matchedCategory = prod.category.trim();
          break;
        }
      }
      if (!matchedCategory) {
        matchedCategory = inferCategoryFromText(inq.productInterest || '', knownCategoryList);
      }
      const entry = ensureCat(matchedCategory);
      entry.inquiryCount += 1;
    }

    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (categoryMetric === 'revenue') {
        if (b.revenueUsd !== a.revenueUsd) return b.revenueUsd - a.revenueUsd;
        if (b.inquiryCount !== a.inquiryCount) return b.inquiryCount - a.inquiryCount;
        return b.skuCount - a.skuCount;
      }
      if (categoryMetric === 'units') {
        if (b.unitsOrdered !== a.unitsOrdered) return b.unitsOrdered - a.unitsOrdered;
        return b.revenueUsd - a.revenueUsd;
      }
      const demandA = a.inquiryCount * 3 + a.orderCount * 2 + a.skuCount;
      const demandB = b.inquiryCount * 3 + b.orderCount * 2 + b.skuCount;
      if (demandB !== demandA) return demandB - demandA;
      return b.revenueUsd - a.revenueUsd;
    });

    return list.slice(0, 8);
  }, [products, filteredOrders, filteredInquiries, categoryMetric]);

  const categoryTotals = useMemo(() => {
    return categoryStats.reduce(
      (acc, c) => ({
        revenue: acc.revenue + c.revenueUsd,
        units: acc.units + c.unitsOrdered,
        demand: acc.demand + c.inquiryCount + c.orderCount + c.skuCount,
        maxMetric: Math.max(
          acc.maxMetric,
          categoryMetric === 'revenue'
            ? c.revenueUsd
            : categoryMetric === 'units'
              ? c.unitsOrdered
              : c.inquiryCount + c.orderCount + c.skuCount
        ),
      }),
      { revenue: 0, units: 0, demand: 0, maxMetric: 0 }
    );
  }, [categoryStats, categoryMetric]);

  const topCategoryLeader = categoryStats[0] || null;
  const activeBucket = hoveredBucketIdx !== null ? timeBuckets[hoveredBucketIdx] : null;
  const focusedOrderStatus = hoveredOrderStatus
    ? orderStatusBreakdown.find((s) => s.status === hoveredOrderStatus)
    : null;

  return (
    <div className="space-y-6">
      {/* Toolbar: Header + Segmented Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-lg font-bold text-slate-900">
            Export Operations Summary
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Live tracking across buyer trade inquiries, pending orders, and garment category performance.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit shrink-0">
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '7d', label: 'Last 7 Days' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTimeframe(opt.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                timeframe === opt.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Executive KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">Total Inquiries</span>
              <Mail className="w-4 h-4 text-blue-700 shrink-0" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {filteredInquiries.length}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
              {inquiryStatusCounts.new} new · {inquiryStatusCounts.in_review} in review ·{' '}
              {inquiryStatusCounts.quoted} quoted
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('inquiries')}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline w-fit cursor-pointer"
          >
            <span>Open Trade Inquiries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">Pending Orders</span>
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {pendingOrders.length}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
              ${pendingOrdersValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} awaiting
              review · {activePipelineCount} total active
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onFilterOrdersByStatus('pending_review');
              onNavigateTab('orders');
            }}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline w-fit cursor-pointer"
          >
            <span>Review Pending Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">Gross Export Revenue</span>
              <ShoppingCart className="w-4 h-4 text-emerald-700 shrink-0" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
              {nonCancelledOrders.length} orders · {totalUnitsOrdered.toLocaleString('en-US')} total
              units
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onFilterOrdersByStatus('all');
              onNavigateTab('orders');
            }}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline w-fit cursor-pointer"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">Top Category &amp; Catalog</span>
              <Package className="w-4 h-4 text-slate-700 shrink-0" />
            </div>
            <div className="mt-2 font-display text-lg font-bold text-slate-900 truncate">
              {topCategoryLeader ? topCategoryLeader.category : `${products.length} SKUs`}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
              {products.length} published SKUs · {clients.length} client accounts
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline w-fit cursor-pointer"
          >
            <span>Manage Garment Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: Two-Column Visualization Grid (Inquiries & Orders Trend + Pending Order Breakdown Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart 1: Inquiries & Pending Orders Activity */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Inquiries &amp; Order Pipeline Trend
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Comparison of incoming buyer inquiries, pending orders, and active export orders
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-600">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-700 inline-block" />
                  <span>Inquiries</span>
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 inline-block" />
                  <span>Pending Orders</span>
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                  <span>Confirmed / Shipped</span>
                </span>
              </div>
            </div>

            {/* Active Hover Readout Strip */}
            <div className="mt-4 min-h-[28px] flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
              {activeBucket ? (
                <>
                  <span className="font-semibold text-slate-900">{activeBucket.label}</span>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] tabular-nums">
                    <span className="text-blue-700 font-semibold">
                      {activeBucket.inquiriesCount} inquiries
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      /
                    </span>
                    <span className="text-amber-700 font-semibold">
                      {activeBucket.pendingOrdersCount} pending
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      /
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      {activeBucket.activeOrdersCount} confirmed
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-slate-500">Hover any period bar to inspect exact counts</span>
                  <span className="font-mono text-[11px] text-slate-700 tabular-nums">
                    {filteredInquiries.length} total inquiries · {pendingOrders.length} pending orders
                  </span>
                </>
              )}
            </div>

            {/* Responsive SVG Grouped Column Chart */}
            {filteredInquiries.length === 0 && nonCancelledOrders.length === 0 ? (
              <div className="py-12 text-center">
                <BarChart3 className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="mt-2 text-xs font-medium text-slate-600">
                  No inquiries or orders recorded in this timeframe yet.
                </p>
                {timeframe !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setTimeframe('all')}
                    className="mt-2 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Switch to All Time
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 w-full overflow-x-auto">
                <svg
                  viewBox="0 0 560 210"
                  role="img"
                  aria-label="Inquiries and order pipeline chart"
                  className="w-full h-52 min-w-[420px]"
                  onMouseLeave={() => setHoveredBucketIdx(null)}
                >
                  {/* Horizontal Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = 175 - ratio * 145;
                    const tickVal = Math.round(ratio * maxBucketValue);
                    return (
                      <g key={ratio}>
                        <line
                          x1={38}
                          x2={548}
                          y1={y}
                          y2={y}
                          stroke="#E2E8F0"
                          strokeDasharray={ratio === 0 ? undefined : '3 3'}
                          strokeWidth={1}
                        />
                        <text
                          x={30}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-slate-400 text-[10px] font-mono tabular-nums"
                        >
                          {tickVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Period Bars */}
                  {timeBuckets.map((bucket, idx) => {
                    const slotWidth = 500 / timeBuckets.length;
                    const groupX = 44 + idx * slotWidth;
                    const centerX = groupX + slotWidth / 2;
                    const barW = Math.min(18, Math.max(10, Math.floor((slotWidth - 18) / 3)));
                    const gap = 3;
                    const totalGroupW = barW * 3 + gap * 2;
                    const startX = centerX - totalGroupW / 2;

                    const hInq = (bucket.inquiriesCount / maxBucketValue) * 145;
                    const hPend = (bucket.pendingOrdersCount / maxBucketValue) * 145;
                    const hConf = (bucket.activeOrdersCount / maxBucketValue) * 145;
                    const isHovered = hoveredBucketIdx === idx;

                    return (
                      <g
                        key={bucket.key}
                        onMouseEnter={() => setHoveredBucketIdx(idx)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={groupX + 2}
                          y={20}
                          width={slotWidth - 4}
                          height={160}
                          rx={6}
                          fill={isHovered ? '#F8FAFC' : 'transparent'}
                        />

                        {/* Inquiries Bar */}
                        <rect
                          x={startX}
                          y={175 - Math.max(hInq, bucket.inquiriesCount > 0 ? 4 : 0)}
                          width={barW}
                          height={Math.max(hInq, bucket.inquiriesCount > 0 ? 4 : 0)}
                          rx={3}
                          fill="#1D4ED8"
                          opacity={hoveredBucketIdx === null || isHovered ? 1 : 0.45}
                        />

                        {/* Pending Orders Bar */}
                        <rect
                          x={startX + barW + gap}
                          y={175 - Math.max(hPend, bucket.pendingOrdersCount > 0 ? 4 : 0)}
                          width={barW}
                          height={Math.max(hPend, bucket.pendingOrdersCount > 0 ? 4 : 0)}
                          rx={3}
                          fill="#D97706"
                          opacity={hoveredBucketIdx === null || isHovered ? 1 : 0.45}
                        />

                        {/* Confirmed / Active Orders Bar */}
                        <rect
                          x={startX + (barW + gap) * 2}
                          y={175 - Math.max(hConf, bucket.activeOrdersCount > 0 ? 4 : 0)}
                          width={barW}
                          height={Math.max(hConf, bucket.activeOrdersCount > 0 ? 4 : 0)}
                          rx={3}
                          fill="#16A34A"
                          opacity={hoveredBucketIdx === null || isHovered ? 1 : 0.45}
                        />

                        {/* Value labels above hovered group */}
                        {isHovered && (
                          <text
                            x={centerX}
                            y={18}
                            textAnchor="middle"
                            className="fill-slate-800 text-[10px] font-mono font-semibold tabular-nums"
                          >
                            {bucket.inquiriesCount} / {bucket.pendingOrdersCount} /{' '}
                            {bucket.activeOrdersCount}
                          </text>
                        )}

                        <text
                          x={centerX}
                          y={195}
                          textAnchor="middle"
                          className={`text-[10px] font-medium ${
                            isHovered ? 'fill-slate-900 font-semibold' : 'fill-slate-500'
                          }`}
                        >
                          {bucket.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Inquiry Status Funnel Breakdown (Hairline Divider, Zero Nested Cards) */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="font-semibold text-slate-800">Inquiry Pipeline Breakdown</span>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {filteredInquiries.length} inquiries total
              </span>
            </div>

            {filteredInquiries.length > 0 ? (
              <>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                  {INQUIRY_STATUS_META.map((item) => {
                    const count = inquiryStatusCounts[item.status] || 0;
                    const pct = (count / filteredInquiries.length) * 100;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={item.status}
                        style={{ width: `${pct}%`, backgroundColor: item.barColor }}
                        title={`${item.label}: ${count} (${pct.toFixed(0)}%)`}
                      />
                    );
                  })}
                </div>
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {INQUIRY_STATUS_META.map((item) => {
                    const count = inquiryStatusCounts[item.status] || 0;
                    const pct =
                      filteredInquiries.length > 0
                        ? Math.round((count / filteredInquiries.length) * 100)
                        : 0;
                    return (
                      <div key={item.status} className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 truncate">
                          <span
                            className="w-2 h-2 rounded-xs shrink-0"
                            style={{ backgroundColor: item.barColor }}
                          />
                          <span>{item.label}</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {count} <span className="text-slate-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Inquiry status distribution will appear once buyers submit quotes.
              </p>
            )}
          </div>
        </section>

        {/* Chart 2: Pending Orders & Fulfillment Funnel (Donut Chart) */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Pending Orders &amp; Status Mix
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Click any status row to filter the order queue
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onFilterOrdersByStatus('pending_review');
                  onNavigateTab('orders');
                }}
                className="text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                {pendingOrders.length} Pending
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingCart className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="mt-2 text-xs font-medium text-slate-600">
                  No orders in this timeframe yet.
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Client orders placed on the storefront will visualize here automatically.
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6">
                {/* Donut Chart */}
                <div className="relative w-44 h-44 shrink-0">
                  <svg
                    viewBox="0 0 200 200"
                    role="img"
                    aria-label="Order status distribution donut chart"
                    className="w-full h-full -rotate-90"
                    onMouseLeave={() => setHoveredOrderStatus(null)}
                  >
                    <circle
                      cx={100}
                      cy={100}
                      r={78}
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth={22}
                    />
                    {donutSegments.map((seg) => {
                      const isActive =
                        hoveredOrderStatus === null || hoveredOrderStatus === seg.status;
                      return (
                        <circle
                          key={seg.status}
                          cx={100}
                          cy={100}
                          r={78}
                          fill="none"
                          stroke={seg.color}
                          strokeWidth={hoveredOrderStatus === seg.status ? 26 : 22}
                          strokeDasharray={seg.dashArray}
                          strokeDashoffset={seg.dashOffset}
                          opacity={isActive ? 1 : 0.35}
                          className="transition-all duration-150 cursor-pointer"
                          onMouseEnter={() => setHoveredOrderStatus(seg.status)}
                          onClick={() => {
                            onFilterOrdersByStatus(seg.status);
                            onNavigateTab('orders');
                          }}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                    <span className="text-[11px] font-medium text-slate-500 truncate max-w-full">
                      {focusedOrderStatus ? focusedOrderStatus.label : 'Pending Review'}
                    </span>
                    <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                      {focusedOrderStatus ? focusedOrderStatus.count : pendingOrders.length}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      $
                      {(focusedOrderStatus
                        ? focusedOrderStatus.valueUsd
                        : pendingOrdersValue
                      ).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Clickable Order Status Ledger */}
                <div className="flex-1 w-full divide-y divide-slate-100">
                  {orderStatusBreakdown.map((item) => (
                    <button
                      key={item.status}
                      type="button"
                      onMouseEnter={() => setHoveredOrderStatus(item.status)}
                      onMouseLeave={() => setHoveredOrderStatus(null)}
                      onClick={() => {
                        onFilterOrdersByStatus(item.status);
                        onNavigateTab('orders');
                      }}
                      className={`w-full py-2 px-2 flex items-center justify-between gap-2 text-xs text-left rounded transition-colors cursor-pointer ${
                        hoveredOrderStatus === item.status ? 'bg-slate-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className={`truncate ${
                            item.status === 'pending_review'
                              ? 'font-semibold text-slate-900'
                              : 'font-medium text-slate-700'
                          }`}
                        >
                          {item.label}
                        </span>
                      </span>
                      <span className="font-mono tabular-nums text-right shrink-0">
                        <span className="font-semibold text-slate-900">{item.count}</span>
                        <span className="text-slate-400 ml-1.5">
                          ({Math.round(item.sharePct)}%)
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total tracked order volume</span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {filteredOrders.length} orders · $
              {filteredOrders
                .reduce((s, o) => s + o.totalUsd, 0)
                .toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </section>
      </div>

      {/* Row 3: Top-Performing Garment Categories (Horizontal Ranked Bar Chart) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-700 shrink-0" />
              <h2 className="text-sm font-bold text-slate-900">
                Top-Performing Garment Categories
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Ranked by export order revenue, ordered unit volume, and buyer inquiry demand across your garment catalog.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit shrink-0">
            {(
              [
                { id: 'revenue', label: 'Revenue (USD)' },
                { id: 'units', label: 'Units Ordered' },
                { id: 'demand', label: 'Inquiries & SKUs' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCategoryMetric(opt.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  categoryMetric === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {categoryStats.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="mt-2 text-sm font-semibold text-slate-800">
              No garment categories or orders yet
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Upload garment SKUs (such as Knitwear, Woven, or Denim) to see category performance and buyer demand charts.
            </p>
            <button
              type="button"
              onClick={onOpenNewProduct}
              className="mt-4 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              Upload First Garment SKU
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {categoryStats.map((cat, idx) => {
              const primaryValue =
                categoryMetric === 'revenue'
                  ? cat.revenueUsd
                  : categoryMetric === 'units'
                    ? cat.unitsOrdered
                    : cat.inquiryCount + cat.orderCount + cat.skuCount;

              const totalDenominator =
                categoryMetric === 'revenue'
                  ? categoryTotals.revenue
                  : categoryMetric === 'units'
                    ? categoryTotals.units
                    : categoryTotals.demand;

              const barWidthPct =
                categoryTotals.maxMetric > 0
                  ? Math.max((primaryValue / categoryTotals.maxMetric) * 100, primaryValue > 0 ? 4 : 0)
                  : 0;

              const sharePct =
                totalDenominator > 0 ? Math.round((primaryValue / totalDenominator) * 100) : 0;

              const isHovered = hoveredCategory === cat.category;

              return (
                <div
                  key={cat.category}
                  onMouseEnter={() => setHoveredCategory(cat.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`py-2 px-3 -mx-3 rounded-lg transition-colors ${
                    isHovered ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 mb-2">
                    <div className="flex items-baseline gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums shrink-0">
                        0{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onFilterProductsByCategory(cat.category);
                          onNavigateTab('products');
                        }}
                        className="text-sm font-bold text-slate-900 hover:text-blue-700 truncate text-left cursor-pointer"
                      >
                        {cat.category}
                      </button>
                      <span className="text-[11px] text-slate-500 truncate">
                        {cat.skuCount} SKUs · {cat.orderCount} orders · {cat.inquiryCount} inquiries
                        {cat.pendingCount > 0 ? ` · ${cat.pendingCount} pending` : ''}
                      </span>
                    </div>

                    <div className="font-mono text-xs font-bold text-slate-900 tabular-nums shrink-0">
                      {categoryMetric === 'revenue' && (
                        <>
                          ${cat.revenueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                          <span className="text-slate-400 font-normal">({sharePct}%)</span>
                        </>
                      )}
                      {categoryMetric === 'units' && (
                        <>
                          {cat.unitsOrdered.toLocaleString('en-US')} units{' '}
                          <span className="text-slate-400 font-normal">({sharePct}%)</span>
                        </>
                      )}
                      {categoryMetric === 'demand' && (
                        <>
                          {cat.inquiryCount} inquiries · {cat.orderCount} orders{' '}
                          <span className="text-slate-400 font-normal">({cat.skuCount} SKUs)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-md overflow-hidden flex items-center">
                    <div
                      className="h-full rounded-md transition-all duration-300"
                      style={{
                        width: `${barWidthPct}%`,
                        backgroundColor: idx === 0 ? '#1D4ED8' : idx === 1 ? '#0F172A' : '#475569',
                      }}
                    />
                  </div>

                  {cat.topProduct && (
                    <div className="mt-1.5 text-[11px] text-slate-500 truncate">
                      Lead item: <span className="text-slate-700 font-medium">{cat.topProduct}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

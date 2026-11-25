export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'zh';

export type Incoterm = 'FOB' | 'CIF' | 'EXW' | 'DDP' | 'CFR';

export type ProductAvailability = 'in_stock' | 'made_to_order' | 'out_of_stock';

export type OrderStatus =
  | 'pending_review'
  | 'confirmed'
  | 'customs_dispatch'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type ShipmentStage =
  | 'order_confirmed'
  | 'customs_cleared'
  | 'vessel_loaded'
  | 'ocean_transit'
  | 'port_arrival'
  | 'customs_released'
  | 'delivered';

export type ClientStatus = 'active' | 'pending_verification' | 'suspended';

export type CreditTier = 'Standard' | 'Net-30' | 'LC-Verified';

export type InquiryStatus = 'new' | 'in_review' | 'quoted' | 'archived';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  hsCode: string;
  description: string;
  fobPriceUsd: number;
  leastAmount?: number;
  highestAmount?: number;
  leastQuantity?: number;
  highestQuantity?: number;
  productQuality?: string;
  moq: number;
  unit: string;
  originPort: string;
  leadTimeDays: number;
  weightKg: number;
  dimensions: string;
  certifications: string;
  availability: ProductAvailability;
  imageUrl: string;
  images?: string[];
  imageUrls?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ClientAccount {
  uid: string;
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  country: string;
  destinationPort: string;
  taxId: string;
  preferredIncoterms: Incoterm;
  preferredLanguage: LanguageCode;
  role: 'client';
  status: ClientStatus;
  creditTier: CreditTier;
  accountNotes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExportOrder {
  id: string;
  orderNumber: string;
  clientUid: string;
  clientEmail: string;
  companyName: string;
  country: string;
  destinationPort: string;
  incoterms: Incoterm;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitPriceUsd: number;
  subtotalUsd: number;
  freightUsd: number;
  totalUsd: number;
  status: OrderStatus;
  trackingNumber: string;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ShipmentTracking {
  trackingNumber: string;
  orderNumber: string;
  clientUid: string;
  originPort: string;
  destinationPort: string;
  carrier: string;
  vesselName: string;
  containerNo: string;
  incoterms: Incoterm;
  weightKg: number;
  currentStage: ShipmentStage;
  currentLocation: string;
  etaDate: string;
  milestoneLog: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ContactInquiry {
  id: string;
  submitterUid: string;
  companyName: string;
  contactName: string;
  email: string;
  country: string;
  destinationPort: string;
  productInterest: string;
  estimatedVolume: string;
  incoterms: Incoterm;
  message: string;
  status: InquiryStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BuyingHouseContent {
  eyebrow: string;
  headline: string;
  paragraph1: string;
  paragraph2: string;
  updatedAt?: unknown;
}

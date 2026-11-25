import { onAuthStateChanged, sendEmailVerification, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ClientPortalView } from './components/ClientPortalView';
import { EmailAuthModal } from './components/EmailAuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { Header, type ActiveView } from './components/Header';
import { StorefrontView } from './components/StorefrontView';
import {
  DEFAULT_BUYING_HOUSE_CONTENT,
  DEFAULT_WHATSAPP_NUMBER,
  INITIAL_SHIPMENTS,
} from './data/seedData';
import { TRANSLATIONS } from './i18n/translations';
import { auth, db, handleFirestoreError, isAdminEmail, OperationType } from './lib/firebase';
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
  ShipmentStage,
  ShipmentTracking,
} from './types';
import { getProductImages, sanitizeId, sanitizeWhatsAppNumber } from './utils/exportReports';

function AppShell() {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [activeView, setActiveView] = useState<ActiveView>('storefront');
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authSource, setAuthSource] = useState<'header' | 'portal' | 'order'>('header');
  const [verificationNotice, setVerificationNotice] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [buyingHouseContent, setBuyingHouseContent] = useState<BuyingHouseContent>(
    DEFAULT_BUYING_HOUSE_CONTENT
  );
  const [whatsappNumber, setWhatsappNumber] = useState<string>(DEFAULT_WHATSAPP_NUMBER);
  const [adminInitialTab, setAdminInitialTab] = useState<'overview' | 'content'>('overview');
  const [clientProfile, setClientProfile] = useState<ClientAccount | null>(null);
  const [orders, setOrders] = useState<ExportOrder[]>([]);
  const [shipments, setShipments] = useState<ShipmentTracking[]>(INITIAL_SHIPMENTS);
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [prefilledTrackingId, setPrefilledTrackingId] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const isAdmin = Boolean(user && emailVerified && isAdminEmail(user.email));
  const t = TRANSLATIONS[language];

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setEmailVerified(Boolean(firebaseUser?.emailVerified));
      setAuthReady(true);

      if (!firebaseUser) {
        setClientProfile(null);
        setOrders([]);
        setClients([]);
        setInquiries([]);
        setVerificationNotice('');
        if (activeView !== 'storefront') setActiveView('storefront');
      }
    });
    return () => unsub();
  }, []);

  // Sync verified client profile from Firestore
  useEffect(() => {
    if (!authReady || !user || !emailVerified) return;
    let active = true;

    const loadProfile = async () => {
      const clientRef = doc(db, 'clients', user.uid);
      try {
        const snap = await getDoc(clientRef);
        if (!active) return;
        if (!snap.exists()) {
          const newProfile: ClientAccount = {
            uid: user.uid,
            email: user.email || 'buyer@example.com',
            companyName: user.displayName
              ? `${user.displayName} Trading Co.`
              : 'International Buyer Account',
            contactName: user.displayName || 'Authorized Buyer',
            phone: '',
            country: 'Netherlands',
            destinationPort: 'Rotterdam, NL',
            taxId: '',
            preferredIncoterms: 'FOB',
            preferredLanguage: language,
            role: 'client',
            status: 'active',
            creditTier: 'Standard',
            accountNotes: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(clientRef, newProfile);
          if (active) setClientProfile(newProfile);
        } else {
          setClientProfile(snap.data() as ClientAccount);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `clients/${user.uid}`);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [authReady, user, emailVerified]);

  // Public products catalog listener (strictly user-uploaded products only)
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
        setProducts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'products')
    );
    return () => unsub();
  }, []);

  // Public homepage editorial section ("The Model / About Our Buying House") listener
  useEffect(() => {
    const ref = doc(db, 'siteContent', 'buying_house_model');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<BuyingHouseContent>;
          setBuyingHouseContent({
            eyebrow: data.eyebrow || DEFAULT_BUYING_HOUSE_CONTENT.eyebrow,
            headline: data.headline || DEFAULT_BUYING_HOUSE_CONTENT.headline,
            paragraph1: data.paragraph1 || DEFAULT_BUYING_HOUSE_CONTENT.paragraph1,
            paragraph2: data.paragraph2 || DEFAULT_BUYING_HOUSE_CONTENT.paragraph2,
            updatedAt: data.updatedAt,
          });
        } else {
          setBuyingHouseContent(DEFAULT_BUYING_HOUSE_CONTENT);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'siteContent/buying_house_model')
    );
    return () => unsub();
  }, []);

  // Public business contact settings (WhatsApp Business number) listener
  useEffect(() => {
    const ref = doc(db, 'siteSettings', 'business_contact');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { whatsappNumber?: string };
          const cleaned = sanitizeWhatsAppNumber(data.whatsappNumber || '');
          setWhatsappNumber(cleaned.length >= 7 ? cleaned : DEFAULT_WHATSAPP_NUMBER);
        } else {
          setWhatsappNumber(DEFAULT_WHATSAPP_NUMBER);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'siteSettings/business_contact')
    );
    return () => unsub();
  }, []);

  // Authenticated data listeners (orders, shipments, clients, inquiries)
  useEffect(() => {
    if (!authReady || !user || !emailVerified) return;

    const ordersQuery = isAdmin
      ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'orders'), where('clientUid', '==', user.uid));

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ExportOrder, 'id'>),
        }));
        setOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const inquiriesQuery = isAdmin
      ? query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'inquiries'), where('submitterUid', '==', user.uid));

    const unsubInquiries = onSnapshot(
      inquiriesQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ContactInquiry, 'id'>),
        }));
        setInquiries(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'inquiries')
    );

    const shipmentsQuery = isAdmin
      ? query(collection(db, 'shipments'))
      : query(collection(db, 'shipments'), where('clientUid', '==', user.uid));

    const unsubShipments = onSnapshot(
      shipmentsQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as ShipmentTracking);
        if (list.length > 0) setShipments(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'shipments')
    );

    let unsubClients = () => {};
    if (isAdmin) {
      unsubClients = onSnapshot(
        collection(db, 'clients'),
        (snap) => {
          setClients(snap.docs.map((d) => d.data() as ClientAccount));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'clients')
      );
    }

    return () => {
      unsubOrders();
      unsubInquiries();
      unsubShipments();
      unsubClients();
    };
  }, [authReady, user, emailVerified, isAdmin]);

  const handleOpenSignIn = (
    mode: 'signin' | 'signup' = 'signin',
    source: 'header' | 'portal' | 'order' = 'header'
  ) => {
    setAuthError('');
    setAuthModalMode(mode);
    setAuthSource(source);
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setVerificationNotice('');
    setActiveView('storefront');
  };

  const handleRefreshVerification = async () => {
    if (!auth.currentUser) return;
    setVerificationNotice('');
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      const verified = Boolean(auth.currentUser.emailVerified);
      setEmailVerified(verified);
      if (verified) {
        setVerificationNotice('Email verified. Full account access is now active.');
        if (isAdminEmail(auth.currentUser.email)) {
          setActiveView('admin');
        }
      } else {
        setAuthError('Email is not verified yet. Please click the verification link sent to your inbox.');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to refresh verification status.');
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setAuthError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationNotice(`Verification email sent to ${auth.currentUser.email}.`);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to send verification email.');
    }
  };

  const handlePlaceOrder = async (payload: {
    product: Product;
    quantity: number;
    incoterms: Incoterm;
    destinationPort: string;
    notes: string;
  }) => {
    if (!user || !emailVerified) {
      setAuthSource('order');
      setAuthModalMode('signin');
      setAuthModalOpen(true);
      throw new Error('Please sign in or log in with a verified email & password account before buying.');
    }
    const minQty = Math.max(1, payload.product.leastQuantity ?? payload.product.moq);
    const maxQty = payload.product.highestQuantity;
    if (payload.quantity < minQty) {
      throw new Error(`Minimum order quantity is ${minQty} ${payload.product.unit}.`);
    }
    if (maxQty && maxQty >= minQty && payload.quantity > maxQty) {
      throw new Error(`Maximum order quantity is ${maxQty} ${payload.product.unit}.`);
    }
    const orderNumber = `ORD-2026-${Math.floor(4200 + Math.random() * 5700)}`;
    const subtotalUsd = payload.quantity * payload.product.fobPriceUsd;
    const freightMultiplier =
      payload.incoterms === 'EXW'
        ? 0
        : payload.incoterms === 'FOB'
          ? 0.04
          : payload.incoterms === 'DDP'
            ? 0.11
            : 0.075;
    const freightUsd = Math.round(subtotalUsd * freightMultiplier);
    const totalUsd = subtotalUsd + freightUsd;

    try {
      await setDoc(doc(db, 'orders', orderNumber), {
        orderNumber,
        clientUid: user.uid,
        clientEmail: user.email || 'buyer@example.com',
        companyName: clientProfile?.companyName || user.displayName || 'International Buyer',
        country: clientProfile?.country || 'International',
        destinationPort: payload.destinationPort,
        incoterms: payload.incoterms,
        productId: sanitizeId(payload.product.id),
        productSku: payload.product.sku,
        productName: payload.product.name,
        quantity: payload.quantity,
        unitPriceUsd: payload.product.fobPriceUsd,
        subtotalUsd,
        freightUsd,
        totalUsd,
        status: 'pending_review',
        trackingNumber: '',
        notes: payload.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${orderNumber}`);
    }
  };

  const handleSubmitInquiry = async (payload: {
    companyName: string;
    contactName: string;
    email: string;
    country: string;
    destinationPort: string;
    productInterest: string;
    estimatedVolume: string;
    incoterms: Incoterm;
    message: string;
  }) => {
    const inquiryId = `INQ-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
    try {
      await setDoc(doc(db, 'inquiries', inquiryId), {
        submitterUid: user ? user.uid : '',
        companyName: payload.companyName,
        contactName: payload.contactName,
        email: payload.email,
        country: payload.country,
        destinationPort: payload.destinationPort,
        productInterest: payload.productInterest,
        estimatedVolume: payload.estimatedVolume,
        incoterms: payload.incoterms,
        message: payload.message,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `inquiries/${inquiryId}`);
    }
  };

  const handleSaveClientProfile = async (updates: Partial<ClientAccount>) => {
    if (!user || !clientProfile) return;
    try {
      await updateDoc(doc(db, 'clients', user.uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      setClientProfile({ ...clientProfile, ...updates });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${user.uid}`);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleSaveProduct = async (product: Product, isNew: boolean) => {
    if (!user || !emailVerified || !isAdmin) {
      throw new Error('Only the verified website owner can upload or modify products.');
    }
    const id = sanitizeId(product.id || product.sku);
    const leastAmount = Number(product.leastAmount ?? product.fobPriceUsd);
    const highestAmount = Math.max(leastAmount, Number(product.highestAmount ?? product.fobPriceUsd));
    const leastQuantity = Math.max(1, Math.floor(Number(product.leastQuantity ?? product.moq)));
    const highestQuantity = Math.max(
      leastQuantity,
      Math.floor(Number(product.highestQuantity ?? leastQuantity))
    );
    const productQuality = (product.productQuality || '').trim();
    const images = getProductImages(product);
    const coverImage = images[0] || '';
    if (images.some((img) => img.length > 350000)) {
      throw new Error('One of the product images is too large. Please upload a smaller image.');
    }
    try {
      if (isNew) {
        await setDoc(doc(db, 'products', id), {
          sku: product.sku,
          name: product.name,
          category: product.category,
          hsCode: product.hsCode,
          description: product.description,
          fobPriceUsd: Number(product.fobPriceUsd),
          leastAmount,
          highestAmount,
          moq: leastQuantity,
          leastQuantity,
          highestQuantity,
          productQuality,
          unit: product.unit,
          originPort: product.originPort,
          leadTimeDays: Number(product.leadTimeDays),
          weightKg: Number(product.weightKg),
          dimensions: product.dimensions,
          certifications: product.certifications,
          availability: product.availability,
          imageUrl: coverImage,
          images,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'products', id), {
          sku: product.sku,
          name: product.name,
          category: product.category,
          hsCode: product.hsCode,
          description: product.description,
          fobPriceUsd: Number(product.fobPriceUsd),
          leastAmount,
          highestAmount,
          moq: leastQuantity,
          leastQuantity,
          highestQuantity,
          productQuality,
          unit: product.unit,
          originPort: product.originPort,
          leadTimeDays: Number(product.leadTimeDays),
          weightKg: Number(product.weightKg),
          dimensions: product.dimensions,
          certifications: product.certifications,
          availability: product.availability,
          imageUrl: coverImage,
          images,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `products/${id}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user || !emailVerified || !isAdmin) {
      throw new Error('Only the verified website owner can delete products.');
    }
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  const handleBulkPublishProducts = async (batchProducts: Product[]) => {
    if (!user || !emailVerified || !isAdmin) {
      throw new Error('Only the verified website owner can bulk publish products.');
    }
    for (const prod of batchProducts) {
      const id = sanitizeId(prod.sku);
      const existingSnap = await getDoc(doc(db, 'products', id));
      await handleSaveProduct(prod, !existingSnap.exists());
    }
  };

  const handleUpdateOrderAndShipment = async (payload: {
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
  }) => {
    try {
      await updateDoc(doc(db, 'orders', payload.order.id), {
        status: payload.newStatus,
        trackingNumber: payload.trackingNumber,
        updatedAt: serverTimestamp(),
      });

      if (payload.trackingNumber && payload.shipment) {
        const shipRef = doc(db, 'shipments', payload.trackingNumber);
        const existingShip = await getDoc(shipRef);
        const timestampStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

        if (existingShip.exists()) {
          const prevData = existingShip.data() as ShipmentTracking;
          const logs = [...(prevData.milestoneLog || [])];
          if (payload.shipment.newLogEntry) {
            logs.push(`${timestampStr} · ${payload.shipment.newLogEntry}`);
          }
          await updateDoc(shipRef, {
            originPort: payload.shipment.originPort,
            destinationPort: payload.shipment.destinationPort,
            carrier: payload.shipment.carrier,
            vesselName: payload.shipment.vesselName,
            containerNo: payload.shipment.containerNo,
            weightKg: payload.shipment.weightKg,
            currentStage: payload.shipment.currentStage,
            currentLocation: payload.shipment.currentLocation,
            etaDate: payload.shipment.etaDate,
            milestoneLog: logs.slice(-10),
            updatedAt: serverTimestamp(),
          });
        } else {
          const initialLog = [
            `${timestampStr} · ${payload.shipment.newLogEntry || `Order ${payload.order.orderNumber} assigned tracking ${payload.trackingNumber}`}`,
          ];
          await setDoc(shipRef, {
            trackingNumber: payload.trackingNumber,
            orderNumber: payload.order.orderNumber,
            clientUid: payload.order.clientUid,
            originPort: payload.shipment.originPort,
            destinationPort: payload.shipment.destinationPort,
            carrier: payload.shipment.carrier,
            vesselName: payload.shipment.vesselName,
            containerNo: payload.shipment.containerNo,
            incoterms: payload.order.incoterms,
            weightKg: payload.shipment.weightKg,
            currentStage: payload.shipment.currentStage,
            currentLocation: payload.shipment.currentLocation,
            etaDate: payload.shipment.etaDate,
            milestoneLog: initialLog,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${payload.order.id}`);
    }
  };

  const handleUpdateClientAccount = async (
    clientId: string,
    updates: { status: ClientStatus; creditTier: CreditTier; accountNotes: string }
  ) => {
    try {
      await updateDoc(doc(db, 'clients', clientId), {
        status: updates.status,
        creditTier: updates.creditTier,
        accountNotes: updates.accountNotes,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${clientId}`);
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, status: InquiryStatus) => {
    try {
      await updateDoc(doc(db, 'inquiries', inquiryId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inquiries/${inquiryId}`);
    }
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    try {
      await deleteDoc(doc(db, 'inquiries', inquiryId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inquiries/${inquiryId}`);
    }
  };

  const handleSaveBuyingHouseContent = async (content: BuyingHouseContent) => {
    if (!user || !emailVerified || !isAdmin) {
      throw new Error('Only the verified website owner can update homepage content.');
    }
    const cleanEyebrow = content.eyebrow.trim();
    const cleanHeadline = content.headline.trim();
    const cleanP1 = content.paragraph1.trim();
    const cleanP2 = content.paragraph2.trim();
    if (!cleanEyebrow || !cleanHeadline || !cleanP1 || !cleanP2) {
      throw new Error('All fields (eyebrow label, headline, and both paragraphs) are required.');
    }
    try {
      await setDoc(doc(db, 'siteContent', 'buying_house_model'), {
        eyebrow: cleanEyebrow.slice(0, 80),
        headline: cleanHeadline.slice(0, 200),
        paragraph1: cleanP1.slice(0, 3000),
        paragraph2: cleanP2.slice(0, 3000),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'siteContent/buying_house_model');
    }
  };

  const handleSaveWhatsAppNumber = async (rawNumber: string) => {
    if (!user || !emailVerified || !isAdmin) {
      throw new Error('Only the verified website owner can update WhatsApp settings.');
    }
    const cleanDigits = sanitizeWhatsAppNumber(rawNumber);
    if (cleanDigits.length < 7 || cleanDigits.length > 20) {
      throw new Error('Please enter a valid WhatsApp phone number with country code (7–20 digits, no + or spaces).');
    }
    try {
      await setDoc(doc(db, 'siteSettings', 'business_contact'), {
        whatsappNumber: cleanDigits,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'siteSettings/business_contact');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        t={t}
        activeView={activeView}
        isSignedIn={Boolean(user && emailVerified)}
        isAdmin={isAdmin}
        onNavigateSection={(sectionId) => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }}
        onChangeView={(view) => {
          if (view === 'admin') setAdminInitialTab('overview');
          setActiveView(view);
        }}
        onSignIn={handleOpenSignIn}
        onSignOut={handleSignOut}
      />

      {user && !emailVerified && (
        <div className="max-w-[1280px] mx-auto px-6 pt-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-950 text-xs rounded-lg p-3.5 flex flex-wrap justify-between items-center gap-3">
            <span>
              Signed in as <strong>{user.email}</strong>. Verify your email address from your inbox to unlock account &amp; website ownership access.
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshVerification}
                className="px-3 py-1.5 bg-blue-700 text-white font-semibold rounded-md hover:bg-blue-800 cursor-pointer"
              >
                I&apos;ve Verified — Refresh
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-semibold rounded-md hover:bg-amber-100 cursor-pointer"
              >
                Resend Email
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-2.5 py-1.5 text-amber-900 font-semibold underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {verificationNotice && (
        <div className="max-w-[1280px] mx-auto px-6 pt-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg p-3 flex justify-between items-center">
            <span>{verificationNotice}</span>
            <button
              type="button"
              onClick={() => setVerificationNotice('')}
              className="font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {authError && (
        <div className="max-w-[1280px] mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3 flex justify-between items-center">
            <span>{authError}</span>
            <button type="button" onClick={() => setAuthError('')} className="font-semibold underline cursor-pointer">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {activeView === 'storefront' && (
        <StorefrontView
          t={t}
          language={language}
          onChangeLanguage={setLanguage}
          products={products}
          buyingHouseContent={buyingHouseContent}
          whatsappNumber={whatsappNumber}
          isSignedIn={Boolean(user && emailVerified)}
          isAdmin={isAdmin}
          clientProfile={clientProfile}
          prefilledTrackingId={prefilledTrackingId}
          onSignIn={handleOpenSignIn}
          onOpenAdminPanel={() => {
            setAdminInitialTab('overview');
            setActiveView('admin');
          }}
          onEditBuyingHouseContent={() => {
            setAdminInitialTab('content');
            setActiveView('admin');
          }}
          onPublishProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onPlaceOrder={handlePlaceOrder}
          onSubmitInquiry={handleSubmitInquiry}
        />
      )}

      {activeView === 'portal' && user && emailVerified && clientProfile && (
        <ClientPortalView
          t={t}
          userEmail={user.email || ''}
          profile={clientProfile}
          orders={orders}
          inquiries={inquiries}
          isAdmin={isAdmin}
          onSaveProfile={handleSaveClientProfile}
          onCancelOrder={handleCancelOrder}
          onTrackShipment={(trackingNum) => {
            setPrefilledTrackingId(trackingNum);
            setActiveView('storefront');
            setTimeout(() => {
              document.getElementById('tracking')?.scrollIntoView({ behavior: 'smooth' });
            }, 80);
          }}
          onBrowseCatalog={() => {
            setActiveView('storefront');
            setTimeout(() => {
              document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            }, 80);
          }}
          onSwitchToAdmin={() => {
            setAdminInitialTab('overview');
            setActiveView('admin');
          }}
        />
      )}

      {activeView === 'admin' && user && isAdmin && (
        <AdminDashboardView
          t={t}
          language={language}
          onChangeLanguage={setLanguage}
          adminEmail={user.email || ''}
          initialTab={adminInitialTab}
          products={products}
          orders={orders}
          shipments={shipments}
          clients={clients}
          inquiries={inquiries}
          buyingHouseContent={buyingHouseContent}
          whatsappNumber={whatsappNumber}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onBulkPublishProducts={handleBulkPublishProducts}
          onUpdateOrderAndShipment={handleUpdateOrderAndShipment}
          onUpdateClientAccount={handleUpdateClientAccount}
          onUpdateInquiryStatus={handleUpdateInquiryStatus}
          onDeleteInquiry={handleDeleteInquiry}
          onSaveBuyingHouseContent={handleSaveBuyingHouseContent}
          onSaveWhatsAppNumber={handleSaveWhatsAppNumber}
          onBackToStorefront={() => setActiveView('storefront')}
          onSwitchToClientPortal={() => setActiveView('portal')}
        />
      )}

      {activeView === 'admin' && !isAdmin && (
        <main className="max-w-[560px] mx-auto px-6 py-20">
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold text-slate-900">
              Private Admin / Owner Panel
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {user && emailVerified
                ? `Signed in as ${user.email}. Only the authorized website owner can upload, customize, edit, or update products and manage admin operations.`
                : user && !emailVerified
                  ? 'Please verify your owner email address using the banner above before opening the private Admin Dashboard.'
                  : 'This private dashboard is restricted to the website owner. Sign in with your verified owner Email & Password to manage products, quantities, quality grades, and images.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {!user ? (
                <button
                  type="button"
                  onClick={() => handleOpenSignIn('signin', 'header')}
                  className="px-5 py-2.5 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 cursor-pointer"
                >
                  Sign In as Owner (Email &amp; Password)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Sign Out &amp; Switch Account
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveView('storefront')}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Go to Customer Panel
              </button>
            </div>
          </div>
        </main>
      )}

      <FloatingWhatsAppButton whatsappNumber={whatsappNumber} />

      <EmailAuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={(authEmail, verified) => {
          setEmailVerified(verified);
          if (verified) {
            setAuthError('');
            if (isAdminEmail(authEmail)) {
              setActiveView('admin');
            } else if (authSource !== 'order') {
              setActiveView('portal');
            }
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}

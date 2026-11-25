import type { LanguageCode, OrderStatus, ShipmentStage } from '../types';

export interface TranslationBundle {
  brandName: string;
  nav: {
    catalog: string;
    upload: string;
    tracking: string;
    inquiry: string;
    portal: string;
    dashboard: string;
    signIn: string;
    signOut: string;
  };
  uploadSection: {
    heading: string;
    subheading: string;
    nameLabel: string;
    namePlaceholder: string;
    imageLabel: string;
    chooseImageBtn: string;
    imageUrlPlaceholder: string;
    addUrlBtn: string;
    setCoverBtn: string;
    coverLabel: string;
    photosCountLabel: string;
    detailsLabel: string;
    detailsPlaceholder: string;
    leastAmountLabel: string;
    highestAmountLabel: string;
    leastQtyLabel: string;
    highestQtyLabel: string;
    qualityLabel: string;
    qualityPlaceholder: string;
    categoryLabel: string;
    unitLabel: string;
    submitBtn: string;
    signInBtn: string;
    adminOnlyNotice: string;
    successNotice: string;
    viewInCatalogBtn: string;
    previewTitle: string;
    rangeLabel: string;
    clearImageBtn: string;
    imageRequiredNotice: string;
    emptyImagePreview: string;
  };
  hero: {
    regionLabel: string;
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    stats: [
      { value: string; label: string },
      { value: string; label: string },
      { value: string; label: string },
      { value: string; label: string },
    ];
  };
  catalog: {
    heading: string;
    subheading: string;
    searchPlaceholder: string;
    smartSearchBtn: string;
    autocorrectPrefix: string;
    autocorrectFrom: string;
    applyCorrectionBtn: string;
    allCategories: string;
    fobLabel: string;
    moqLabel: string;
    qtyRangeLabel: string;
    qualityLabel: string;
    originLabel: string;
    leadTimeLabel: string;
    daysSuffix: string;
    inspectButton: string;
    emptyTitle: string;
    emptyBody: string;
    noProductsYetTitle: string;
    noProductsYetBody: string;
    goToUploadBtn: string;
    availability: {
      in_stock: string;
      made_to_order: string;
      out_of_stock: string;
    };
  };
  productModal: {
    specsTitle: string;
    quality: string;
    qtyRange: string;
    hsCode: string;
    originPort: string;
    leadTime: string;
    weight: string;
    dimensions: string;
    certifications: string;
    orderBoxTitle: string;
    quantityLabel: string;
    incotermsLabel: string;
    destPortLabel: string;
    notesLabel: string;
    subtotalLabel: string;
    freightEstLabel: string;
    totalEstLabel: string;
    placeOrderBtn: string;
    signInToOrderBtn: string;
    authRequiredTitle: string;
    authRequiredBody: string;
    loginExistingBtn: string;
    createAccountBtn: string;
    requestQuoteBtn: string;
    orderSuccessMsg: string;
  };
  tracking: {
    heading: string;
    subheading: string;
    placeholder: string;
    trackButton: string;
    samplesLabel: string;
    carrierLabel: string;
    vesselLabel: string;
    containerLabel: string;
    routeLabel: string;
    etaLabel: string;
    locationLabel: string;
    weightLabel: string;
    logTitle: string;
    notFoundTitle: string;
    notFoundBody: string;
    stages: Record<ShipmentStage, string>;
  };
  inquiry: {
    heading: string;
    subheading: string;
    docsTitle: string;
    docsList: string[];
    companyLabel: string;
    contactLabel: string;
    emailLabel: string;
    countryLabel: string;
    portLabel: string;
    productLabel: string;
    volumeLabel: string;
    incotermsLabel: string;
    messageLabel: string;
    submitButton: string;
    submittingButton: string;
    successTitle: string;
    successBody: string;
    anotherButton: string;
  };
  portal: {
    title: string;
    subtitle: string;
    profileTab: string;
    ordersTab: string;
    inquiriesTab: string;
    saveProfileBtn: string;
    profileSavedMsg: string;
    noOrdersTitle: string;
    noOrdersBody: string;
    browseCatalogBtn: string;
    cancelOrderBtn: string;
    trackShipmentBtn: string;
  };
  orderStatuses: Record<OrderStatus, string>;
  footer: {
    tagline: string;
    rights: string;
  };
}

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
};

const en: TranslationBundle = {
  brandName: 'AWP International Traders',
  nav: {
    catalog: 'Catalog',
    upload: 'Upload Product',
    tracking: 'Track Shipment',
    inquiry: 'Trade Inquiry',
    portal: 'Customer Panel',
    dashboard: 'Admin Panel',
    signIn: 'Sign In',
    signOut: 'Sign Out',
  },
  uploadSection: {
    heading: 'Upload Export Product',
    subheading:
      'Add a new export listing directly with product name, image, quality grade, least/highest quantity, and price range.',
    nameLabel: 'Product Name',
    namePlaceholder: 'e.g. 100% Combed Cotton Polo Shirts / Denim Jackets',
    imageLabel: 'Product Pictures (Phone Gallery Multi-Select or URLs · Up to 6)',
    chooseImageBtn: 'Upload Photos',
    imageUrlPlaceholder: 'Paste image URL(s), separated by commas (https://...)',
    addUrlBtn: 'Add URL(s)',
    setCoverBtn: 'Set Cover',
    coverLabel: 'Cover',
    photosCountLabel: 'photos',
    detailsLabel: 'Clothing Details & Specifications',
    detailsPlaceholder: 'Describe fabric GSM, material blend, size ratios (S-XXL), export carton packing, and certifications...',
    leastAmountLabel: 'Least Amount (USD)',
    highestAmountLabel: 'Highest Amount (USD)',
    leastQtyLabel: 'Least Quantity',
    highestQtyLabel: 'Highest Quantity',
    qualityLabel: 'Product Quality',
    qualityPlaceholder: 'e.g. Export Grade A+ (220 GSM Combed Cotton)',
    categoryLabel: 'Category',
    unitLabel: 'Unit',
    submitBtn: 'Upload & Publish Product',
    signInBtn: 'Sign In as Exporter Admin to Upload',
    adminOnlyNotice: 'Exporter admin account required to publish live catalog listings.',
    successNotice: 'published to the live AWP International Traders catalog.',
    viewInCatalogBtn: 'View in Catalog',
    previewTitle: 'Live Catalog Card Preview',
    rangeLabel: 'Amount Range (Least – Highest)',
    clearImageBtn: 'Clear All',
    imageRequiredNotice: 'Please upload at least one product picture or add an image URL.',
    emptyImagePreview: 'Upload product pictures to preview',
  },
  hero: {
    regionLabel: 'Global Clothing & Apparel Export · ISO 9001 Certified',
    headline: 'Direct wholesale clothing & garment supply across 48 international ports.',
    subheadline:
      'Browse certified apparel specifications, track ocean and air garment shipments in real time, and manage bulk B2B clothing orders from a unified export portal.',
    primaryCta: 'Explore Clothing Catalog',
    secondaryCta: 'Track a Shipment',
    stats: [
      { value: '48+', label: 'Active Destination Ports' },
      { value: '24h', label: 'Proforma Quote Turnaround' },
      { value: '99.4%', label: 'On-Schedule Customs Clearance' },
      { value: 'FOB / CIF', label: 'Flexible Trade Incoterms' },
    ],
  },
  catalog: {
    heading: 'Clothing Export Catalog',
    subheading: 'Search garments by name, fabric, SKU, HS code, origin port, or international certification.',
    searchPlaceholder: 'Search product name, SKU, HS code, or certification...',
    smartSearchBtn: 'Smart Search',
    autocorrectPrefix: 'Showing AI-matched results for',
    autocorrectFrom: 'corrected from',
    applyCorrectionBtn: 'Use corrected name',
    allCategories: 'All Categories',
    fobLabel: 'FOB Unit Price',
    moqLabel: 'MOQ',
    qtyRangeLabel: 'Order Qty Range',
    qualityLabel: 'Quality',
    originLabel: 'Origin',
    leadTimeLabel: 'Lead Time',
    daysSuffix: 'days',
    inspectButton: 'Specifications & Order',
    emptyTitle: 'No matching export listings',
    emptyBody: 'Clear your search query or select another product category.',
    noProductsYetTitle: 'No products uploaded yet',
    noProductsYetBody: 'Add your own product images, details, and amount range in the upload section below to populate your live catalog.',
    goToUploadBtn: 'Upload Your Product',
    availability: {
      in_stock: 'Ready for Dispatch',
      made_to_order: 'Made to Order',
      out_of_stock: 'Allocated / Backorder',
    },
  },
  productModal: {
    specsTitle: 'Technical & Customs Specifications',
    quality: 'Product Quality',
    qtyRange: 'Allowed Order Quantity',
    hsCode: 'HS Tariff Code',
    originPort: 'Port of Loading',
    leadTime: 'Production Lead Time',
    weight: 'Gross Unit Weight',
    dimensions: 'Export Packaging Dimensions',
    certifications: 'Compliance & Certificates',
    orderBoxTitle: 'Submit Purchase Order',
    quantityLabel: 'Order Quantity',
    incotermsLabel: 'Preferred Incoterms',
    destPortLabel: 'Destination Port',
    notesLabel: 'Packing / Certificate Instructions',
    subtotalLabel: 'Product Subtotal',
    freightEstLabel: 'Estimated Freight & Insurance',
    totalEstLabel: 'Total Order Value',
    placeOrderBtn: 'Submit Export Order',
    signInToOrderBtn: 'Sign In with Email to Order',
    authRequiredTitle: 'Sign In with Email & Password to Buy',
    authRequiredBody:
      'To buy any product, please log in with your email and password if you already have an account on AWP International Traders, or sign up to create a client account.',
    loginExistingBtn: 'Log In with Email & Password',
    createAccountBtn: 'Sign Up with Email & Password',
    requestQuoteBtn: 'Send Formal RFQ Inquiry',
    orderSuccessMsg: 'Purchase order submitted and queued for export confirmation.',
  },
  tracking: {
    heading: 'Real-Time Shipment Tracking',
    subheading: 'Enter your AWP International Traders tracking reference to inspect live vessel status, container ID, and customs milestones.',
    placeholder: 'Enter tracking ID (e.g. MRD-2026-8841)',
    trackButton: 'Track Cargo',
    samplesLabel: 'Sample references:',
    carrierLabel: 'Carrier',
    vesselLabel: 'Vessel',
    containerLabel: 'Container ID',
    routeLabel: 'Trade Route',
    etaLabel: 'Estimated Arrival',
    locationLabel: 'Latest Telemetry Position',
    weightLabel: 'Verified Gross Weight',
    logTitle: 'Verified Milestone Ledger',
    notFoundTitle: 'Tracking reference not found',
    notFoundBody: 'Verify the tracking number or select one of the active shipment references above.',
    stages: {
      order_confirmed: 'Confirmed',
      customs_cleared: 'Export Cleared',
      vessel_loaded: 'Loaded',
      ocean_transit: 'In Transit',
      port_arrival: 'Port Arrival',
      customs_released: 'Import Released',
      delivered: 'Delivered',
    },
  },
  inquiry: {
    heading: 'International Trade Inquiry',
    subheading: 'Request bulk pricing tiers, sample dispatches, or custom HS-code documentation for your destination port.',
    docsTitle: 'Included Export Documentation',
    docsList: [
      'Commercial Invoice & Certified Packing List',
      'Certificate of Origin (Chamber of Commerce)',
      'Clean On-Board Bill of Lading / Air Waybill',
      'Phytosanitary, Mill Test, or CE Conformity Dossier',
    ],
    companyLabel: 'Company Legal Name',
    contactLabel: 'Authorized Buyer Name',
    emailLabel: 'Corporate Email',
    countryLabel: 'Destination Country',
    portLabel: 'Destination Port',
    productLabel: 'Product or Category of Interest',
    volumeLabel: 'Estimated Volume / Frequency',
    incotermsLabel: 'Preferred Incoterms',
    messageLabel: 'Specifications, Packaging, or Compliance Notes',
    submitButton: 'Submit Trade Inquiry',
    submittingButton: 'Submitting Inquiry...',
    successTitle: 'Trade Inquiry Logged',
    successBody: 'Our regional export desk has received your RFQ and will issue a formal proforma within 24 business hours.',
    anotherButton: 'Submit Another Inquiry',
  },
  portal: {
    title: 'Customer / Client Panel',
    subtitle: 'Manage your buyer profile, track active clothing shipments, and review order history.',
    profileTab: 'Company Profile',
    ordersTab: 'Export Orders',
    inquiriesTab: 'My Inquiries',
    saveProfileBtn: 'Save Trade Profile',
    profileSavedMsg: 'Company profile and trade preferences saved.',
    noOrdersTitle: 'No export orders yet',
    noOrdersBody: 'Select any listing from the export catalog to submit your first purchase order.',
    browseCatalogBtn: 'Browse Catalog',
    cancelOrderBtn: 'Cancel Pending Order',
    trackShipmentBtn: 'Track Live Cargo',
  },
  orderStatuses: {
    pending_review: 'Pending Review',
    confirmed: 'Confirmed',
    customs_dispatch: 'Customs & Dispatch',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  },
  footer: {
    tagline: 'Direct international B2B export logistics, customs compliance, and multi-port fulfillment.',
    rights: '© 2026 AWP International Traders. All rights reserved.',
  },
};

const es: TranslationBundle = {
  brandName: 'AWP International Traders',
  nav: {
    catalog: 'Catálogo',
    upload: 'Subir Producto',
    tracking: 'Rastreo',
    inquiry: 'Cotización',
    portal: 'Panel Cliente',
    dashboard: 'Panel Admin',
    signIn: 'Iniciar Sesión',
    signOut: 'Cerrar Sesión',
  },
  uploadSection: {
    heading: 'Subir Producto de Exportación',
    subheading:
      'Agregue un nuevo producto con nombre, imagen, calidad, cantidad mínima/máxima y rango de precio.',
    nameLabel: 'Nombre del Producto',
    namePlaceholder: 'ej. Camisetas Polo 100% Algodón Peinado / Chaquetas Denim',
    imageLabel: 'Fotos del Producto (Subir Varias Imágenes o URLs · Máx. 6)',
    chooseImageBtn: 'Agregar Foto(s)',
    imageUrlPlaceholder: 'Pegar URL de imagen (https://...)',
    addUrlBtn: 'Agregar URL',
    setCoverBtn: 'Principal',
    coverLabel: 'Principal',
    photosCountLabel: 'fotos',
    detailsLabel: 'Detalles y Especificaciones de la Prenda',
    detailsPlaceholder: 'Describa gramaje GSM, composición de tela, tallas, embalaje de exportación y certificaciones...',
    leastAmountLabel: 'Monto Mínimo (USD)',
    highestAmountLabel: 'Monto Máximo (USD)',
    leastQtyLabel: 'Cantidad Mínima',
    highestQtyLabel: 'Cantidad Máxima',
    qualityLabel: 'Calidad del Producto',
    qualityPlaceholder: 'ej. Grado Exportación A+ (220 GSM)',
    categoryLabel: 'Categoría',
    unitLabel: 'Unidad',
    submitBtn: 'Subir y Publicar Producto',
    signInBtn: 'Iniciar Sesión como Admin para Subir',
    adminOnlyNotice: 'Se requiere cuenta de administrador exportador para publicar en el catálogo.',
    successNotice: 'publicado en el catálogo en vivo de AWP International Traders.',
    viewInCatalogBtn: 'Ver en Catálogo',
    previewTitle: 'Vista Previa en Catálogo',
    rangeLabel: 'Rango de Monto (Mínimo – Máximo)',
    clearImageBtn: 'Quitar Todas',
    imageRequiredNotice: 'Por favor suba al menos una foto del producto o agregue una URL.',
    emptyImagePreview: 'Suba fotos del producto para previsualizar',
  },
  hero: {
    regionLabel: 'Exportación Global de Confección y Moda · ISO 9001',
    headline: 'Suministro directo de prendas y textiles al por mayor a 48 puertos internacionales.',
    subheadline:
      'Consulte fichas técnicas de confección, rastree embarques textiles en tiempo real y gestione pedidos B2B desde un portal unificado.',
    primaryCta: 'Explorar Catálogo Textil',
    secondaryCta: 'Rastrear Envío',
    stats: [
      { value: '48+', label: 'Puertos de Destino Activos' },
      { value: '24h', label: 'Emisión de Factura Proforma' },
      { value: '99.4%', label: 'Despacho Aduanal Puntual' },
      { value: 'FOB / CIF', label: 'Incoterms Flexibles' },
    ],
  },
  catalog: {
    heading: 'Catálogo de Exportación Textil',
    subheading: 'Busque por nombre de prenda, tejido, SKU, código arancelario HS o certificación.',
    searchPlaceholder: 'Buscar nombre de producto, SKU, código HS...',
    smartSearchBtn: 'Búsqueda IA',
    autocorrectPrefix: 'Mostrando resultados corregidos para',
    autocorrectFrom: 'corregido de',
    applyCorrectionBtn: 'Usar término corregido',
    allCategories: 'Todas las Categorías',
    fobLabel: 'Precio Unitario FOB',
    moqLabel: 'Pedido Mínimo',
    qtyRangeLabel: 'Rango de Cantidad',
    qualityLabel: 'Calidad',
    originLabel: 'Origen',
    leadTimeLabel: 'Plazo',
    daysSuffix: 'días',
    inspectButton: 'Especificaciones y Pedido',
    emptyTitle: 'Sin resultados en el catálogo',
    emptyBody: 'Ajuste su búsqueda o seleccione otra categoría de producto.',
    noProductsYetTitle: 'Aún no hay productos cargados',
    noProductsYetBody: 'Suba sus propias imágenes, detalles y montos en la sección inferior para publicar su catálogo.',
    goToUploadBtn: 'Subir Producto',
    availability: {
      in_stock: 'Listo para Despacho',
      made_to_order: 'Bajo Pedido',
      out_of_stock: 'Asignado / Sin Stock',
    },
  },
  productModal: {
    specsTitle: 'Especificaciones Técnicas y Aduanales',
    quality: 'Calidad del Producto',
    qtyRange: 'Cantidad Permitida',
    hsCode: 'Código Arancelario HS',
    originPort: 'Puerto de Carga',
    leadTime: 'Tiempo de Producción',
    weight: 'Peso Bruto Unitario',
    dimensions: 'Dimensiones de Embalaje',
    certifications: 'Certificaciones y Normativa',
    orderBoxTitle: 'Enviar Orden de Compra',
    quantityLabel: 'Cantidad del Pedido',
    incotermsLabel: 'Incoterms Preferidos',
    destPortLabel: 'Puerto de Destino',
    notesLabel: 'Instrucciones de Embalaje / Certificados',
    subtotalLabel: 'Subtotal de Mercancía',
    freightEstLabel: 'Flete y Seguro Estimado',
    totalEstLabel: 'Valor Total del Pedido',
    placeOrderBtn: 'Confirmar Orden de Exportación',
    signInToOrderBtn: 'Inicie Sesión con Correo para Ordenar',
    authRequiredTitle: 'Inicie Sesión con Correo y Contraseña para Comprar',
    authRequiredBody:
      'Para comprar cualquier producto, inicie sesión con su correo y contraseña si ya tiene una cuenta en AWP International Traders o cree una cuenta nueva.',
    loginExistingBtn: 'Iniciar Sesión (Correo y Contraseña)',
    createAccountBtn: 'Registrarse (Correo y Contraseña)',
    requestQuoteBtn: 'Solicitar Cotización Formal',
    orderSuccessMsg: 'Orden enviada y registrada para confirmación de exportación.',
  },
  tracking: {
    heading: 'Rastreo de Carga en Tiempo Real',
    subheading: 'Ingrese su referencia de AWP International Traders para consultar el estado del buque, contenedor y hitos aduanales.',
    placeholder: 'Ingrese código de rastreo (ej. MRD-2026-8841)',
    trackButton: 'Rastrear Carga',
    samplesLabel: 'Referencias de prueba:',
    carrierLabel: 'Naviera',
    vesselLabel: 'Buque',
    containerLabel: 'Contenedor',
    routeLabel: 'Ruta Comercial',
    etaLabel: 'Llegada Estimada (ETA)',
    locationLabel: 'Posición Actual',
    weightLabel: 'Peso Bruto Verificado',
    logTitle: 'Registro Cronológico de Hitos',
    notFoundTitle: 'Referencia no encontrada',
    notFoundBody: 'Verifique el código de rastreo o elija una referencia de muestra arriba.',
    stages: {
      order_confirmed: 'Confirmado',
      customs_cleared: 'Aduana Origen',
      vessel_loaded: 'Embarcado',
      ocean_transit: 'En Tránsito',
      port_arrival: 'Arribo Puerto',
      customs_released: 'Liberado',
      delivered: 'Entregado',
    },
  },
  inquiry: {
    heading: 'Solicitud de Cotización Internacional',
    subheading: 'Solicite tarifas por volumen, muestras comerciales o documentación arancelaria para su puerto.',
    docsTitle: 'Documentación de Exportación Incluida',
    docsList: [
      'Factura Comercial y Lista de Empaque Certificada',
      'Certificado de Origen (Cámara de Comercio)',
      'Conocimiento de Embarque (B/L) o Guía Aérea',
      'Certificados Fitosanitarios, de Calidad o Conformidad CE',
    ],
    companyLabel: 'Razón Social de la Empresa',
    contactLabel: 'Nombre del Comprador',
    emailLabel: 'Correo Corporativo',
    countryLabel: 'País de Destino',
    portLabel: 'Puerto de Destino',
    productLabel: 'Producto o Categoría de Interés',
    volumeLabel: 'Volumen Estimado / Frecuencia',
    incotermsLabel: 'Incoterms Preferidos',
    messageLabel: 'Notas de Especificación o Embalaje',
    submitButton: 'Enviar Solicitud Comercial',
    submittingButton: 'Enviando Solicitud...',
    successTitle: 'Solicitud Registrada',
    successBody: 'Nuestro equipo de exportación responderá con una proforma formal en menos de 24 horas hábiles.',
    anotherButton: 'Enviar Otra Solicitud',
  },
  portal: {
    title: 'Panel de Cliente',
    subtitle: 'Gestione sus datos fiscales, rastree embarques activos y revise su historial de órdenes.',
    profileTab: 'Perfil Corporativo',
    ordersTab: 'Órdenes de Exportación',
    inquiriesTab: 'Mis Solicitudes',
    saveProfileBtn: 'Guardar Perfil Comercial',
    profileSavedMsg: 'Perfil corporativo y preferencias guardados.',
    noOrdersTitle: 'Sin órdenes registradas',
    noOrdersBody: 'Seleccione cualquier producto del catálogo para emitir su primera orden.',
    browseCatalogBtn: 'Ver Catálogo',
    cancelOrderBtn: 'Cancelar Orden Pendiente',
    trackShipmentBtn: 'Rastrear Carga',
  },
  orderStatuses: {
    pending_review: 'Pendiente de Revisión',
    confirmed: 'Confirmada',
    customs_dispatch: 'Aduana y Despacho',
    in_transit: 'En Tránsito',
    delivered: 'Entregada',
    cancelled: 'Cancelada',
  },
  footer: {
    tagline: 'Logística internacional B2B, cumplimiento aduanal y despacho multipuerto.',
    rights: '© 2026 AWP International Traders. Todos los derechos reservados.',
  },
};

const fr: TranslationBundle = {
  brandName: 'AWP International Traders',
  nav: {
    catalog: 'Catalogue',
    upload: 'Ajouter Produit',
    tracking: 'Suivi Fret',
    inquiry: 'Demande Devis',
    portal: 'Espace Client',
    dashboard: 'Panneau Admin',
    signIn: 'Connexion',
    signOut: 'Déconnexion',
  },
  uploadSection: {
    heading: 'Téléverser un Produit Export',
    subheading:
      'Ajoutez un produit avec son nom, image, qualité, quantité min/max et fourchette de prix.',
    nameLabel: 'Nom du Produit',
    namePlaceholder: 'ex. Polos 100% Coton Peigné / Vestes en Denim',
    imageLabel: 'Photos du Produit (Plusieurs Fichiers ou URLs · Max 6)',
    chooseImageBtn: 'Ajouter Photo(s)',
    imageUrlPlaceholder: 'Coller une URL (https://...)',
    addUrlBtn: 'Ajouter URL',
    setCoverBtn: 'Principale',
    coverLabel: 'Principale',
    photosCountLabel: 'photos',
    detailsLabel: 'Détails & Spécifications du Vêtement',
    detailsPlaceholder: 'Décrivez le grammage GSM, la matière, les tailles, le colisage export et certifications...',
    leastAmountLabel: 'Montant Minimum (USD)',
    highestAmountLabel: 'Montant Maximum (USD)',
    leastQtyLabel: 'Quantité Minimum',
    highestQtyLabel: 'Quantité Maximum',
    qualityLabel: 'Qualité du Produit',
    qualityPlaceholder: 'ex. Qualité Export Grade A+ (220 GSM)',
    categoryLabel: 'Catégorie',
    unitLabel: 'Unité',
    submitBtn: 'Publier le Produit',
    signInBtn: 'Connexion Admin pour Publier',
    adminOnlyNotice: 'Un compte administrateur exportateur est requis pour publier.',
    successNotice: 'publié dans le catalogue AWP International Traders.',
    viewInCatalogBtn: 'Voir au Catalogue',
    previewTitle: 'Aperçu Fiche Catalogue',
    rangeLabel: 'Fourchette de Montant (Min – Max)',
    clearImageBtn: 'Tout Effacer',
    imageRequiredNotice: 'Veuillez téléverser au moins une photo du produit ou saisir une URL.',
    emptyImagePreview: 'Téléversez des photos produit pour l’aperçu',
  },
  hero: {
    regionLabel: 'Export Mondial Textile & Habillement · Certifié ISO 9001',
    headline: 'Approvisionnement direct de vêtements en gros vers 48 ports internationaux.',
    subheadline:
      'Consultez nos fiches textiles export, suivez vos expéditions en temps réel et gérez vos commandes B2B depuis une interface unique.',
    primaryCta: 'Parcourir le Catalogue Textile',
    secondaryCta: 'Suivre un Envoi',
    stats: [
      { value: '48+', label: 'Ports de Destination Actifs' },
      { value: '24h', label: 'Délai Facture Proforma' },
      { value: '99.4%', label: 'Dédouanement Ponctuel' },
      { value: 'FOB / CIF', label: 'Incoterms Flexibles' },
    ],
  },
  catalog: {
    heading: 'Catalogue Export Vêtements',
    subheading: 'Recherchez par modèle, tissu, référence SKU, code SH, port ou certification.',
    searchPlaceholder: 'Rechercher nom de produit, SKU, code SH...',
    smartSearchBtn: 'Recherche IA',
    autocorrectPrefix: 'Résultats corrigés par IA pour',
    autocorrectFrom: 'corrigé depuis',
    applyCorrectionBtn: 'Utiliser la correction',
    allCategories: 'Toutes Catégories',
    fobLabel: 'Prix Unitaire FOB',
    moqLabel: 'QMC',
    qtyRangeLabel: 'Quantité Autorisée',
    qualityLabel: 'Qualité',
    originLabel: 'Origine',
    leadTimeLabel: 'Délai',
    daysSuffix: 'jours',
    inspectButton: 'Spécifications & Commande',
    emptyTitle: 'Aucun produit correspondant',
    emptyBody: 'Modifiez votre recherche ou changez de catégorie.',
    noProductsYetTitle: 'Aucun produit publié pour le moment',
    noProductsYetBody: 'Ajoutez vos propres images, détails et fourchettes de prix dans la section ci-dessous.',
    goToUploadBtn: 'Ajouter un Produit',
    availability: {
      in_stock: 'Prêt à Expédier',
      made_to_order: 'Sur Commande',
      out_of_stock: 'Alloué / Rupture',
    },
  },
  productModal: {
    specsTitle: 'Spécifications Techniques & Douanières',
    quality: 'Qualité du Produit',
    qtyRange: 'Quantité de Commande',
    hsCode: 'Code Douanier SH',
    originPort: 'Port de Chargement',
    leadTime: 'Délai de Production',
    weight: 'Poids Brut Unitaire',
    dimensions: 'Dimensions Colis Export',
    certifications: 'Certifications & Conformité',
    orderBoxTitle: 'Passer Commande Export',
    quantityLabel: 'Quantité Commandée',
    incotermsLabel: 'Incoterms Souhaités',
    destPortLabel: 'Port de Destination',
    notesLabel: 'Instructions Emballage / Certificats',
    subtotalLabel: 'Sous-total Marchandise',
    freightEstLabel: 'Fret & Assurance Estimés',
    totalEstLabel: 'Total Estimé',
    placeOrderBtn: 'Valider la Commande',
    signInToOrderBtn: 'Connexion par Email pour Commander',
    authRequiredTitle: 'Connexion par Email et Mot de Passe Requise',
    authRequiredBody:
      'Pour acheter un produit, connectez-vous avec votre email et mot de passe si vous avez déjà un compte sur AWP International Traders, ou créez un compte client.',
    loginExistingBtn: 'Connexion (Email & Mot de Passe)',
    createAccountBtn: 'Créer un Compte (Email & Mot de Passe)',
    requestQuoteBtn: 'Demander un Devis Formule',
    orderSuccessMsg: 'Commande enregistrée et transmise pour validation export.',
  },
  tracking: {
    heading: 'Suivi de Fret en Temps Réel',
    subheading: 'Saisissez votre référence AWP International Traders pour suivre le navire, le conteneur et les étapes douanières.',
    placeholder: 'Référence de suivi (ex. MRD-2026-8841)',
    trackButton: 'Suivre le Colis',
    samplesLabel: 'Références démo :',
    carrierLabel: 'Armateur',
    vesselLabel: 'Navire',
    containerLabel: 'Conteneur',
    routeLabel: 'Route Maritime',
    etaLabel: 'Arrivée Prévue (ETA)',
    locationLabel: 'Position Actuelle',
    weightLabel: 'Poids Brut Vérifié',
    logTitle: 'Journal des Étapes Vérifiées',
    notFoundTitle: 'Référence introuvable',
    notFoundBody: 'Vérifiez le numéro de suivi ou sélectionnez un exemple ci-dessus.',
    stages: {
      order_confirmed: 'Confirmé',
      customs_cleared: 'Douane Export',
      vessel_loaded: 'Chargé',
      ocean_transit: 'En Transit',
      port_arrival: 'Arrivée Port',
      customs_released: 'Dédouané',
      delivered: 'Livré',
    },
  },
  inquiry: {
    heading: 'Demande Commerciale Internationale',
    subheading: 'Demandez des tarifs dégressifs, échantillons ou dossiers douaniers adaptés à votre port.',
    docsTitle: 'Documents Export Inclus',
    docsList: [
      'Facture Commerciale & Liste de Colisage Certifiée',
      'Certificat d’Origine (Chambre de Commerce)',
      'Connaissement Maritime (B/L) ou LTA',
      'Certificats Phytosanitaires, Matière ou Marquage CE',
    ],
    companyLabel: 'Raison Sociale',
    contactLabel: 'Nom de l’Acheteur',
    emailLabel: 'Email Professionnel',
    countryLabel: 'Pays de Destination',
    portLabel: 'Port de Destination',
    productLabel: 'Produit ou Catégorie',
    volumeLabel: 'Volume Estimé / Fréquence',
    incotermsLabel: 'Incoterms Préférés',
    messageLabel: 'Précisions Techniques ou Emballage',
    submitButton: 'Envoyer la Demande',
    submittingButton: 'Envoi en cours...',
    successTitle: 'Demande Enregistrée',
    successBody: 'Notre bureau export vous transmettra une facture proforma sous 24 heures ouvrées.',
    anotherButton: 'Nouvelle Demande',
  },
  portal: {
    title: 'Panneau Client International',
    subtitle: 'Gérez votre profil société, suivez vos expéditions actives et consultez vos commandes.',
    profileTab: 'Profil Société',
    ordersTab: 'Mes Commandes',
    inquiriesTab: 'Mes Demandes',
    saveProfileBtn: 'Enregistrer le Profil',
    profileSavedMsg: 'Profil société et préférences mis à jour.',
    noOrdersTitle: 'Aucune commande enregistrée',
    noOrdersBody: 'Sélectionnez un article du catalogue pour passer votre première commande.',
    browseCatalogBtn: 'Voir le Catalogue',
    cancelOrderBtn: 'Annuler la Commande',
    trackShipmentBtn: 'Suivre le Navire',
  },
  orderStatuses: {
    pending_review: 'En Attente',
    confirmed: 'Confirmée',
    customs_dispatch: 'Douane & Expédition',
    in_transit: 'En Transit',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  },
  footer: {
    tagline: 'Logistique export B2B directe, conformité douanière et expédition multi-ports.',
    rights: '© 2026 AWP International Traders. Tous droits réservés.',
  },
};

const de: TranslationBundle = {
  brandName: 'AWP International Traders',
  nav: {
    catalog: 'Katalog',
    upload: 'Produkt Hochladen',
    tracking: 'Sendungsverfolgung',
    inquiry: 'Anfrage',
    portal: 'Kundenpanel',
    dashboard: 'Admin-Panel',
    signIn: 'Anmelden',
    signOut: 'Abmelden',
  },
  uploadSection: {
    heading: 'Exportprodukt hochladen',
    subheading:
      'Laden Sie ein Produkt mit Name, Bild, Qualität, Mindest-/Höchstmenge und Preisspanne hoch.',
    nameLabel: 'Produktname',
    namePlaceholder: 'z.B. 100% Gekämmte Baumwoll-Poloshirts / Denim-Jacken',
    imageLabel: 'Produktbilder (Mehrere Dateien oder URLs · Max. 6)',
    chooseImageBtn: 'Bild(er) hinzufügen',
    imageUrlPlaceholder: 'Bild-URL einfügen (https://...)',
    addUrlBtn: 'URL hinzufügen',
    setCoverBtn: 'Titelbild',
    coverLabel: 'Titelbild',
    photosCountLabel: 'Fotos',
    detailsLabel: 'Bekleidungsdetails & Spezifikationen',
    detailsPlaceholder: 'Stoffgewicht GSM, Materialmix, Größenverteilung, Exportverpackung und Zertifikate beschreiben...',
    leastAmountLabel: 'Mindestbetrag (USD)',
    highestAmountLabel: 'Höchstbetrag (USD)',
    leastQtyLabel: 'Mindestmenge',
    highestQtyLabel: 'Höchstmenge',
    qualityLabel: 'Produktqualität',
    qualityPlaceholder: 'z.B. Export-Qualität A+ (220 GSM)',
    categoryLabel: 'Kategorie',
    unitLabel: 'Einheit',
    submitBtn: 'Produkt hochladen & veröffentlichen',
    signInBtn: 'Als Export-Admin anmelden',
    adminOnlyNotice: 'Für die Veröffentlichung im Live-Katalog ist ein Admin-Konto erforderlich.',
    successNotice: 'im Live-Katalog von AWP International Traders veröffentlicht.',
    viewInCatalogBtn: 'Im Katalog ansehen',
    previewTitle: 'Live-Vorschau im Katalog',
    rangeLabel: 'Betragsspanne (Min – Max)',
    clearImageBtn: 'Alle entfernen',
    imageRequiredNotice: 'Bitte laden Sie mindestens ein Produktbild hoch oder fügen Sie eine URL hinzu.',
    emptyImagePreview: 'Produktbilder für die Vorschau hochladen',
  },
  hero: {
    regionLabel: 'Globaler Bekleidungsexport · ISO 9001 Zertifiziert',
    headline: 'Direkter Großhandels-Bekleidungsexport an 48 internationale Häfen.',
    subheadline:
      'Durchsuchen Sie geprüfte Bekleidungsspezifikationen, verfolgen Sie Sendungen in Echtzeit und verwalten Sie B2B-Aufträge zentral.',
    primaryCta: 'Bekleidungskatalog öffnen',
    secondaryCta: 'Sendung verfolgen',
    stats: [
      { value: '48+', label: 'Aktive Zielhäfen weltweit' },
      { value: '24h', label: 'Proforma-Angebotszeit' },
      { value: '99.4%', label: 'Termingerechte Verzollung' },
      { value: 'FOB / CIF', label: 'Flexible Incoterms' },
    ],
  },
  catalog: {
    heading: 'Bekleidungs-Exportkatalog',
    subheading: 'Suche nach Modellname, Stoff, SKU, HS-Zolltarifnummer oder Zertifikat.',
    searchPlaceholder: 'Produktname, SKU, HS-Code oder Norm suchen...',
    smartSearchBtn: 'KI-Suche',
    autocorrectPrefix: 'KI-korrigierte Ergebnisse für',
    autocorrectFrom: 'korrigiert aus',
    applyCorrectionBtn: 'Korrektur übernehmen',
    allCategories: 'Alle Kategorien',
    fobLabel: 'FOB-Stückpreis',
    moqLabel: 'Mindestmenge',
    qtyRangeLabel: 'Bestellmenge (Min–Max)',
    qualityLabel: 'Qualität',
    originLabel: 'Herkunft',
    leadTimeLabel: 'Lieferzeit',
    daysSuffix: 'Tage',
    inspectButton: 'Spezifikationen & Bestellung',
    emptyTitle: 'Keine passenden Einträge',
    emptyBody: 'Passen Sie Ihren Suchbegriff an oder wählen Sie eine andere Kategorie.',
    noProductsYetTitle: 'Noch keine Produkte hochgeladen',
    noProductsYetBody: 'Fügen Sie unten Ihre eigenen Produktbilder, Details und Preisspannen hinzu.',
    goToUploadBtn: 'Produkt hochladen',
    availability: {
      in_stock: 'Versandbereit',
      made_to_order: 'Auftragsfertigung',
      out_of_stock: 'Reserviert / Nachbestellt',
    },
  },
  productModal: {
    specsTitle: 'Technische & Zolldaten',
    quality: 'Produktqualität',
    qtyRange: 'Zulässige Bestellmenge',
    hsCode: 'HS-Zolltarifnummer',
    originPort: 'Verladehafen',
    leadTime: 'Produktionsvorlaufzeit',
    weight: 'Bruttogewicht je Einheit',
    dimensions: 'Exportverpackungsmaße',
    certifications: 'Zertifikate & Konformität',
    orderBoxTitle: 'Exportauftrag einreichen',
    quantityLabel: 'Bestellmenge',
    incotermsLabel: 'Bevorzugte Incoterms',
    destPortLabel: 'Zielhafen',
    notesLabel: 'Verpackungs- / Zertifikathinweise',
    subtotalLabel: 'Warenwert Zwischensumme',
    freightEstLabel: 'Geschätzte Fracht & Versicherung',
    totalEstLabel: 'Gesamtauftragswert',
    placeOrderBtn: 'Exportauftrag absenden',
    signInToOrderBtn: 'Mit E-Mail anmelden zum Bestellen',
    authRequiredTitle: 'Mit E-Mail & Passwort anmelden zum Kaufen',
    authRequiredBody:
      'Um ein Produkt zu kaufen, melden Sie sich bitte mit Ihrer E-Mail-Adresse und Ihrem Passwort an, falls Sie bereits ein Konto haben, oder erstellen Sie ein neues Kundenkonto.',
    loginExistingBtn: 'Anmelden (E-Mail & Passwort)',
    createAccountBtn: 'Registrieren (E-Mail & Passwort)',
    requestQuoteBtn: 'Formelle RFQ-Anfrage senden',
    orderSuccessMsg: 'Auftrag übermittelt und zur Exportprüfung eingereiht.',
  },
  tracking: {
    heading: 'Echtzeit-Sendungsverfolgung',
    subheading: 'Geben Sie Ihre AWP International Traders-Trackingnummer ein, um Schiffsstatus, Container-ID und Zollmeilensteine zu prüfen.',
    placeholder: 'Tracking-ID eingeben (z.B. MRD-2026-8841)',
    trackButton: 'Fracht verfolgen',
    samplesLabel: 'Beispielnummern:',
    carrierLabel: 'Reederei',
    vesselLabel: 'Schiff',
    containerLabel: 'Container-Nr.',
    routeLabel: 'Handelsroute',
    etaLabel: 'Voraussichtliche Ankunft',
    locationLabel: 'Aktuelle Position',
    weightLabel: 'Verifiziertes Bruttogewicht',
    logTitle: 'Verifiziertes Meilenstein-Protokoll',
    notFoundTitle: 'Tracking-Referenz nicht gefunden',
    notFoundBody: 'Prüfen Sie die Nummer oder wählen Sie eine Beispielsendung oben.',
    stages: {
      order_confirmed: 'Bestätigt',
      customs_cleared: 'Ausfuhrzoll',
      vessel_loaded: 'Verladen',
      ocean_transit: 'Seetransit',
      port_arrival: 'Hafenankunft',
      customs_released: 'Verzollt',
      delivered: 'Zugestellt',
    },
  },
  inquiry: {
    heading: 'Internationale Handelsanfrage',
    subheading: 'Fordern Sie Staffelpreise, Muster oder Zolldokumente für Ihren Zielhafen an.',
    docsTitle: 'Enthaltene Exportdokumente',
    docsList: [
      'Handelsrechnung & zertifizierte Packliste',
      'Ursprungszeugnis (Industrie- und Handelskammer)',
      'Konnossement (Bill of Lading) / Luftfrachtbrief',
      'Pflanzengesundheits-, Werksprüf- oder CE-Nachweise',
    ],
    companyLabel: 'Firmenname',
    contactLabel: 'Ansprechpartner',
    emailLabel: 'Geschäftliche E-Mail',
    countryLabel: 'Zielland',
    portLabel: 'Zielhafen',
    productLabel: 'Gewünschtes Produkt / Kategorie',
    volumeLabel: 'Geschätztes Volumen / Turnus',
    incotermsLabel: 'Bevorzugte Incoterms',
    messageLabel: 'Spezifikations- oder Verpackungshinweise',
    submitButton: 'Handelsanfrage senden',
    submittingButton: 'Wird gesendet...',
    successTitle: 'Anfrage gespeichert',
    successBody: 'Unser Exportdesk sendet Ihnen innerhalb von 24 Werkstunden eine Proforma-Rechnung.',
    anotherButton: 'Weitere Anfrage senden',
  },
  portal: {
    title: 'Kundenkonto-Panel',
    subtitle: 'Verwalten Sie Firmendaten, verfolgen Sie aktive Seefracht und prüfen Sie Bestellungen.',
    profileTab: 'Firmenprofil',
    ordersTab: 'Exportaufträge',
    inquiriesTab: 'Meine Anfragen',
    saveProfileBtn: 'Profil speichern',
    profileSavedMsg: 'Firmenprofil und Handelseinstellungen gespeichert.',
    noOrdersTitle: 'Noch keine Exportaufträge',
    noOrdersBody: 'Wählen Sie ein Produkt aus dem Katalog, um Ihren ersten Auftrag aufzugeben.',
    browseCatalogBtn: 'Katalog ansehen',
    cancelOrderBtn: 'Offenen Auftrag stornieren',
    trackShipmentBtn: 'Fracht verfolgen',
  },
  orderStatuses: {
    pending_review: 'In Prüfung',
    confirmed: 'Bestätigt',
    customs_dispatch: 'Zoll & Versand',
    in_transit: 'Unterwegs',
    delivered: 'Zugestellt',
    cancelled: 'Storniert',
  },
  footer: {
    tagline: 'Direkte internationale B2B-Exportlogistik, Zollabwicklung und Multi-Port-Versand.',
    rights: '© 2026 AWP International Traders. Alle Rechte vorbehalten.',
  },
};

const zh: TranslationBundle = {
  brandName: 'AWP International Traders',
  nav: {
    catalog: '产品目录',
    upload: '上传产品',
    tracking: '货运追踪',
    inquiry: '贸易询盘',
    portal: '客户面板',
    dashboard: '管理员面板',
    signIn: '登录账户',
    signOut: '退出登录',
  },
  uploadSection: {
    heading: '上传出口产品',
    subheading: '直接上传产品名称、产品图片、产品品质、最低/最高数量及价格区间。',
    nameLabel: '产品名称',
    namePlaceholder: '例如：100% 精梳纯棉 Polo 衫 / 水洗牛仔夹克',
    imageLabel: '产品多图上传（选择多张图片或添加链接 · 最多 6 张）',
    chooseImageBtn: '添加产品图片',
    imageUrlPlaceholder: '粘贴图片 URL (https://...)',
    addUrlBtn: '添加链接',
    setCoverBtn: '设为封面',
    coverLabel: '封面',
    photosCountLabel: '张图片',
    detailsLabel: '服装详情与技术规格',
    detailsPlaceholder: '请描述面料克重 GSM、材质成分、尺码配比、出口装箱标准及 OEKO-TEX 认证信息...',
    leastAmountLabel: '最低金额 (USD)',
    highestAmountLabel: '最高金额 (USD)',
    leastQtyLabel: '最低起订量',
    highestQtyLabel: '最高订购量',
    qualityLabel: '产品品质等级',
    qualityPlaceholder: '例如：出口 A+ 级（220 GSM 精梳棉）',
    categoryLabel: '产品分类',
    unitLabel: '计量单位',
    submitBtn: '上传并发布产品',
    signInBtn: '使用管理员账户登录后上传',
    adminOnlyNotice: '需要出口商管理员账户方可发布至公开产品目录。',
    successNotice: '已成功发布至 AWP International Traders 产品目录。',
    viewInCatalogBtn: '在目录中查看',
    previewTitle: '目录卡片实时预览',
    rangeLabel: '金额区间（最低 – 最高）',
    clearImageBtn: '清空全部图片',
    imageRequiredNotice: '请至少上传一张产品图片或添加图片链接。',
    emptyImagePreview: '上传产品图片以实时预览',
  },
  hero: {
    regionLabel: '全球服装与成衣出口业务 · ISO 9001 质量认证',
    headline: '直达全球 48 个国际港口的批发成衣与服装出口供应链。',
    subheadline:
      '在线检索出口服装面料规格与海关编码，实时追踪海运及空运服装货运动态，并通过统一门户管理 B2B 采购订单。',
    primaryCta: '浏览服装出口目录',
    secondaryCta: '实时追踪货物',
    stats: [
      { value: '48+', label: '覆盖国际目的港' },
      { value: '24h', label: '形式发票响应时效' },
      { value: '99.4%', label: '准点清关交付率' },
      { value: 'FOB / CIF', label: '灵活国际贸易条款' },
    ],
  },
  catalog: {
    heading: '服装出口产品目录',
    subheading: '支持按服装款名、面料、SKU 编号、HS 海关编码、起运港或国际认证快速检索。',
    searchPlaceholder: '搜索产品名称、SKU、HS 编码或认证...',
    smartSearchBtn: '智能纠错搜索',
    autocorrectPrefix: '已为您智能匹配结果：',
    autocorrectFrom: '原搜索词',
    applyCorrectionBtn: '应用纠正词',
    allCategories: '全部分类',
    fobLabel: 'FOB 离岸单价',
    moqLabel: '起订量',
    qtyRangeLabel: '订购数量区间',
    qualityLabel: '产品品质',
    originLabel: '起运港',
    leadTimeLabel: '交货周期',
    daysSuffix: '天',
    inspectButton: '查看规格与下单',
    emptyTitle: '未找到匹配的产品',
    emptyBody: '请调整搜索关键词或切换产品分类。',
    noProductsYetTitle: '暂无已上传的产品',
    noProductsYetBody: '请在下方产品上传区添加您自己的产品图片、详情和价格区间。',
    goToUploadBtn: '上传您的产品',
    availability: {
      in_stock: '现货可发',
      made_to_order: '按单生产',
      out_of_stock: '排期备货中',
    },
  },
  productModal: {
    specsTitle: '技术参数与海关规格',
    quality: '产品品质',
    qtyRange: '允许订购数量',
    hsCode: 'HS 海关编码',
    originPort: '装运港',
    leadTime: '生产交期',
    weight: '单件毛重',
    dimensions: '出口包装尺寸',
    certifications: '合规认证',
    orderBoxTitle: '提交出口采购订单',
    quantityLabel: '订购数量',
    incotermsLabel: '贸易条款 (Incoterms)',
    destPortLabel: '目的港',
    notesLabel: '包装或单证备注',
    subtotalLabel: '货值小计',
    freightEstLabel: '预估海运及保险费',
    totalEstLabel: '订单预估总额',
    placeOrderBtn: '提交采购订单',
    signInToOrderBtn: '使用邮箱登录后下单',
    authRequiredTitle: '请使用邮箱和密码登录后购买',
    authRequiredBody:
      '如需购买任何产品，已有 AWP International Traders 账户的客户请使用邮箱和密码登录；新客户请使用邮箱和密码注册账户。',
    loginExistingBtn: '使用邮箱和密码登录',
    createAccountBtn: '使用邮箱和密码注册',
    requestQuoteBtn: '发送正式询盘 (RFQ)',
    orderSuccessMsg: '采购订单已提交并进入出口审核队列。',
  },
  tracking: {
    heading: '实时货运状态追踪',
    subheading: '输入 AWP International Traders 追踪单号，实时查看船名航次、集装箱号及海关清关节点。',
    placeholder: '输入追踪单号（如 MRD-2026-8841）',
    trackButton: '查询物流',
    samplesLabel: '示例单号：',
    carrierLabel: '承运船司',
    vesselLabel: '船名航次',
    containerLabel: '集装箱号',
    routeLabel: '运输航线',
    etaLabel: '预计到港 (ETA)',
    locationLabel: '当前最新位置',
    weightLabel: '核定总毛重',
    logTitle: '物流与清关节点记录',
    notFoundTitle: '未查询到该追踪单号',
    notFoundBody: '请核对追踪编号，或点击上方示例单号体验实时追踪。',
    stages: {
      order_confirmed: '订单确认',
      customs_cleared: '出口报关',
      vessel_loaded: '装船离港',
      ocean_transit: '海运在途',
      port_arrival: '抵达目的港',
      customs_released: '进口放行',
      delivered: '签收交付',
    },
  },
  inquiry: {
    heading: '国际贸易询盘 (RFQ)',
    subheading: '获取阶梯报价、样品寄送或针对目的港清关的定制单证支持。',
    docsTitle: '随附标准出口单证',
    docsList: [
      '商业发票 (Commercial Invoice) 与认证装箱单',
      '原产地证书 (贸促会 / 商会签发)',
      '清洁已装船海运提单 (B/L) 或空运提单',
      '植物检疫证书、材质证明或 CE 认证档案',
    ],
    companyLabel: '买方公司名称',
    contactLabel: '采购联系人',
    emailLabel: '企业邮箱',
    countryLabel: '目的国/地区',
    portLabel: '目的港口',
    productLabel: '意向产品或类别',
    volumeLabel: '预计采购量与频次',
    incotermsLabel: '意向贸易条款',
    messageLabel: '技术规格、包装或认证要求',
    submitButton: '提交贸易询盘',
    submittingButton: '正在提交...',
    successTitle: '询盘已收到',
    successBody: '我们的国际业务团队已记录您的需求，将在 24 个工作小时内发送正式形式发票报价。',
    anotherButton: '继续发送询盘',
  },
  portal: {
    title: '国际客户面板',
    subtitle: '维护企业贸易档案，追踪在途海运货物并管理历史采购订单。',
    profileTab: '企业档案',
    ordersTab: '出口订单',
    inquiriesTab: '我的询盘',
    saveProfileBtn: '保存企业档案',
    profileSavedMsg: '企业资料与贸易偏好已更新。',
    noOrdersTitle: '暂无采购订单',
    noOrdersBody: '前往产品目录选择商品即可提交首笔出口订单。',
    browseCatalogBtn: '浏览目录',
    cancelOrderBtn: '取消待审核订单',
    trackShipmentBtn: '查看实时物流',
  },
  orderStatuses: {
    pending_review: '待审核',
    confirmed: '已确认',
    customs_dispatch: '报关发运中',
    in_transit: '海运在途',
    delivered: '已交付',
    cancelled: '已取消',
  },
  footer: {
    tagline: '直营 B2B 国际出口物流、海关合规单证及多港口履约服务。',
    rights: '© 2026 AWP International Traders. 保留所有权利。',
  },
};

export const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en,
  es,
  fr,
  de,
  zh,
};

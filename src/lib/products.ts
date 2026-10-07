// Product data for Convoltaje and Tintaflash (Centralized Single Source of Truth)
// Precios actualizados según la lista comercial oficial de WhatsApp (30/09/2026)

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Precio actual / precio de oferta
  originalPrice?: number; // Precio base tachado (solo cuando existe oferta)
  image?: string | null;
  hasImagePending?: boolean; // true si se debe mostrar placeholder profesional
  category: 'Residencial' | 'Comercial' | 'Personalizado' | 'PowerStations' | 'Insumos';
  popular?: boolean;
  discount?: number; // Porcentaje calculado de descuento
  outOfStock?: boolean;
  slug: string;
  images: string[];
  specs?: string[];
  supports?: string;
  manuals?: { nombre: string; url: string }[];
  pdfUrl?: string | null; // Ruta relativa del PDF oficial en public/pdfs/
  pdfDownloadName?: string;
  hasTechnicalSheet: boolean; // false si 'Ficha técnica pendiente'
}

export const SERVICES_FLYER_URL = "/flyers/precio/Imagen de Codex 16 sept 2026, 01_17_33.png";


export interface ComplementaryService {
  id: string;
  name: string;
  description: string;
  price: number;
  period?: 'mes' | 'año';
  badge?: string;
}

export const COMPLEMENTARY_SERVICES: ComplementaryService[] = [
  {
    id: "serv-aterramiento",
    name: "Aterramiento",
    description: "Ayuda a proteger el sistema ante descargas atmosféricas. Incluye varilla y perrito de conexión.",
    price: 150,
    badge: "Recomendado"
  },
  {
    id: "serv-alarma",
    name: "Alarma para Paneles Solares",
    description: "Protección antirrobo electrónica dedicada para la estructura exterior de paneles.",
    price: 250
  },
  {
    id: "serv-limpieza-kit",
    name: "Kit de Limpieza de Paneles",
    description: "Líquidos y herramientas especializadas diseñadas para no rayar las celdas fotovoltaicas.",
    price: 150
  },
  {
    id: "serv-suscripcion-limpieza",
    name: "Suscripción Mensual de Limpieza",
    description: "Visita mensual, limpieza profesional de módulos y revisión visual preventiva del sistema.",
    price: 25,
    period: "mes",
    badge: "Suscripción"
  },
  {
    id: "serv-mantenimiento-semestral",
    name: "Mantenimiento Semestral",
    description: "2 revisiones técnicas integrales al año con reapriete de terminales y chequeo de inversores.",
    price: 250,
    period: "año"
  },
  {
    id: "serv-publicidad",
    name: "Publicidad para Negocios",
    description: "Promoción de negocio verde y difusión en redes aliadas de Convoltaje.",
    price: 125
  }
];

export const CONVOLTAJE_PRODUCTS: Product[] = [
  {
    id: "conv-ecoflow-panel",
    name: "EcoFlow + Panel Solar",
    description: "Combo portátil de alta durabilidad con estación EcoFlow y panel solar de alta captación. Incluye base para panel, conector XT60i, anclajes y asesoramiento de puesta en marcha. Ideal para luces, TV, router, laptops y cargas esenciales.",
    price: 1350,
    image: null,
    hasImagePending: true,
    category: "PowerStations",
    popular: true,
    slug: "ecoflow-panel",
    images: [
      "/flyers/precio/Imagen de Codex 15 sept 2026, 21_23_02.png"
    ],
    specs: [
      "Estación EcoFlow LiFePO4 de salida rápida",
      "Panel solar monocristalino de alta eficiencia",
      "Conector XT60i y base regulable",
      "Mano de obra y transporte incluidos",
      "Garantía oficial y puesta en marcha"
    ],
    supports: "Luces LED, TV, router, laptops, ventiladores y refrigeración pequeña",
    pdfUrl: null,
    hasTechnicalSheet: false
  },
  {
    id: "conv-1-2kw",
    name: "Sistema 1,2 kW",
    description: "Lo esencial con menor inversión. Es la opción más accesible para organizar un respaldo confiable de iluminación, ventiladores, routers y computadoras.",
    price: 1700,
    originalPrice: 1950,
    discount: 13,
    image: "/flyers/Imagen de Codex 15 sept 2026, 22_36_43.png",
    hasImagePending: false,
    category: "Residencial",
    popular: false,
    slug: "sistema-1-2kw",
    images: ["/flyers/Imagen de Codex 15 sept 2026, 22_36_43.png"],
    specs: [
      "1 ud. Inversor solar 1200 W",
      "1 ud. Batería LiFePO4 1.2 kWh",
      "1 ud. Panel Solar Monocristalino",
      "Breaker DC 125A y 32A",
      "Cuchilla de doble tiro 32A 3 polos",
      "Cable solar 20m + cable batería 1m",
      "Caja estanca para breakers 6WAY",
      "Instalación profesional incluida",
      "Garantía 3 meses — equipos e instalación"
    ],
    supports: "Iluminación LED, ventiladores, TV, teléfonos, internet y computadoras",
    pdfUrl: "/pdfs/Sistema 1,2 kW.pdf",
    pdfDownloadName: "Sistema 1,2 kW.pdf",
    hasTechnicalSheet: true
  },
  {
    id: "conv-2kw",
    name: "Sistema 2 kW",
    description: "Escalón residencial equilibrado. Proporciona mayor margen de potencia continua para el hogar que requiere estabilidad energética durante los apagones prolongados.",
    price: 2300,
    originalPrice: 2500,
    discount: 8,
    image: null,
    hasImagePending: true,
    category: "Residencial",
    popular: false,
    slug: "sistema-2kw",
    images: [],
    specs: [
      "Inversor solar 2000 W onda sinusoidal pura",
      "Banco de batería LiFePO4 de ciclo profundo",
      "Arreglo de paneles monocristalinos",
      "Pizarra eléctrica de protecciones",
      "Instalación profesional incluida",
      "Garantía 3 meses — equipos e instalación"
    ],
    supports: "Refrigerador, ventiladores, TV, luces, router y electrodomésticos esenciales",
    pdfUrl: null,
    hasTechnicalSheet: false
  },
  {
    id: "conv-3kw-base",
    name: "Sistema 3 kW Base",
    description: "Más potencia para el día a día. Inversor de 3000 W y banco de 2.4 kWh para combinar las cargas esenciales cotidianas (refrigerador, luces, TV, ventiladores y cocina básica).",
    price: 2600,
    originalPrice: 2950,
    discount: 12,
    image: "/flyers/exec-e83f47e4-0233-44c7-a477-95240b61afae.png",
    hasImagePending: false,
    category: "Residencial",
    popular: false,
    slug: "sistema-3kw-base",
    images: ["/flyers/exec-e83f47e4-0233-44c7-a477-95240b61afae.png"],
    specs: [
      "1 ud. Inversor solar 3000 W 110 V",
      "1 ud. Batería LiFePO4 2.4 kWh",
      "2 ud. Panel Solar Monocristalino",
      "4 ud. Purles Galvanizados 3M",
      "Breaker DC 125A y 32A",
      "Cuchilla de doble tiro 63A 3 polos",
      "Cable solar 30m + cable batería 4AWG",
      "Instalación profesional incluida",
      "Garantía 3 meses — equipos e instalación"
    ],
    supports: "Refrigerador durante el día, luces, ventiladores, TV, internet y computadora",
    pdfUrl: "/pdfs/Sistema 3 kW básico.pdf",
    pdfDownloadName: "Sistema 3 kW básico.pdf",
    hasTechnicalSheet: true
  },
  {
    id: "conv-3kw-medio",
    name: "Sistema 3 kW Medio",
    description: "Más reserva para tus prioridades. Mantiene 3 kW de potencia e incrementa el banco de baterías a 5 kWh (2 baterías de 2.5 kWh) para prolongar el respaldo nocturno de las cargas importantes.",
    price: 3550,
    originalPrice: 3850,
    discount: 8,
    image: null,
    hasImagePending: true,
    category: "Residencial",
    popular: false,
    slug: "sistema-3kw-medio",
    images: [],
    specs: [
      "1 ud. Inversor solar 3000 W 110 V/220 V",
      "2 ud. Batería LiFePO4 2.5 kWh (5 kWh total)",
      "2 ud. Panel Solar Monocristalino",
      "Breaker DC 125A y 32A",
      "Cuchilla de doble tiro 32A 2 polos",
      "Cable batería 4AWG (6m) + cable solar (30m)",
      "Soportes de madera de batería incluidos",
      "Instalación profesional incluida",
      "Garantía 3 meses — equipos e instalación"
    ],
    supports: "Nevera, ventiladores continuos, luces, TV, estación de trabajo y cocina ligera",
    pdfUrl: "/pdfs/Sistema 3 kW MEDIO 110 V.pdf",
    pdfDownloadName: "Sistema 3 kW MEDIO 110 V.pdf",
    hasTechnicalSheet: true
  },
  {
    id: "conv-3kw-plus",
    name: "Sistema 3 kW PLUS",
    description: "Nuestra solución más vendida para aire acondicionado durante el día. Duplica la captación solar a 4 paneles y entrega 110V/220V simultáneos con banco de 5 kWh.",
    price: 4500,
    originalPrice: 4850,
    discount: 7,
    image: "/flyers/Imagen de Codex 15 sept 2026, 23_34_41.png",
    hasImagePending: false,
    category: "Residencial",
    popular: true,
    slug: "sistema-3kw-plus",
    images: ["/flyers/Imagen de Codex 15 sept 2026, 23_34_41.png"],
    specs: [
      "1 ud. Inversor solar 3000 W 110 V/220 V fase dividida",
      "2 ud. Batería LiFePO4 2.5 kWh (5 kWh total)",
      "4 ud. Panel Solar Monocristalino",
      "6 ud. Purles Galvanizados 3M",
      "2 ud. Protectores de Voltaje",
      "Breaker DC 125A y 32A + Cuchilla 32A 2 polos",
      "Instalación profesional incluida",
      "Garantía 3 meses — equipos e instalación"
    ],
    supports: "Aire acondicionado diurno, refrigerador, ventiladores, TV, cocina y equipos del hogar",
    pdfUrl: "/pdfs/Sistema 3 kW PLUS 220 V.pdf",
    pdfDownloadName: "Sistema 3 kW PLUS 220 V.pdf",
    hasTechnicalSheet: true
  },
  {
    id: "conv-6kw-base",
    name: "Sistema 6 kW Base",
    description: "Un salto notable en potencia simultánea. Inversor de 6000 W con banco de 5 kWh y 4 paneles solares para hogares activos o pequeños emprendimientos con cargas combinadas.",
    price: 4900,
    originalPrice: 5250,
    discount: 7,
    image: null,
    hasImagePending: true,
    category: "Residencial",
    popular: false,
    slug: "sistema-6kw-base",
    images: [],
    specs: [
      "1 ud. Inversor solar 6000 W",
      "1 ud. Batería LiFePO4 5 kWh",
      "4 ud. Panel Solar Monocristalino",
      "1 ud. Conmutador Manual + Breaker DC 32A",
      "6 ud. Purles Galvanizados 3M",
      "Cable solar 30m + cable batería 4m",
      "Instalación profesional incluida",
      "Garantía 3 meses — equipos e instalación"
    ],
    supports: "Múltiples electrodomésticos simultáneos, refrigeración comercial ligera, iluminación y TV",
    pdfUrl: "/pdfs/Sistema 6 kW base.pdf",
    pdfDownloadName: "Sistema 6 kW base.pdf",
    hasTechnicalSheet: true
  },
  {
    id: "conv-6kw-medio",
    name: "Sistema 6 kW Medio",
    description: "Más energía guardada. Eleva la batería a 10 kWh y suma 6 paneles solares. Recomendado para respaldar aire acondicionado durante la noche (4-6 horas estimadas) y cargas esenciales.",
    price: 7000,
    originalPrice: 7450,
    discount: 6,
    image: "/flyers/Imagen de Codex 16 sept 2026, 00_20_49.png",
    hasImagePending: false,
    category: "Comercial",
    popular: false,
    slug: "sistema-6kw-medio",
    images: ["/flyers/Imagen de Codex 16 sept 2026, 00_20_49.png"],
    specs: [
      "1 ud. Inversor solar 6000 W",
      "1 ud. Batería LiFePO4 10 kWh",
      "6 ud. Panel Solar Monocristalino",
      "8 ud. Purles Galvanizados 3M",
      "Conmutador Manual + Breakers AC 63A",
      "Conector Y de Paralelos + 5 pares MC4",
      "Instalación profesional incluida",
      "Garantía 3 meses — equipos e instalación"
    ],
    supports: "Aire acondicionado nocturno (4-6h), refrigeración comercial, luces, TV y motores",
    pdfUrl: "/pdfs/Sistema 6k MEDIO.pdf",
    pdfDownloadName: "Sistema 6k MEDIO.pdf",
    hasTechnicalSheet: true
  },
  {
    id: "conv-6kw-plus",
    name: "Sistema 6 kW PLUS",
    description: "El sistema más recomendado para aire acondicionado toda la noche. Suma 8 paneles solares y un banco masivo LiFePO4 de 15 kWh para máxima autonomía sin depender de la red.",
    price: 8500,
    originalPrice: 8840,
    discount: 4,
    image: "/flyers/Imagen de Codex 16 sept 2026, 00_34_44.png",
    hasImagePending: false,
    category: "Comercial",
    popular: true,
    slug: "sistema-6kw-plus",
    images: ["/flyers/Imagen de Codex 16 sept 2026, 00_34_44.png"],
    specs: [
      "1 ud. Inversor solar 6000 W",
      "1 ud. Batería LiFePO4 15 kWh",
      "8 ud. Panel Solar Monocristalino",
      "10 ud. Purles Galvanizados 3M",
      "Conmutador Manual ATS 63A",
      "Cable batería 8AWG (20m) + cable solar (60m)",
      "Instalación profesional incluida",
      "Garantía 3 meses — equipos e instalación"
    ],
    supports: "Aire acondicionado continuo toda la noche, 4 neveras, luces, TV, microondas y bomba de agua",
    pdfUrl: "/pdfs/Sistema 6 kW PLUS.pdf",
    pdfDownloadName: "Sistema 6 kW PLUS.pdf",
    hasTechnicalSheet: true
  },
  {
    id: "conv-6kw-ultra",
    name: "Sistema 6 kW ULTRA",
    description: "Capacidad industrializada en gama de 6 kW. Diseñado para usuarios de máxima exigencia que demandan la más alta reserva de almacenamiento y resistencia para ciclos ininterrumpidos.",
    price: 15650,
    image: null,
    hasImagePending: true,
    category: "Comercial",
    popular: false,
    slug: "sistema-6kw-ultra",
    images: [],
    specs: [
      "Inversor 6000 W split-phase de servicio continuo",
      "Banco de baterías LiFePO4 de ultra-alta capacidad",
      "Arreglo fotovoltaico de máxima captación solar",
      "Gabinete de protecciones de grado industrial y ATS",
      "Instalación profesional incluida y puesta en marcha",
      "Garantía técnica oficial"
    ],
    supports: "Climatización intensiva, congeladores comerciales, equipamiento de telecomunicaciones y oficinas",
    pdfUrl: null,
    hasTechnicalSheet: false
  },
  {
    id: "conv-10kw-base",
    name: "Sistema 10 kW Base",
    description: "Más potencia para combinar cargas. Inversor industrial de 10 kW con 6 paneles solares bifaciales y banco LiFePO4 de 10 kWh. Pensado para evaluar negocios con alta demanda simultánea.",
    price: 8800,
    originalPrice: 9250,
    discount: 5,
    image: "/images/kit-10kw-equipo.jpg",
    hasImagePending: false,
    category: "Comercial",
    popular: false,
    slug: "sistema-10kw-base",
    images: ["/images/kit-10kw-equipo.jpg"],
    specs: [
      "1 ud. Inversor solar 10000 W",
      "1 ud. Batería LiFePO4 10 kWh",
      "6 ud. Panel Solar Bifacial",
      "8 ud. Purles Galvanizados 3M",
      "3 ud. Supresores de Pico DC(2) y AC(1)",
      "1 ud. Cuchilla Doble Tiro 100A",
      "Varilla para Aterramiento y Perrito",
      "Instalación profesional incluida",
      "Garantía 3 meses — equipos e instalación"
    ],
    supports: "Grandes cargas simultáneas, talleres, clínicas, restaurantes y residencias amplias",
    pdfUrl: "/pdfs/Sistema 10 kW base.pdf",
    pdfDownloadName: "Sistema 10 kW base.pdf",
    hasTechnicalSheet: true
  },
  {
    id: "conv-10kw-medio",
    name: "Sistema 10 kW Medio",
    description: "Nuestra solución más robusta y definitiva para aislamiento completo de la red. Combina 10 paneles bifaciales, inversor de 10000 W y banco LiFePO4 masivo de 15 kWh.",
    price: 10900,
    originalPrice: 11550,
    discount: 6,
    image: "/images/kit-10kw-equipo.jpg",
    hasImagePending: false,
    category: "Comercial",
    popular: true,
    slug: "sistema-10kw-medio",
    images: [
      "/images/kit-10kw-equipo.jpg",
      "/images/Kit-10k-imagen-2.jpg"
    ],
    specs: [
      "1 ud. Inversor solar 10000 W",
      "1 ud. Batería LiFePO4 15 kWh",
      "10 ud. Panel Solar Bifacial",
      "14 ud. Purles Galvanizados 3M",
      "3 ud. Supresores de Pico DC(2) y AC(1)",
      "1 ud. Cuchilla Doble Tiro 100A",
      "Varilla para Aterramiento y Perrito",
      "Instalación profesional incluida",
      "Garantía 3 meses — equipos e instalación"
    ],
    supports: "Independencia eléctrica total día y noche, hasta 4 aires acondicionados, 10 refrigeradores y maquinaria",
    pdfUrl: "/pdfs/Sistema 10K Medio.pdf",
    pdfDownloadName: "Sistema 10K Medio.pdf",
    hasTechnicalSheet: true
  },
  {
    id: "conv-20kw",
    name: "Sistema 20 kW",
    description: "Central energética a escala industrial. Diseñada a medida para empresas, complejos agropecuarios, hoteles y centros comerciales que requieren autosuficiencia eléctrica total.",
    price: 23000,
    image: null,
    hasImagePending: true,
    category: "Personalizado",
    popular: false,
    slug: "sistema-20kw",
    images: [],
    specs: [
      "Arreglo de inversores industriales de 20 kW",
      "Banco masivo LiFePO4 de alta densidad energética",
      "Campo solar fotovoltaico de alta eficiencia",
      "Tablero de sincronización y protecciones avanzadas",
      "Ingeniería de montaje en techo o suelo",
      "Garantía ejecutiva y soporte técnico prioritario"
    ],
    supports: "Complejos enteros, cuartos fríos, maquinaria trifásica pesada e instalaciones críticas",
    pdfUrl: null,
    hasTechnicalSheet: false
  }
];

export const TINTAFLASH_PRODUCTS = [
  {
    id: "tinta-1",
    name: "Púlover de Niño",
    description: "Púloveres personalizables con colores, nombres o divertidos gráficos.",
    price: 1800,
    image: "/images/logoconvoltaje.jpg",
    category: "Ropa Personalizada",
    slug: "pulover-de-nino",
    images: ["/images/logoconvoltaje.jpg"]
  },
  {
    id: "tinta-2",
    name: "Mousepad",
    description: "Mousepads personalizables de alta durabilidad.",
    price: 600,
    image: "/images/logoconvoltaje.jpg",
    category: "Accesorios",
    popular: true,
    slug: "mousepad",
    images: ["/images/logoconvoltaje.jpg"]
  }
];

export const OFFICIAL_WHATSAPP_NUMBER = "+53 53097058";
export const OFFICIAL_WHATSAPP_CLEAN = "5353097058";

export const WHATSAPP_NUMBERS = {
  convoltaje: OFFICIAL_WHATSAPP_NUMBER,
  tintaflash: OFFICIAL_WHATSAPP_NUMBER,
};

export const CONTACT_INFO = {
  phone: OFFICIAL_WHATSAPP_NUMBER,
  whatsapp: OFFICIAL_WHATSAPP_NUMBER,
  whatsappUrl: `https://wa.me/${OFFICIAL_WHATSAPP_CLEAN}`,
  email: "convoltaje@gmail.com",
  instagram: "https://www.instagram.com/convoltajecuba",
  facebook: "https://www.facebook.com/convoltajecuba",
  youtube: "https://www.youtube.com/@convoltajecuba",
  tiktok: "https://www.tiktok.com/@convoltaje",
};


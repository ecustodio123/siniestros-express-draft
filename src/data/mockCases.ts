export type CaseStatus =
  | "Registrado"
  | "Información faltante"
  | "Informe generado"
  | "Completado";

export type DocumentStatus = "Recibido" | "Pendiente" | "Adjunto simulado";
export type RiskType = "Transporte" | "Importaciones / Exportaciones";
export type CaseSubCategory =
  | "Flota propia"
  | "Transportista contratado"
  | "Responsabilidad del transportista"
  | "Tránsito internacional"
  | "Tramo terrestre post importación";

export type CaseDocument = {
  name: string;
  status: DocumentStatus;
};

export type ClaimCase = {
  id: string;
  insurer: string;
  insured: string;
  broker: string;
  riskType: RiskType;
  subCategory: CaseSubCategory;
  claimedAmount: number;
  adjuster: string;
  status: CaseStatus;
  lastUpdate: string;
  policyNumber: string;
  contact: string;
  description: string;
  documents: CaseDocument[];
  confidence: number;
};

export const cases: ClaimCase[] = [
  {
    id: "SE-2026-001",
    insurer: "Pacífico Seguros",
    insured: "Transportes Andina SAC",
    broker: "Broker Risk Perú",
    riskType: "Transporte",
    subCategory: "Flota propia",
    claimedAmount: 128500,
    adjuster: "Carlos Caro",
    status: "Informe generado",
    lastUpdate: "26 Jun 2026",
    policyNumber: "TR-984512",
    contact: "operaciones@andina.pe · +51 987 442 118",
    description: "Volcadura parcial durante traslado de mercadería refrigerada en ruta Panamericana Sur.",
    documents: [
      { name: "Denuncia policial", status: "Recibido" },
      { name: "Documentos del chofer/camión", status: "Recibido" },
      { name: "Guías de remisión", status: "Recibido" },
      { name: "Facturas", status: "Recibido" },
    ],
    confidence: 92,
  },
  {
    id: "SE-2026-002",
    insurer: "Rimac Seguros",
    insured: "Logística Norte EIRL",
    broker: "Aon Perú",
    riskType: "Transporte",
    subCategory: "Transportista contratado",
    claimedAmount: 76200,
    adjuster: "Fabricio Sotelo",
    status: "Información faltante",
    lastUpdate: "25 Jun 2026",
    policyNumber: "TR-771204",
    contact: "siniestros@lognorte.pe · +51 944 210 882",
    description: "Robo parcial de carga durante parada no programada en centro de distribución.",
    documents: [
      { name: "Denuncia policial", status: "Pendiente" },
      { name: "Documentos del chofer/camión", status: "Recibido" },
      { name: "Guías de remisión", status: "Recibido" },
      { name: "Facturas", status: "Recibido" },
    ],
    confidence: 64,
  },
  {
    id: "SE-2026-003",
    insurer: "La Positiva",
    insured: "Carga Express del Sur",
    broker: "Marsh Perú",
    riskType: "Transporte",
    subCategory: "Responsabilidad del transportista",
    claimedAmount: 44200,
    adjuster: "Jose Kldas",
    status: "Información faltante",
    lastUpdate: "24 Jun 2026",
    policyNumber: "TR-553890",
    contact: "admin@cargaexpress.pe · +51 999 520 104",
    description: "Daño por humedad en mercadería textil durante transporte interprovincial.",
    documents: [
      { name: "Denuncia policial", status: "Recibido" },
      { name: "Documentos del chofer/camión", status: "Recibido" },
      { name: "Guías de remisión", status: "Recibido" },
      { name: "Facturas", status: "Pendiente" },
    ],
    confidence: 78,
  },
  {
    id: "SE-2026-004",
    insurer: "Mapfre Perú",
    insured: "Distribuciones Santa Rosa",
    broker: "Willis Towers Watson",
    riskType: "Importaciones / Exportaciones",
    subCategory: "Tránsito internacional",
    claimedAmount: 211900,
    adjuster: "Enrique Custodio",
    status: "Completado",
    lastUpdate: "23 Jun 2026",
    policyNumber: "TR-120945",
    contact: "gerencia@dsantarosa.pe · +51 933 818 774",
    description: "Daño reportado durante tránsito internacional de mercancía importada.",
    documents: [
      { name: "Denuncia policial", status: "Recibido" },
      { name: "Documentos del chofer/camión", status: "Recibido" },
      { name: "Guías de remisión", status: "Recibido" },
      { name: "Facturas", status: "Recibido" },
    ],
    confidence: 71,
  },
  {
    id: "SE-2026-005",
    insurer: "HDI Seguros",
    insured: "Frío Cargo Perú",
    broker: "Corredores Unidos",
    riskType: "Transporte",
    subCategory: "Transportista contratado",
    claimedAmount: 93500,
    adjuster: "Carlos Caro",
    status: "Registrado",
    lastUpdate: "22 Jun 2026",
    policyNumber: "TR-444781",
    contact: "contacto@friocargo.pe · +51 956 442 901",
    description: "Falla de unidad de frío durante traslado de productos perecibles.",
    documents: [
      { name: "Denuncia policial", status: "Pendiente" },
      { name: "Documentos del chofer/camión", status: "Pendiente" },
      { name: "Guías de remisión", status: "Pendiente" },
      { name: "Facturas", status: "Pendiente" },
    ],
    confidence: 0,
  },
  {
    id: "SE-2026-006",
    insurer: "Chubb Perú",
    insured: "Importadora Altamar",
    broker: "Risk Partners",
    riskType: "Importaciones / Exportaciones",
    subCategory: "Tramo terrestre post importación",
    claimedAmount: 158700,
    adjuster: "Fabricio Sotelo",
    status: "Completado",
    lastUpdate: "21 Jun 2026",
    policyNumber: "TR-333019",
    contact: "claims@altamar.pe · +51 988 601 450",
    description: "Daños por impacto lateral durante traslado de maquinaria importada.",
    documents: [
      { name: "Denuncia policial", status: "Recibido" },
      { name: "Documentos del chofer/camión", status: "Recibido" },
      { name: "Guías de remisión", status: "Pendiente" },
      { name: "Facturas", status: "Recibido" },
    ],
    confidence: 78,
  },
];

export const featuredCase = cases[5];

import {
  AlertCircle,
  ArrowDownUp,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { CaseSubCategory, CaseStatus, ClaimCase, cases, claimTypeOptions, featuredCase } from "./data/mockCases";
import { analizarSiniestro, estadoDeVeredicto, guardarResultado, leerResultado } from "./api";
import type { CamposExpediente, Confianza, DatosOperador, PasoTraza, PreAnalisisIA, RespuestaAnalisis, Veredicto, ValorJson } from "./api";

type Screen = "login" | "dashboard" | "new" | "confirmation" | "detail" | "report";
type SortDirection = "asc" | "desc";
type SortKey = keyof Pick<
  ClaimCase,
  "id" | "insurer" | "insured" | "riskType" | "subCategory" | "claimedAmount" | "adjuster" | "status" | "lastUpdate"
>;

const routeByScreen: Record<Screen, string> = {
  login: "/login",
  dashboard: "/dashboard",
  new: "/siniestros/nuevo",
  confirmation: "/siniestros/confirmacion",
  detail: `/siniestros/${featuredCase.id}`,
  report: `/siniestros/${cases[0].id}/informe`,
};

function useScreenNavigation() {
  const navigate = useNavigate();
  return (screen: Screen) => navigate(routeByScreen[screen]);
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  }).format(value);

// Los montos del cálculo de indemnización (Motor B) viajan en dólares
// (`poliza.suma_asegurada_usd`, `siniestro.perdida_usd`, `carga.valor_usd`
// en `ingestion/schema.py`), no en soles: por eso llevan un formateador
// aparte de `formatMoney`, que es el de los montos reclamados de la maqueta.
const formatUsd = (value: number) =>
  `US$ ${new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;

const statusStyles: Record<CaseStatus, string> = {
  Registrado: "bg-slate-100 text-slate-700 ring-slate-200",
  "Información faltante": "bg-amber-50 text-amber-800 ring-amber-200",
  "Informe generado": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Completado: "bg-blue-50 text-blue-800 ring-blue-200",
};

function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  icon,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-slate-950 text-white shadow-sm shadow-slate-950/20 hover:bg-brand-700",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-200/60 hover:border-slate-300 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    danger: "border border-amber-200 bg-amber-50 text-amber-900 shadow-sm shadow-amber-100 hover:bg-amber-100",
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]}`}
      onClick={onClick}
      type="button"
      disabled={disabled}
    >
      {icon}
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${className}`}>{children}</section>;
}

function LoginPage({ go }: { go: (screen: Screen) => void }) {
  return (
    <main className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between bg-[linear-gradient(145deg,#172554_0%,#0f172a_46%,#111827_100%)] p-8 text-white lg:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold">Asistente IA de Siniestros</p>
              <p className="text-sm text-blue-100">Ramo Transporte</p>
            </div>
          </div>
          <div className="max-w-xl py-16">
            {/* <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-blue-100 ring-1 ring-white/15">
              Demo comercial
            </span> */}
            <h1 className="mt-6 text-4xl font-bold leading-tight lg:text-5xl">
              Plataforma inteligente para gestión de siniestros de transporte
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-200">
              Centraliza expedientes, documentos, observaciones y generación visual de informes para acelerar la revisión del ajustador.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <span className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-emerald-300" /> Documentos</span>
            <span className="flex items-center gap-2"><Bot className="h-4 w-4 text-violet-300" /> Análisis IA</span>
            <span className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-blue-300" /> Informe final</span>
          </div>
        </section>
        <section className="flex items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eef3f8_100%)] p-6">
          <Card className="w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-slate-950">Ingresar</h2>
            <p className="mt-2 text-sm text-slate-500">Acceso visual para la maqueta del producto.</p>
            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Correo</span>
                <input className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-blue-100" placeholder="maria.fernandez@empresa.com" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Contraseña</span>
                <input className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-blue-100" placeholder="••••••••" type="password" />
              </label>
              <Button onClick={() => go("dashboard")} icon={<ChevronRight className="h-4 w-4" />}>
                Ingresar
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function AppShell({ screen, go, children }: { screen: Screen; go: (screen: Screen) => void; children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const items = [
    { label: "Dashboard", screen: "dashboard" as Screen, icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Nuevo Siniestro", screen: "new" as Screen, icon: <Plus className="h-4 w-4" /> },
    { label: "Expediente", screen: "detail" as Screen, icon: <FolderOpen className="h-4 w-4" /> },
    { label: "Informe Final", screen: "report" as Screen, icon: <FileText className="h-4 w-4" /> },
  ];
  const navigateFromMenu = (nextScreen: Screen) => {
    go(nextScreen);
    setIsMobileMenuOpen(false);
  };
  const renderSidebarContent = () => (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="font-bold text-white">Asistente IA</p>
          <p className="text-xs font-medium text-slate-400">Siniestros de Transporte</p>
        </div>
      </div>
      <nav className="mt-9 space-y-1">
        {items.map((item) => (
          <button
            key={item.label}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
              screen === item.screen ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => navigateFromMenu(item.screen)}
            type="button"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Demo estática</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">Sin backend, APIs, autenticación real ni carga de archivos.</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-slate-800 bg-slate-950 p-5 text-white lg:flex">
        {renderSidebarContent()}
      </aside>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-[min(82vw,320px)] flex-col bg-slate-950 p-5 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Menú</p>
              <button
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderSidebarContent()}
          </aside>
        </div>
      )}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 px-5 py-4 shadow-sm shadow-slate-200/40 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Abrir menú"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                type="button"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-wide text-brand-700">Siniestros Express AI</p>
                <p className="truncate text-sm text-slate-600">Gestión documental asistida para ramo Transporte</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">Enrique Custodio</p>
                <p className="text-xs text-slate-500">Ajustador</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-bold text-white shadow-sm">EC</div>
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => go("login")} type="button">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-73px)] bg-[linear-gradient(180deg,#f8fafc_0%,#eef3f8_100%)] p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function DashboardPage({ go }: { go: (screen: Screen) => void }) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "lastUpdate",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "">("");
  const [insurerFilter, setInsurerFilter] = useState("");
  const totalAmount = useMemo(() => cases.reduce((sum, item) => sum + item.claimedAmount, 0), []);
  const statusOptions = useMemo(() => Array.from(new Set(cases.map((item) => item.status))), []);
  const insurerOptions = useMemo(() => Array.from(new Set(cases.map((item) => item.insurer))), []);
  const tableColumns = [
    { label: "N° Caso", width: "min-w-[130px]", sortKey: "id" },
    { label: "Aseguradora", width: "min-w-[190px]", sortKey: "insurer" },
    { label: "Asegurado", width: "min-w-[230px]", sortKey: "insured" },
    { label: "Tipo de riesgo", width: "min-w-[170px]", sortKey: "riskType" },
    { label: "Sub categoría", width: "min-w-[240px]", sortKey: "subCategory" },
    { label: "Monto reclamado", width: "min-w-[190px]", sortKey: "claimedAmount" },
    { label: "Ajustador", width: "min-w-[210px]", sortKey: "adjuster" },
    { label: "Estado", width: "min-w-[210px]", sortKey: "status" },
    { label: "Última actualización", width: "min-w-[220px]", sortKey: "lastUpdate" },
    { label: "Acción", width: "min-w-[150px]" },
  ] satisfies Array<{ label: string; width: string; sortKey?: SortKey }>;
  const filteredAndSortedCases = useMemo(() => {
    const monthByName: Record<string, number> = {
      Ene: 0,
      Feb: 1,
      Mar: 2,
      Abr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Ago: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dic: 11,
    };
    const parseDate = (value: string) => {
      const [day, month, year] = value.split(" ");
      return new Date(Number(year), monthByName[month] ?? 0, Number(day)).getTime();
    };
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("es");
    const filteredCases = cases.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          item.id,
          item.insurer,
          item.insured,
          item.broker,
          item.adjuster,
          item.policyNumber,
          item.status,
          item.riskType,
          item.subCategory,
        ]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(normalizedSearch);
      const matchesStatus = statusFilter === "" || item.status === statusFilter;
      const matchesInsurer = insurerFilter === "" || item.insurer === insurerFilter;

      return matchesSearch && matchesStatus && matchesInsurer;
    });

    return filteredCases.sort((a, b) => {
      const aValue = sortConfig.key === "lastUpdate" ? parseDate(a.lastUpdate) : a[sortConfig.key];
      const bValue = sortConfig.key === "lastUpdate" ? parseDate(b.lastUpdate) : b[sortConfig.key];
      const comparison =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue), "es", { numeric: true, sensitivity: "base" });

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [insurerFilter, searchTerm, sortConfig, statusFilter]);
  const filteredAmount = useMemo(
    () => filteredAndSortedCases.reduce((sum, item) => sum + item.claimedAmount, 0),
    [filteredAndSortedCases],
  );
  const updateSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };
  const kpis = [
    { label: "Total de casos", value: cases.length, icon: <FolderOpen className="h-5 w-5" />, color: "text-brand-700 bg-brand-50 ring-brand-100", accent: "bg-brand-700" },
    { label: "Casos completados", value: cases.filter((item) => item.status === "Completado").length, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-blue-700 bg-blue-50 ring-blue-100", accent: "bg-blue-600" },
    { label: "Información faltante", value: cases.filter((item) => item.status === "Información faltante").length, icon: <AlertCircle className="h-5 w-5" />, color: "text-amber-700 bg-amber-50 ring-amber-100", accent: "bg-amber-500" },
    { label: "Informes generados", value: cases.filter((item) => item.status === "Informe generado").length, icon: <FileCheck2 className="h-5 w-5" />, color: "text-emerald-700 bg-emerald-50 ring-emerald-100", accent: "bg-emerald-600" },
  ];

  return (
    <div className="mx-auto max-w-[1680px] space-y-7">
      <div className="flex flex-col justify-between gap-5 rounded-lg border border-slate-200/80 bg-white px-6 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Panel ejecutivo</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Dashboard de Siniestros</h1>
          <p className="mt-2 text-slate-500">Vista ejecutiva de expedientes de transporte y estado documental.</p>
        </div>
        <Button onClick={() => go("new")} icon={<Plus className="h-4 w-4" />}>Nuevo Siniestro</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="relative overflow-hidden p-5">
            <div className={`absolute inset-x-0 top-0 h-1 ${kpi.accent}`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">{kpi.label}</p>
                <p className="mt-3 text-4xl font-bold text-slate-950">{kpi.value}</p>
              </div>
              <div className={`rounded-lg p-2.5 ring-1 ${kpi.color}`}>{kpi.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <label className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar caso, asegurado o póliza"
              value={searchTerm}
            />
          </label>
          <select
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm text-slate-600 outline-none transition focus:border-brand-600 focus:bg-white"
            onChange={(event) => setStatusFilter(event.target.value as CaseStatus | "")}
            value={statusFilter}
          >
            <option value="">Todos los estados</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm text-slate-600 outline-none transition focus:border-brand-600 focus:bg-white"
            onChange={(event) => setInsurerFilter(event.target.value)}
            value={insurerFilter}
          >
            <option value="">Todas las aseguradoras</option>
            {insurerOptions.map((insurer) => (
              <option key={insurer} value={insurer}>{insurer}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Casos registrados</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredAndSortedCases.length} de {cases.length} casos · Monto filtrado: {formatMoney(filteredAmount)} · Total cartera: {formatMoney(totalAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-500">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1940px] text-left text-sm">
            <thead className="bg-slate-100/80 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                {tableColumns.map((column) => (
                  <th key={column.label} className={`${column.width} border-b border-slate-200 px-6 py-4`}>
                    {column.sortKey ? (
                      <button
                        className={`inline-flex items-center gap-2 rounded-md text-left transition hover:text-brand-700 ${
                          sortConfig.key === column.sortKey ? "text-brand-700" : ""
                        }`}
                        onClick={() => updateSort(column.sortKey)}
                        type="button"
                      >
                        {column.label}
                        <ArrowDownUp
                          className={`h-3.5 w-3.5 ${
                            sortConfig.key === column.sortKey ? "text-brand-700" : "text-slate-400"
                          }`}
                        />
                        {sortConfig.key === column.sortKey && (
                          <span className="text-[10px] font-bold normal-case text-brand-700">
                            {sortConfig.direction === "asc" ? "Asc" : "Desc"}
                          </span>
                        )}
                      </button>
                    ) : (
                      <span>{column.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAndSortedCases.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-5 font-bold text-brand-700">{item.id}</td>
                  <td className="px-6 py-5 text-slate-700">{item.insurer}</td>
                  <td className="px-6 py-5 font-medium text-slate-900">{item.insured}</td>
                  <td className="px-6 py-5 text-slate-600">{item.riskType}</td>
                  <td className="px-6 py-5 text-slate-600">{item.subCategory}</td>
                  <td className="px-6 py-5 font-semibold text-slate-900">{formatMoney(item.claimedAmount)}</td>
                  <td className="px-6 py-5 text-slate-600">{item.adjuster}</td>
                  <td className="px-6 py-5"><StatusBadge status={item.status} /></td>
                  <td className="px-6 py-5 text-slate-600">{item.lastUpdate}</td>
                  <td className="px-6 py-5">
                    <Button variant="secondary" onClick={() => go("detail")}>Ver detalle</Button>
                  </td>
                </tr>
              ))}
              {filteredAndSortedCases.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-sm font-semibold text-slate-500" colSpan={tableColumns.length}>
                    No se encontraron casos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const CAMPOS_EXPEDIENTE: { clave: keyof CamposExpediente; etiqueta: string }[] = [
  { clave: "aseguradora", etiqueta: "Nombre de la aseguradora" },
  { clave: "asegurado", etiqueta: "Nombre del asegurado" },
  { clave: "corredor", etiqueta: "Nombre del corredor de seguros" },
  { clave: "contacto", etiqueta: "Datos de contacto del asegurado" },
  { clave: "numero_poliza", etiqueta: "Número de póliza" },
  { clave: "monto_reclamado", etiqueta: "Monto reclamado" },
];

// Único lugar donde vive la correspondencia subcategoría -> escenario del
// motor de reglas (T1..I2). Si el motor suma un escenario o el dashboard una
// subcategoría, se actualiza aquí y en ningún otro sitio.
const ESCENARIO_POR_SUBCATEGORIA: Record<CaseSubCategory, string> = {
  "Flota propia": "T1",
  "Transportista contratado": "T2",
  "Responsabilidad del transportista": "T3",
  "Tránsito internacional": "I1",
  "Tramo terrestre post importación": "I2",
};

// Opciones del control de "prima pagada". El valor vacío ("no especificado")
// es una opción legítima, no un estado a evitar: ver `DatosOperador` en
// `api.ts`. Si el operador no lo declara, el motor deriva el caso a revisión
// humana por dato ausente — comportamiento correcto, no un fallo.
const OPCIONES_PRIMA_PAGADA: { valor: "" | "true" | "false"; etiqueta: string }[] = [
  { valor: "", etiqueta: "No especificado" },
  { valor: "true", etiqueta: "Sí" },
  { valor: "false", etiqueta: "No" },
];

/** Tarjeta de un documento adjuntable. `obligatorio` solo cambia el
 *  ROTULADO del estado vacío ("Pendiente" en ámbar vs. "Adjuntar si aplica"
 *  en gris neutro): un condicional sin adjuntar es normal, no una carencia
 *  — ver el comentario junto a `conditionalDocuments` en `data/mockCases.ts`. */
function TarjetaDocumento({
  documento,
  archivos,
  onSeleccionar,
  obligatorio,
}: {
  documento: string;
  archivos: File[];
  onSeleccionar: (archivos: File[]) => void;
  obligatorio: boolean;
}) {
  const tieneArchivos = archivos.length > 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 transition hover:border-brand-200 hover:bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-white p-2 text-slate-600 shadow-sm ring-1 ring-slate-200">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{documento}</p>
            <p className={`mt-1 text-sm font-medium ${tieneArchivos ? "text-emerald-700" : obligatorio ? "text-amber-700" : "text-slate-500"}`}>
              {tieneArchivos
                ? archivos.map((archivo) => archivo.name).join(", ")
                : obligatorio
                  ? "Pendiente"
                  : "Adjuntar si aplica"}
            </p>
          </div>
        </div>
        <label className="shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
          Seleccionar
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => onSeleccionar(Array.from(e.target.files ?? []))}
          />
        </label>
      </div>
    </div>
  );
}

function NewCasePage({ go }: { go: (screen: Screen) => void }) {
  const [campos, setCampos] = useState<CamposExpediente>({
    aseguradora: "",
    asegurado: "",
    corredor: "",
    contacto: "",
    numero_poliza: "",
    monto_reclamado: "",
    descripcion: "",
  });
  const [selectedSubCategory, setSelectedSubCategory] = useState<CaseSubCategory>(claimTypeOptions[0].subCategory);
  const [isChoosingClaimType, setIsChoosingClaimType] = useState(true);
  const [archivosPorDocumento, setArchivosPorDocumento] = useState<Record<string, File[]>>({});
  const [primaPagada, setPrimaPagada] = useState<"" | "true" | "false">("");
  const [fechaAviso, setFechaAviso] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const selectedClaimTypeOption =
    claimTypeOptions.find((option) => option.subCategory === selectedSubCategory) ?? claimTypeOptions[0];
  const docsObligatorios = selectedClaimTypeOption.requiredDocuments;
  const docsCondicionales = selectedClaimTypeOption.conditionalDocuments;
  const selectedClaimTypeLabel = `${selectedClaimTypeOption.riskType} - ${selectedClaimTypeOption.subCategory}`;
  const selectClaimType = (subCategory: CaseSubCategory) => {
    setSelectedSubCategory(subCategory);
    setArchivosPorDocumento({});
    setIsChoosingClaimType(false);
  };

  const todosLosArchivos = Object.values(archivosPorDocumento).flat();
  const faltaPoliza = !(archivosPorDocumento["Póliza"]?.length);

  const enviarAAnalisis = async () => {
    setError(null);
    setAnalizando(true);
    try {
      // El tipo elegido en la pantalla anterior viaja como el escenario del
      // motor (T1..I2): ver ESCENARIO_POR_SUBCATEGORIA más arriba.
      const datosOperador: DatosOperador = {
        escenario: ESCENARIO_POR_SUBCATEGORIA[selectedSubCategory],
        prima_pagada: primaPagada,
        fecha_aviso: fechaAviso,
      };
      const respuesta = await analizarSiniestro(campos, todosLosArchivos, datosOperador);
      guardarResultado(respuesta);
      navigate("/siniestros/confirmacion");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fallo inesperado al analizar el expediente.");
    } finally {
      setAnalizando(false);
    }
  };

  if (isChoosingClaimType) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200/80 bg-white px-6 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Nuevo siniestro</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Selecciona el tipo de siniestro</h1>
            <p className="mt-2 text-slate-500">La documentación requerida se ajustará automáticamente según la subcategoría elegida.</p>
          </div>
          <Button variant="secondary" onClick={() => go("dashboard")}>Cancelar</Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {claimTypeOptions.map((option) => (
            <button
              key={option.subCategory}
              className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:border-brand-200 hover:shadow-[0_22px_55px_rgba(37,99,235,0.12)]"
              onClick={() => selectClaimType(option.subCategory)}
              type="button"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{option.riskType}</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">{option.subCategory}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {option.requiredDocuments.length} documentos obligatorios
                    {option.conditionalDocuments.length > 0 &&
                      ` · ${option.conditionalDocuments.length} condicionales (si aplica)`}
                    {" "}para iniciar la revisión documental.
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-brand-700 ring-1 ring-slate-200 transition group-hover:bg-brand-700 group-hover:text-white">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {option.requiredDocuments.slice(0, 3).map((doc) => (
                  <span key={doc} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {doc}
                  </span>
                ))}
                {option.requiredDocuments.length > 3 && (
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    +{option.requiredDocuments.length - 3} más
                  </span>
                )}
              </div>
              <div className="mt-5 text-sm font-bold text-brand-700">Seleccionar y continuar</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Nuevo Siniestro</h1>
        <p className="mt-1 text-slate-500">Los documentos se analizan con IA y se evalúan contra las reglas de la póliza.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Datos del expediente</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {CAMPOS_EXPEDIENTE.map(({ clave, etiqueta }) => (
              <label key={clave} className="block">
                <span className="text-sm font-semibold text-slate-700">{etiqueta}</span>
                <input
                  value={campos[clave]}
                  onChange={(e) => setCampos((prev) => ({ ...prev, [clave]: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder={etiqueta}
                />
              </label>
            ))}
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Tipo de siniestro</span>
              <div className="mt-2 rounded-lg border border-brand-100 bg-brand-50 p-4">
                <p className="font-bold text-brand-900">{selectedClaimTypeLabel}</p>
                <button
                  className="mt-2 text-sm font-bold text-brand-700 hover:text-brand-900"
                  onClick={() => setIsChoosingClaimType(true)}
                  type="button"
                >
                  Cambiar tipo
                </button>
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Tipo de riesgo</span>
              <input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-3 text-slate-600" value={selectedClaimTypeOption.riskType} readOnly />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Subcategoría</span>
              <input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-3 text-slate-600" value={selectedClaimTypeOption.subCategory} readOnly />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Descripción del siniestro</span>
              <textarea
                value={campos.descripcion}
                onChange={(e) => setCampos((prev) => ({ ...prev, descripcion: e.target.value }))}
                className="mt-2 min-h-32 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Describa brevemente el incidente, ruta, mercadería y daños reportados."
              />
            </label>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-bold text-slate-900">Datos que declara el operador</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Ningún documento del expediente los contiene: en producción llegarían del sistema de la
              aseguradora. El ajustador sí los conoce. Si se dejan sin declarar, el motor deriva el caso a
              revisión del ajustador por dato ausente — es el comportamiento correcto, no un error.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-sm font-semibold text-slate-700">¿La prima está pagada?</span>
                <div className="mt-2 inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {OPCIONES_PRIMA_PAGADA.map((opcion) => (
                    <button
                      key={opcion.valor}
                      type="button"
                      onClick={() => setPrimaPagada(opcion.valor)}
                      className={`px-4 py-2 text-sm font-semibold transition ${
                        primaPagada === opcion.valor ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {opcion.etiqueta}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Fecha de aviso a la aseguradora</span>
                <input
                  type="date"
                  value={fechaAviso}
                  onChange={(e) => setFechaAviso(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Documentos requeridos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Requisitos para {selectedClaimTypeLabel}. PDF o imágenes; la póliza es indispensable para evaluar la cobertura.
          </p>
          <div className="mt-5 grid gap-3">
            {docsObligatorios.map((documento) => (
              <TarjetaDocumento
                key={documento}
                documento={documento}
                archivos={archivosPorDocumento[documento] ?? []}
                onSeleccionar={(archivos) => setArchivosPorDocumento((prev) => ({ ...prev, [documento]: archivos }))}
                obligatorio
              />
            ))}
          </div>
          {faltaPoliza && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              Sin la póliza no se puede evaluar la cobertura: el expediente se derivaría a revisión humana.
            </p>
          )}

          {docsCondicionales.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-bold text-slate-900">Documentos condicionales</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Solo aplican si la aseguradora decide hacer salvamento o recupero legal (catálogo Protegia).
                Su ausencia NO es una carencia: el motor nunca los exige para completar la revisión
                documental (compuerta G6.1).
              </p>
              <div className="mt-4 grid gap-3">
                {docsCondicionales.map((documento) => (
                  <TarjetaDocumento
                    key={documento}
                    documento={documento}
                    archivos={archivosPorDocumento[documento] ?? []}
                    onSeleccionar={(archivos) => setArchivosPorDocumento((prev) => ({ ...prev, [documento]: archivos }))}
                    obligatorio={false}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={() => go("dashboard")}>Cancelar</Button>
        <Button
          onClick={enviarAAnalisis}
          disabled={analizando || todosLosArchivos.length === 0}
          icon={analizando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
        >
          {analizando ? "Analizando expediente…" : "Enviar a análisis IA"}
        </Button>
      </div>
    </div>
  );
}

const TITULO_VEREDICTO: Record<Veredicto, string> = {
  APROBABLE: "Expediente aprobable",
  APROBABLE_POR_SILENCIO: "Aprobado por silencio positivo (Art. 74 LCS)",
  RECHAZO: "Expediente rechazado",
  OBSERVADO: "Faltan documentos obligatorios",
  ESCALADO: "Derivado a revisión del ajustador",
};

const DETALLE_VEREDICTO: Record<Veredicto, string> = {
  APROBABLE: "Las seis compuertas pasaron. El informe y el cálculo de indemnización están listos.",
  APROBABLE_POR_SILENCIO: "La aseguradora no se pronunció en plazo: el siniestro queda consentido.",
  RECHAZO: "Una compuerta falló con evidencia. El informe cita el motivo y su fundamento legal.",
  OBSERVADO: "El expediente está incompleto. Se generaron recordatorios a 30, 60 y 180 días.",
  ESCALADO: "El motor no decide sin evidencia suficiente: el caso pasa al ajustador con pre-análisis.",
};

// Categoría visual del veredicto (icono/color de ConfirmationPage): distingue
// un rechazo (negativo) de una derivación u observación (atención), en vez de
// tratarlos igual solo por no ser una aprobación.
const CATEGORIA_VEREDICTO: Record<Veredicto, "positivo" | "negativo" | "atencion"> = {
  APROBABLE: "positivo",
  APROBABLE_POR_SILENCIO: "positivo",
  RECHAZO: "negativo",
  OBSERVADO: "atencion",
  ESCALADO: "atencion",
};

const ESTILO_CATEGORIA: Record<"positivo" | "negativo" | "atencion", string> = {
  positivo: "bg-emerald-50 text-emerald-700",
  negativo: "bg-red-50 text-red-700",
  atencion: "bg-amber-50 text-amber-700",
};

function EstadoVacio({
  titulo,
  detalle,
  go,
  etiquetaBoton = "Nuevo siniestro",
}: {
  titulo: string;
  detalle: string;
  go: (screen: Screen) => void;
  etiquetaBoton?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl pt-12">
      <Card className="p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-950">{titulo}</h1>
        <p className="mt-3 text-slate-500">{detalle}</p>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => go("new")}>{etiquetaBoton}</Button>
        </div>
      </Card>
    </div>
  );
}

function ConfirmationPage({ go }: { go: (screen: Screen) => void }) {
  const navigate = useNavigate();
  const resultado = leerResultado();

  if (!resultado) {
    return (
      <EstadoVacio
        go={go}
        titulo="No hay ningún análisis en curso"
        detalle="Registra un siniestro para ver su resultado."
      />
    );
  }

  const categoria = CATEGORIA_VEREDICTO[resultado.veredicto];
  const Icono = categoria === "negativo" ? AlertCircle : categoria === "positivo" ? CheckCircle2 : AlertCircle;

  return (
    <div className="mx-auto max-w-3xl pt-12">
      <Card className="p-8 text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${ESTILO_CATEGORIA[categoria]}`}>
          <Icono className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">{TITULO_VEREDICTO[resultado.veredicto]}</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">{DETALLE_VEREDICTO[resultado.veredicto]}</p>

        <div className="mx-auto mt-6 max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Número de caso</p>
          <p className="mt-1 text-2xl font-bold text-brand-700">{resultado.caso_id}</p>
          <div className="mt-3 flex justify-center">
            <StatusBadge status={estadoDeVeredicto(resultado.veredicto)} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => go("dashboard")}>Volver al Dashboard</Button>
          <Button onClick={() => navigate(`/siniestros/${resultado.caso_id}`)}>Ver Detalle del Expediente</Button>
        </div>
      </Card>
    </div>
  );
}

const ESTILO_ESTADO_GATE: Record<string, string> = {
  PASS: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  FAIL: "bg-red-50 text-red-800 ring-red-200",
  INCONCLUSO: "bg-amber-50 text-amber-800 ring-amber-200",
  OBSERVADO: "bg-amber-50 text-amber-800 ring-amber-200",
  SILENCIO: "bg-blue-50 text-blue-800 ring-blue-200",
};

const ESTILO_CONFIANZA: Record<Confianza, string> = {
  alta: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  media: "bg-amber-50 text-amber-800 ring-amber-200",
  baja: "bg-red-50 text-red-800 ring-red-200",
};

/** El valor de un campo de evidencia puede ser un escalar, una lista o un
 *  objeto (`poliza.garantias` es una lista de objetos, por ejemplo): un
 *  `String(valor)` ingenuo imprimiría "[object Object]" para esos casos. Se
 *  muestra el string tal cual y se serializa cualquier otra cosa. */
function formatearValorEvidencia(valor: ValorJson): string {
  return typeof valor === "string" ? valor : JSON.stringify(valor);
}

/** El corazón de la demo: cada compuerta (G1..G6) con su estado, su motivo y
 *  la evidencia citada junto al documento del que salió cada dato. Sustituye
 *  a las tres "Observaciones" hardcodeadas que traía la maqueta. */
function TrazaMotor({ traza }: { traza: PasoTraza[] }) {
  if (traza.length === 0) {
    return (
      <div>
        <p className="font-bold text-slate-950">Traza de la decisión</p>
        <p className="mt-2 text-sm text-slate-500">
          El motor no llegó a evaluar la cascada de compuertas: la extracción no obtuvo los datos
          núcleo necesarios para decidir (ver «Extracción incompleta»).
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-bold text-slate-950">Traza de la decisión</p>
      <p className="mt-1 text-sm text-slate-500">
        Cada compuerta, su motivo y la evidencia con el documento que la respalda.
      </p>
      <ol className="mt-4 space-y-3">
        {traza.map((paso) => (
          <li key={paso.gate} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-slate-900">
                {paso.gate} · {paso.nombre}
              </p>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${ESTILO_ESTADO_GATE[paso.estado] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                {paso.estado}
              </span>
            </div>
            {paso.estado !== "PASS" && paso.motivo && <p className="mt-2 text-sm text-slate-600">{paso.motivo}</p>}
            {paso.estado !== "PASS" && !!paso.evidencia?.length && (
              <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {paso.evidencia.map((e) => (
                  <li key={e.campo} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                    <span className="font-semibold text-slate-500">{e.campo}</span>
                    <span className="font-bold text-slate-900">{formatearValorEvidencia(e.valor)}</span>
                    <span className="text-slate-400">— fuente: {e.fuente ?? "no determinada"}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** El pre-análisis de la capa IA de lectura: nunca decide, solo lee y cita
 *  evidencia de los documentos para ayudar al ajustador en un caso ESCALADO.
 *  `compuerta` es la última compuerta de la traza (sobre la que el lector
 *  fue consultado: ver `lectura/__init__.py::anotar_evidencia`). */
function PanelPreAnalisisIA({ preAnalisis, compuerta }: { preAnalisis: PreAnalisisIA; compuerta?: PasoTraza }) {
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold text-slate-950">Pre-análisis de lectura IA</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${ESTILO_CONFIANZA[preAnalisis.confianza]}`}>
          Confianza {preAnalisis.confianza} · {preAnalisis.proveedor}
        </span>
      </div>
      {compuerta && (
        <p className="mt-1 text-xs font-semibold text-violet-700">
          Sobre la compuerta {compuerta.gate} · {compuerta.nombre}
        </p>
      )}
      {preAnalisis.resuelto ? (
        <>
          {preAnalisis.hallazgo && <p className="mt-3 text-sm text-slate-700">{preAnalisis.hallazgo}</p>}
          {preAnalisis.evidencia && (
            <blockquote className="mt-3 border-l-4 border-violet-300 pl-3 text-sm italic text-slate-600">
              “{preAnalisis.evidencia}”
            </blockquote>
          )}
          {preAnalisis.documento && (
            <p className="mt-2 text-xs font-semibold text-slate-500">Documento fuente: {preAnalisis.documento}</p>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          El asistente de lectura no encontró evidencia concluyente en los documentos disponibles.
          El caso requiere revisión directa del ajustador.
        </p>
      )}
      <p className="mt-3 text-xs text-slate-400">
        El asistente de lectura solo cita evidencia de los documentos: nunca decide el veredicto.
      </p>
    </div>
  );
}

function DetailPage({ go }: { go: (screen: Screen) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const resultado = leerResultado();

  if (!resultado) {
    return (
      <EstadoVacio
        go={go}
        titulo="No hay ningún expediente analizado"
        detalle="Registra un siniestro para ver su detalle."
      />
    );
  }

  const estado = estadoDeVeredicto(resultado.veredicto);
  const indem = resultado.indemnizacion;
  // El importe vive en `indemnizacion.indemnizacion` (no en un campo `monto`,
  // que no existe): y solo se pinta si `calculable` es verdadero, para no
  // mostrar nunca una cifra engañosa.
  const montoIndemnizacion = !indem
    ? "No aplica a este veredicto"
    : indem.calculable
      ? formatUsd(indem.indemnizacion)
      : "No calculable con los datos disponibles";
  const ultimaCompuerta = resultado.traza.length ? resultado.traza[resultado.traza.length - 1] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-950">Detalle del Expediente</h1>
            <StatusBadge status={estado} />
          </div>
          <p className="mt-1 text-slate-500">
            Expediente {resultado.caso_id} · {TITULO_VEREDICTO[resultado.veredicto]}
          </p>
        </div>
        {resultado.informe_md && (
          <Button onClick={() => navigate(`${location.pathname}/informe`)} icon={<FileText className="h-4 w-4" />}>
            Ver informe final
          </Button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.6fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-950">Resumen</h2>
            <dl className="mt-5 space-y-4 text-sm">
              {[
                ["N° Caso", resultado.caso_id],
                ["Veredicto", resultado.veredicto],
                ["Escenario", resultado.clasificacion?.escenario ?? "—"],
                ["Confianza de clasificación", resultado.clasificacion?.confianza ?? "—"],
                ["Indemnización", montoIndemnizacion],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-5 border-b border-slate-100 pb-3">
                  <dt className="font-semibold text-slate-500">{label}</dt>
                  <dd className="text-right font-bold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            {!!resultado.flags.length && (
              <div className="mt-5 flex flex-wrap gap-2">
                {resultado.flags.map((f) => (
                  <span key={f} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {!!indem?.calculable && !!indem.detalle.length && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-950">Detalle del cálculo</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {indem.detalle.map((linea) => (
                  <li key={linea} className="rounded-lg border border-slate-200 bg-slate-50 p-3">{linea}</li>
                ))}
              </ul>
            </Card>
          )}

          {resultado.veredicto === "OBSERVADO" && !!resultado.faltantes.length && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-950">Documentos faltantes</h2>
              <ul className="mt-4 space-y-2">
                {resultado.faltantes.map((d) => (
                  <li key={d} className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                    <Clock3 className="h-4 w-4 shrink-0" />
                    {resultado.etiquetas_documentos[d] ?? d}
                  </li>
                ))}
              </ul>
              {!!resultado.recordatorios?.length && (
                <p className="mt-4 text-sm text-slate-500">
                  Recordatorios: {resultado.recordatorios.map((r) => `${r.dias}d (${r.fecha ?? "fecha base no disponible"})`).join(" · ")}
                </p>
              )}
            </Card>
          )}

          {!!resultado.condicionales.length && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-950">Documentos condicionales del escenario</h2>
              <p className="mt-1 text-sm text-slate-500">
                Informativo: su ausencia nunca cuenta como faltante (compuerta G6.1).
              </p>
              <ul className="mt-4 space-y-2">
                {resultado.condicionales.map((c) => (
                  <li key={c.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-800">{resultado.etiquetas_documentos[c.id] ?? c.id}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{c.condicion}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {!!resultado.problemas_extraccion.length && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-950">Extracción incompleta</h2>
              <p className="mt-1 text-sm text-slate-500">
                {resultado.motivo ?? "El motor no decide sin estos datos: el caso se deriva al ajustador."}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {resultado.problemas_extraccion.map((p) => (
                  <li key={p} className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs">{p}</li>
                ))}
              </ul>
            </Card>
          )}

          {resultado.discrepancia_escenario && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-950">Discrepancia de escenario</h2>
              <p className="mt-2 text-sm text-slate-600">
                La extracción trajo el escenario <strong>{resultado.discrepancia_escenario.extraido}</strong>, pero el
                clasificador calculó <strong>{resultado.discrepancia_escenario.clasificado}</strong>. El motor no pisa
                uno con el otro: queda para revisión humana.
              </p>
            </Card>
          )}

          {resultado.discrepancia_datos_operador && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-950">Discrepancia con datos del operador</h2>
              <p className="mt-2 text-sm text-slate-600">
                Un dato declarado por el operador no coincidía con lo extraído del documento. Gana siempre
                la evidencia documental; se reporta igual para que el ajustador lo revise.
              </p>
              <ul className="mt-3 space-y-2">
                {Object.entries(resultado.discrepancia_datos_operador).map(([campo, valores]) => (
                  <li key={campo} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-mono text-xs font-semibold text-slate-500">{campo}</p>
                    <p className="mt-1 text-slate-700">
                      Documento: <strong>{formatearValorEvidencia(valores.extraido)}</strong> · Operador:{" "}
                      <strong>{formatearValorEvidencia(valores.operador)}</strong>
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-violet-100 bg-violet-50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-2 text-violet-700 shadow-sm">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Análisis del expediente</h2>
                <p className="text-sm text-violet-700">Motor de reglas · decisión trazable</p>
              </div>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-500">Escenario clasificado</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{resultado.clasificacion?.escenario ?? "—"}</p>
                {resultado.clasificacion?.motivo && (
                  <p className="mt-1 text-xs text-slate-500">{resultado.clasificacion.motivo}</p>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-500">Confianza de clasificación</p>
                {resultado.clasificacion ? (
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${ESTILO_CONFIANZA[resultado.clasificacion.confianza]}`}>
                    {resultado.clasificacion.confianza}
                  </span>
                ) : (
                  <p className="mt-1 text-lg font-bold text-slate-950">—</p>
                )}
              </div>
            </div>

            <TrazaMotor traza={resultado.traza} />

            {resultado.veredicto === "ESCALADO" && resultado.pre_analisis_ia && (
              <PanelPreAnalisisIA preAnalisis={resultado.pre_analisis_ia} compuerta={ultimaCompuerta} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/** Convierte `**negrita**`, `` `código` `` y `_cursiva_` en nodos React.
 *  No es un parser de Markdown general: cubre exactamente el énfasis
 *  inline que emite `informe/reporte.py` (Motor B). */
function textoConEnfasis(texto: string): React.ReactNode[] {
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g);
  return partes.map((parte, indice) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      return (
        <strong key={indice} className="font-bold text-slate-950">
          {parte.slice(2, -2)}
        </strong>
      );
    }
    if (parte.startsWith("`") && parte.endsWith("`")) {
      return (
        <code key={indice} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800">
          {parte.slice(1, -1)}
        </code>
      );
    }
    if (parte.length > 2 && parte.startsWith("_") && parte.endsWith("_")) {
      return <em key={indice}>{parte.slice(1, -1)}</em>;
    }
    return <span key={indice}>{parte}</span>;
  });
}

/** Renderiza el Markdown que producen `generar_informe`/`generar_carta_sbs`
 *  (`informe/reporte.py`): encabezados, tabla de la cascada, listas y
 *  énfasis. No es un renderer de Markdown general — no se añadió
 *  `react-markdown` para esta demo — sino uno acotado a lo que ese
 *  generador realmente emite. */
function BloqueMarkdown({ markdown }: { markdown: string }) {
  const lineas = markdown.split("\n");
  const bloques: React.ReactNode[] = [];
  let i = 0;
  let clave = 0;

  const celdasDe = (fila: string) => fila.split("|").slice(1, -1).map((c) => c.trim());

  while (i < lineas.length) {
    const linea = lineas[i];

    if (linea.trim() === "") {
      i += 1;
      continue;
    }

    if (linea.startsWith("## ")) {
      bloques.push(
        <h2 key={clave++} className="mt-2 text-lg font-bold text-slate-950">
          {textoConEnfasis(linea.slice(3))}
        </h2>,
      );
      i += 1;
      continue;
    }

    if (linea.startsWith("# ")) {
      bloques.push(
        <h1 key={clave++} className="text-2xl font-bold text-slate-950">
          {textoConEnfasis(linea.slice(2))}
        </h1>,
      );
      i += 1;
      continue;
    }

    if (linea.trim() === "---") {
      bloques.push(<hr key={clave++} className="border-slate-200" />);
      i += 1;
      continue;
    }

    if (linea.startsWith("|")) {
      const filas: string[] = [];
      while (i < lineas.length && lineas[i].startsWith("|")) {
        filas.push(lineas[i]);
        i += 1;
      }
      const [encabezado, , ...datos] = filas;
      bloques.push(
        <div key={clave++} className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300">
                {celdasDe(encabezado).map((c, idxCol) => (
                  <th key={idxCol} className="px-3 py-2 font-bold text-slate-900">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, idxFila) => (
                <tr key={idxFila} className="border-b border-slate-100">
                  {celdasDe(fila).map((c, idxCol) => (
                    <td key={idxCol} className="px-3 py-2 text-slate-700">{textoConEnfasis(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (linea.startsWith("- ")) {
      const items: string[] = [];
      while (i < lineas.length && lineas[i].startsWith("- ")) {
        items.push(lineas[i].slice(2));
        i += 1;
      }
      bloques.push(
        <ul key={clave++} className="list-disc space-y-1.5 pl-5 text-slate-700">
          {items.map((item, idx) => (
            <li key={idx}>{textoConEnfasis(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    bloques.push(
      <p key={clave++} className="leading-7 text-slate-700">
        {textoConEnfasis(linea)}
      </p>,
    );
    i += 1;
  }

  return <div className="space-y-4">{bloques}</div>;
}

function ReportPage({ go }: { go: (screen: Screen) => void }) {
  const navigate = useNavigate();
  const resultado = leerResultado();

  if (!resultado) {
    return (
      <EstadoVacio
        go={go}
        titulo="Todavía no hay informe"
        detalle="Registra un siniestro para generarlo."
      />
    );
  }

  if (!resultado.informe_md) {
    return (
      <div className="mx-auto max-w-3xl pt-12">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-950">Este expediente no tiene informe</h1>
          <p className="mt-3 text-slate-500">
            Expediente {resultado.caso_id}: {TITULO_VEREDICTO[resultado.veredicto]}. {DETALLE_VEREDICTO[resultado.veredicto]}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate(`/siniestros/${resultado.caso_id}`)}>
              Volver al detalle del expediente
            </Button>
            <Button onClick={() => go("new")}>Nuevo siniestro</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Informe Final</h1>
          <p className="mt-1 text-slate-500">Generado por el motor. Sujeto a revisión del ajustador.</p>
        </div>
        <Button onClick={() => go("dashboard")}>Volver al dashboard</Button>
      </div>

      <Card className="mx-auto max-w-5xl overflow-hidden">
        <div className="border-b border-amber-200 bg-amber-50 px-8 py-4 text-sm font-semibold text-amber-900">
          Informe generado automáticamente y sujeto a revisión del ajustador.
        </div>
        <article className="bg-white px-8 py-10 md:px-14">
          <BloqueMarkdown markdown={resultado.informe_md} />
          {resultado.carta_sbs && (
            <section className="mt-10 border-t border-slate-200 pt-8">
              <h3 className="text-lg font-bold text-slate-950">Carta SBS</h3>
              <div className="mt-3">
                <BloqueMarkdown markdown={resultado.carta_sbs} />
              </div>
            </section>
          )}
        </article>
      </Card>
    </div>
  );
}

function LoginRoute() {
  const go = useScreenNavigation();
  return <LoginPage go={go} />;
}

function DashboardRoute() {
  const go = useScreenNavigation();
  return (
    <AppShell screen="dashboard" go={go}>
      <DashboardPage go={go} />
    </AppShell>
  );
}

function NewCaseRoute() {
  const go = useScreenNavigation();
  return (
    <AppShell screen="new" go={go}>
      <NewCasePage go={go} />
    </AppShell>
  );
}

function ConfirmationRoute() {
  const go = useScreenNavigation();
  return (
    <AppShell screen="confirmation" go={go}>
      <ConfirmationPage go={go} />
    </AppShell>
  );
}

function DetailRoute() {
  const go = useScreenNavigation();
  return (
    <AppShell screen="detail" go={go}>
      <DetailPage go={go} />
    </AppShell>
  );
}

function ReportRoute() {
  const go = useScreenNavigation();
  return (
    <AppShell screen="report" go={go}>
      <ReportPage go={go} />
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/siniestros/nuevo" element={<NewCaseRoute />} />
        <Route path="/siniestros/confirmacion" element={<ConfirmationRoute />} />
        <Route path="/siniestros/:caseId" element={<DetailRoute />} />
        <Route path="/siniestros/:caseId/informe" element={<ReportRoute />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

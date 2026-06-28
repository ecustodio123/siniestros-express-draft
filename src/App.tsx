import {
  AlertCircle,
  ArrowDownUp,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CaseStatus, ClaimCase, cases, featuredCase } from "./data/mockCases";

type Screen = "login" | "dashboard" | "new" | "confirmation" | "detail" | "report";
type AnalysisResult = "faltante" | "informe";
type SortDirection = "asc" | "desc";
type SortKey = keyof Pick<
  ClaimCase,
  "id" | "insurer" | "insured" | "riskType" | "claimedAmount" | "adjuster" | "status" | "lastUpdate"
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: React.ReactNode;
}) {
  const styles = {
    primary: "bg-slate-950 text-white shadow-sm shadow-slate-950/20 hover:bg-brand-700",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-200/60 hover:border-slate-300 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    danger: "border border-amber-200 bg-amber-50 text-amber-900 shadow-sm shadow-amber-100 hover:bg-amber-100",
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${styles[variant]}`}
      onClick={onClick}
      type="button"
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
          <table className="w-full min-w-[1700px] text-left text-sm">
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

function NewCasePage({ go }: { go: (screen: Screen) => void }) {
  const [attached, setAttached] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const docs = ["Denuncia Policial", "Documentos del chofer o camión", "Guías de remisión", "Facturas"];
  const sendToAnalysis = () => {
    const result: AnalysisResult = Math.random() < 0.5 ? "faltante" : "informe";
    navigate(`/siniestros/confirmacion?resultado=${result}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Nuevo Siniestro</h1>
        <p className="mt-1 text-slate-500">Registro visual de expediente para análisis documental simulado.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Datos del expediente</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              "Nombre de la aseguradora",
              "Nombre del asegurado",
              "Nombre del corredor de seguros",
              "Datos de contacto del asegurado",
              "Número de póliza",
              "Monto reclamado",
            ].map((label) => (
              <label key={label} className="block">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-blue-100" placeholder={label} />
              </label>
            ))}
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Tipo de riesgo</span>
              <input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-3 text-slate-600" value="Transporte" readOnly />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Descripción del siniestro</span>
              <textarea className="mt-2 min-h-32 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-blue-100" placeholder="Describa brevemente el incidente, ruta, mercadería y daños reportados." />
            </label>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Documentos requeridos</h2>
          <p className="mt-1 text-sm text-slate-500">Las tarjetas simulan la selección de archivos; no se realiza carga real.</p>
          <div className="mt-5 grid gap-3">
            {docs.map((doc) => (
              <div key={doc} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 transition hover:border-brand-200 hover:bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white p-2 text-slate-600 shadow-sm ring-1 ring-slate-200">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{doc}</p>
                      <p className={`mt-1 text-sm font-medium ${attached[doc] ? "text-emerald-700" : "text-amber-700"}`}>
                        {attached[doc] ? "Adjunto simulado" : "Pendiente"}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => setAttached((prev) => ({ ...prev, [doc]: true }))}>Seleccionar archivo</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={() => go("dashboard")}>Cancelar</Button>
        <Button variant="secondary">Guardar borrador</Button>
        <Button onClick={sendToAnalysis} icon={<Bot className="h-4 w-4" />}>Enviar a análisis IA</Button>
      </div>
    </div>
  );
}

function ConfirmationPage({ go }: { go: (screen: Screen) => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const result: AnalysisResult = searchParams.get("resultado") === "informe" ? "informe" : "faltante";
  const isGenerated = result === "informe";

  return (
    <div className="mx-auto max-w-3xl pt-12">
      <Card className="p-8 text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isGenerated ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {isGenerated ? <CheckCircle2 className="h-9 w-9" /> : <AlertCircle className="h-9 w-9" />}
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">Siniestro registrado correctamente</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">
          {isGenerated
            ? "El expediente fue analizado y quedó listo con informe generado."
            : "El expediente fue analizado y requiere completar información documental."}
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Número de caso simulado</p>
          <p className="mt-1 text-2xl font-bold text-brand-700">SE-2026-007</p>
          <div className="mt-3 flex justify-center">
            <StatusBadge status={isGenerated ? "Informe generado" : "Información faltante"} />
          </div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => go("dashboard")}>Volver al Dashboard</Button>
          <Button onClick={() => navigate(`/siniestros/SE-2026-007?resultado=${result}`)}>Ver Detalle del Expediente</Button>
        </div>
      </Card>
    </div>
  );
}

function DetailPage({ go }: { go: (screen: Screen) => void }) {
  const item = featuredCase;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialResult: AnalysisResult = searchParams.get("resultado") === "informe" ? "informe" : "faltante";
  const [detailResult, setDetailResult] = useState<AnalysisResult>(initialResult);
  const isGenerated = detailResult === "informe";
  const visibleDocuments = isGenerated
    ? item.documents.map((doc) => ({ ...doc, status: "Recibido" as const }))
    : item.documents;
  const setSuccessfulDetail = () => {
    setDetailResult("informe");
    navigate(`${location.pathname}?resultado=informe`, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-950">Detalle del Expediente</h1>
            <StatusBadge status={isGenerated ? "Informe generado" : "Información faltante"} />
          </div>
          <p className="mt-1 text-slate-500">
            {isGenerated
              ? `Expediente ${item.id} con documentación completa e informe listo.`
              : `Expediente ${item.id} con observaciones documentales generadas de forma simulada.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isGenerated && (
            <Button variant="secondary" onClick={setSuccessfulDetail} icon={<CheckCircle2 className="h-4 w-4" />}>
              Simular informe generado
            </Button>
          )}
          <Button onClick={() => navigate(`${location.pathname}/informe`)} icon={<FileText className="h-4 w-4" />}>
            {isGenerated ? "Ver informe final" : "Generar informe final"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_0.8fr_1.1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Información del caso</h2>
          <dl className="mt-5 space-y-4 text-sm">
            {[
              ["N° Caso", item.id],
              ["Aseguradora", item.insurer],
              ["Asegurado", item.insured],
              ["Corredor", item.broker],
              ["Póliza", item.policyNumber],
              ["Monto reclamado", formatMoney(item.claimedAmount)],
              ["Estado actual", isGenerated ? "Informe generado" : "Información faltante"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-5 border-b border-slate-100 pb-3">
                <dt className="font-semibold text-slate-500">{label}</dt>
                <dd className="text-right font-bold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-950">Documentos</h2>
          <div className="mt-5 space-y-3">
            {visibleDocuments.map((doc) => (
              <div key={doc.name} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-center gap-3">
                  {doc.status === "Recibido" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Clock3 className="h-5 w-5 text-amber-600" />}
                  <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${doc.status === "Recibido" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
          {isGenerated ? (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-bold text-emerald-900">Documentación completa</p>
              <p className="mt-1 text-sm text-emerald-800">Los documentos mínimos fueron identificados y validados visualmente.</p>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-bold text-amber-900">Documentos faltantes</p>
              <p className="mt-1 text-sm text-amber-800">Guías de remisión requeridas para completar la revisión.</p>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-violet-100 bg-violet-50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-2 text-violet-700 shadow-sm">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Análisis Inteligente del Expediente</h2>
                <p className="text-sm text-violet-700">Resultado simulado del Asistente IA</p>
              </div>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-500">Estado</p>
                <p className={`mt-1 text-lg font-bold ${isGenerated ? "text-emerald-700" : "text-amber-700"}`}>
                  {isGenerated ? "Informe generado" : "Información faltante"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-500">Confianza estimada</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{isGenerated ? "94%" : "78%"}</p>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-950">Observaciones</p>
              {isGenerated ? (
                <ol className="mt-3 space-y-3 text-sm text-slate-600">
                  <li>1. La documentación mínima del expediente fue identificada correctamente.</li>
                  <li>2. Las guías de remisión y facturas coinciden con la mercadería declarada.</li>
                  <li>3. El expediente se encuentra apto para visualizar el informe final.</li>
                </ol>
              ) : (
                <ol className="mt-3 space-y-3 text-sm text-slate-600">
                  <li>1. Falta guía de remisión para validar la mercadería transportada.</li>
                  <li>2. La factura fue identificada correctamente.</li>
                  <li>3. La denuncia policial contiene fecha y ubicación del incidente.</li>
                </ol>
              )}
            </div>
            <div className={`rounded-lg border p-4 ${isGenerated ? "border-emerald-100 bg-emerald-50" : "border-brand-100 bg-brand-50"}`}>
              <p className={`text-sm font-semibold ${isGenerated ? "text-emerald-700" : "text-brand-700"}`}>Próxima acción recomendada</p>
              <p className={`mt-1 font-bold ${isGenerated ? "text-emerald-900" : "text-brand-900"}`}>
                {isGenerated ? "Revisar el informe final con el ajustador responsable." : "Solicitar guía de remisión al asegurado o corredor."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {!isGenerated && <Button variant="secondary" icon={<Upload className="h-4 w-4" />}>Adjuntar documento faltante</Button>}
              <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />}>Reanalizar expediente</Button>
              <Button onClick={() => navigate(`${location.pathname}/informe`)} icon={<FileText className="h-4 w-4" />}>{isGenerated ? "Ver informe final" : "Generar informe final"}</Button>
              {!isGenerated && <Button variant="danger" icon={<AlertCircle className="h-4 w-4" />}>Marcar como observado</Button>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportPage({ go }: { go: (screen: Screen) => void }) {
  const item = cases[0];
  const sections = [
    ["Datos generales", `Caso ${item.id}. Aseguradora ${item.insurer}. Asegurado ${item.insured}. Póliza ${item.policyNumber}. Monto reclamado ${formatMoney(item.claimedAmount)}.`],
    ["Antecedentes del siniestro", item.description],
    ["Documentación revisada", "Se revisaron denuncia policial, documentos del chofer y unidad, guías de remisión y facturas vinculadas al traslado de mercadería."],
    ["Análisis del expediente", "La documentación permite identificar fecha, ubicación, unidad involucrada, mercadería transportada y valorización preliminar del reclamo."],
    ["Observaciones", "No se identifican documentos críticos pendientes para la emisión del informe preliminar. El contenido debe ser revisado por el ajustador responsable."],
    ["Conclusión", "Expediente apto para informe final sujeto a revisión del ajustador y validación de cobertura según condiciones de póliza."],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Informe Final</h1>
          <p className="mt-1 text-slate-500">Vista formal generada para presentación del expediente.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" icon={<Download className="h-4 w-4" />}>Descargar PDF</Button>
          <Button variant="secondary" icon={<Send className="h-4 w-4" />}>Enviar al ajustador</Button>
          <Button onClick={() => go("dashboard")}>Volver al dashboard</Button>
        </div>
      </div>

      <Card className="mx-auto max-w-5xl overflow-hidden">
        <div className="border-b border-amber-200 bg-amber-50 px-8 py-4 text-sm font-semibold text-amber-900">
          Informe generado automáticamente por el Asistente IA y sujeto a revisión del ajustador.
        </div>
        <article className="bg-white px-8 py-10 md:px-14">
          <div className="border-b border-slate-200 pb-8">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Ramo Transporte</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-950">Informe Final de Siniestro de Transporte</h2>
            <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
              <div><p className="font-semibold text-slate-500">Caso</p><p className="mt-1 font-bold text-slate-950">{item.id}</p></div>
              <div><p className="font-semibold text-slate-500">Ajustador</p><p className="mt-1 font-bold text-slate-950">{item.adjuster}</p></div>
              <div><p className="font-semibold text-slate-500">Fecha</p><p className="mt-1 font-bold text-slate-950">27 Jun 2026</p></div>
            </div>
          </div>
          <div className="mt-8 space-y-8">
            {sections.map(([title, content]) => (
              <section key={title}>
                <h3 className="text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{content}</p>
              </section>
            ))}
          </div>
          <div className="mt-12 grid gap-6 border-t border-slate-200 pt-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-500">Firma / revisión del ajustador</p>
              <div className="mt-10 border-t border-slate-300 pt-3 font-bold text-slate-900">Enrique Custodio · Ajustador</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="font-bold text-slate-950">Estado del informe</p>
              <p className="mt-2 text-sm text-slate-600">Generado automáticamente. Pendiente de validación final y aprobación interna.</p>
            </div>
          </div>
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

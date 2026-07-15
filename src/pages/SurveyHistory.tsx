import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Search, 
  History, 
  Trash2, 
  Calendar, 
  MapPin, 
  Filter,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "../lib/utils";

interface SurveyResponse {
  id: string;
  unique_code: string;
  survey_id: string;
  branch_id: string;
  branch_name: string;
  survey_title: string;
  surveyor_name: string;
  timestamp: string;
  nps_score: number;
  csat_score: number;
  cx_score: number;
  customer_comment: string | null;
}

export default function SurveyHistory() {
  const { user, fetchWithAuth } = useAuth();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedZone, setSelectedZone] = useState("all");
  const [branches, setBranches] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: searchTerm,
        branchId: selectedBranch,
        zoneId: selectedZone,
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      const res = await fetchWithAuth(`/api/responses-history?${queryParams}`);
      const result = await res.json();
      if (result && result.data) {
        setResponses(result.data);
        setTotalCount(result.total);
        setTotalPages(result.totalPages);
      } else {
        setResponses([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, searchTerm, selectedBranch, selectedZone, page, pageSize]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedBranch, selectedZone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Fetch branches and zones for filters
    fetchWithAuth("/api/branches").then(async res => {
      if (!res.ok) {
        const text = await res.text();
        console.error(`Fetch /api/branches failed (${res.status}):`, text.substring(0, 500));
        return [];
      }
      return res.json();
    }).then(data => {
      if (!Array.isArray(data)) {
        console.error("Branches data is not an array:", data);
        setBranches([]);
        return;
      }
      const role = (user?.role || "").toUpperCase();
      if (role === 'ADMINISTRADOR') {
        const allowedBranches = user?.branches || [];
        setBranches(data.filter((b: any) => allowedBranches.includes(b.id)));
      } else if (role === 'ZONAL') {
        const allowedZones = user?.zone_ids || [];
        setBranches(data.filter((b: any) => allowedZones.includes(b.zone_id)));
      } else {
        setBranches(data);
      }
    });

    fetchWithAuth("/api/zones").then(async res => {
      if (!res.ok) {
        const text = await res.text();
        console.error(`Fetch /api/zones failed (${res.status}):`, text.substring(0, 500));
        return [];
      }
      return res.json();
    }).then(data => {
      if (!Array.isArray(data)) {
        console.error("Zones data is not an array:", data);
        setZones([]);
        return;
      }
      const role = (user?.role || "").toUpperCase();
      if (role === 'ZONAL') {
        const allowedZones = user?.zone_ids || [];
        setZones(data.filter((z: any) => allowedZones.includes(z.id)));
      } else if (role === 'ADMINISTRADOR') {
        // Find zones for their branches
        const allowedBranches = user?.branches || [];
        fetchWithAuth("/api/branches").then(r => r.json()).then(brs => {
          if (!Array.isArray(brs)) return;
          const userBrs = brs.filter((b: any) => allowedBranches.includes(b.id));
          const userZoneIds = [...new Set(userBrs.map((b: any) => b.zone_id))];
          setZones(data.filter((z: any) => userZoneIds.includes(z.id)));
        });
      } else {
        setZones(data);
      }
    });
  }, [fetchData, fetchWithAuth, user]);

  const isManagement = ['CREATOR', 'CREADOR', 'ANALISTA'].includes((user?.role || "").toUpperCase());

  const handleDelete = async (id: string) => {
    if (!isManagement) {
      toast.error("No tienes permisos de gestión");
      return;
    }
    
    toast("¿Estás seguro de eliminar esta encuesta?", {
      description: "Esta acción borrará permanentemente los datos.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          setIsDeleting(id);
          try {
            const res = await fetchWithAuth(`/api/responses/${id}`, { method: 'DELETE' });
            if (res.ok) {
              toast.success("Encuesta eliminada correctamente");
              fetchData();
            } else {
              const err = await res.json();
              toast.error(err.error || "Error al eliminar");
            }
          } catch (e) {
            console.error("Delete error:", e);
            toast.error("Error de conexión al servidor");
          } finally {
            setIsDeleting(null);
          }
        }
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {}
      }
    });
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.25rem] bg-brand-blue flex items-center justify-center shadow-lg shadow-blue-200">
                <History className="w-6 h-6 text-white" />
             </div>
             <span className="text-brand-blue-light text-[10px] font-bold uppercase tracking-widest leading-none">Sistema de Trazabilidad</span>
          </div>
          <h1 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tight">
            {isManagement ? 'Gestión de' : 'Historial de'} <span className="text-brand-blue border-b-4 border-brand-accent pb-1">Encuestas</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm max-w-2xl leading-relaxed">
            {isManagement 
              ? 'Administra, busca y audita todas las encuestas registradas en la plataforma con control total sobre los registros.'
              : 'Consulta el historial de encuestas realizadas en tu sede o zona asignada.'
            }
          </p>
        </div>

        <button 
          onClick={fetchData}
          className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue transition-all shadow-sm group active:scale-95"
        >
          <RefreshCw className={cn("w-4 h-4 transition-transform group-hover:rotate-180 duration-500", loading && "animate-spin")} />
          Actualizar Listado
        </button>
      </header>

      {/* Filters Card */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-0 opacity-50 group-hover:bg-brand-blue/5 transition-colors duration-700"></div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Search */}
           <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Buscar por Código o Sede</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Ej: PURU-NPS-1..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white transition-all outline-none"
                />
              </div>
           </div>

           {/* Zone Filter */}
           <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Filtrar por Zona</label>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white transition-all outline-none"
                >
                  <option value="all">Todas las Zonas</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
           </div>

           {/* Branch Filter */}
           <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Filtrar por Sede</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white transition-all outline-none"
                >
                  <option value="all">Todas las Sedes</option>
                  {branches.filter(b => selectedZone === 'all' || b.zone_id === selectedZone).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
           </div>

           {/* Info Display */}
           <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black text-brand-blue uppercase tracking-widest mb-0.5">Total Registros</p>
                <p className="text-xl font-display font-black text-slate-800 leading-none">{totalCount}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden relative group">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Sede / Zona</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Encuesta</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                {isManagement && (
                  <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={isManagement ? 6 : 5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultando base de datos...</p>
                    </div>
                  </td>
                </tr>
              ) : responses.length === 0 ? (
                <tr>
                  <td colSpan={isManagement ? 6 : 5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Search className="w-12 h-12 text-slate-200" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No se encontraron registros para los filtros aplicados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                responses.map((r, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={r.id} 
                    className="hover:bg-slate-50/80 transition-colors group/row"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center font-mono text-[9px] font-black text-brand-blue">
                          {idx + 1}
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-900 group-hover/row:text-brand-blue transition-colors">
                          {r.unique_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{r.branch_name}</p>
                        <div className="flex items-center gap-1.5">
                           <MapPin className="w-3 h-3 text-slate-400" />
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                             {branches.find(b => b.id === r.branch_id)?.zone_name || 'Sin Zona'}
                           </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-md inline-block w-fit">
                          {r.survey_title}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase italic">
                          Por: {r.surveyor_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold">
                          {format(new Date(r.timestamp), "MMM dd, yyyy HH:mm", { locale: es })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={cn(
                        "inline-flex items-center justify-center w-12 h-12 rounded-2xl font-display font-black text-lg shadow-sm border",
                        r.cx_score >= 8.5 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : r.cx_score >= 6 
                            ? "bg-amber-50 text-amber-600 border-amber-100" 
                            : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {r.cx_score.toFixed(1)}
                      </div>
                    </td>
                    {isManagement && (
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDelete(r.id)}
                          disabled={isDeleting === r.id}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                        >
                          {isDeleting === r.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Mostrando <span className="text-slate-900">{(page - 1) * pageSize + 1}</span> a <span className="text-slate-900">{Math.min(page * pageSize, totalCount)}</span> de <span className="text-slate-900">{totalCount}</span> registros
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue disabled:opacity-50 transition-all shadow-sm"
              >
                Anterior
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  // Simple window logic for pagination
                  let pageNum = page;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all",
                        page === pageNum 
                          ? "bg-brand-blue text-white shadow-lg shadow-blue-200" 
                          : "bg-white border border-slate-200 text-slate-600 hover:border-brand-blue"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue disabled:opacity-50 transition-all shadow-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Disclosure Footer */}
      <footer className="flex items-center gap-4 bg-white/50 border border-slate-200 border-dashed rounded-2xl p-6">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Los registros eliminados son marcados como <span className="text-red-400">inválidos</span> en la base de datos de auditoría. Estos registros no serán contabilizados en los dashboards de rendimiento corporativo ni en las estadísticas del encuestador a partir del momento de su eliminación.
        </p>
      </footer>
    </div>
  );
}

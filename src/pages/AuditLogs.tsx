import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Database,
  Layout,
  RefreshCw,
  Clock,
  MapPin,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "RESTORE";
  resource_type: string;
  resource_id?: string;
  branch_id?: string;
  details?: string;
  metadata?: string;
  timestamp: string;
}

export default function AuditLogs() {
  const { user, fetchWithAuth } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [branches, setBranches] = useState<any[]>([]);

  const isCreator = user?.role?.toUpperCase() === 'CREATOR' || user?.role?.toUpperCase() === 'CREADOR';

  const [confirmStep, setConfirmStep] = useState<{id: string, step: number} | null>(null);

  const handleRestore = async (logId: string) => {
    console.log("Restoration requested for log:", logId);
    
    if (!logId) {
      alert("Error: ID de log no válido. Por favor refresca la página.");
      return;
    }

    if (confirmStep?.id !== logId || confirmStep?.step === 1) {
      setConfirmStep({ id: logId, step: 2 });
      return;
    }
    
    // Step 2 confirmed
    setRestoringId(logId);
    setConfirmStep(null);
    try {
      console.log("Sending POST to /api/audit/restore/" + logId);
      const res = await fetchWithAuth(`/api/audit/restore/${logId}`, {
        method: "POST"
      });
      const data = await res.json();
      console.log("Restoration response received:", res.status, data);
      
      if (res.ok) {
        alert("✅ Restauración exitosa: " + (data.message || "Datos recuperados"));
        fetchLogs();
      } else {
        alert("❌ Error al restaurar: " + (data.error || "Error desconocido"));
      }
    } catch (error: any) {
      console.error("Error restoring:", error);
      alert("❌ Error crítico al intentar restaurar: " + (error?.message || ""));
    } finally {
      setRestoringId(null);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      console.log("Fetching logs with diagnostic info...");
      const res = await fetchWithAuth("/api/audit-logs");
      const data = await res.json();
      console.log("Logs data received:", Array.isArray(data) ? data.length : "not an array");
      setLogs(Array.isArray(data) ? data : []);
      
      const bRes = await fetchWithAuth("/api/branches");
      const bData = await bRes.json();
      setBranches(Array.isArray(bData) ? bData : []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === "all" || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-emerald-500/10 text-emerald-600 border-emerald-200/50";
      case "DELETE": return "bg-rose-500/10 text-rose-600 border-rose-200/50";
      case "UPDATE": return "bg-blue-500/10 text-blue-600 border-blue-200/50";
      case "RESTORE": return "bg-amber-500/10 text-amber-600 border-amber-200/50";
      case "LOGIN": return "bg-slate-500/10 text-slate-600 border-slate-200/50";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200/50";
    }
  };

  const getBranchName = (id?: string) => {
    if (!id) return "N/A";
    const branch = branches.find(b => b.id === id);
    return branch ? branch.name : "Sede desconocida";
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-3xl bg-brand-blue flex items-center justify-center shadow-xl shadow-blue-900/20">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Auditoría del Sistema</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Registro permanente de acciones y cambios</p>
            </div>
          </div>
        </div>

        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-brand-blue hover:border-brand-blue/30 transition-all shadow-sm hover:shadow-xl disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Logs
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input 
              type="text" 
              placeholder="Buscar por usuario, recurso o detalle..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-slate-900 focus:outline-none focus:border-brand-blue/40 transition-all font-bold text-lg shadow-inner"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-10 py-5 font-bold text-slate-600 focus:outline-none appearance-none"
              >
                <option value="all">Todas las acciones</option>
                <option value="CREATE">Creaciones</option>
                <option value="UPDATE">Ediciones</option>
                <option value="DELETE">Eliminaciones</option>
                <option value="LOGIN">Inicios de sesión</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Usuario</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Acción</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Recurso / Sede</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Detalles</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-10">
                        <div className="h-8 bg-slate-50 rounded-xl" />
                      </td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron registros de auditoría</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-brand-blue group-hover:text-white transition-all">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none mb-1">{log.user_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {log.user_id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black border tracking-wider uppercase inline-block ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Database className="w-3.5 h-3.5 text-slate-300" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{log.resource_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                              {log.branch_id ? getBranchName(log.branch_id) : "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-start gap-2 max-w-sm">
                          <FileText className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                          <p className="text-xs font-medium text-slate-600 line-clamp-2">{log.details || "Sin detalles adicionales"}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                            <span className="text-xs">{format(new Date(log.timestamp), "dd MMM, yyyy", { locale: es })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase">{format(new Date(log.timestamp), "HH:mm:ss 'PE'")}</span>
                          </div>
                          
                          {isCreator && log.action === "DELETE" && 
                           (log.resource_type === "SURVEY" || log.resource_type === "SINGLE_RESPONSE") && 
                           log.metadata && !log.details?.toUpperCase().includes("REVERTID") && (
                            <div className="flex flex-col items-end gap-1">
                              <button
                                id={`restore-btn-${log.id}`}
                                onClick={() => handleRestore(log.id)}
                                onMouseLeave={() => {
                                  if (confirmStep?.id === log.id) setConfirmStep(null);
                                }}
                                disabled={restoringId === log.id}
                                className={`mt-2 flex items-center gap-2 px-4 py-2 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 ${
                                  confirmStep?.id === log.id 
                                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-900/20" 
                                    : "bg-brand-blue hover:bg-brand-blue-light shadow-blue-900/20"
                                }`}
                              >
                                {restoringId === log.id ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Procesando...
                                  </>
                                ) : confirmStep?.id === log.id ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-pulse" />
                                    ¿ESTÁS SEGURO? (CLIC OTRA VEZ)
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-3 h-3" />
                                    Revertir Acción
                                  </>
                                )}
                              </button>
                              {confirmStep?.id === log.id && (
                                <span className="text-[8px] font-bold text-rose-500 animate-pulse uppercase">
                                  Confirmación de seguridad requerida
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Mostrando {filteredLogs.length} de {logs.length} registros finales
          </p>
          <p className="text-[10px] font-black text-brand-blue-light uppercase tracking-[0.2em]">Cineplanet Audit Shield v1.0</p>
        </div>
      </div>
    </div>
  );
}

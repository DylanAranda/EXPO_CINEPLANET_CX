import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Filter,
  User,
  MapPin,
  FileText,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export default function Requests() {
  const { fetchWithAuth, user: currentUser } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    type: "MODIFY_USER",
    reason: "",
    details: {
      userId: "",
      username: "",
      action: "",
      responseId: "",
      code: ""
    }
  });

  const fetchRequests = async () => {
    try {
      const res = await fetchWithAuth("/api/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      if (res.ok) {
        fetchRequests();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          type: "MODIFY_USER",
          reason: "",
          details: { userId: "", username: "", action: "", responseId: "", code: "" }
        });
        fetchRequests();
        alert("Solicitud enviada correctamente para revisión del Creador o Analista.");
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Error de conexión: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => filter === "ALL" || r.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-blue w-8 h-8" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(252,209,22,0.5)]"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buzón de Operaciones</span>
          </div>
          <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Gestión de <span className="text-brand-blue border-b-4 border-brand-accent pb-1">Solicitudes</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs max-w-xl">
            Aprobación y rechazo de cambios operativos, eliminaciones de encuestas y registros de red.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-brand-nav text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/10 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4 text-brand-accent" />
                NUEVA SOLICITUD
            </button>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 shadow-inner border border-slate-200">
            {[
                { id: "PENDING", label: "Pendientes", icon: Clock },
                { id: "APPROVED", label: "Aprobadas", icon: Check },
                { id: "REJECTED", label: "Rechazadas", icon: X },
                { id: "ALL", label: "Todas", icon: Filter }
            ].map(f => (
                <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95",
                    filter === f.id 
                    ? "bg-white text-brand-blue shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
                >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
                </button>
            ))}
            </div>
        </div>
      </header>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredRequests.map((r) => (
            <motion.div
              layout
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl overflow-hidden relative group transition-all hover:shadow-2xl"
            >
              <div className={cn(
                "absolute top-0 left-0 w-2 h-full transition-all",
                r.status === 'PENDING' ? "bg-amber-400" :
                r.status === 'APPROVED' ? "bg-emerald-500" : "bg-red-500"
              )}></div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                        "px-4 py-1.5 rounded-lg border font-bold text-[9px] uppercase tracking-widest",
                        r.type === 'DELETE_RESPONSE' ? "bg-red-50 border-red-100 text-red-600" : "bg-slate-50 border-slate-100 text-slate-500"
                    )}>
                      {r.type.replace('_', ' ')}
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">{new Date(r.created_at).toLocaleString()}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight leading-none">
                      {r.type === 'DELETE_RESPONSE' ? 'Eliminación de Encuesta' : 
                       r.type === 'CREATE_USER' ? 'Creación de Usuario' :
                       r.type === 'DELETE_USER' ? 'Eliminación de Usuario' : 'Solicitud de Cambio'}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed italic border-l-4 border-slate-100 pl-4 py-1">
                      "{r.reason}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><User className="w-5 h-5" /></div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Solicitante</span>
                        <span className="text-xs font-bold text-slate-700">{r.requester_name}</span>
                      </div>
                    </div>
                    {r.details?.code && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><FileText className="w-5 h-5" /></div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Código Ref.</span>
                          <code className="text-xs font-mono font-bold text-brand-blue tracking-tighter uppercase">{r.details.code}</code>
                        </div>
                      </div>
                    )}
                    {r.details?.username && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><User className="w-5 h-5" /></div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Usuario Obj.</span>
                          <span className="text-xs font-bold text-slate-700">{r.details.username}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-row lg:flex-col gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-8 lg:pt-0 lg:pl-10">
                  {r.status === 'PENDING' ? (
                    <>
                      {(currentUser?.role === 'CREATOR' || currentUser?.role === 'ANALISTA') ? (
                        <>
                          <button 
                            disabled={isSubmitting}
                            onClick={() => handleAction(r.id, 'APPROVED')}
                            className="flex-1 lg:w-48 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            APROBAR SOLICITUD
                          </button>
                          <button 
                            disabled={isSubmitting}
                            onClick={() => handleAction(r.id, 'REJECTED')}
                            className="flex-1 lg:w-48 py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            RECHAZAR
                          </button>
                        </>
                      ) : (
                        <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-center lg:w-48">
                          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight block">En espera de autorización</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={cn(
                      "flex-1 lg:w-48 py-6 rounded-[2rem] border flex flex-col items-center justify-center gap-2 text-center",
                      r.status === 'APPROVED' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-red-600"
                    )}>
                      {r.status === 'APPROVED' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-black uppercase tracking-widest block">{r.status === 'APPROVED' ? 'EJECUTADO' : 'RECHAZADO'}</span>
                        <span className="text-[8px] font-bold opacity-60 uppercase tracking-[0.2em]">Cerrado el {new Date(r.updated_at || r.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {filteredRequests.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200"
            >
              <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-6 animate-pulse" />
              <p className="text-slate-300 font-bold uppercase text-lg tracking-widest italic">
                No se registran solicitudes {filter !== 'ALL' && filter.toLowerCase()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20">
                        <Plus className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-display font-black text-slate-900 uppercase italic">Nueva Solicitud</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-brand-red transition-colors">
                    <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Solicitud</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-blue/30"
                  >
                    <option value="CREATE_USER">CREACIÓN DE USUARIO</option>
                    <option value="DELETE_USER">ELIMINACIÓN DE USUARIO</option>
                    <option value="MODIFY_USER">MODIFICACIÓN DE USUARIO</option>
                    <option value="DELETE_RESPONSE">ELIMINACIÓN DE ENCUESTA</option>
                  </select>
                </div>

                {formData.type === 'DELETE_RESPONSE' ? (
                   <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Código de Encuesta (CP-XXXXXX)</label>
                    <input 
                      required
                      placeholder="Ej: CP-A1B2C3"
                      value={formData.details.code}
                      onChange={e => setFormData({...formData, details: {...formData.details, code: e.target.value}})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-blue/30"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Usuario Objetivo (DNI)</label>
                    <input 
                      required
                      placeholder="DNI del usuario"
                      value={formData.details.username}
                      onChange={e => setFormData({...formData, details: {...formData.details, username: e.target.value}})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-blue/30"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Motivo / Justificación</label>
                  <textarea 
                    required
                    placeholder="Explica el motivo de esta solicitud..."
                    rows={4}
                    value={formData.reason}
                    onChange={e => setFormData({...formData, reason: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-blue/30 resize-none"
                  />
                </div>

                <div className="pt-4">
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-brand-nav text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        {isSubmitting ? "ENVIANDO..." : "ENVIAR PARA REVISIÓN"}
                    </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

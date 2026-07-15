import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Target, 
  Info, 
  Activity,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { toast } from "sonner";

interface KpiConfig {
  id: string;
  name: string;
  description: string;
  formula: string;
  method: string;
  target: number;
}

export default function KpiManagement() {
  const { fetchWithAuth } = useAuth();
  const [kpis, setKpis] = useState<KpiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<KpiConfig>>({
    name: "",
    description: "",
    formula: "",
    method: "AVERAGE",
    target: 4.0
  });

  const fetchData = async () => {
    try {
      const res = await fetchWithAuth("/api/kpi-configs");
      if (res.ok) {
        const data = await res.json();
        setKpis(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return toast.error("El nombre del KPI es requerido");
    
    setIsSaving(true);
    try {
      const url = editingId ? `/api/kpi-configs/${editingId}` : "/api/kpi-configs";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: "", description: "", formula: "", method: "AVERAGE", target: 4.0 });
        toast.success(editingId ? "Indicador actualizado" : "Indicador creado");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({ error: "Error al guardar" }));
        toast.error(`Error: ${data.error}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Error de conexión: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      setTimeout(() => {
        setConfirmingDeleteId(prev => prev === id ? null : prev);
      }, 3000);
      return;
    }

    setDeletingId(id);
    setConfirmingDeleteId(null);
    try {
      const res = await fetchWithAuth(`/api/kpi-configs/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Indicador eliminado correctamente");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({ error: "Fallo al eliminar" }));
        toast.error(`Error: ${data.error}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Error al intentar eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-blue w-8 h-8" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(252,209,22,0.5)]"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gobernanza de Indicadores</span>
          </div>
          <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Configuración de <span className="text-brand-blue border-b-4 border-brand-accent pb-1">KPIs</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs max-w-xl">
            Define los estándares de medición y objetivos corporativos para la experiencia del cliente.
          </p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({ name: "", description: "", formula: "", method: "AVERAGE", target: 4.0 });
          }}
          className="px-8 py-4 bg-brand-nav text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/10 active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus className="w-5 h-5 text-brand-accent" /> 
          CREAR NUEVO KPI
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {kpis.map((k) => (
            <motion.div 
              layout
              key={k.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative group"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner group-hover:rotate-6 transition-transform">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingId(k.id);
                        setFormData(k);
                        setIsAdding(true);
                      }}
                      disabled={deletingId === k.id}
                      className="p-2 text-slate-300 hover:text-brand-blue transition-colors disabled:opacity-50"
                    >
                      <Activity className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(k.id)}
                      disabled={deletingId === k.id}
                      className={cn(
                        "p-2 transition-all rounded-lg flex items-center justify-center gap-1",
                        confirmingDeleteId === k.id 
                          ? "bg-red-500 text-white px-3 shadow-lg shadow-red-500/20" 
                          : "text-slate-300 hover:text-brand-red"
                      )}
                    >
                      {deletingId === k.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : confirmingDeleteId === k.id ? (
                        <span className="text-[8px] font-black uppercase tracking-tighter">¿CONFIRMAR?</span>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight italic">{k.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest line-clamp-2 leading-relaxed">
                    {k.description || "Sin descripción definida para este indicador corporativo."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Meta</span>
                    <span className="text-lg font-display font-black text-brand-blue italic">{k.target}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fórmula</span>
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight truncate">{k.method}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">CX INTERNAL ID: {k.id.slice(0, 8)}</span>
                <ChevronRight className="w-4 h-4 text-slate-200" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {kpis.length === 0 && !isAdding && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <Target className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-slate-300 font-bold uppercase text-lg tracking-widest italic">
              No se han definido indicadores corporativos
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden"
            >
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-3xl font-display font-black italic tracking-tight text-slate-900 uppercase">
                    {editingId ? 'Editar' : 'Nuevo'} <span className="text-brand-blue">Indicador</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocolo de medición CX</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Nombre del KPI</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-brand-blue transition-all shadow-inner"
                      placeholder="Ej: NPS Dulcería"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Meta (Target)</label>
                    <input 
                      type="number"
                      step="0.1"
                      required
                      value={formData.target}
                      onChange={e => setFormData({...formData, target: parseFloat(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-brand-blue transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Descripción Estratégica</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-brand-blue transition-all shadow-inner min-h-[100px]"
                    placeholder="¿Qué mide este indicador y por qué es importante?"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Método de Agregación</label>
                    <select 
                      value={formData.method}
                      onChange={e => setFormData({...formData, method: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:border-brand-blue transition-all shadow-inner appearance-none"
                    >
                      <option value="AVERAGE">PROMEDIO SIMPLE</option>
                      <option value="NPS">NET PROMOTER SCORE</option>
                      <option value="CSAT">SATISFACCIÓN (Top 2)</option>
                      <option value="PERCENTAGE">PORCENTAJE CUMPLIMIENTO</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Mapeo Ténico (Formula Key)</label>
                    <input 
                      value={formData.formula}
                      onChange={e => setFormData({...formData, formula: e.target.value.toUpperCase().replace(/\s/g, '_')})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-mono font-bold outline-none focus:border-brand-blue transition-all shadow-inner"
                      placeholder="KPI_CUSTOM_KEY"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" disabled={isSaving} onClick={() => setIsAdding(false)} className="flex-1 py-5 bg-white text-slate-500 border border-slate-200 rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-sm disabled:opacity-50">CANCELAR</button>
                  <button type="submit" disabled={isSaving} className="flex-[2] py-5 bg-brand-nav text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-xl shadow-brand-blue/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-brand-blue italic disabled:opacity-70">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 text-brand-accent" />} 
                    {isSaving ? 'GUARDANDO...' : (editingId ? 'ACTUALIZAR INDICADOR' : 'CONFIGURAR INDICADOR')}
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

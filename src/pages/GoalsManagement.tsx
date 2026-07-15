import { useState, useEffect } from "react";
import { 
  Target, 
  Plus, 
  Trash2, 
  Calendar, 
  MapPin, 
  Building2, 
  Search, 
  Loader2, 
  Edit2, 
  X, 
  Trophy,
  Activity,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface Goal {
  id: string;
  indicator: string;
  target: number;
  month: number;
  year: number;
  branch_id?: string;
  zone_id?: string;
  type: "ZONE" | "BRANCH";
}

interface Branch {
  id: string;
  name: string;
  zone_id?: string;
}

interface Zone {
  id: string;
  name: string;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const INDICATORS = [
  { id: "KPI_NPS", name: "NPS (Net Promoter Score)" },
  { id: "KPI_CSAT", name: "CSAT (Satisfacción)" },
  { id: "KPI_CX", name: "CX Score (Experiencia)" },
  { id: "KPI_DULCERIA", name: "Satisfacción Dulcería" },
  { id: "KPI_LIMPIEZA", name: "Satisfacción Limpieza" },
];

export default function GoalsManagement() {
  const { fetchWithAuth } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [formData, setFormData] = useState<Partial<Goal>>({
    indicator: "KPI_NPS",
    target: 50,
    month: currentMonth,
    year: currentYear,
    type: "BRANCH",
    branch_id: "",
    zone_id: ""
  });

  const [kpiConfigs, setKpiConfigs] = useState<any[]>([]);
  const fetchData = async () => {
    try {
      const [gRes, bRes, zRes, kRes] = await Promise.all([
        fetchWithAuth("/api/goals"),
        fetchWithAuth("/api/branches"),
        fetchWithAuth("/api/zones"),
        fetchWithAuth("/api/kpi-configs")
      ]);
      if (gRes.ok) setGoals(await gRes.json());
      if (bRes.ok) setBranches(await bRes.json());
      if (zRes.ok) setZones(await zRes.json());
      if (kRes.ok) setKpiConfigs(await kRes.json());
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const dynamicIndicators = [
    ...INDICATORS,
    ...kpiConfigs.map(k => ({ id: k.formula || k.id, name: k.name }))
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'BRANCH' && !formData.branch_id) return toast.error("Seleccione una sede");
    if (formData.type === 'ZONE' && !formData.zone_id) return toast.error("Seleccione una zona");

    setIsSaving(true);
    try {
      const url = editingId ? `/api/goals/${editingId}` : "/api/goals";
      const method = editingId ? "PUT" : "POST";
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsAdding(false);
        setEditingId(null);
        toast.success(editingId ? "Meta actualizada" : "Meta creada");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(`Error: ${err.error}`);
      }
    } catch (e) {
      toast.error("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta meta?")) return;
    try {
      const res = await fetchWithAuth(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Meta eliminada");
        fetchData();
      }
    } catch (e) {
      toast.error("Error al eliminar");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-blue w-8 h-8" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(252,209,22,0.5)]"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planificación Estratégica</span>
          </div>
          <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Gestión de <span className="text-brand-blue border-b-4 border-brand-accent pb-1">Metas Corporativas</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs max-w-xl">
            Establece objetivos mensuales por zona o sede para medir el desempeño de la experiencia Cineplanet.
          </p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({
              indicator: "KPI_NPS",
              target: 50,
              month: currentMonth,
              year: currentYear,
              type: "BRANCH",
              branch_id: "",
              zone_id: ""
            });
          }}
          className="px-8 py-4 bg-brand-nav text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/10 active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus className="w-5 h-5 text-brand-accent" /> 
          CONFIGURAR NUEVA META
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {goals.map((g) => {
            const branch = branches.find(b => b.id === g.branch_id);
            const zone = zones.find(z => z.id === g.zone_id);
            const indicator = dynamicIndicators.find(i => i.id === g.indicator);

            return (
              <motion.div 
                layout
                key={g.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/5 rounded-bl-[4rem] flex items-center justify-center">
                  <Target className="w-8 h-8 text-brand-blue/20" />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-accent" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {MONTHS[g.month - 1]} {g.year}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-display font-black text-slate-900 uppercase italic leading-tight">
                      {indicator?.name || g.indicator}
                    </h3>
                    <div className="flex items-center gap-2">
                      {g.type === 'BRANCH' ? <Building2 className="w-3 h-3 text-brand-blue" /> : <MapPin className="w-3 h-3 text-brand-blue" />}
                      <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">
                        {g.type === 'BRANCH' ? (branch?.name || 'Sede desconocida') : (zone?.name || 'Zona desconocida')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Meta Mensual</span>
                      <span className="text-3xl font-display font-black text-brand-nav italic">{g.target}%</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingId(g.id);
                          setFormData(g);
                          setIsAdding(true);
                        }}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-brand-blue hover:border-brand-blue transition-all flex items-center justify-center shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(g.id)}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-brand-red hover:border-brand-red transition-all flex items-center justify-center shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
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
                    {editingId ? 'Actualizar' : 'Configurar'} <span className="text-brand-blue">Meta</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planificación CX Cineplanet</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Mes</label>
                    <select 
                      value={formData.month} 
                      onChange={e => setFormData({...formData, month: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none appearance-none shadow-inner"
                    >
                      {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Año</label>
                    <input 
                      type="number" 
                      value={formData.year} 
                      onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Nivel de Aplicación</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: "BRANCH"})}
                      className={`py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 transition-all ${formData.type === 'BRANCH' ? 'bg-brand-blue/5 border-brand-blue text-brand-blue' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                    >
                      SEDE INDIVIDUAL
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: "ZONE"})}
                      className={`py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 transition-all ${formData.type === 'ZONE' ? 'bg-brand-blue/5 border-brand-blue text-brand-blue' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                    >
                      PROMEDIO ZONAL
                    </button>
                  </div>
                </div>

                {formData.type === 'BRANCH' ? (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Sede</label>
                    <select 
                      value={formData.branch_id} 
                      onChange={e => setFormData({...formData, branch_id: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none appearance-none shadow-inner"
                      required
                    >
                      <option value="">Seleccione sede...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Zona</label>
                    <select 
                      value={formData.zone_id} 
                      onChange={e => setFormData({...formData, zone_id: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none appearance-none shadow-inner"
                      required
                    >
                      <option value="">Seleccione zona...</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Indicador</label>
                    <select 
                      value={formData.indicator} 
                      onChange={e => setFormData({...formData, indicator: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none appearance-none shadow-inner"
                    >
                      {dynamicIndicators.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Meta (%)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={formData.target} 
                        onChange={e => setFormData({...formData, target: parseFloat(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none shadow-inner"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" disabled={isSaving} onClick={() => setIsAdding(false)} className="flex-1 py-5 bg-white text-slate-500 border border-slate-200 rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm">CANCELAR</button>
                  <button type="submit" disabled={isSaving} className="flex-[2] py-5 bg-brand-nav text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-xl shadow-brand-blue/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-brand-blue">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5 text-brand-accent" />} 
                    {isSaving ? 'GUARDANDO...' : (editingId ? 'ACTUALIZAR META' : 'ESTABLECER OBJETIVO')}
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

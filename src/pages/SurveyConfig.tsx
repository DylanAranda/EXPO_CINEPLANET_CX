import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Settings2, 
  MessageSquare, 
  Star, 
  Plus, 
  Trash2,
  Check,
  MapPin,
  ChevronRight,
  List,
  Type,
  Layout,
  X,
  Save,
  Loader2,
  Globe,
  ThumbsUp,
  ChevronUp,
  ChevronDown,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface Question {
  id: string;
  type: "rating" | "text" | "choice";
  label: string;
  required: boolean;
  scale_max?: 5 | 10;
  options?: string[]; // for choice
  indicator?: string;
  allowComment?: boolean;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  config: { questions: Question[] };
  branch_ids: string[];
}

export default function SurveyConfig() {
  const { token, user, fetchWithAuth } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [kpiConfigs, setKpiConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, step: number} | null>(null);

  const isCreator = user?.role?.toUpperCase() === 'CREATOR' || user?.role?.toUpperCase() === 'CREADOR';

  const fetchData = async () => {
    try {
      const [sRes, bRes, kRes] = await Promise.all([
        fetchWithAuth("/api/surveys"),
        fetchWithAuth("/api/branches"),
        fetchWithAuth("/api/kpi-configs")
      ]);
      
      if (sRes.ok && bRes.ok && kRes.ok) {
        setSurveys(await sRes.json());
        setBranches(await bRes.json());
        setKpiConfigs(await kRes.json());
      }
    } catch (e: any) {
      console.error("Error fetching survey config data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleCreate = async () => {
    const newSurvey = {
      title: "NUEVO FORMULARIO DE EXPERIENCIA",
      description: "Define el alcance y propósito de este canal de recolección.",
      config: { questions: [] },
      branch_ids: []
    };
    const res = await fetchWithAuth("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSurvey)
    });
    if (res.ok) fetchData();
  };

  const handleSave = async () => {
    if (!editingSurvey) return;
    const res = await fetchWithAuth(`/api/surveys/${editingSurvey.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingSurvey)
    });
    if (res.ok) {
      setEditingSurvey(null);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!isCreator) {
      alert("Solo el rol de Creador tiene permisos para eliminar formularios.");
      return;
    }

    if (!deleteConfirmation || deleteConfirmation.id !== id) {
      setDeleteConfirmation({ id, step: 1 });
      return;
    }

    if (deleteConfirmation.step === 1) {
      setDeleteConfirmation({ id, step: 2 });
      return;
    }

    // Step 2 confirmed
    const res = await fetchWithAuth(`/api/surveys/${id}`, {
      method: "DELETE"
    });
    
    if (res.ok) {
      setDeleteConfirmation(null);
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || "Error al eliminar el formulario");
      setDeleteConfirmation(null);
    }
  };

  const addQuestion = (type: Question["type"], scale_max?: 5 | 10) => {
    if (!editingSurvey) return;
    const newQ: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: "Nueva Interrogante",
      required: true,
      scale_max: type === "rating" ? (scale_max || 5) : undefined,
      options: type === "choice" ? ["Opción A", "Opción B"] : undefined
    };
    setEditingSurvey({
      ...editingSurvey,
      config: { ...editingSurvey.config, questions: [...editingSurvey.config.questions, newQ] }
    });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    if (!editingSurvey) return;
    setEditingSurvey({
      ...editingSurvey,
      config: {
        ...editingSurvey.config,
        questions: editingSurvey.config.questions.map(q => q.id === id ? { ...q, ...updates } : q)
      }
    });
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (!editingSurvey) return;
    const newQs = [...editingSurvey.config.questions];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newQs.length) return;
    [newQs[idx], newQs[targetIdx]] = [newQs[targetIdx], newQs[idx]];
    setEditingSurvey({
      ...editingSurvey,
      config: { ...editingSurvey.config, questions: newQs }
    });
  };

  const removeQuestion = (id: string) => {
    if (!editingSurvey) return;
    setEditingSurvey({
      ...editingSurvey,
      config: {
        ...editingSurvey.config,
        questions: editingSurvey.config.questions.filter(q => q.id !== id)
      }
    });
  };

  const toggleBranch = (id: string) => {
    if (!editingSurvey) return;
    const exists = editingSurvey.branch_ids.includes(id);
    setEditingSurvey({
      ...editingSurvey,
      branch_ids: exists 
        ? editingSurvey.branch_ids.filter(b => b !== id) 
        : [...editingSurvey.branch_ids, id]
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-blue w-8 h-8" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32">
      {!editingSurvey ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(252,209,22,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocolos CX Corporativos</span>
              </div>
              <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                Gestión de <span className="text-brand-blue border-b-4 border-brand-accent pb-1">Formularios</span>
              </h2>
              <p className="text-slate-500 font-medium text-xs max-w-xl">
                Diseño y personalización de canales de recolección de experiencia de cliente Cineplanet.
              </p>
            </div>
            <button 
              onClick={handleCreate}
              className="px-8 py-4 bg-brand-nav text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/10 active:scale-95 transition-all flex items-center gap-3"
            >
              <Plus className="w-5 h-5 text-brand-accent" /> 
              CREAR NUEVO FORMULARIO
            </button>
          </header>

          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {surveys.map((s, i) => (
                <motion.div 
                  layout
                  key={s.id}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl hover:shadow-2xl transition-all flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-[5rem] -mr-8 -mt-8 pointer-events-none"></div>
                  
                  <div className="w-16 h-16 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-lg relative z-10">
                    <Layout className="w-8 h-8" />
                  </div>
                  
                  <div className="flex-1 space-y-2 relative z-10">
                    <h4 className="text-2xl font-display font-black text-slate-900 uppercase italic tracking-tight leading-none group-hover:text-brand-blue transition-colors">
                      {s.title}
                    </h4>
                    <div className="flex items-center gap-4">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-brand-accent"></div>
                         {s.config.questions.length} INDICADORES
                       </span>
                       <span className="text-[9px] font-bold text-brand-blue uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-brand-blue/30"></div>
                         {s.branch_ids.length === 0 ? "DESPLIEGUE GLOBAL" : `${s.branch_ids.length} SEDES ASIGNADAS`}
                       </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10">
                     <button 
                       onClick={() => setEditingSurvey(s)}
                       className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue bg-slate-50 transition-all shadow-sm active:scale-95 italic"
                     >
                       REDISEÑAR INTERFAZ
                     </button>
                     
                     {isCreator && (
                       <div className="flex items-center gap-2">
                         <button 
                           onClick={() => handleDelete(s.id)}
                           className={cn(
                             "flex items-center gap-2 px-4 py-3 rounded-xl transition-all border",
                             deleteConfirmation?.id === s.id && deleteConfirmation.step === 1 
                               ? "bg-orange-50 border-orange-200 text-orange-600 animate-pulse" 
                               : deleteConfirmation?.id === s.id && deleteConfirmation.step === 2 
                                 ? "bg-red-600 border-red-700 text-white shadow-lg shadow-red-200" 
                                 : "text-slate-300 hover:text-brand-red border-transparent hover:border-brand-red/20"
                           )}
                         >
                           {deleteConfirmation?.id === s.id ? (
                             <>
                               {deleteConfirmation.step === 1 ? (
                                 <>
                                   <AlertTriangle className="w-4 h-4" />
                                   <span className="text-[10px] font-black italic uppercase">¿CONFIRMAR?</span>
                                 </>
                               ) : (
                                 <>
                                   <Trash2 className="w-4 h-4" />
                                   <span className="text-[10px] font-black italic uppercase underline decoration-2">¡ELIMINAR TODO!</span>
                                 </>
                               )}
                             </>
                           ) : (
                             <Trash2 className="w-5 h-5" />
                           )}
                         </button>
                         
                         {deleteConfirmation?.id === s.id && (
                           <button 
                             onClick={() => setDeleteConfirmation(null)}
                             className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-slate-100 rounded-xl border border-slate-200"
                           >
                             <X className="w-4 h-4" />
                           </button>
                         )}
                       </div>
                     )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {surveys.length === 0 && (
              <div className="py-32 text-center bg-white rounded-[3rem] border-dashed border-2 border-slate-200">
                <Layout className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-300 font-bold uppercase text-lg tracking-widest italic animate-pulse">
                  No se han registrado modelos de encuesta
                </p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-12">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-12">
                <div className="space-y-4 flex-1">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(252,209,22,0.5)]"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entorno de Diseño CX</span>
                   </div>
                   <input 
                      value={editingSurvey.title} 
                      onChange={e => setEditingSurvey({...editingSurvey, title: e.target.value})}
                      className="bg-transparent text-4xl font-display font-black italic tracking-tighter uppercase outline-none text-slate-900 border-none w-full p-0 leading-none"
                      placeholder="Título de la Encuesta"
                   />
                   <input 
                      value={editingSurvey.description} 
                      onChange={e => setEditingSurvey({...editingSurvey, description: e.target.value})}
                      className="bg-transparent text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] outline-none w-full border-none p-0"
                      placeholder="Descripción del contexto de datos..."
                   />
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setEditingSurvey(null)} className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">DESCARTAR</button>
                  <button 
                    onClick={handleSave} 
                    className="bg-brand-nav text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-brand-blue/10 active:scale-95"
                  >
                    <Save className="w-5 h-5 text-brand-accent" /> GUARDAR LOGICA
                  </button>
                </div>
             </header>

             <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                   <div className="w-8 h-[2px] bg-brand-blue"></div>
                   <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Flujo de Interrogación</h4>
                </div>
                
                <div className="space-y-6">
                  <AnimatePresence mode="popLayout">
                    {editingSurvey.config.questions.map((q, idx) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={q.id} 
                        className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl group hover:border-brand-blue/20 transition-all relative"
                      >
                         <div className="absolute -left-4 top-10 w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center font-display font-black text-lg italic shadow-lg">
                           {idx + 1}
                         </div>

                         <div className="space-y-8">
                            <div className="flex items-center justify-between gap-6">
                               <div className="flex-1 space-y-2">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">Etiqueta del Indicador</label>
                                  <input 
                                      value={q.label}
                                      onChange={e => updateQuestion(q.id, { label: e.target.value })}
                                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold text-lg focus:outline-none focus:border-brand-blue/30 shadow-inner"
                                      placeholder="Definir pregunta..."
                                  />
                               </div>
                               <div className="w-48 space-y-2">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">Tipología</label>
                                  <select 
                                    value={q.type}
                                    onChange={(e) => updateQuestion(q.id, { type: e.target.value as any })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest appearance-none cursor-pointer outline-none shadow-sm"
                                  >
                                    <option value="rating">VALORACIÓN</option>
                                    <option value="choice">SELECCIÓN</option>
                                    <option value="text">ABIERTA</option>
                                  </select>
                               </div>
                            </div>

                            {q.type === 'rating' && (
                               <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-6 shadow-inner">
                                  <div className="grid grid-cols-2 gap-8">
                                     <div className="space-y-3">
                                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Escala de Respuesta</label>
                                       <div className="flex gap-2">
                                         {[5, 10].map(s => (
                                           <button 
                                             key={s}
                                             onClick={() => updateQuestion(q.id, { scale_max: s as 5 | 10 })}
                                             className={cn(
                                               "flex-1 py-3 rounded-xl font-bold text-xs border transition-all",
                                               q.scale_max === s ? "bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20" : "bg-white text-slate-500 border-slate-200 hover:text-slate-700"
                                             )}
                                           >
                                             1 - {s}
                                           </button>
                                         ))}
                                       </div>
                                     </div>
                                     <div className="space-y-3">
                                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mapeo KPI Corporativo</label>
                                       <select
                                          value={q.indicator || ""}
                                          onChange={e => updateQuestion(q.id, { indicator: e.target.value as any || undefined })}
                                          className="w-full py-3.5 bg-white border border-slate-200 rounded-xl px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest outline-none shadow-sm"
                                       >
                                          <option value="">SIN VÍNCULO</option>
                                          {kpiConfigs.map(k => (
                                            <option key={k.id} value={k.formula || k.name}>
                                              {k.name}
                                            </option>
                                          ))}
                                       </select>
                                     </div>
                                  </div>
                               </div>
                            )}

                            {q.type === 'choice' && (
                              <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4 shadow-inner">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Opciones Sugeridas</label>
                                <div className="space-y-3">
                                  {q.options?.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent"></div>
                                      <input 
                                        value={opt}
                                        onChange={e => {
                                          const newOpts = [...(q.options || [])];
                                          newOpts[optIdx] = e.target.value;
                                          updateQuestion(q.id, { options: newOpts });
                                        }}
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none w-full focus:border-brand-blue shadow-sm"
                                      />
                                      <button onClick={() => updateQuestion(q.id, { options: q.options?.filter((_, i) => i !== optIdx) })} className="text-slate-300 hover:text-brand-red p-1"><X className="w-4 h-4" /></button>
                                    </div>
                                  ))}
                                  <button 
                                    onClick={() => updateQuestion(q.id, { options: [...(q.options || []), "NUEVA OPCIÓN"] })}
                                    className="text-[10px] font-bold text-brand-blue uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all mt-4"
                                  >
                                    <Plus className="w-4 h-4" /> AÑADIR ALTERNATIVA
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                               <div className="flex items-center gap-8">
                                  <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                      type="checkbox" 
                                      checked={q.required} 
                                      onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                                      className="sr-only"
                                    />
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all", q.required ? "bg-brand-success border-brand-success text-white" : "border-slate-200 text-slate-200")}>
                                      <Check className={cn("w-5 h-5", q.required ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Mandatorio</span>
                                  </label>

                                  <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                      type="checkbox" 
                                      checked={q.allowComment} 
                                      onChange={e => updateQuestion(q.id, { allowComment: e.target.checked })}
                                      className="sr-only"
                                    />
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all", q.allowComment ? "bg-brand-blue border-brand-blue text-white" : "border-slate-200 text-slate-200")}>
                                      <MessageSquare className={cn("w-5 h-5", q.allowComment ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Feedback Libre</span>
                                  </label>
                               </div>

                               <div className="flex items-center gap-2">
                                  <div className="flex flex-col gap-1 mr-4">
                                     <button onClick={() => moveQuestion(idx, 'up')} className="p-1.5 text-slate-300 hover:text-brand-blue disabled:opacity-0" disabled={idx === 0}><ChevronUp className="w-5 h-5" /></button>
                                     <button onClick={() => moveQuestion(idx, 'down')} className="p-1.5 text-slate-300 hover:text-brand-blue disabled:opacity-0" disabled={idx === editingSurvey.config.questions.length - 1}><ChevronDown className="w-5 h-5" /></button>
                                  </div>
                                  <button 
                                    onClick={() => removeQuestion(q.id)}
                                    className="p-4 bg-slate-50 text-slate-300 hover:text-brand-red rounded-2xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {editingSurvey.config.questions.length === 0 && (
                    <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
                      <Layout className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                      <p className="text-slate-400 font-bold uppercase text-sm tracking-widest">
                        Inserte componentes desde el panel de herramientas
                      </p>
                    </div>
                  )}
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
             <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl space-y-8 sticky top-8">
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-[2px] bg-brand-accent"></div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Caja de Herramientas</h4>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'rating', label: 'Escala 1-5', icon: Star, scale: 5, color: 'text-brand-accent' },
                        { id: 'rating', label: 'Escala 1-10', icon: ThumbsUp, scale: 10, color: 'text-brand-accent' },
                        { id: 'text', label: 'Texto Abierto', icon: Type, color: 'text-brand-blue' },
                        { id: 'choice', label: 'Multiopción', icon: List, color: 'text-brand-success' }
                      ].map((tool, tIdx) => (
                        <button 
                          key={tIdx}
                          onClick={() => addQuestion(tool.id as any, tool.scale as any)}
                          className="w-full flex items-center gap-5 p-5 bg-slate-50 border border-slate-100 hover:bg-white hover:border-brand-blue hover:shadow-xl rounded-2xl transition-all group active:scale-95"
                        >
                          <div className={cn("w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform", tool.color)}>
                            <tool.icon className="w-6 h-6" />
                          </div>
                          <div className="text-left font-bold text-[11px] uppercase tracking-widest text-slate-700">
                             {tool.label}
                          </div>
                          <Plus className="ml-auto w-4 h-4 text-slate-300 group-hover:text-brand-blue" />
                        </button>
                      ))}
                   </div>
                </div>

                <div className="pt-8 border-t border-slate-100 space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-[2px] bg-brand-accent"></div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Asignación de Red</h4>
                   </div>
                   
                   <div className="space-y-4">
                      <button 
                        onClick={() => setEditingSurvey({...editingSurvey, branch_ids: []})}
                        className={cn(
                          "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all",
                          editingSurvey.branch_ids.length === 0 ? "border-brand-blue bg-brand-blue/5 text-brand-blue" : "border-slate-100 bg-slate-50 text-slate-400"
                        )}
                      >
                        <Globe className="w-6 h-6" />
                        <span className="font-bold text-[11px] uppercase tracking-widest">DESPLIEGUE OMNICANAL</span>
                      </button>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                         {branches.map(b => (
                           <button 
                             key={b.id}
                             onClick={() => toggleBranch(b.id)}
                             className={cn(
                               "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                               editingSurvey.branch_ids.includes(b.id) 
                                 ? "bg-white border-brand-accent shadow-md text-slate-900" 
                                 : "bg-slate-50/50 border-slate-100 text-slate-400 grayscale"
                             )}
                           >
                             <div className={cn("w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center", editingSurvey.branch_ids.includes(b.id) ? "bg-brand-accent border-brand-accent" : "border-slate-200")}>
                                {editingSurvey.branch_ids.includes(b.id) && <Check className="w-4 h-4 text-white stroke-[3px]" />}
                             </div>
                             <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-[10px] uppercase tracking-tight">{b.name}</span>
                                <span className="text-[8px] font-medium text-slate-400">{b.location}</span>
                             </div>
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}


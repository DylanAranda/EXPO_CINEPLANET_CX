import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  CheckCircle2, 
  MapPin, 
  ClipboardList, 
  Star, 
  ThumbsUp, 
  Zap,
  Send,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export default function Surveyor() {
  const { token, user, fetchWithAuth } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  
  const [step, setStep] = useState(0); // 0: Select Branch/Survey, 1: Form, 2: Success
  const [scores, setScores] = useState({ nps: 10, csat: 5, ces: 5 });
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [questionComments, setQuestionComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSurvey) {
      const initialAnswers: Record<string, any> = {};
      selectedSurvey.config.questions.forEach((q: any) => {
        initialAnswers[q.id] = q.type === 'rating' ? (q.scale_max === 10 ? 10 : 5) : "";
      });
      setAnswers(initialAnswers);
    }
  }, [selectedSurvey]);

  const fetchData = async () => {
    try {
      const bRes = await fetchWithAuth("/api/branches");
      const sRes = await fetchWithAuth("/api/surveys");
      
      if (!bRes.ok) {
        if (bRes.status === 401) return;
        const err = await bRes.json().catch(() => ({ error: bRes.statusText }));
        throw new Error(`Sedes: ${err.error || bRes.status}`);
      }
      if (!sRes.ok) {
        const err = await sRes.json().catch(() => ({ error: sRes.statusText }));
        throw new Error(`Encuestas: ${err.error || sRes.status}`);
      }

      const bData = await bRes.json();
      const sData = await sRes.json();
      
      // Ensure data are arrays
      const safeBData = Array.isArray(bData) ? bData : [];
      const safeSData = Array.isArray(sData) ? sData : [];

      // Filter branches if user is restricted
      const userBranches = user?.branches || [];
      const role = (user?.role || '').toUpperCase();
      let finalBranches = [];
      if (!['CREATOR', 'CREADOR', 'ANALISTA'].includes(role)) {
        finalBranches = safeBData.filter((b: any) => userBranches.includes(b.id));
      } else {
        finalBranches = safeBData;
      }
      
      setBranches(finalBranches);
      if (finalBranches.length === 1) {
        setSelectedBranch(finalBranches[0].id);
      }
      
      setSurveys(safeSData);
    } catch (e: any) {
      console.error("Error fetching surveyor data:", e);
      alert(`ERR_PROTOCOL_TRANSCEIVER: ${e.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, user]);

  const handleSubmit = async () => {
    setLoading(true);
    
    // Auto-calculate metrics for legacy analytics if possible
    const ratingQuestions = selectedSurvey.config.questions.filter((q: any) => q.type === 'rating');
    const npsQ = ratingQuestions.find((q: any) => q.scale_max === 10);
    const otherRatings = ratingQuestions.filter((q: any) => q.scale_max === 5);
    
    const finalScores = {
      nps: npsQ ? answers[npsQ.id] : 10,
      csat: otherRatings.length > 0 ? answers[otherRatings[0].id] : 5,
      ces: otherRatings.length > 1 ? answers[otherRatings[1].id] : 5
    };

    // Find the first text answer correctly or the longest string
    const firstTextQuestion = selectedSurvey.config.questions.find((q: any) => q.type === 'text');
    const firstTextAnswer = firstTextQuestion ? answers[firstTextQuestion.id] : "";
    const generalComment = firstTextAnswer || Object.values(answers).find(v => typeof v === 'string' && v.length > 5) || "";

    try {
      const res = await fetchWithAuth("/api/responses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          survey_id: selectedSurvey.id,
          branch_id: selectedBranch,
          scores: finalScores,
          comment: generalComment,
          answers,
          questionComments
        })
      });
      if (res.ok) setStep(2);
      else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      alert("Error al enviar encuesta");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="step0"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-brand-blue/5 border border-brand-blue/10 rounded-3xl flex items-center justify-center text-brand-blue shadow-xl">
                  <ClipboardList className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-4xl font-display font-black text-slate-900 italic tracking-tighter uppercase">FORMULARIOS CX</h2>
              <p className="tech-label tracking-[0.3em]">Configuración de Recolección de Datos</p>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-10 relative overflow-hidden">
              {branches.length === 0 && user?.role !== 'CREATOR' && user?.role !== 'ANALISTA' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>No tienes sedes asignadas para este protocolo. Contacta al Creador.</span>
                </div>
              )}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Selección de Sede</label>
                <div className="relative group">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
                  <select 
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue/40 text-slate-900 font-bold text-lg appearance-none cursor-pointer transition-all"
                  >
                    <option value="" className="bg-white">-- Seleccionar Sede --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id} className="bg-white">{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Encuesta a Realizar</label>
                <div className="grid grid-cols-1 gap-4">
                  {surveys.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSurvey(s)}
                      className={cn(
                        "p-6 rounded-2xl border transition-all text-left flex items-center justify-between group active:scale-[0.98]",
                        selectedSurvey?.id === s.id 
                          ? "bg-brand-blue border-brand-blue shadow-xl shadow-brand-blue/20" 
                          : "bg-slate-50 border-slate-200 hover:border-brand-blue/30"
                      )}
                    >
                      <div className="space-y-1">
                        <h4 className={cn("font-bold text-lg uppercase tracking-tight transition-colors", selectedSurvey?.id === s.id ? "text-white" : "text-brand-nav")}>{s.title}</h4>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest leading-loose", selectedSurvey?.id === s.id ? "text-blue-100" : "text-slate-500")}>{s.description}</p>
                      </div>
                      <div className={cn(
                        "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all",
                        selectedSurvey?.id === s.id ? "bg-white/20 border-white/20" : "bg-white border-slate-200"
                      )}>
                         {selectedSurvey?.id === s.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!selectedBranch || !selectedSurvey}
                onClick={() => setStep(1)}
                className="w-full py-5 bg-brand-accent text-brand-nav rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-accent/20 hover:bg-brand-nav hover:text-white transition-all active:scale-95 disabled:opacity-30"
              >
                EMPEZAR ENCUESTA
              </button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setStep(0)}
                className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand-blue hover:border-brand-blue transition-all active:scale-90 shadow-sm"
              >
                <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="text-right">
                <h3 className="font-display font-black text-brand-nav italic uppercase text-2xl tracking-tight">{selectedSurvey?.title}</h3>
                <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">{branches.find(b => b.id === selectedBranch)?.name}</span>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl space-y-12 relative overflow-hidden">
               {selectedSurvey?.config.questions.map((q: any, idx: number) => (
                 <div key={q.id} className="space-y-8">
                   <div className="flex items-center gap-4">
                     <div className={cn(
                       "w-10 h-10 rounded-xl flex items-center justify-center font-black italic",
                       q.type === 'rating' ? "bg-brand-blue text-white" : "bg-slate-100 text-brand-nav"
                     )}>
                       {idx + 1}
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{q.type.toUpperCase()}_PROTOCOL</span>
                       <span className="font-bold text-slate-900 text-lg tracking-tight uppercase">{q.label}</span>
                     </div>
                   </div>

                   {q.type === 'rating' && (
                     <div className="space-y-4">
                        {q.scale_max === 5 ? (
                          <div className="flex gap-3">
                             {[1,2,3,4,5].map(v => (
                               <button
                                 key={v}
                                 onClick={() => setAnswers({...answers, [q.id]: v})}
                                 className={cn(
                                   "flex-1 h-20 rounded-2xl font-black text-2xl transition-all border shadow-md active:scale-95",
                                   answers[q.id] === v 
                                     ? "bg-brand-blue border-brand-blue text-white scale-105 z-10 shadow-lg shadow-brand-blue/20" 
                                     : "bg-slate-50 border-slate-100 text-slate-400 hover:border-brand-blue/30 hover:text-brand-blue"
                                 )}
                               >
                                 {v}
                               </button>
                             ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-10 gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                            {[1,2,3,4,5,6,7,8,9,10].map(v => (
                              <button
                                key={v}
                                onClick={() => setAnswers({...answers, [q.id]: v})}
                                className={cn(
                                  "h-12 rounded-xl font-bold text-sm transition-all border active:scale-95 flex items-center justify-center",
                                  answers[q.id] === v 
                                    ? "bg-brand-blue text-white border-brand-blue scale-110 shadow-lg shadow-brand-blue/20" 
                                    : "bg-white border-slate-200 text-slate-400 hover:text-brand-blue"
                                )}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] font-bold text-slate-300 px-2 uppercase tracking-widest">
                          <span>Mínima</span>
                          <span>Máxima</span>
                        </div>
                     </div>
                   )}

                   {q.type === 'text' && (
                     <textarea
                       value={answers[q.id] || ""}
                       onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                       placeholder="Escriba aquí la respuesta detallada..."
                       className="w-full h-32 p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue/40 text-slate-900 font-bold placeholder:text-slate-300 transition-all resize-none shadow-inner"
                     />
                   )}

                   {q.type === 'choice' && (
                     <div className="grid grid-cols-1 gap-3">
                        {q.options?.map((opt: string) => (
                          <button
                            key={opt}
                            onClick={() => setAnswers({...answers, [q.id]: opt})}
                            className={cn(
                              "p-5 rounded-2xl border transition-all text-left font-bold text-xs uppercase tracking-widest flex items-center justify-between group active:scale-[0.98]",
                              answers[q.id] === opt 
                                ? "bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20" 
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-brand-blue/30"
                            )}
                          >
                            {opt}
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                              answers[q.id] === opt ? "bg-white border-white" : "border-slate-300"
                            )} >
                              {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-brand-blue"></div>}
                            </div>
                          </button>
                        ))}
                     </div>
                   )}
                 {q.allowComment && (
                    <div className="mt-4 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Comentario adicional</label>
                      <textarea
                        value={questionComments[q.id] || ""}
                        onChange={(e) => setQuestionComments({...questionComments, [q.id]: e.target.value})}
                        placeholder="Observaciones..."
                        className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-blue/40 text-slate-900 text-xs font-bold transition-all resize-none shadow-inner"
                      />
                    </div>
                  )}
                </div>
               ))}

              <button
                onClick={handleSubmit}
                disabled={loading || selectedSurvey?.config.questions.some((q:any) => q.required && !answers[q.id])}
                className="w-full py-6 bg-brand-blue text-white rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-brand-nav transition-all active:scale-95 shadow-xl shadow-brand-blue/20 disabled:opacity-30"
              >
                {loading ? (
                    <div className="flex gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.4s]"></div>
                    </div>
                ) : (
                    <>
                        <Send className="w-6 h-6" /> 
                        ENVIAR ENCUESTA
                    </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 space-y-12"
          >
            <div className="relative inline-block">
              <motion.div 
                initial={{ rotateY: 180, scale: 0 }} 
                animate={{ rotateY: 0, scale: 1 }} 
                transition={{ type: 'spring', damping: 10, duration: 1 }}
                className="w-44 h-44 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)] border-8 border-white relative z-10"
              >
                <CheckCircle2 className="text-white w-24 h-24" />
              </motion.div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-100/50 rounded-full animate-ping opacity-20"></div>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <span className="tech-label tracking-[0.5em] text-emerald-600">TRANSACCIÓN COMPLETA</span>
                <h1 className="text-6xl font-display font-black tracking-tighter text-slate-900 italic uppercase leading-none">REGISTRO EXITOSO</h1>
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest max-w-sm mx-auto leading-loose p-6 bg-slate-50 rounded-2xl border border-slate-100">
                Los datos recolectados en <span className="text-brand-blue">{branches.find(b => b.id === selectedBranch)?.name}</span> han sido sincronizados con el núcleo de inteligencia corporativa en tiempo real.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={reset}
                className="group relative px-16 py-7 bg-brand-nav text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] hover:bg-brand-blue transition-all shadow-2xl active:scale-95 overflow-hidden"
              >
                <span className="relative z-10">INICIAR NUEVA ENCUESTA</span>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-brand-accent opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </button>
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest animate-pulse">Esperando siguiente cliente...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

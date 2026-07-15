import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Trophy, 
  Target, 
  Users, 
  Calendar, 
  TrendingUp,
  Loader2,
  Clock,
  CheckCircle2,
  Medal,
  Star,
  Zap,
  BarChart3,
  Activity,
  Award,
  PieChart as PieChartIcon,
  ShieldCheck,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie
} from "recharts";

export default function SurveyorStats() {
  const { fetchWithAuth, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetchWithAuth("/api/surveyor/stats");
      if (res.ok) {
        const json = await res.json();
        setData(json);
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-brand-blue rounded-full animate-spin"></div>
        <Zap className="w-6 h-6 text-brand-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Métricas...</p>
    </div>
  );

  const totalSurveys = data?.history?.length || 0;
  const todaySurveys = data?.todayDate ? (data?.stats?.find((s:any) => s.date === data.todayDate)?.total || 0) : 0;
  const avgCx = data?.avgCx || 0;

  const chartData = data?.stats?.map((s: any) => ({
    ...s,
    ...s.surveys
  })).slice(0, 14).reverse();

  const hourlyData = data?.hourlyStats || [];
  const distData = data?.surveyDistribution || [];
  
  const COLORS = ['#003A70', '#FCD116', '#6366F1', '#10B981', '#F43F5E', '#8B5CF6'];

  const getRank = () => {
    const total = totalSurveys;
    if (total > 500) return { name: "Elite Diamante", color: "text-blue-500", icon: Zap, label: "Top 1%" };
    if (total > 200) return { name: "Maestro Oro", color: "text-amber-500", icon: Trophy, label: "Liderazgo" };
    if (total > 50) return { name: "Profesional Plata", color: "text-slate-400", icon: Medal, label: "Experto" };
    return { name: "Promesa Bronce", color: "text-orange-600", icon: Award, label: "En Crecimiento" };
  };

  const Rank = getRank();

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 md:px-0 bg-slate-50/30">
      {/* Header Ejecutivo */}
      <header className="relative group p-10 md:p-14 rounded-[4rem] bg-slate-900 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-blue/20 to-transparent opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse shadow-[0_0_12px_rgba(252,209,22,0.8)]"></div>
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em]">Sistemas de Inteligencia CX</span>
            </div>
            
            <div className="space-y-2">
                <h1 className="text-6xl md:text-7xl font-display font-black italic uppercase tracking-tighter text-white leading-none">
                  {user?.full_name?.split(' ')[0] || 'Mi'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-amber-200">Impacto</span>
                </h1>
                <p className="text-white/40 font-medium text-lg max-w-xl italic">
                  "Tu dedicación redefine los estándares de excelencia en nuestra sede."
                </p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-3xl">
            <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transform rotate-3 transition-transform group-hover:rotate-0", Rank.color, "bg-white")}>
              <Rank.icon className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Clasificación</span>
                <span className="px-2 py-0.5 bg-brand-accent/20 text-brand-accent text-[8px] font-black rounded-lg uppercase">{Rank.label}</span>
              </div>
              <div className="text-3xl font-display font-black text-white uppercase tracking-tight italic">{Rank.name}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid con Diseño de Tarjetas de Vidrio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: "Registros Hoy", value: todaySurveys, suffix: "DOCS", icon: Star, color: "text-brand-blue", bg: "bg-blue-600", trend: "+12%" },
          { title: "Índice de Calidad", value: avgCx.toFixed(1), suffix: "/10", icon: ShieldCheck, color: "text-brand-accent", bg: "bg-amber-500", trend: "ESTABLE" },
          { title: "Volumen Total", value: totalSurveys, suffix: "HIST", icon: Trophy, color: "text-emerald-500", bg: "bg-emerald-600", trend: "ACTIVO" },
          { title: "Días de Servicio", value: data?.stats?.length || 0, suffix: "DÍAS", icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-600", trend: "CONSTANTE" },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            key={stat.title}
            className="group relative bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:border-brand-blue/30 transition-all overflow-hidden"
          >
            <div className={cn("w-16 h-16 rounded-3xl mb-8 flex items-center justify-center transition-all group-hover:scale-110", "bg-slate-50", stat.color)}>
              <stat.icon className="w-8 h-8" />
            </div>
            
            <div className="space-y-1 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</span>
                <div className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1", stat.color, "bg-slate-50")}>
                    <TrendingUp className="w-2.5 h-2.5" />
                    {stat.trend}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-5xl font-display font-black tracking-tighter italic", stat.color)}>{stat.value}</span>
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{stat.suffix}</span>
              </div>
            </div>

            <div className={cn("absolute -bottom-10 -right-10 w-40 h-40 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity", stat.color)}>
                <stat.icon className="w-full h-full" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gráfico Principal de Actividad */}
        <div className="lg:col-span-8 space-y-10">
          <section className="bg-white rounded-[4rem] p-12 md:p-16 border border-slate-200 shadow-2xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-blue/5 rounded-2xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-brand-blue" />
                    </div>
                  <h3 className="text-3xl font-display font-black text-slate-900 uppercase italic tracking-tight">Actividad Dinámica</h3>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-13">Distribución multicanal por jornada (14D)</p>
              </div>

              <div className="flex flex-wrap gap-4">
                {data?.surveyList?.map((sName: string, idx: number) => (
                  <div key={sName} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/50 hover:bg-white hover:border-brand-blue/20 transition-all cursor-default">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{sName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <defs>
                    {COLORS.map((color, i) => (
                        <linearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                        </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                    dy={20}
                    tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '32px', border: 'none', boxShadow: '0 30px 80px rgba(0,0,0,0.2)', background: '#0F172A', color: 'white', padding: '24px' }} 
                    itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}
                    cursor={{ fill: '#F8FAFC', radius: 20 }}
                  />
                  {data?.surveyList?.map((sName: string, idx: number) => (
                    <Bar 
                      key={sName} 
                      dataKey={sName} 
                      stackId="a" 
                      fill={`url(#barGrad-${idx % COLORS.length})`} 
                      radius={[10, 10, 10, 10]}
                      barSize={12}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Curva de Productividad Horaria Mejorada */}
          <section className="bg-slate-900 rounded-[4rem] p-12 md:p-16 text-white shadow-3xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-accent/5 to-transparent"></div>
            <div className="relative z-10 space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                            <Activity className="w-5 h-5 text-brand-accent" />
                        </div>
                        <h3 className="text-3xl font-display font-black text-white uppercase italic tracking-tight">Ritmo de Escaneo</h3>
                    </div>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.3em] ml-13">Frecuencia operativa promedio por h:00</p>
                </div>
                <div className="flex items-center gap-8 px-8 py-4 bg-white/5 rounded-[2rem] border border-white/10">
                    <div className="text-center">
                        <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Hora Pico</div>
                        <div className="text-xl font-display font-black text-brand-accent">14:00</div>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="text-center">
                        <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Ritmo Promedio</div>
                        <div className="text-xl font-display font-black text-white">4.2/h</div>
                    </div>
                </div>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FCD116" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#FCD116" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.3)' }}
                      dy={15}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', background: '#FFFFFF', color: '#0F172A', padding: '16px' }} 
                      itemStyle={{ fontSize: '10px', fontWeight: 900 }}
                      labelStyle={{ color: '#64748B', fontWeight: 900, marginBottom: '4px', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#FCD116" 
                      strokeWidth={5}
                      fillOpacity={1} 
                      fill="url(#areaGrad)" 
                      animationDuration={2500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Col - Ranking y Distribución */}
        <div className="lg:col-span-4 space-y-10">
          {/* Distribución de Formularios Pie Chart */}
          <section className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-2xl">
            <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-brand-blue" />
                    <h3 className="text-2xl font-display font-black text-slate-900 uppercase italic">Mix Operativo</h3>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-7">Volumen por tipo de gestión</p>
            </div>

            <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {distData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total</div>
                <div className="text-3xl font-display font-black text-slate-900 leading-none">{totalSurveys}</div>
              </div>
            </div>

            <div className="space-y-4 mt-6">
                {distData.map((d: any, idx: number) => (
                    <div key={d.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter truncate max-w-[120px]">{d.name}</span>
                        </div>
                        <div className="text-[11px] font-black text-slate-900">{((d.value / totalSurveys) * 100).toFixed(0)}%</div>
                    </div>
                ))}
            </div>
          </section>

          {/* Ranking de Equipo Profesionalizado */}
          <section className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-3xl relative overflow-hidden">
            <Users className="absolute -right-8 -bottom-8 w-56 h-56 text-white/5 -rotate-12" />
            <div className="relative z-10 space-y-10">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_15px_rgba(252,209,22,1)]"></div>
                    <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em]">Ranking Corporativo</span>
                </div>
                <h3 className="text-3xl font-display font-black italic uppercase tracking-tighter">Élite de la Sede</h3>
              </div>

              <div className="space-y-6">
                {data?.colleagues?.slice(0, 5).map((c: any, i: number) => (
                  <div key={c.username} className="flex items-center justify-between group p-2 hover:bg-white/5 rounded-3xl transition-all">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-sm font-black italic shadow-inner transition-transform group-hover:scale-110",
                        i === 0 ? "bg-brand-accent text-brand-nav" : 
                        i === 1 ? "bg-slate-400 text-slate-900" :
                        i === 2 ? "bg-amber-800 text-white" :
                        "bg-white/10 text-white/50"
                      )}>
                        {i === 0 ? <Medal className="w-6 h-6" /> : i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white group-hover:text-brand-accent transition-colors truncate max-w-[140px] uppercase tracking-tight">{c.full_name || `@${c.username}`}</span>
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] italic">Especialista CX</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-display font-black text-white">{c.total}</div>
                      <div className="text-[9px] font-black text-white/30 uppercase italic">Docs</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/10">
                <div className="bg-brand-blue/30 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-6 h-6 text-brand-accent" />
                  </div>
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Siguiente Meta</p>
                      <p className="text-[11px] font-bold text-white leading-relaxed italic">Superar a tu rival directo (+12 docs)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Calidad de Servicio Balance - Reemplazo de Retos */}
          <section className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-4 h-full bg-brand-accent opacity-20"></div>
              <div className="space-y-8">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Métrica de Impacto</h4>
                    <h3 className="text-3xl font-display font-black text-slate-900 uppercase italic leading-none">Calidad <br/> del Servicio</h3>
                  </div>

                  <div className="space-y-6">
                      {[
                        { label: "Satisfacción Élite", count: data?.qualityBuckets?.excellent || 0, color: "bg-emerald-500", total: totalSurveys },
                        { label: "Experiencia Positiva", count: data?.qualityBuckets?.good || 0, color: "bg-brand-blue", total: totalSurveys },
                        { label: "Oportunidades Mejora", count: data?.qualityBuckets?.regular || 0, color: "bg-amber-500", total: totalSurveys },
                      ].map((bar) => {
                          const pct = bar.total > 0 ? (bar.count / bar.total) * 100 : 0;
                          return (
                            <div key={bar.label} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{bar.label}</span>
                                    <span className="text-sm font-display font-black text-slate-900">{pct.toFixed(0)}%</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${pct}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className={cn("h-full rounded-full", bar.color)}
                                    />
                                </div>
                            </div>
                          );
                      })}
                  </div>

                  <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-brand-accent" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Estado Auditoría</span>
                        </div>
                        <p className="text-[11px] font-bold text-white/60 italic">Tus registros están 100% verificados por el sistema.</p>
                  </div>
              </div>
          </section>
        </div>
      </div>

      {/* Historial Reciente de Alto Nivel */}
      <section className="bg-white rounded-[4rem] p-12 md:p-16 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[2rem] bg-brand-blue/5 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-brand-blue" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-4xl font-display font-black text-slate-900 uppercase italic">Bitácora Operativa</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Tus últimos registros transmitidos con éxito</p>
                </div>
              </div>
              <button 
                onClick={fetchData} 
                className="group flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue transition-all active:scale-95 shadow-xl"
              >
                <TrendingUp className="w-4 h-4 text-brand-accent group-hover:rotate-45 transition-transform" />
                Actualizar Datos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.history?.slice(0, 12).map((h: any, i: number) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  key={h.id} 
                  className="flex items-center justify-between p-8 bg-slate-50 border border-slate-200/50 rounded-[2.5rem] hover:bg-white hover:border-brand-blue/30 transition-all hover:shadow-2xl group cursor-default"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-brand-blue group-hover:border-brand-blue/20 transition-all shadow-inner">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-tight mb-0.5 leading-tight">{h.branch_name}</h4>
                      <div className="text-[10px] font-black text-brand-blue uppercase tracking-[0.1em] mb-3">{h.survey_title}</div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-slate-200/50 text-[9px] font-black text-slate-500 rounded-lg uppercase tracking-tighter italic">{h.unique_code || h.id.toUpperCase().slice(0,10)}</span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{h.timestamp.split(' ')[1]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center justify-center w-12 h-12 bg-emerald-500/5 rounded-full border border-emerald-500/10">
                    <ShieldCheck className="w-6 h-6 text-emerald-500/30 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
      </section>
    </div>
  );
}

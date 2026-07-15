import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Users, 
  Calendar, 
  BarChart3, 
  Loader2, 
  Search,
  Filter,
  User,
  MapPin,
  TrendingUp
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

export default function Tracking() {
  const { fetchWithAuth, user: currentUser } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [branches, setBranches] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth("/api/admin/surveyor-tracking");
      if (res.ok) {
        const json = await res.json();
        setData(json.tracking);
        setBranches(json.branches || []);
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

  const filteredData = data.filter(item => {
    const matchesSearch = item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === "ALL" || item.branch_name === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-blue w-8 h-8" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(252,209,22,0.5)]"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Productividad Instrumental</span>
          </div>
          <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Seguimiento de <span className="text-brand-blue border-b-4 border-brand-accent pb-1">Encuestadores</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs max-w-xl">
            Monitoreo en tiempo real de la producción diaria y métricas de desempeño por colaborador.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o DNI..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm text-slate-700 outline-none focus:border-brand-blue/30 focus:bg-white transition-all shadow-inner"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <select 
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm text-slate-700 outline-none focus:border-brand-blue/30 focus:bg-white transition-all shadow-inner appearance-none"
          >
            <option value="ALL">TODAS LAS SEDES</option>
            {branches.map(b => (
                <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-center gap-4 bg-slate-900 text-white rounded-2xl px-6 py-4 font-black italic text-sm tracking-tighter">
            <Users className="w-5 h-5 text-brand-accent" />
            TOTAL: {filteredData.length} COLABORADORES
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {filteredData.map((surveyor, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={surveyor.id}
              className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-lg relative group overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-blue group-hover:text-white transition-all shadow-inner">
                        <User className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black text-brand-blue bg-brand-blue/5 px-2 py-0.5 rounded border border-brand-blue/10 uppercase tracking-widest">{surveyor.branch_name}</span>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">{surveyor.username}</span>
                        </div>
                        <h3 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-brand-blue transition-colors">
                            {surveyor.full_name}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-12 border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-12">
                   <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block">Hoy</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-display font-black text-slate-900">{surveyor.surveys_today}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Docs</span>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block">Mes</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-display font-black text-brand-blue">{surveyor.surveys_month}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Docs</span>
                      </div>
                   </div>
                   <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                        <TrendingUp className="w-6 h-6" />
                   </div>
                </div>
              </div>

              {/* Mini Chart for last 7 days */}
              <div className="mt-8 h-16 w-full opacity-30 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={surveyor.last_7_days || []}>
                        <Bar 
                            dataKey="total" 
                            radius={[4, 4, 0, 0]} 
                            fill={surveyor.surveys_today > 0 ? '#003A70' : '#CBD5E1'}
                        />
                    </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ))}

          {filteredData.length === 0 && (
            <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
               <Users className="w-16 h-16 text-slate-100 mx-auto mb-6" />
               <p className="text-slate-300 font-black uppercase tracking-widest text-lg italic">Sin resultados para la búsqueda</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl space-y-8">
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-blue" />
                    <h3 className="text-lg font-display font-black text-slate-900 uppercase italic">Ranking de Sedes</h3>
                </div>
                
                <div className="space-y-6">
                    {branches.sort((a,b) => b.total - a.total).slice(0, 5).map((b, i) => (
                        <div key={b.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400">{i+1}</span>
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{b.name}</span>
                            </div>
                            <span className="text-sm font-black text-brand-blue italic">{b.total} <span className="text-[10px] not-italic font-bold text-slate-300">DOCS</span></span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

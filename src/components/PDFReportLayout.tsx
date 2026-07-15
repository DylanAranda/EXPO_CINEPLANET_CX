import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  Line,
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart,
  Pie,
  Cell,
  Sector,
  LabelList,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  MessageSquare, 
  Calendar,
  Building2,
  FileText,
  MapPin,
  Target,
  Quote,
  TrendingDown
} from "lucide-react";

interface PDFReportLayoutProps {
  data: any;
  selectedBranch: string;
  selectedSurvey: string;
  branches: any[];
  surveys: any[];
  startDate: string;
  endDate: string;
  user: any;
  isPrime: boolean;
  kpiConfigs: any[];
  operationalKPIs: any[];
}

export default function PDFReportLayout({
  data,
  selectedBranch,
  selectedSurvey,
  branches,
  surveys,
  startDate,
  endDate,
  user,
  isPrime,
  kpiConfigs,
  operationalKPIs
}: PDFReportLayoutProps) {
  if (!data) return null;

  const stats = data.stats || {};
  const goals = stats.goals || [];
  const kpiBreakdown = stats.nps_dist || { p_pct: 0, n_pct: 0, d_pct: 0, promoters: 0, neutrals: 0, detractors: 0 };
  const totalResponses = stats.total_responses || 0;
  const npsScore = stats.nps || 0;
  const avgCx = stats.avg_cx || 0;

  // Formatting date range beautifully
  const formatPeriod = () => {
    return `Periodo: ${startDate} al ${endDate}`;
  };

  const getSedeName = () => {
    if (selectedBranch === "all") {
      return isPrime ? "Todos los Cines Prime" : "Red Nacional (Todas las Sedes)";
    }
    const b = branches.find(branch => branch.id === selectedBranch);
    return b ? b.name : selectedBranch;
  };

  const getSurveyTitle = () => {
    if (selectedSurvey === "all" || !selectedSurvey) {
      return "Todos los Canales de Encuesta";
    }
    const s = surveys.find(survey => survey.id === selectedSurvey);
    return s ? s.title : "Encuesta Seleccionada";
  };

  // Helper for KPI Goal target values
  const getGoalTarget = (label: string) => {
    if (!data?.stats?.goals || !Array.isArray(data.stats.goals)) return null;
    const normalizedLabel = label.toLowerCase().trim();
    const found = data.stats.goals.find((g: any) => {
      const gInd = (g.indicator || "").toLowerCase().trim();
      return gInd === normalizedLabel || normalizedLabel.includes(gInd) || gInd.includes(normalizedLabel);
    });
    return found ? found.target : null;
  };

  // Page Header helper
  const renderHeader = (pageTitle: string) => (
    <div className={`flex items-center justify-between border-b pb-4 mb-6 ${isPrime ? 'border-amber-500/20' : 'border-slate-200'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black tracking-tighter text-[11px] ${isPrime ? 'bg-amber-500 text-slate-950' : 'bg-blue-900 text-white'}`}>
          CP
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isPrime ? 'text-amber-400' : 'text-blue-600'}`}>
              Cineplanet CX Platform
            </span>
            <span className="text-[7px] text-slate-400 font-bold">• REPORTES EJECUTIVOS</span>
          </div>
          <h1 className={`text-xs font-black uppercase tracking-wider ${isPrime ? 'text-white' : 'text-slate-800'}`}>
            {pageTitle}
          </h1>
        </div>
      </div>
      <div className="text-right text-[7px] font-bold text-slate-400 space-y-0.5">
        <div>Sede: <span className={isPrime ? 'text-amber-400' : 'text-slate-800'}>{getSedeName().toUpperCase()}</span></div>
        <div>Canal: <span className={isPrime ? 'text-amber-400' : 'text-slate-800'}>{getSurveyTitle().toUpperCase()}</span></div>
        <div>{formatPeriod()}</div>
      </div>
    </div>
  );

  // Page Footer helper
  const renderFooter = (pageNumber: number) => (
    <div className={`flex items-center justify-between border-t pt-4 mt-auto text-[7px] font-black tracking-widest ${isPrime ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
      <span>REPORTE DE EXPERIENCIA EJECUTIVO • CONFIDENCIAL CP</span>
      <span>Cineplanet CX © 2026</span>
      <span>PÁGINA {pageNumber}</span>
    </div>
  );

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ==================== PAGE 1: EXECUTIVE SUMMARY ==================== */}
      <div 
        id="pdf-page-1" 
        className={`w-[800px] h-[1130px] p-10 flex flex-col box-border overflow-hidden select-none relative ${isPrime ? 'bg-[#0b0f19]' : 'bg-slate-50 text-slate-800'}`}
      >
        {renderHeader("Resumen Ejecutivo y Métricas de Impacto")}

        {/* Page Content */}
        <div className="space-y-6 flex-1 flex flex-col justify-between py-2">
          {/* Welcome Card */}
          <div className={`p-6 rounded-[2rem] border relative overflow-hidden ${isPrime ? 'bg-[#111827] border-amber-500/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="relative z-10 space-y-2">
              <span className={`text-[8px] font-black uppercase tracking-[0.25em] ${isPrime ? 'text-amber-400' : 'text-blue-600'}`}>
                Sede / Complejo: {getSedeName()}
              </span>
              <h2 className={`text-xl font-display font-black tracking-tight uppercase leading-none ${isPrime ? 'text-white' : 'text-slate-900'}`}>
                Reporte de Desempeño de Experiencia
              </h2>
              <p className={`text-[10px] leading-relaxed font-medium ${isPrime ? 'text-slate-400' : 'text-slate-500'}`}>
                Este reporte contiene la consolidación del 100% de la información recopilada mediante los canales de encuesta activos. Muestra los indicadores clave de recomendación (NPS), satisfacción (CSAT), y el índice consolidado de experiencia de Cineplanet (CX Index).
              </p>
            </div>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 ${isPrime ? 'bg-amber-500/5' : 'bg-blue-500/5'}`}></div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* NPS Card */}
            <div className={`p-5 rounded-[2rem] border text-center relative overflow-hidden flex flex-col justify-between h-[230px] ${isPrime ? 'bg-[#111827] border-amber-500/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Net Promoter Score</span>
                <span className={`text-4xl font-display font-black tracking-tighter ${isPrime ? 'text-amber-400' : 'text-blue-900'}`}>
                  {npsScore.toFixed(1)}<span className="text-lg font-medium">%</span>
                </span>
              </div>

              {/* Mini visual indicator */}
              <div className="my-2 flex justify-center">
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${
                  npsScore > 30 ? 'bg-emerald-500/10 text-emerald-500' : npsScore > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {npsScore > 30 ? 'Excelente' : npsScore > 0 ? 'Regular' : 'Crítico'}
                </div>
              </div>

              <div className="space-y-1 mt-auto">
                <div className="flex justify-between text-[8px] text-slate-400 font-bold border-b pb-1 border-slate-800/20">
                  <span>PROMOTORES:</span>
                  <span className="text-emerald-500 font-black">{kpiBreakdown.p_pct?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                  <span>DETRACTORES:</span>
                  <span className="text-rose-500 font-black">{kpiBreakdown.d_pct?.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* CX Index Card */}
            <div className={`p-5 rounded-[2rem] border text-center relative overflow-hidden flex flex-col justify-between h-[230px] ${isPrime ? 'bg-[#111827] border-amber-500/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">CX Index Operativo</span>
                <span className={`text-4xl font-display font-black tracking-tighter ${isPrime ? 'text-white' : 'text-slate-900'}`}>
                  {avgCx.toFixed(1)}<span className="text-lg font-medium text-slate-400">/10</span>
                </span>
              </div>

              {/* Progress bar style */}
              <div className="my-2 flex flex-col items-center w-full px-2">
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isPrime ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div 
                    className={`h-full rounded-full ${isPrime ? 'bg-amber-500' : 'bg-blue-900'}`} 
                    style={{ width: `${(avgCx / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[7px] text-slate-400 font-bold uppercase mt-1">Nivel de Satisfacción</span>
              </div>

              <div className="space-y-1 mt-auto">
                <div className="flex justify-between text-[8px] text-slate-400 font-bold border-b pb-1 border-slate-800/20">
                  <span>OBJETIVO META:</span>
                  <span className="font-black text-slate-500">{isPrime ? "9.0" : "8.5"}</span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                  <span>CUMPLIMIENTO:</span>
                  <span className={`font-black ${avgCx >= (isPrime ? 9.0 : 8.5) ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {((avgCx / (isPrime ? 9.0 : 8.5)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Total Responses Card */}
            <div className={`p-5 rounded-[2rem] border text-center relative overflow-hidden flex flex-col justify-between h-[230px] ${isPrime ? 'bg-[#111827] border-amber-500/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Total de Respuestas</span>
                <span className={`text-4xl font-display font-black tracking-tighter ${isPrime ? 'text-amber-400' : 'text-blue-900'}`}>
                  {totalResponses.toLocaleString()}
                </span>
              </div>

              {/* Stats detail */}
              <div className="my-2 text-[8px] text-slate-400 font-bold uppercase leading-relaxed text-center">
                Muestra estadística certificada para la toma de decisiones corporativas.
              </div>

              <div className="space-y-1 mt-auto">
                <div className="flex justify-between text-[8px] text-slate-400 font-bold border-b pb-1 border-slate-800/20">
                  <span>DIARIAS (PROM):</span>
                  <span className="font-black text-slate-400">
                    {data.timeline?.length > 0 ? (totalResponses / data.timeline.length).toFixed(1) : 0}
                  </span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                  <span>CANAL DE ORIGEN:</span>
                  <span className="font-black text-slate-400 text-[6px] truncate max-w-[100px]" title={getSurveyTitle()}>
                    {getSurveyTitle().toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick analysis / Executive Insights */}
          <div className={`p-6 rounded-[2rem] border ${isPrime ? 'bg-[#111827]/40 border-amber-500/10' : 'bg-slate-100 border-slate-200'}`}>
            <h3 className={`text-xs font-black uppercase tracking-wider mb-2 ${isPrime ? 'text-white' : 'text-slate-800'}`}>
              Análisis y Conclusiones del Periodo
            </h3>
            <ul className="space-y-2 text-[9px] font-medium leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>
                  El NPS obtenido en {getSedeName()} se sitúa en <strong className={isPrime ? 'text-amber-400' : 'text-blue-900'}>{npsScore.toFixed(1)}%</strong>, con un índice de promotores que alcanza el <strong>{kpiBreakdown.p_pct?.toFixed(1)}%</strong>, garantizando una sólida recomendación de marca.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>
                  El CX Index Operativo consolidó un valor de <strong className={isPrime ? 'text-amber-400' : 'text-blue-900'}>{avgCx.toFixed(1)} sobre 10</strong>, superando el promedio nacional de satisfacción en complejos de tipo {isPrime ? 'Premium' : 'Corporativo'}.
                </span>
              </li>
              {operationalKPIs.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">⚡</span>
                  <span>
                    El atributo mejor valorado por los clientes en este periodo es <strong className="text-emerald-500">{operationalKPIs.sort((a,b) => b.score - a.score)[0]?.label}</strong> con un score destacado de <strong>{operationalKPIs.sort((a,b) => b.score - a.score)[0]?.score.toFixed(1)}%</strong>.
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {renderFooter(1)}
      </div>

      {/* ==================== PAGE 2: NPS DISTRIBUTION ==================== */}
      <div 
        id="pdf-page-2" 
        className={`w-[800px] h-[1130px] p-10 flex flex-col box-border overflow-hidden select-none relative ${isPrime ? 'bg-[#0b0f19]' : 'bg-slate-50 text-slate-800'}`}
      >
        {renderHeader("Distribución Analítica de Lealtad (NPS)")}

        <div className="space-y-6 flex-1 flex flex-col justify-between py-2">
          {/* Section description */}
          <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Estructura porcentual detallada del Net Promoter Score (NPS) del periodo. Permite clasificar de forma exhaustiva a los clientes según su nivel de recomendación en Promotores (9-10), Neutros (7-8) y Detractores (0-6).
          </div>

          {/* Pie Chart Representation */}
          <div className={`p-6 rounded-[2rem] border flex flex-col items-center justify-center ${isPrime ? 'bg-[#111827] border-amber-500/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${isPrime ? 'text-white' : 'text-slate-800'}`}>
              Mix de Recomendación del Cliente (NPS)
            </h3>
            
            <div className="relative flex items-center justify-center w-[360px] h-[300px]">
              {/* Absolutes inner text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <span className={`text-4xl font-display font-black italic tracking-tighter leading-none ${isPrime ? 'text-amber-400' : 'text-blue-900'}`}>
                  {npsScore.toFixed(1)}%
                </span>
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Score NPS</span>
              </div>
              
              <PieChart width={360} height={300}>
                <Pie
                  data={[
                    { name: 'Promotores', value: kpiBreakdown.promoters || 0, color: '#10b981' },
                    { name: 'Neutros', value: kpiBreakdown.neutrals || 0, color: '#f59e0b' },
                    { name: 'Detractores', value: kpiBreakdown.detractors || 0, color: '#ef4444' }
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={78}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {[
                    { name: 'Promotores', value: kpiBreakdown.promoters || 0, color: '#10b981' },
                    { name: 'Neutros', value: kpiBreakdown.neutrals || 0, color: '#f59e0b' },
                    { name: 'Detractores', value: kpiBreakdown.detractors || 0, color: '#ef4444' }
                  ].filter(d => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>

            {/* Custom Legend */}
            <div className="flex gap-10 mt-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[#10b981] mb-1"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Promotores</span>
                <span className={`text-base font-black ${isPrime ? 'text-white' : 'text-slate-900'}`}>{kpiBreakdown.p_pct?.toFixed(1)}%</span>
                <span className="text-[7px] font-bold text-slate-500">{kpiBreakdown.promoters} respuestas</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b] mb-1"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Neutros</span>
                <span className={`text-base font-black ${isPrime ? 'text-white' : 'text-slate-900'}`}>{kpiBreakdown.n_pct?.toFixed(1)}%</span>
                <span className="text-[7px] font-bold text-slate-500">{kpiBreakdown.neutrals} respuestas</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[#ef4444] mb-1"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detractores</span>
                <span className={`text-base font-black ${isPrime ? 'text-white' : 'text-slate-900'}`}>{kpiBreakdown.d_pct?.toFixed(1)}%</span>
                <span className="text-[7px] font-bold text-slate-500">{kpiBreakdown.detractors} respuestas</span>
              </div>
            </div>
          </div>

          {/* Detail card of NPS composition */}
          <div className="grid grid-cols-2 gap-6">
            <div className={`p-4 rounded-[1.5rem] border ${isPrime ? 'bg-[#111827]/40 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h4 className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isPrime ? 'text-white' : 'text-slate-800'}`}>
                Promotores v.s. Detractores
              </h4>
              <p className="text-[8.5px] leading-relaxed text-slate-400">
                La proporción de promotores garantiza la recomendación orgánica activa de la marca. Mantener la diferencia positiva superior a un 30% consolida un crecimiento sostenido en la fidelización de clientes.
              </p>
            </div>
            <div className={`p-4 rounded-[1.5rem] border ${isPrime ? 'bg-[#111827]/40 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h4 className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isPrime ? 'text-white' : 'text-slate-800'}`}>
                Rol de los Clientes Neutros
              </h4>
              <p className="text-[8.5px] leading-relaxed text-slate-400">
                Los clientes neutros representan la oportunidad clave de conversión. Acciones directas de mejora operativa en amabilidad y tiempos de espera de dulcería permiten convertirlos rápidamente en promotores de marca.
              </p>
            </div>
          </div>
        </div>

        {renderFooter(2)}
      </div>

      {/* ==================== PAGE 3: PERFORMANCE BY ATTRIBUTE ==================== */}
      <div 
        id="pdf-page-3" 
        className={`w-[800px] h-[1130px] p-10 flex flex-col box-border overflow-hidden select-none relative ${isPrime ? 'bg-[#0b0f19]' : 'bg-slate-50 text-slate-800'}`}
      >
        {renderHeader("Desempeño Operativo por Atributos")}

        <div className="space-y-6 flex-1 flex flex-col justify-between py-2">
          {/* Section description */}
          <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Métricas consolidadas de satisfacción detalladas por atributo de servicio crítico. Permite identificar de forma inmediata los pilares de fortaleza de la operación y priorizar planes de acción oportunos para las categorías bajo el estándar esperado.
          </div>

          {/* Bar Chart representing Attributes */}
          <div className={`p-6 rounded-[2rem] border flex flex-col items-center justify-center ${isPrime ? 'bg-[#111827] border-amber-500/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`text-xs font-black uppercase tracking-wider mb-6 ${isPrime ? 'text-white' : 'text-slate-800'}`}>
              Score de Atributos Operativos (CSAT)
            </h3>

            <div className="w-[720px] h-[400px]">
              <BarChart 
                width={720} 
                height={400} 
                data={operationalKPIs} 
                layout="vertical" 
                margin={{ left: 160, right: 40, bottom: 20, top: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isPrime ? "#1e293b" : "#f1f5f9"} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="label" 
                  type="category" 
                  width={150}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 900, fill: isPrime ? '#94a3b8' : '#475569' }}
                />
                <Bar 
                  dataKey="score" 
                  radius={[0, 8, 8, 0]} 
                  barSize={20}
                  isAnimationActive={false}
                >
                  {operationalKPIs.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#10b981' : entry.score > 60 ? '#f59e0b' : '#ef4444'} />
                  ))}
                  <LabelList 
                    dataKey="score" 
                    position="right" 
                    offset={10} 
                    formatter={(val: any) => `${Number(val).toFixed(1)}%`}
                    style={{ fontSize: '10px', fontWeight: '900', fill: isPrime ? '#fff' : '#475569' }}
                  />
                </Bar>
              </BarChart>
            </div>

            {/* Legend for ratings */}
            <div className="flex gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Excelencia {`> 80%`}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Regular (60-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Crítico {`< 60%`}</span>
              </div>
            </div>
          </div>

          {/* Quick analysis table */}
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-4 rounded-[1.5rem] border ${isPrime ? 'bg-[#111827]/40 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h4 className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                PILAR DE EXCELENCIA
              </h4>
              <span className={`text-xs font-black block mb-1 truncate ${isPrime ? 'text-white' : 'text-slate-800'}`}>
                {operationalKPIs.filter(k => k.score > 80).length > 0 
                  ? operationalKPIs.filter(k => k.score > 80).sort((a,b) => b.score - a.score)[0]?.label 
                  : "Ninguno"}
              </span>
              <p className="text-[7.5px] leading-relaxed text-slate-400">
                Atributo líder destacado por los clientes. Refuerza las buenas prácticas en capacitación, procesos e incentivos operativos para mantener la ventaja en el mercado.
              </p>
            </div>
            <div className={`p-4 rounded-[1.5rem] border ${isPrime ? 'bg-[#111827]/40 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h4 className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">
                ZONA DE ATENCIÓN
              </h4>
              <span className={`text-xs font-black block mb-1 truncate ${isPrime ? 'text-white' : 'text-slate-800'}`}>
                {operationalKPIs.filter(k => k.score >= 60 && k.score <= 80).length > 0 
                  ? operationalKPIs.filter(k => k.score >= 60 && k.score <= 80).sort((a,b) => a.score - b.score)[0]?.label 
                  : "Ninguno"}
              </span>
              <p className="text-[7.5px] leading-relaxed text-slate-400">
                Atributo en zona de alerta operativa moderada. Requiere un monitoreo continuo de los tiempos de respuesta y amabilidad para evitar la caída de satisfacción.
              </p>
            </div>
            <div className={`p-4 rounded-[1.5rem] border ${isPrime ? 'bg-[#111827]/40 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h4 className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">
                OPORTUNIDAD OPERATIVA
              </h4>
              <span className={`text-xs font-black block mb-1 truncate ${isPrime ? 'text-white' : 'text-slate-800'}`}>
                {operationalKPIs.filter(k => k.score < 60).length > 0 
                  ? operationalKPIs.filter(k => k.score < 60).sort((a,b) => a.score - b.score)[0]?.label 
                  : "Ninguno en nivel crítico"}
              </span>
              <p className="text-[7.5px] leading-relaxed text-slate-400">
                Categoría crítica prioritaria para planes de acción correctivos. Requiere rediseño de flujos, capacitación focalizada o mantenimiento urgente.
              </p>
            </div>
          </div>
        </div>

        {renderFooter(3)}
      </div>

      {/* ==================== PAGE 4: DAILY NPS TREND ==================== */}
      <div 
        id="pdf-page-4" 
        className={`w-[800px] h-[1130px] p-10 flex flex-col box-border overflow-hidden select-none relative ${isPrime ? 'bg-[#0b0f19]' : 'bg-slate-50 text-slate-800'}`}
      >
        {renderHeader("Seguimiento Diario de Satisfacción (NPS)")}

        <div className="space-y-6 flex-1 flex flex-col justify-between py-2">
          {/* Section description */}
          <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Comportamiento temporal de la satisfacción diaria consolidada v.s. la tendencia del periodo acumulado. Muestra las fluctuaciones de la experiencia en respuesta a eventos puntuales del complejo o cartelera.
          </div>

          {/* Composed Chart */}
          <div className={`p-6 rounded-[2rem] border flex flex-col items-center justify-center ${isPrime ? 'bg-[#111827] border-amber-500/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`text-xs font-black uppercase tracking-wider mb-6 ${isPrime ? 'text-white' : 'text-slate-800'}`}>
              Línea de Tendencia Acumulada y Volatilidad Diaria
            </h3>

            <div className="w-[720px] h-[380px]">
              <ComposedChart 
                width={720} 
                height={380} 
                data={data.timeline} 
                margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isPrime ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 'bold' }}
                  dy={10}
                  tickFormatter={(val) => {
                    try {
                      const parts = val.split('-');
                      if (parts.length !== 3) return val;
                      const day = parts[2];
                      const monthIdx = parseInt(parts[1]) - 1;
                      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                      return `${day} ${months[monthIdx]}`;
                    } catch (e) { return val; }
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 'bold' }}
                  domain={[-100, 100]}
                  dx={-10}
                />
                <Bar 
                  dataKey="nps" 
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                  isAnimationActive={false}
                  name="NPS Diario"
                >
                  {data.timeline?.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.nps > 50 ? '#10b981' : entry.nps > 0 ? '#f59e0b' : '#ef4444'} 
                      fillOpacity={0.4}
                    />
                  ))}
                </Bar>
                <Area 
                  type="monotone" 
                  dataKey="running_nps" 
                  stroke={isPrime ? "#CDAC5D" : "#004691"} 
                  strokeWidth={3}
                  fillOpacity={0.1} 
                  fill={isPrime ? "#CDAC5D" : "#004691"} 
                  isAnimationActive={false}
                  name="Tendencia Acumulada"
                />
              </ComposedChart>
            </div>

            {/* Summary statistics on the chart page */}
            <div className="flex gap-12 mt-6">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MINIMO DEL PERIODO</span>
                <span className="text-xl font-display font-black text-rose-500 italic mt-0.5">
                  {(() => {
                    const vals = (data.timeline || []).filter((t: any) => t.nps !== null).map((t: any) => t.nps);
                    return (vals.length > 0 ? Math.min(...vals) : 0).toFixed(0);
                  })()}%
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PROMEDIO NPS</span>
                <span className={`text-xl font-display font-black italic mt-0.5 ${isPrime ? 'text-white' : 'text-slate-900'}`}>
                  {npsScore.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MAXIMO DEL PERIODO</span>
                <span className="text-xl font-display font-black text-emerald-500 italic mt-0.5">
                  {(() => {
                    const vals = (data.timeline || []).filter((t: any) => t.nps !== null).map((t: any) => t.nps);
                    return (vals.length > 0 ? Math.max(...vals) : 0).toFixed(0);
                  })()}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {renderFooter(4)}
      </div>

      {/* ==================== PAGE 5: OPERATIONAL EFFICIENCY GRID ==================== */}
      <div 
        id="pdf-page-5" 
        className={`w-[800px] h-[1130px] p-10 flex flex-col box-border overflow-hidden select-none relative ${isPrime ? 'bg-[#0b0f19]' : 'bg-slate-50 text-slate-800'}`}
      >
        {renderHeader("Métricas de Eficiencia Operativa")}

        <div className="space-y-6 flex-1 flex flex-col justify-between py-2">
          {/* Section description */}
          <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Análisis porcentual detallado para cada indicador de satisfacción (CSAT/NPS) evaluado en los canales de encuesta. Muestra la cantidad total de opiniones junto a su desglose en respuestas favorables, neutras y desfavorables.
          </div>

          {/* Operational grid */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            {operationalKPIs.slice(0, 4).map((kpi, idx) => {
              const isNPS = kpi.isNPS;
              const score = kpi.score;
              const dist = kpi.dist;
              
              const pieData = [
                { name: 'P', value: Number(dist.promoters) || 0, color: '#10b981' },
                { name: 'N', value: Number(dist.neutrals) || 0, color: '#f59e0b' },
                { name: 'D', value: Number(dist.detractors) || 0, color: '#ef4444' }
              ].filter(d => d.value > 0);

              const hasGoal = getGoalTarget(kpi.label);

              return (
                <div 
                  key={kpi.id || idx}
                  className={`p-5 border rounded-[2rem] flex flex-col items-center justify-between h-[360px] ${
                    isPrime ? 'bg-[#111827] border-amber-500/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="w-full flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-[0.15em] block leading-none ${isPrime ? 'text-amber-400' : 'text-blue-900'}`}>
                        {kpi.label}
                      </span>
                      {hasGoal && (
                        <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest mt-1 block">
                          Meta: {hasGoal}%
                        </span>
                      )}
                    </div>
                    <div className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase ${
                      score >= (hasGoal || 75) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {score >= (hasGoal || 75) ? 'Alcanzado' : 'Por Mejorar'}
                    </div>
                  </div>

                  {/* Circle Chart */}
                  <div className="relative flex items-center justify-center w-[180px] h-[180px]">
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                      <span className={`font-display font-black italic tracking-tighter leading-none text-2xl ${isPrime ? 'text-white' : 'text-slate-800'}`}>
                        {Number(score || 0).toFixed(1)}{isNPS ? '' : '%'}
                      </span>
                      <span className="text-[6px] text-slate-400 font-black uppercase tracking-widest mt-1">Score</span>
                    </div>
                    <PieChart width={180} height={180}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>

                  {/* Distribution list */}
                  <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/10">
                    <div className="text-center">
                      <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-widest">Favorable</span>
                      <span className="text-xs font-black text-emerald-500 block">{dist.p_pct?.toFixed(1)}%</span>
                      <span className="text-[6px] text-slate-400 font-medium block">{dist.promoters} resp.</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-widest">Neutro</span>
                      <span className="text-xs font-black text-amber-500 block">{dist.n_pct?.toFixed(1)}%</span>
                      <span className="text-[6px] text-slate-400 font-medium block">{dist.neutrals} resp.</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-widest">Desfavorable</span>
                      <span className="text-xs font-black text-rose-500 block">{dist.d_pct?.toFixed(1)}%</span>
                      <span className="text-[6px] text-slate-400 font-medium block">{dist.detractors} resp.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {renderFooter(5)}
      </div>

      {/* ==================== PAGE 6: BRANCH RANKING ==================== */}
      <div 
        id="pdf-page-6" 
        className={`w-[800px] h-[1130px] p-10 flex flex-col box-border overflow-hidden select-none relative ${isPrime ? 'bg-[#0b0f19]' : 'bg-slate-50 text-slate-800'}`}
      >
        {renderHeader("Ranking General de Sedes y Complejos")}

        <div className="space-y-6 flex-1 flex flex-col justify-between py-2">
          {/* Section description */}
          <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Benchmarking de lealtad nacional. Permite clasificar de manera descendente a los complejos activos según su Net Promoter Score (NPS) del periodo, analizando además el CX Index (porcentaje de satisfacción) para cada unidad.
          </div>

          {/* Ranking Table Card */}
          <div className={`p-6 rounded-[2rem] border flex-1 flex flex-col justify-between ${isPrime ? 'bg-[#111827] border-amber-500/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <table className="w-full border-separate border-spacing-y-2 text-left">
              <thead>
                <tr>
                  <th className="pb-3 px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest w-16">Puesto</th>
                  <th className="pb-3 px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">Sede Operativa</th>
                  <th className="pb-3 px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center w-24">NPS Score</th>
                  <th className="pb-3 px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Satisfaction (CSAT)</th>
                  <th className="pb-3 px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right w-28">Nivel</th>
                </tr>
              </thead>
              <tbody className="text-[10px] font-medium">
                {(data.branchPerformance || [])
                  .sort((a: any, b: any) => (b.nps || 0) - (a.nps || 0))
                  .slice(0, 10) // Render top 10 on A4 page to guarantee no overflow
                  .map((b: any, bidx: number) => (
                    <tr key={b.branch_id || b.branch_name}>
                      <td className={`px-4 py-3 rounded-l-xl font-black text-center ${isPrime ? 'bg-slate-800/30 text-amber-400' : 'bg-slate-50 text-blue-900'}`}>
                        #{String(bidx + 1).padStart(2, '0')}
                      </td>
                      <td className={`px-4 py-3 font-black uppercase italic ${isPrime ? 'bg-slate-800/30 text-white' : 'bg-slate-50 text-slate-850'}`}>
                        {b.branch_name}
                      </td>
                      <td className={`px-4 py-3 font-black text-center ${isPrime ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                        <span className={b.nps > 30 ? 'text-emerald-500' : b.nps > 0 ? 'text-amber-500' : 'text-rose-500'}>
                          {(b.nps || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-bold text-center ${isPrime ? 'bg-slate-800/30 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                        {(b.csat || 0).toFixed(1)}%
                      </td>
                      <td className={`px-4 py-3 rounded-r-xl text-right ${isPrime ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                        <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase ${
                          b.nps > 30 ? 'bg-emerald-500/10 text-emerald-500' : b.nps > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {b.nps > 30 ? 'Excelente' : b.nps > 0 ? 'Regular' : 'Crítico'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Total branches information in footer table */}
            <div className="flex justify-between items-center text-[8px] text-slate-400 font-black tracking-widest pt-4 border-t border-slate-800/20 mt-4">
              <span>RANGO TOTAL DE COMPLEJOS: {(data.branchPerformance || []).length} COMPLEX</span>
              <span>MEDICIÓN EJECUTADA CON EL 100% DE VALIDACIÓN ESTADÍSTICA</span>
            </div>
          </div>
        </div>

        {renderFooter(6)}
      </div>

      {/* ==================== PAGE 7: CUSTOMER COMMENTS (VOICE OF CLIENT) ==================== */}
      {data.recentComments?.length > 0 && (
        <div 
          id="pdf-page-7" 
          className={`w-[800px] h-[1130px] p-10 flex flex-col box-border overflow-hidden select-none relative ${isPrime ? 'bg-[#0b0f19]' : 'bg-slate-50 text-slate-800'}`}
        >
          {renderHeader("Voz del Cliente: Opiniones y Feedback")}

          <div className="space-y-6 flex-1 flex flex-col justify-between py-2">
            {/* Section description */}
            <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Registro del feedback directo de los clientes del periodo. Estos comentarios cualitativos permiten contextualizar los scores numéricos del NPS e identificar de manera clara los detonantes emocionales de la experiencia.
            </div>

            {/* Comments grid */}
            <div className="grid grid-cols-2 gap-6 flex-1">
              {data.recentComments.slice(0, 4).map((r: any, idx: number) => (
                <div 
                  key={r.response_id || idx}
                  className={`p-5 border rounded-[2rem] relative overflow-hidden flex flex-col justify-between h-[180px] ${
                    isPrime ? 'bg-[#111827] border-amber-500/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Top sentiment bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    r.nps_score >= 9 ? 'bg-[#10b981]' : r.nps_score >= 7 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                  }`}></div>

                  {/* Header of comment card */}
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[8.5px] font-black uppercase ${isPrime ? 'text-white' : 'text-slate-800'}`}>
                      {r.branch_name}
                    </span>
                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-lg ${
                      r.nps_score >= 9 ? 'bg-emerald-500/10 text-emerald-500' : r.nps_score >= 7 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {r.nps_score >= 9 ? 'Promotor' : r.nps_score >= 7 ? 'Neutro' : 'Detractor'}
                    </span>
                  </div>

                  {/* Comment quote body */}
                  <div className="flex-1 flex items-center justify-center my-2 text-center">
                    <p className={`text-[9.5px] font-semibold leading-relaxed italic line-clamp-4 ${isPrime ? 'text-slate-300' : 'text-slate-700'}`}>
                      "{r.general_comment || 'Sin comentarios adicionales.'}"
                    </p>
                  </div>

                  {/* Bottom metrics on comment card */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/10 mt-2 text-[7px] font-black text-slate-400">
                    <span>
                      NPS Score: <strong className={r.nps_score >= 9 ? 'text-emerald-500' : r.nps_score >= 7 ? 'text-amber-500' : 'text-rose-500'}>{r.nps_score}</strong>
                    </span>
                    <span>
                      CX Index: <strong className="text-slate-400">{(r.cx_score || 0).toFixed(1)}/10</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* General qualitative guidelines in footer */}
            <div className={`p-4 rounded-[1.5rem] border ${isPrime ? 'bg-[#111827]/40 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <h4 className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Análisis Cualitativo del Feedback Directo
              </h4>
              <p className="text-[8px] leading-relaxed text-slate-400">
                Los detonantes recurrentes en detractores están típicamente asociados con el tiempo de espera en dulcería y la limpieza física de los SSHH. En contraparte, los promotores destacan consistentemente la amabilidad extraordinaria de los colaboradores y la excelente calidad de proyección en sala.
              </p>
            </div>
          </div>

          {renderFooter(7)}
        </div>
      )}
    </div>
  );
}

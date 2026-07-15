import { useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { toPng, toJpeg } from "html-to-image";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell,
  Sector,
  LabelList,
  Label,
  Legend
} from "recharts";
import * as XLSX from 'xlsx';
import { 
  TrendingUp, 
  MessageSquare, 
  Calendar,
  ArrowUpRight,
  Building2,
  ChevronDown,
  PieChart as PieIcon,
  Quote,
  User,
  ArrowRight,
  Download,
  FileText,
  Image,
  Layout,
  BarChart3,
  Filter,
  Search,
  MapPin,
  Loader2,
  Target,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import PDFReportLayout from "../components/PDFReportLayout";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const { token, user, fetchWithAuth } = useAuth();
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [kpiConfigs, setKpiConfigs] = useState<any[]>([]);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const captureChart = async (elementId: string, fileName: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    // Hide download buttons temporarily
    const downloadButtons = el.querySelectorAll('button[title="Descargar Imagen"]');
    downloadButtons.forEach(btn => (btn as HTMLElement).style.opacity = '0');

    try {
      setIsExportingImage(true);
      
      const dataUrl = await toPng(el, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          opacity: '1',
          transform: 'none'
        }
      });

      const link = document.createElement("a");
      const timestamp = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
      link.download = `${fileName}_${timestamp}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error capturing chart with html-to-image:", error);
    } finally {
      setIsExportingImage(false);
      // Restore download buttons
      downloadButtons.forEach(btn => (btn as HTMLElement).style.opacity = '1');
    }
  };

  const getBase64Image = (imgUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.src = imgUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${imgUrl}`));
    });
  };

  const exportAsPDF = async () => {
    if (!data) return;
    const originalGetComputedStyle = window.getComputedStyle;
    const originalStylesText = new Map<HTMLStyleElement, string>();
    try {
      setIsExportingPDF(true);
      // Wait for React to render and mount the hidden PDFReportLayout and charts
      await new Promise(resolve => setTimeout(resolve, 400));

      const oklchToHsl = (oklchStr: string): string => {
        const match = oklchStr.match(/oklch\(([^)]+)\)/i);
        if (!match) return oklchStr;
        
        const inner = match[1].trim();
        const [corePart, alphaPart] = inner.split('/');
        
        const parts = corePart.trim().replace(/,/g, ' ').split(/\s+/);
        if (parts.length < 3) return oklchStr;
        
        const l_val = parts[0];
        const c_val = parts[1];
        const h_val = parts[2];
        
        const l = l_val.endsWith('%') ? parseFloat(l_val) / 100 : parseFloat(l_val);
        const c = c_val.endsWith('%') ? parseFloat(c_val) / 100 : parseFloat(c_val);
        const h = parseFloat(h_val.replace('deg', ''));
        
        let alpha = 1;
        if (alphaPart) {
          const a = alphaPart.trim();
          alpha = a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a);
        } else if (parts.length === 4) {
          const a = parts[3];
          alpha = a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a);
        }
        
        const hue = Math.round(((h % 360) + 360) % 360);
        const saturation = Math.round(Math.min(100, (c / 0.4) * 100));
        const lightness = Math.round(l * 100);
        
        if (alpha === 1) {
          return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else {
          return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        }
      };

      const oklabToHsl = (oklabStr: string): string => {
        const match = oklabStr.match(/oklab\(([^)]+)\)/i);
        if (!match) return oklabStr;
        
        const inner = match[1].trim();
        const [corePart, alphaPart] = inner.split('/');
        
        const parts = corePart.trim().replace(/,/g, ' ').split(/\s+/);
        if (parts.length < 3) return oklabStr;
        
        const l_val = parts[0];
        const a_val = parts[1];
        const b_val = parts[2];
        
        const l = l_val.endsWith('%') ? parseFloat(l_val) / 100 : parseFloat(l_val);
        const a = a_val.endsWith('%') ? parseFloat(a_val) / 100 : parseFloat(a_val);
        const b = b_val.endsWith('%') ? parseFloat(b_val) / 100 : parseFloat(b_val);
        
        let alpha = 1;
        if (alphaPart) {
          const aNormal = alphaPart.trim();
          alpha = aNormal.endsWith('%') ? parseFloat(aNormal) / 100 : parseFloat(aNormal);
        } else if (parts.length === 4) {
          const aNormal = parts[3];
          alpha = aNormal.endsWith('%') ? parseFloat(aNormal) / 100 : parseFloat(aNormal);
        }
        
        const c = Math.sqrt(a * a + b * b);
        let h = Math.atan2(b, a) * (180 / Math.PI);
        if (h < 0) h += 360;
        
        const hue = Math.round(((h % 360) + 360) % 360);
        const saturation = Math.round(Math.min(100, (c / 0.4) * 100));
        const lightness = Math.round(l * 100);
        
        if (alpha === 1) {
          return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else {
          return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        }
      };

      const replaceUnsupportedColorFunctions = (cssText: string): string => {
        if (!cssText) return cssText;
        
        const targets = ["oklch(", "oklab(", "color-mix("];
        let result = cssText;
        
        for (const target of targets) {
          let index = result.indexOf(target);
          while (index !== -1) {
            let parenCount = 1;
            let i = index + target.length;
            while (i < result.length && parenCount > 0) {
              if (result[i] === '(') {
                parenCount++;
              } else if (result[i] === ')') {
                parenCount--;
              }
              i++;
            }
            
            if (parenCount === 0) {
              const fullMatch = result.substring(index, i);
              let fallback = "rgb(255, 255, 255)";
              if (target === "oklch(") {
                try {
                  fallback = oklchToHsl(fullMatch);
                } catch (e) {
                  fallback = "rgb(255, 255, 255)";
                }
              } else if (target === "oklab(") {
                try {
                  fallback = oklabToHsl(fullMatch);
                } catch (e) {
                  fallback = "rgb(255, 255, 255)";
                }
              } else if (target === "color-mix(") {
                fallback = "rgb(150, 150, 150)";
              }
              
              result = result.substring(0, index) + fallback + result.substring(i);
            } else {
              break;
            }
            
            index = result.indexOf(target);
          }
        }
        
        return result;
      };

      const cleanColorValue = (val: string): string => {
        if (!val || typeof val !== "string") {
          return val;
        }
        return replaceUnsupportedColorFunctions(val);
      };

      // 1. Intercept getComputedStyle to convert modern oklab/oklch colors
      (window as any).getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
        const style = originalGetComputedStyle(elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === "getPropertyValue") {
              return function (key: string) {
                return cleanColorValue(target.getPropertyValue(key));
              };
            }
            const val = Reflect.get(target, prop, target);
            if (typeof val === "function") {
              return val.bind(target);
            }
            if (typeof val === "string") {
              return cleanColorValue(val);
            }
            return val;
          }
        });
      };

      // 2. Temporarily clean styles in document style tags
      const styleElements = Array.from(document.querySelectorAll("style"));
      styleElements.forEach((styleEl) => {
        const text = styleEl.textContent || "";
        if (text.includes("oklab") || text.includes("oklch") || text.includes("color-mix")) {
          originalStylesText.set(styleEl, text);
          styleEl.textContent = replaceUnsupportedColorFunctions(text);
        }
      });

      const pdfPageIds = ["pdf-page-1", "pdf-page-2", "pdf-page-3", "pdf-page-4", "pdf-page-5", "pdf-page-6"];
      if (data.recentComments?.length > 0) {
        pdfPageIds.push("pdf-page-7");
      }

      // Convert all pages to canvases in parallel
      const canvasPromises = pdfPageIds.map(async (pageId) => {
        const el = document.getElementById(pageId);
        if (!el) {
          console.warn(`PDF page element with ID ${pageId} not found`);
          return null;
        }

        const canvas = await html2canvas(el, {
          scale: 2, // High definition scale
          useCORS: true,
          backgroundColor: isPrime ? "#0b0f19" : "#f8fafc",
          logging: false
        });

        return canvas.toDataURL("image/png");
      });

      const imagesData = await Promise.all(canvasPromises);

      const pdf = new jsPDF("p", "mm", "a4");
      let pageIndex = 0;

      for (let i = 0; i < imagesData.length; i++) {
        const imgData = imagesData[i];
        if (!imgData) continue;

        if (pageIndex > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "FAST");
        pageIndex++;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const branchName = selectedBranch === 'all' ? 'Nacional' : (branches.find(b => b.id === selectedBranch)?.name || selectedBranch);
      pdf.save(`REPORTE_CX_CINEPLANET_${branchName.toUpperCase().replace(/\s+/g, '_')}_${timestamp}.pdf`);
    } catch (error) {
      console.error("PDF Export Failure:", error);
      alert("Error al generar el reporte: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      // Restore original getComputedStyle and document style blocks
      window.getComputedStyle = originalGetComputedStyle;
      originalStylesText.forEach((originalText, styleEl) => {
        try {
          styleEl.textContent = originalText;
        } catch (e) {
          console.error("Failed to restore style tag content", e);
        }
      });
      setIsExportingPDF(false);
    }
  };


  const downloadReport = async () => {
    try {
      setIsExporting(true);
      const res = await fetchWithAuth(`/api/reports/detailed?startDate=${startDate}&endDate=${endDate}&branchId=${selectedBranch}&surveyId=${selectedSurvey}`);
      if (!res.ok) throw new Error("Error al obtener datos del reporte");
      
      const rawData = await res.json();
      
      const wb = XLSX.utils.book_new();
      
      const mapResponseForExcel = (r: any) => ({
        "Código Referencia": r.unique_code || "N/A",
        "ID Respuesta": r.id,
        "Fecha y Hora de Envío": new Date(r.timestamp).toLocaleString('es-PE', { timeZone: 'America/Lima' }),
        "Sede / Complejo": r.branch_name,
        "Tipo de Encuesta": r.survey_title,
        "Clasificación NPS": r.kpi_nps >= 9 ? 'PROMOTOR' : r.kpi_nps >= 7 ? 'NEUTRO' : 'PASIVO/DETRACTOR',
        "Score NPS (0-10)": r.kpi_nps,
        "Puntaje Dulcería": r.kpi_csat_dulceria || "N/A",
        "Puntaje Proyección": r.kpi_csat_proyeccion || "N/A",
        "Puntaje Amabilidad": r.kpi_csat_amabilidad || "N/A",
        "Puntaje Ingreso": r.kpi_csat_ingreso || "N/A",
        "Puntaje Comodidad": r.kpi_csat_comodidad || "N/A",
        "Puntaje Limpieza Salas": r.kpi_csat_limpieza_salas || "N/A",
        "Puntaje Limpieza Baños": r.kpi_csat_limpieza_baños || "N/A",
        "CX Index (Calculado)": parseFloat((r.cx_score || 0).toFixed(2)),
        "Comentario del Cliente": r.customer_comment || "SIN COMENTARIO",
        "Analista/Encuestador": r.surveyor_name
      });

      const role = (user?.role || "").toUpperCase();
      
      if (['CREATOR', 'CREADOR', 'ANALISTA'].includes(role)) {
        // Separate data by branch for tabs
        const branchesReportMap: Record<string, any[]> = {};
        
        rawData.forEach((r: any) => {
          if (!branchesReportMap[r.branch_name]) {
            branchesReportMap[r.branch_name] = [];
          }
          branchesReportMap[r.branch_name].push(mapResponseForExcel(r));
        });

        // Also add a "General" sheet with everything
        if (rawData.length > 0) {
          const wsGeneral = XLSX.utils.json_to_sheet(rawData.map(mapResponseForExcel));
          XLSX.utils.book_append_sheet(wb, wsGeneral, "General");
        }

        // Create a sheet for each branch
        Object.entries(branchesReportMap).forEach(([branchName, branchData]) => {
          const ws = XLSX.utils.json_to_sheet(branchData);
          XLSX.utils.book_append_sheet(wb, ws, branchName.substring(0, 31).replace(/[\[\]\?\*\/\\\:]/g, '')); // clean sheet name
        });
      } else {
        // Admin or other role: Single sheet for their branch(es)
        const ws = XLSX.utils.json_to_sheet(rawData.map(mapResponseForExcel));
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Sede");
      }

      XLSX.writeFile(wb, `Reporte_CX_Cineplanet_${startDate}_a_${endDate}.xlsx`);
    } catch (error) {
      console.error("Export error:", error);
      alert("Hubo un error al generar el reporte. Inténtalo de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };
  
  const getGoal = (label: string, id?: string) => {
    if (!data?.stats?.goals || !Array.isArray(data.stats.goals)) return null;
    const goalsArray = data.stats.goals;
    const normalizedLabel = label.toLowerCase().trim();
    const normalizedId = (id || "").toLowerCase().trim();
    
    // Find goal in array that matches indicator AND current filters
    const foundGoal = goalsArray.find(g => {
      // 1. Check if the goal applies to the current selection
      const goalBranch = g.branch_id || 'all';
      const goalZone = g.zone_id || 'all';
      
      const branchMatch = selectedBranch === goalBranch;
      const zoneMatch = selectedZone === goalZone;
      
      if (!branchMatch || !zoneMatch) return false;

      // 2. Match indicator
      const gInd = (g.indicator || "").toLowerCase().trim();
      
      // Special mappings
      const mappings: Record<string, string[]> = {
        'kpi_nps': ['nps', 'net promoter score', 'net promoter score (nps)'],
        'kpi_cx': ['cx', 'cx index', 'cx score', 'cx index operativo'],
        'kpi_csat': ['csat', 'satisfacción'],
        'kpi_dulceria': ['dulcería', 'dulceria'],
        'kpi_proyeccion': ['proyección y sonido', 'proyeccion y sonido'],
        'kpi_amabilidad': ['amabilidad colaboradores', 'amabilidad'],
        'kpi_ingreso': ['ingreso a salas', 'ingreso'],
        'kpi_comodidad': ['comodidad asientos', 'comodidad'],
        'kpi_limpieza_salas': ['limpieza salas'],
        'kpi_limpieza_baños': ['limpieza baños', 'limpieza banos']
      };

      if (gInd === normalizedId || gInd === normalizedLabel) return true;
      if (mappings[gInd]?.includes(normalizedId) || mappings[gInd]?.includes(normalizedLabel)) return true;
      
      return normalizedLabel.includes(gInd) || gInd.includes(normalizedLabel);
    });
    
    return foundGoal && foundGoal.target > 0 ? foundGoal : null;
  };

  const getLimaDate = (date: Date = new Date()) => {
    return new Intl.DateTimeFormat('fr-CA', { 
      timeZone: 'America/Lima', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(date);
  };

  // Date and Branch filtering state
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getLimaDate(d);
  });
  const [endDate, setEndDate] = useState<string>(() => getLimaDate());
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [selectedSurvey, setSelectedSurvey] = useState<string>("");
  const [dashboardType, setDashboardType] = useState<"GENERAL" | "PRIME">("GENERAL");
  const [activeTab, setActiveTab] = useState<"ANALYSIS" | "GOALS">("ANALYSIS");
  const isPrime = dashboardType === "PRIME";

  // Helper properties for role-based dashboard visibility
  const userRole = (user?.role || "").toUpperCase();
  const isManagement = ['CREATOR', 'CREADOR', 'ANALISTA', 'ZONAL'].includes(userRole);
  const hasPrimeBranch = branches.some((b: any) => b.tipo_cine?.toUpperCase() === 'PRIME');

  // Show both Classic and Prime selector ONLY for Zonal, Analista, and Creador/Creator
  const showTypeSwitcher = isManagement;

  useEffect(() => {
    if (userRole === 'ADMINISTRADOR' && branches.length > 0) {
      if (hasPrimeBranch) {
        setDashboardType("PRIME");
      } else {
        setDashboardType("GENERAL");
      }
    }
  }, [userRole, branches, hasPrimeBranch]);
  
  // Temporary states for the inputs
  const [tempStart, setTempStart] = useState<string>(startDate || "");
  const [tempEnd, setTempEnd] = useState<string>(endDate || "");
  const [tempBranch, setTempBranch] = useState<string>("all");
  const [tempZone, setTempZone] = useState<string>("all");
  const [tempSurvey, setTempSurvey] = useState<string>("");

  const fetchMetadata = useCallback(() => {
    // Fetch branches and surveys for all authorized dashboard users
    const role = (user?.role || "").toUpperCase();
    const userZones = user?.zone_ids || [];

    if (['CREATOR', 'CREADOR', 'ANALISTA', 'MANAGER', 'ZONAL'].includes(role)) {
      fetchWithAuth("/api/branches")
        .then(res => res.json())
        .then(data => {
          const branchesArr = Array.isArray(data) ? data : [];
          const sortedBranches = branchesArr.sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));
          if (role === 'ZONAL') {
            setBranches(sortedBranches.filter((b: any) => userZones.includes(b.zone_id)));
          } else {
            setBranches(sortedBranches);
          }
        })
        .catch(console.error);

      fetchWithAuth("/api/zones")
        .then(res => res.json())
        .then(data => {
          const zonesArr = Array.isArray(data) ? data : [];
          const sortedZones = zonesArr.sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));
          if (role === 'ZONAL') {
            const filteredZones = sortedZones.filter((z: any) => userZones.includes(z.id));
            setZones(filteredZones);
            if (filteredZones.length === 1 && selectedZone === 'all') {
              setTempZone(filteredZones[0].id);
              setSelectedZone(filteredZones[0].id);
            }
          } else {
            setZones(sortedZones);
          }
        })
        .catch(console.error);
    } else if (role === "ADMINISTRADOR") {
      const userBranches = user?.branches || [];
      fetchWithAuth("/api/branches")
        .then(res => res.json())
        .then(data => {
          const branchesArr = Array.isArray(data) ? data : [];
          const sortedBranches = branchesArr.sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));
          const filteredBranches = sortedBranches.filter((b: any) => userBranches.includes(b.id));
          setBranches(filteredBranches);
          if (filteredBranches.length === 1 && selectedBranch === 'all') {
            setTempBranch(filteredBranches[0].id);
            setSelectedBranch(filteredBranches[0].id);
          }
        })
        .catch(console.error);

      fetchWithAuth("/api/zones")
        .then(res => res.json())
        .then(data => {
          const zonesArr = Array.isArray(data) ? data : [];
          const sortedZones = zonesArr.sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));
          fetchWithAuth("/api/branches").then(r => r.json()).then(brs => {
            const adminBrs = brs.filter((b: any) => userBranches.includes(b.id));
            const adminZoneIds = [...new Set(adminBrs.map((b: any) => b.zone_id))];
            setZones(sortedZones.filter((z: any) => adminZoneIds.includes(z.id)));
          });
        })
        .catch(console.error);
    }
        
    fetchWithAuth("/api/surveys")
      .then(res => res.json())
      .then(data => {
        const surveysArr = Array.isArray(data) ? data : [];
        setSurveys(surveysArr);
        if (surveysArr.length > 0 && !selectedSurvey && selectedSurvey !== 'all') {
          setSelectedSurvey(surveysArr[0].id);
          setTempSurvey(surveysArr[0].id);
        }
      })
      .catch(console.error);

    fetchWithAuth("/api/kpi-configs")
      .then(res => res.json())
      .then(data => setKpiConfigs(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [user, fetchWithAuth, selectedBranch, selectedZone, selectedSurvey]);

  const fetchDashboardData = useCallback(() => {
    if (!selectedSurvey && surveys.length > 0) {
      setLoading(false);
      return;
    }
    
    // if isPrime is false, it's the global dashboard (Clásico + Prime)
    // if isPrime is true, it's strictly Prime
    const tipoCineParam = isPrime ? 'PRIME' : 'all';
    
    setLoading(true);
    console.log(`Fetching dashboard data for: survey=${selectedSurvey}, branch=${selectedBranch}, zone=${selectedZone}, tipo_cine=${tipoCineParam}`);
    
    fetchWithAuth(`/api/analytics?startDate=${startDate}&endDate=${endDate}&branchId=${selectedBranch}&zoneId=${selectedZone}&surveyId=${selectedSurvey}&tipo_cine=${tipoCineParam}`)
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch analytics");
      }
      return res.json();
    })
    .then(receivedData => {
      if (!receivedData) return;
      const sanitize = (val: any): any => {
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        if (Array.isArray(val)) return val.map(sanitize);
        if (val && typeof val === 'object') {
          const res: any = {};
          Object.keys(val).forEach(k => { res[k] = sanitize(val[k]); });
          return res;
        }
        return val;
      };

      const sanitizedData = sanitize({
        stats: {
          ...(receivedData.stats || {}),
          goals: receivedData.goals || []
        },
        branchPerformance: Array.isArray(receivedData.branchPerformance) ? receivedData.branchPerformance : [],
        timeline: Array.isArray(receivedData.timeline) ? receivedData.timeline : [],
        recentComments: Array.isArray(receivedData.recentComments) ? receivedData.recentComments : [],
        questionStats: Array.isArray(receivedData.questionStats) ? receivedData.questionStats : [],
        indicatorAnalysis: receivedData.indicatorAnalysis || {},
        goal_tracking: Array.isArray(receivedData.goal_tracking) ? receivedData.goal_tracking : []
      });
      setData(sanitizedData);
    })
    .catch(err => {
      console.error("Error loading analytics:", err);
      setData({
        stats: { nps: 0, avg_cx: 0, total_responses: 0 },
        branchPerformance: [],
        timeline: [],
        recentComments: [],
        questionStats: [],
        indicatorAnalysis: {}
      });
    })
    .finally(() => setLoading(false));
  }, [fetchWithAuth, startDate, endDate, selectedBranch, selectedZone, selectedSurvey, isPrime]);

  const applyFilters = () => {
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setSelectedBranch(tempBranch);
    setSelectedZone(tempZone);
    setSelectedSurvey(tempSurvey);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const socket = io();

    socket.on("connect", () => {
      socket.emit("join-dashboard");
    });

    socket.on("refresh-dashboard", (payload: any) => {
      console.log("Real-time update received:", payload);
      // If it's a metadata change (surveys/kpis), refresh everything
      if (payload.source === 'surveys' || payload.source === 'kpis') {
        fetchMetadata();
      }
      
      // Always refresh analytics if relevant
      if (selectedBranch === "all" || payload.branch_id === "all" || selectedBranch === payload.branch_id) {
        fetchDashboardData();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedBranch, fetchDashboardData]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  if (loading && !data) return <div className="p-20 text-slate-800 font-mono text-xs uppercase tracking-widest animate-pulse flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin" /> Iniciando escaneo de red...</div>;
  if (!data) return <div className="p-20 text-rose-500 font-mono text-xs uppercase tracking-widest flex items-center gap-3"><AlertTriangle className="w-4 h-4" /> Error de conexión con el núcleo de datos</div>;

  const getKpiName = (key: string, fallback: string) => {
    if (!kpiConfigs || kpiConfigs.length === 0) return fallback;
    const normalizedKey = key.toLowerCase().trim();
    const config = kpiConfigs.find(c => 
      c.formula?.toLowerCase().trim() === normalizedKey || 
      c.name?.toLowerCase().trim() === normalizedKey
    );
    return config ? config.name : fallback;
  };

  const getNormalizedKpiLabel = (label: string): string => {
    const normalized = label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();

    // Check Limpieza first to resolve specific cleaning targets cleanly
    if (normalized.includes("LIMPIEZA")) {
      if (normalized.includes("BAÑO") || normalized.includes("BANO") || normalized.includes("SSHH") || normalized.includes("TOILET")) {
        return "LIMPIEZA BAÑOS";
      }
      return "LIMPIEZA SALAS";
    }

    if (normalized.includes("DULCERIA") || normalized.includes("DULCE") || normalized.includes("CANDY") || normalized.includes("DUL")) return "DULCERÍA";
    if (normalized.includes("PROYECCION") || normalized.includes("SONIDO") || normalized.includes("IMAGE") || normalized.includes("PANTALLA") || normalized.includes("PROY")) return "PROYECCIÓN Y SONIDO";
    if (normalized.includes("AMABILIDAD") || normalized.includes("COLABORADO") || normalized.includes("PERSONAL") || normalized.includes("TRATO") || normalized.includes("STAFF") || normalized.includes("ATENCION") || normalized.includes("AMAB")) return "AMABILIDAD COLABORADORES";
    if (normalized.includes("INGRESO") || normalized.includes("ACCESO") || normalized.includes("ENTRADA") || normalized.includes("BOLET") || normalized.includes("TICKET") || normalized.includes("INGR")) return "INGRESO A SALAS";
    if (normalized.includes("COMODIDAD") || normalized.includes("ASIENTO") || normalized.includes("BUTACA") || normalized.includes("CONFORT") || normalized.includes("COMOD") || normalized.includes("SILLA")) return "COMODIDAD ASIENTOS";
    
    return label;
  };

  const stats = data.stats || {};
  const goals = stats.goals || [];
  const kpiBreakdown = stats.nps_dist || { p_pct: 0, n_pct: 0, d_pct: 0, promoters: 0, neutrals: 0, detractors: 0 };

  const kpis = [
    { 
      label: "Net Promoter Score (NPS)", 
      value: (stats.nps || 0).toFixed(1), 
      total: 100, 
      color: (stats.nps || 0) > 30 ? "bg-emerald-500" : (stats.nps || 0) > 0 ? "bg-amber-500" : "bg-red-500", 
      min: -100,
      breakdown: [
        { label: "P", value: kpiBreakdown.p_pct, color: "bg-emerald-500", count: kpiBreakdown.promoters },
        { label: "N", value: kpiBreakdown.n_pct, color: "bg-amber-400", count: kpiBreakdown.neutrals },
        { label: "D", value: kpiBreakdown.d_pct, color: "bg-red-500", count: kpiBreakdown.detractors }
      ]
    },
    { label: "Total Respuestas", value: stats.total_responses || 0, total: null, color: "bg-brand-blue" },
    { label: "CX Index Operativo", value: (stats.avg_cx || 0).toFixed(1), total: 10, color: "bg-[#002d5d]", dark: true },
  ];

  // Dynamic Operational KPIs based on survey questions AND/OR default KPIs
  const kpiDefinitions = [
    { id: 'csat_dulceria', label: getKpiName('CSAT_DULCERIA', "DULCERÍA"), key: 'csat_dulceria', dist: 'dulceria_dist' },
    { id: 'csat_proyeccion', label: getKpiName('CSAT_PROYECCION_Y_SONIDO', "PROYECCIÓN Y SONIDO"), key: 'csat_proyeccion', dist: 'proyeccion_dist' },
    { id: 'csat_amabilidad', label: getKpiName('CSAT_AMABILIDAD_COLABORADORES', "AMABILIDAD COLABORADORES"), key: 'csat_amabilidad', dist: 'amabilidad_dist' },
    { id: 'csat_ingreso', label: getKpiName('CSAT_INGRESO_A_SALAS', "INGRESO A SALAS"), key: 'csat_ingreso', dist: 'ingreso_dist' },
    { id: 'csat_comodidad', label: getKpiName('CSAT_COMODIDAD_ASIENTOS', "COMODIDAD ASIENTOS"), key: 'csat_comodidad', dist: 'comodidad_dist' },
    { id: 'csat_limpieza_salas', label: getKpiName('CSAT_LIMPIEZA_SALAS', "LIMPIEZA SALAS"), key: 'csat_limpieza_salas', dist: 'limpieza_salas_dist' },
    { id: 'csat_limpieza_baños', label: getKpiName('CSAT_LIMPIEZA_BAÑOS', "LIMPIEZA BAÑOS"), key: 'csat_limpieza_baños', dist: 'limpieza_baños_dist' }
  ];

  // Logic to determine which KPIs to show
  let operationalKPIs = [];

  if (selectedSurvey && selectedSurvey !== 'all' && data.questionStats && data.questionStats.length > 0) {
    // IF A SPECIFIC SURVEY IS SELECTED: Show all measurable questions (Rating/NPS/CSAT)
    const survey = surveys.find(s => s.id === selectedSurvey);
    let questions = [];
    try {
      const config = typeof survey?.config === 'string' ? JSON.parse(survey.config) : (survey?.config || {});
      questions = config.questions || [];
    } catch (e) {
      console.error("Error parsing survey config for dashboard:", e);
    }
    
    // Deduplicate by Label and ensure clean mapping
    const uniqueKPIs = new Map<string, any>();
    
    questions
      .filter((q: any) => q.type === 'rating' || q.type === 'nps' || q.type === 'csat')
      .forEach((q: any) => {
        const qs = data.questionStats.find((s: any) => s.question_key === q.id) || {
          avg_value: 0,
          total_votes: 0,
          positive_votes: 0,
          neutral_votes: 0,
          negative_votes: 0,
          nps_promoters: 0,
          nps_neutrals: 0,
          nps_detractors: 0
        };
        
        const labelText = q.label || q.id;
        const kpiLabel = getKpiName(q.indicator || q.id, labelText.toUpperCase());
        const total = qs.total_votes || 0;
        
        // Detection of NPS vs CSAT
        const isNPS = q.type === 'nps' || 
                      (q.type === 'rating' && q.scale_max === 10) || 
                      (q.indicator && q.indicator.toUpperCase().includes('NPS'));
        
        let p_count, n_count, d_count, score;
        
        if (isNPS) {
          p_count = qs.nps_promoters || 0;
          n_count = qs.nps_neutrals || 0;
          d_count = qs.nps_detractors || 0;
          const p_pct = total > 0 ? (p_count / total) * 100 : 0;
          const d_pct = total > 0 ? (d_count / total) * 100 : 0;
          score = p_pct - d_pct;
        } else {
          p_count = qs.positive_votes || 0;
          n_count = qs.neutral_votes || 0;
          d_count = qs.negative_votes || 0;
          // Percentage of excellence (Positive Votes / Total)
          score = total > 0 ? (p_count / total) * 100 : 0;
        }
        
        const kpiData = {
          id: q.id,
          label: kpiLabel,
          score: score,
          isNPS: isNPS,
          dist: {
            count: total,
            promoters: p_count,
            neutrals: n_count,
            detractors: d_count,
            p_pct: total > 0 ? (p_count / total) * 100 : 0,
            n_pct: total > 0 ? (n_count / total) * 100 : 0,
            d_pct: total > 0 ? (d_count / total) * 100 : 0
          }
        };

        // If duplicate label, keep the one with more votes or the one already there
        if (!uniqueKPIs.has(kpiLabel) || total > uniqueKPIs.get(kpiLabel).dist.count) {
          uniqueKPIs.set(kpiLabel, kpiData);
        }
      });
      
    operationalKPIs = Array.from(uniqueKPIs.values()).filter((k: any) => k.dist.count > 0);
  } else if (data.indicatorAnalysis && Object.keys(data.indicatorAnalysis).length > 0) {
    // IF ALL SURVEYS ARE SELECTED: Show all indicators found in dynamic analysis
    // This solves the "some are blank" issue by pulling aggregate data for ANY indicator string assigned
    operationalKPIs = Object.entries(data.indicatorAnalysis).map(([key, ia]: [string, any]) => {
      const isNPS = ia.type === 'nps' || 
                    (ia.type === 'rating' && ia.scale_max === 10) || 
                    key.includes('NPS');
      const total = ia.total || 0;
      let score;
      
      if (isNPS) {
        const p_pct = total > 0 ? (ia.prom / total) * 100 : 0;
        const d_pct = total > 0 ? (ia.detr / total) * 100 : 0;
        score = p_pct - d_pct;
      } else {
        score = total > 0 ? (ia.pos / total) * 100 : 0;
      }

      return {
        id: key,
        label: getKpiName(key, key),
        score: score,
        isNPS: isNPS,
        dist: {
          count: total,
          promoters: isNPS ? ia.prom : ia.pos,
          neutrals: isNPS ? ia.neu : ia.neu,
          detractors: isNPS ? ia.detr : ia.neg,
          p_pct: total > 0 ? (isNPS ? ia.prom : ia.pos) / total * 100 : 0,
          n_pct: total > 0 ? (isNPS ? ia.neu : ia.neu) / total * 100 : 0,
          d_pct: total > 0 ? (isNPS ? ia.detr : ia.neg) / total * 100 : 0
        }
      };
    }).filter((k: any) => k.dist.count > 0).sort((a, b) => b.dist.count - a.dist.count);
  } else {
    // Fallback to core aggregate KPIs if indicatorAnalysis is not yet available
    // Ensure we filter out those with 0 responses to keep it clean
    operationalKPIs = kpiDefinitions
      .map(k => ({
        id: k.id,
        label: k.label,
        score: stats[k.key] || 0,
        isNPS: k.label.includes('NPS') || k.id.includes('nps'),
        dist: stats[k.dist] || { promoters: 0, neutrals: 0, detractors: 0, count: 0, p_pct: 0, n_pct: 0, d_pct: 0 }
      }))
      .filter(k => k.dist.count > 0);
    
    // If still empty, might as well show the default ones so it doesn't look broken
    if (operationalKPIs.length === 0) {
        operationalKPIs = kpiDefinitions.map(k => ({
            id: k.id,
            label: k.label,
            score: 0,
            isNPS: k.label.includes('NPS') || k.id.includes('nps'),
            dist: { promoters: 0, neutrals: 0, detractors: 0, count: 0, p_pct: 0, n_pct: 0, d_pct: 0 }
        }));
    }
  }

  // Final deduplication and data cleansing for Operational KPIs
  const uniqueKPIsMap = new Map();
  operationalKPIs.forEach(kpi => {
    const cleanLabel = getNormalizedKpiLabel(kpi.label);
    
    // Skip main NPS (Net Promoter Score) from the sub-kpi graphs as they are already displayed on top
    const normalizedLabel = cleanLabel.toUpperCase();
    if (normalizedLabel === "NPS" || normalizedLabel.includes("NET PROMOTER SCORE")) {
      return;
    }

    // Normalize more aggressively to avoid repeats (accents, case, extra whitespace)
    const labelKey = cleanLabel
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
      
    // If we have duplicates, prefer the one with more data (responses)
    if (!uniqueKPIsMap.has(labelKey) || (kpi.dist.count > uniqueKPIsMap.get(labelKey).dist.count)) {
      uniqueKPIsMap.set(labelKey, {
        ...kpi,
        label: cleanLabel
      });
    }
  });
  operationalKPIs = Array.from(uniqueKPIsMap.values());

  return (
    <div ref={dashboardRef} className={cn("w-full space-y-8 md:space-y-12 pb-20 transition-colors duration-700", isPrime ? "bg-slate-950 px-4 md:px-8 py-8 md:py-12 rounded-[3.5rem]" : "")}>
      {/* Dashboard Tabs & Type Switcher */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
        {showTypeSwitcher && (
          <div className={cn("p-1 rounded-2xl border shadow-xl flex gap-1", isPrime ? "bg-slate-900 border-white/10" : "bg-white border-slate-200")}>
            <button 
              onClick={() => setDashboardType("GENERAL")}
              className={cn(
                "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                !isPrime ? "bg-brand-blue text-white shadow-lg" : "text-slate-500 hover:bg-white/5"
              )}
            >
              Clásico
            </button>
            <button 
              onClick={() => setDashboardType("PRIME")}
              className={cn(
                "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                isPrime ? "bg-brand-accent text-slate-950 shadow-lg shadow-brand-accent/20" : "text-slate-400 hover:bg-slate-50"
              )}
            >
              Prime ✨
            </button>
          </div>
        )}

        <div className={cn("p-1 rounded-2xl border shadow-xl flex gap-1", isPrime ? "bg-slate-900 border-white/10" : "bg-white border-slate-200")}>
          <button 
            onClick={() => setActiveTab("ANALYSIS")}
            className={cn(
              "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === "ANALYSIS" 
                ? (isPrime ? "bg-white/10 text-white shadow-inner" : "bg-slate-100 text-slate-900") 
                : (isPrime ? "text-slate-500 hover:bg-white/5" : "text-slate-400 hover:bg-slate-50")
            )}
          >
            <BarChart3 className="w-3 h-3" />
            Análisis
          </button>
          <button 
            onClick={() => setActiveTab("GOALS")}
            className={cn(
              "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === "GOALS" 
                ? (isPrime ? "bg-white/10 text-white shadow-inner" : "bg-slate-100 text-slate-900") 
                : (isPrime ? "text-slate-500 hover:bg-white/5" : "text-slate-400 hover:bg-slate-50")
            )}
          >
            <TrendingUp className="w-3 h-3" />
            Metas
          </button>
        </div>
      </div>

      <div id="pdf-dashboard-container" className="space-y-12">
        {/* Header Section */}
        <header id="dashboard-header-preview" className={cn("flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b pb-8 md:pb-12", isPrime ? "border-brand-accent/20" : "border-slate-200")}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,173,239,0.5)]", isPrime ? "bg-brand-accent" : "bg-brand-blue-light")}></div>
            <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", isPrime ? "text-brand-accent" : "text-brand-blue-light")}>Gestión de Experiencia {isPrime ? 'Premium' : 'Corporativa'}</span>
          </div>
          <h2 className={cn("text-2xl md:text-3xl font-display font-black uppercase tracking-tight leading-tight", isPrime ? "text-white" : "text-slate-900")}>
            Indicadores de <span className={cn("relative", isPrime ? "text-brand-accent" : "text-brand-blue")}>
              Satisfacción {isPrime ? 'Prime' : ''}
              <span className={cn("absolute bottom-0 left-0 w-full h-1 md:h-1.5 -z-10", isPrime ? "bg-brand-accent/20" : "bg-brand-accent/40")}></span>
            </span>
          </h2>
        </div>
        
        {/* Date Filter Controls */}
        <div className={cn("flex flex-wrap items-center gap-3 md:gap-4", isExportingPDF && "hidden")}>
          {/* Zone Selector */}
          {((user?.role?.toUpperCase() === 'CREATOR' || user?.role?.toUpperCase() === 'CREADOR' || user?.role?.toUpperCase() === 'ANALISTA' || user?.role?.toUpperCase() === 'ZONAL')) && (
            <div className={cn("flex-1 min-w-[160px] md:flex-none flex items-center gap-3 px-4 py-2.5 border rounded-xl group transition-all shadow-sm", isPrime ? "bg-slate-900 border-white/10 hover:border-brand-accent" : "bg-white border-slate-200 hover:border-brand-blue")}>
                <MapPin className={cn("w-4 h-4 shrink-0", isPrime ? "text-brand-accent" : "text-slate-400 group-hover:text-brand-blue")} />
                <div className="flex flex-col flex-1">
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Zona / Región</span>
                  <select
                    value={tempZone}
                    onChange={(e) => {
                      setTempZone(e.target.value);
                      setTempBranch("all");
                    }}
                    className={cn("bg-transparent text-[11px] font-bold uppercase outline-none cursor-pointer appearance-none w-full", isPrime ? "text-brand-accent" : "text-brand-blue")}
                  >
                    <option value="all">Todas las Zonas</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id} className="bg-slate-900 text-white">{z.name}</option>
                    ))}
                  </select>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </div>
          )}

          {/* Branch Selector */}
          {((user?.role?.toUpperCase() === 'CREATOR' || user?.role?.toUpperCase() === 'CREADOR' || user?.role?.toUpperCase() === 'ANALISTA' || user?.role?.toUpperCase() === 'ZONAL')) && (
            <div className={cn("flex-1 min-w-[160px] md:flex-none flex items-center gap-3 px-4 py-2.5 border rounded-xl group transition-all shadow-sm", isPrime ? "bg-slate-900 border-white/10 hover:border-brand-accent" : "bg-white border-slate-200 hover:border-brand-blue")}>
                <Building2 className={cn("w-4 h-4 shrink-0", isPrime ? "text-brand-accent" : "text-slate-400 group-hover:text-brand-blue")} />
                <div className="flex flex-col flex-1">
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sede</span>
                  <select
                    value={tempBranch}
                    onChange={(e) => setTempBranch(e.target.value)}
                    className={cn("bg-transparent text-[11px] font-bold uppercase outline-none cursor-pointer appearance-none w-full", isPrime ? "text-brand-accent" : "text-brand-blue")}
                  >
                    <option value="all" className="bg-slate-900 text-white">
                      {isPrime ? 'Todos los Cines Prime' : (tempZone !== 'all' ? `Todo ${zones.find(z => z.id === tempZone)?.name}` : 'Red Nacional')}
                    </option>
                    {branches
                      .filter(b => tempZone === 'all' || b.zone_id === tempZone)
                      .filter(b => !isPrime || b.tipo_cine === 'PRIME')
                      .map(b => (
                        <option key={b.id} value={b.id} className="bg-slate-900 text-white">{b.name}</option>
                      ))}
                  </select>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </div>
          )}

          <div className={cn("flex-1 min-w-[160px] md:flex-none flex items-center gap-3 px-4 py-2.5 border rounded-xl group transition-all shadow-sm", isPrime ? "bg-slate-900 border-white/10 hover:border-brand-accent" : "bg-white border-slate-200 hover:border-brand-blue")}>
            <FileText className={cn("w-4 h-4 shrink-0", isPrime ? "text-brand-accent" : "text-slate-400 group-hover:text-brand-blue")} />
            <div className="flex flex-col flex-1">
              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Canal</span>
              <select
                value={tempSurvey}
                onChange={(e) => setTempSurvey(e.target.value)}
                className={cn("bg-transparent text-[11px] font-bold uppercase outline-none cursor-pointer appearance-none w-full", isPrime ? "text-brand-accent" : "text-brand-blue")}
              >
                <option value="all" className="bg-slate-900 text-white">Todas las Encuestas</option>
                {surveys.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.title}</option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </div>

          <div className={cn("w-full md:w-auto flex flex-wrap items-center gap-3 p-1 rounded-2xl border shadow-sm sm:flex-nowrap", isPrime ? "bg-slate-900 border-white/10" : "bg-white border-slate-200")}>
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex flex-col">
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Desde</span>
                <input 
                  type="date" 
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className={cn("bg-transparent text-[10px] font-bold outline-none", isPrime ? "text-white" : "text-slate-900")}
                />
              </div>
              <div className="w-px h-6 bg-slate-200 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Hasta</span>
                <input 
                  type="date" 
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className={cn("bg-transparent text-[10px] font-bold outline-none", isPrime ? "text-white" : "text-slate-900")}
                />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto px-2 pb-2 sm:pb-0">
              <button 
                onClick={applyFilters}
                className={cn("flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap", isPrime ? "bg-brand-accent text-slate-900" : "bg-brand-blue text-white")}
              >
                Actualizar
              </button>
              
              <button 
                onClick={downloadReport}
                disabled={isExporting || isExportingPDF}
                className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all active:scale-95"
                title="Excel"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </button>

              <button 
                onClick={exportAsPDF}
                disabled={isExporting || isExportingPDF}
                className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all active:scale-95"
                title="PDF"
              >
                {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === "ANALYSIS" ? (
        <div className="space-y-12">
          {/* Stats Cards Grid */}
          <div id="stats-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {kpis.map((kpi, i) => {
              const numericValue = parseFloat(String(kpi.value)) || 0;
              const goalItem = getGoal(kpi.label, kpi.label.split(' (')[0]);
              const diffValue = goalItem ? numericValue - goalItem.target : null;
              
              return (
                <motion.div 
                  key={kpi.label}
                  id={`kpi-card-${i}`}
                  initial={isExportingPDF || isExportingImage ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={isExportingPDF || isExportingImage ? { duration: 0 } : { delay: i * 0.1, duration: 0.4 }}
                  className={cn("p-6 md:p-8 rounded-[2.5rem] border shadow-sm relative group overflow-hidden transition-all", isPrime ? "bg-slate-900/80 border-white/5 hover:border-brand-accent/30 shadow-brand-accent/5 backdrop-blur-md" : "bg-white border-slate-200 hover:shadow-xl hover:border-brand-blue/10")}
                >
                  <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-1000", isPrime ? "bg-brand-accent/10" : "bg-brand-blue/5")}></div>
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
                      <div className="flex items-baseline gap-2">
                        <h2 className={cn("text-3xl md:text-4xl font-display font-black tracking-tight", kpi.dark && !isPrime ? "text-slate-900" : isPrime ? "text-brand-accent drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]" : "text-brand-blue")}>
                          {kpi.value}
                          {kpi.label.includes("NPS") && <span className="text-xl ml-1 text-slate-400">%</span>}
                        </h2>
                        {diffValue !== null && goalItem && (
                          <div className={cn(
                            "flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-bold",
                            diffValue >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                          )}>
                            {diffValue >= 0 ? '↑' : '↓'}{Math.abs(diffValue).toFixed(1)}
                            <span className="opacity-60 ml-1">vs meta</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 relative z-20">
                      <button 
                        onClick={() => captureChart(`kpi-card-${i}`, kpi.label.replace(/\s+/g, '_'))}
                        className={cn("w-8 h-8 rounded-xl border flex items-center justify-center transition-all shadow-sm opacity-0 group-hover:opacity-100", isPrime ? "bg-slate-800 border-white/10 text-white hover:bg-brand-accent hover:text-slate-900" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-brand-blue hover:text-white")}
                        title="Descargar Imagen"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isPrime ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-blue/5 text-brand-blue")}>
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center mb-6 relative z-10 w-full max-w-[340px] md:max-w-[380px] mx-auto">
                    <div className="aspect-square w-full relative flex items-center justify-center">
                    {kpi.label.includes("NPS") && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className={cn("text-3xl md:text-4xl font-display font-black italic tracking-tighter leading-none", isPrime ? "text-brand-accent drop-shadow-lg" : "text-brand-blue")}>
                           {numericValue.toFixed(1)}
                         </span>
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Score NPS</span>
                      </div>
                    )}
                    {kpi.label.includes("NPS") && (
                      <ResponsiveContainer width={isExportingPDF || isExportingImage ? 320 : "100%"} height={isExportingPDF || isExportingImage ? 320 : "100%"}>
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Pie
                            data={[
                              { name: 'Promotores', value: kpiBreakdown.promoters || 0, color: '#10b981' },
                              { name: 'Neutros', value: kpiBreakdown.neutrals || 0, color: '#f59e0b' },
                              { name: 'Detractores', value: kpiBreakdown.detractors || 0, color: '#ef4444' }
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius="72%"
                            outerRadius="98%"
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            isAnimationActive={!isExportingPDF && !isExportingImage}
                            activeShape={(props: any) => {
                              const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                              return (
                                <g>
                                  <Sector
                                    cx={cx}
                                    cy={cy}
                                    innerRadius={innerRadius}
                                    outerRadius={outerRadius + 8}
                                    startAngle={startAngle}
                                    endAngle={endAngle}
                                    fill={fill}
                                  />
                                </g>
                              );
                            }}
                          >
                            {[
                              { name: 'Promotores', value: kpiBreakdown.promoters || 0, color: '#10b981' },
                              { name: 'Neutros', value: kpiBreakdown.neutrals || 0, color: '#f59e0b' },
                              { name: 'Detractores', value: kpiBreakdown.detractors || 0, color: '#ef4444' }
                            ].filter(d => d.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                             contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '11px', backgroundColor: isPrime ? '#0f172a' : 'white', color: isPrime ? 'white' : 'black' }}
                             itemStyle={{ fontWeight: 800, textTransform: 'uppercase' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}

                    {kpi.label.includes("CX Index") && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className={cn("text-3xl md:text-4xl font-display font-black italic tracking-tighter leading-none", isPrime ? "text-brand-accent drop-shadow-lg" : "text-brand-blue")}>
                           {numericValue.toFixed(1)}
                         </span>
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">CX Index</span>
                      </div>
                    )}
                    {kpi.label.includes("CX Index") && (
                      <ResponsiveContainer width={isExportingPDF || isExportingImage ? 320 : "100%"} height={isExportingPDF || isExportingImage ? 320 : "100%"}>
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Pie
                            data={[
                              { name: 'Puntaje', value: numericValue, color: isPrime ? '#D4AF37' : '#004691' },
                              { name: 'Resto', value: Math.max(0, 10 - numericValue), color: isPrime ? '#1e293b' : '#f1f5f9' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius="72%"
                            outerRadius="98%"
                            startAngle={90}
                            endAngle={450}
                            dataKey="value"
                            stroke="none"
                            activeShape={(props: any) => {
                              const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props;
                              if (index === 1) return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />;
                              return (
                                <g>
                                  <Sector
                                    cx={cx}
                                    cy={cy}
                                    innerRadius={innerRadius}
                                    outerRadius={outerRadius + 8}
                                    startAngle={startAngle}
                                    endAngle={endAngle}
                                    fill={fill}
                                  />
                                </g>
                              );
                            }}
                          >
                            <Cell fill={isPrime ? '#D4AF37' : '#004691'} />
                            <Cell fill={isPrime ? '#1e293b' : '#f1f5f9'} />
                          </Pie>
                          <Tooltip 
                             contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '11px', backgroundColor: isPrime ? '#0f172a' : 'white', color: isPrime ? 'white' : 'black' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}

                    {kpi.label.includes("Total Respuestas") && (
                      <ResponsiveContainer width={isExportingPDF || isExportingImage ? 320 : "100%"} height={isExportingPDF || isExportingImage ? 80 : "20%"} minHeight={80}>
                        <BarChart data={[{ label: 'Total', count: numericValue }]}>
                          <defs>
                            <linearGradient id="colorTotalResp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isPrime ? "#CDAC5D" : "#004691"} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={isPrime ? "#CDAC5D" : "#004691"} stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <Bar 
                            dataKey="count" 
                            fill="url(#colorTotalResp)" 
                            radius={[12, 12, 12, 12]}
                            barSize={120}
                            isAnimationActive={!isExportingPDF && !isExportingImage}
                          >
                            <LabelList 
                              dataKey="count" 
                              position="center" 
                              style={{ fill: '#ffffff', fontSize: '18px', fontWeight: '900', fontStyle: 'italic' }} 
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {!kpi.label.includes("NPS") && !kpi.label.includes("CX Index") && !kpi.label.includes("Total Respuestas") && (
                      <div className={cn("w-32 h-32 rounded-full border-[10px] flex items-center justify-center relative", isPrime ? "border-slate-800" : "border-slate-50")}>
                         <BarChart3 className={cn("w-12 h-12", isPrime ? "text-slate-700" : "text-slate-200")} />
                         <div className={cn("absolute inset-0 rounded-full border-[10px] border-t-transparent animate-[spin_3s_linear_infinite]", isPrime ? "border-brand-accent" : "border-brand-blue")}></div>
                      </div>
                    )}
                    </div>

                    {kpi.label.includes("NPS") && (() => {
                      const total = (kpiBreakdown.promoters || 0) + (kpiBreakdown.neutrals || 0) + (kpiBreakdown.detractors || 0);
                      const getPct = (val: number) => total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                      return (
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-8 px-2 pb-2">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-[#10b981] mb-2 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Prom.</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-[#f59e0b] mb-2 shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Neut.</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-[#ef4444] mb-2 shadow-[0_0_10px_rgba(239,68,68,0.3)]"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Detr.</span>
                          </div>
                        </div>
                      );
                    })()}

                    {kpi.label.includes("Total Respuestas") && (() => {
                      const avgDaily = data.timeline?.length > 0 ? (stats.total_responses / data.timeline.length).toFixed(1) : 0;
                      const maxDaily = data.timeline?.length > 0 ? Math.max(...data.timeline.map((t: any) => t.count || 0)) : 0;
                      return (
                        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mt-8 px-2 pb-2">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Prom. Diarias</span>
                            <span className={cn("text-xl font-black", isPrime ? "text-white" : "text-slate-900")}>{avgDaily}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Máx. Diarias</span>
                            <span className={cn("text-xl font-black", isPrime ? "text-white" : "text-slate-900")}>{maxDaily}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
  
                  <div className="w-full space-y-4 relative z-10 px-2">
                    {/* Goal comparison if available */}
                    {goalItem && (
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objetivo: {goalItem.target}</span>
                        <span className={cn(
                          "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest",
                          numericValue >= (goalItem.target || 0) ? "bg-emerald-500/10 text-emerald-500" : 
                          numericValue >= (goalItem.target || 0) * 0.9 ? "bg-amber-500/10 text-amber-500" : 
                          "bg-rose-500/10 text-rose-500"
                        )}>
                          {numericValue >= (goalItem.target || 0) ? 'Logrado' : 
                           numericValue >= (goalItem.target || 0) * 0.9 ? 'Cerca' : 'Bajo Meta'}
                        </span>
                      </div>
                    )}
                    <div className={cn("w-full h-2.5 rounded-full overflow-hidden shadow-inner", isPrime ? "bg-slate-800" : "bg-slate-100")}>
                      <motion.div 
                         initial={isExportingPDF || isExportingImage ? { width: `${Math.max(0, Math.min(100, kpi.min === -100 ? (numericValue + 100) / 2 : (numericValue / (kpi.total || 100)) * 100)) || 0}%` } : { width: 0 }}
                         animate={{ width: `${Math.max(0, Math.min(100, kpi.min === -100 ? (numericValue + 100) / 2 : (numericValue / (kpi.total || 100)) * 100)) || 0}%` }}
                         transition={{ duration: isExportingPDF || isExportingImage ? 0 : 1.5, ease: "circOut" }}
                         className={cn("h-full rounded-full shadow-lg", isPrime ? "bg-brand-accent/80" : kpi.color)}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Attribute Radar Analysis Replace Temporal Trend */}
          <motion.div 
            id="historical-radar-chart"
            initial={isExportingPDF || isExportingImage ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={isExportingPDF || isExportingImage ? { opacity: 1, y: 0 } : undefined}
            whileInView={isExportingPDF || isExportingImage ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn("p-8 md:p-12 lg:p-16 rounded-[4rem] border shadow-xl overflow-hidden relative", isPrime ? "bg-slate-900/50 border-white/5 backdrop-blur-md" : "bg-white border-slate-200")}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-2xl border flex items-center justify-center", isPrime ? "bg-brand-accent/10 border-brand-accent/20 text-brand-accent" : "bg-brand-blue/5 border-brand-blue/10 text-brand-blue")}>
                     <BarChart3 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Análisis Multidimensional</span>
                </div>
                <h3 className={cn("text-3xl md:text-4xl font-display font-black uppercase tracking-tight leading-none", isPrime ? "text-white" : "text-slate-900")}>
                    Desempeño <span className={cn("italic", isPrime ? "text-brand-accent" : "text-brand-blue")}>por Atributos</span>
                </h3>
                <p className={cn("text-xs font-medium max-w-md", isPrime ? "text-slate-400" : "text-slate-500")}>
                  Visualización del impacto de cada atributo operativo en la experiencia global del cliente.
                </p>
              </div>
            </div>

            <div className="h-[500px] md:h-[600px] w-full">
              <ResponsiveContainer width={isExportingPDF || isExportingImage ? 1100 : "100%"} height={isExportingPDF || isExportingImage ? 550 : "100%"}>
                <BarChart data={operationalKPIs} layout="vertical" margin={{ left: 160, right: 40, bottom: 40, top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isPrime ? "#1e293b" : "#f1f5f9"} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    dataKey="label" 
                    type="category" 
                    width={150}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 900, fill: isPrime ? '#94a3b8' : '#475569' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className={cn("p-4 rounded-2xl border shadow-2xl", isPrime ? "bg-slate-900 border-white/10" : "bg-white border-slate-200")}>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">{d.label}</p>
                            <div className="flex items-center gap-4">
                              <span className={cn("text-2xl font-black", isPrime ? "text-brand-accent" : "text-brand-blue")}>{d.score.toFixed(1)}%</span>
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-slate-500 uppercase">Muestra</span>
                                <span className={cn("text-xs font-black", isPrime ? "text-white" : "text-slate-900")}>{d.dist.count} respuestas</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="score" 
                    radius={[0, 12, 12, 0]} 
                    barSize={32}
                    isAnimationActive={!isExportingPDF && !isExportingImage}
                  >
                    {operationalKPIs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#10b981' : entry.score > 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                    <LabelList 
                      dataKey="score" 
                      position="right" 
                      offset={15} 
                      formatter={(val: any) => `${Number(val).toFixed(1)}%`}
                      style={{ fontSize: '12px', fontWeight: '900', fill: isPrime ? '#fff' : '#475569' }}
                    />
                  </Bar>
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    content={() => (
                      <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mt-8 pb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 rounded-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                           <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Excelencia {`> 80%`}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 rounded-full bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                           <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Regular (60-80%)</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 rounded-full bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.3)]"></div>
                           <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Crítico {`< 60%`}</span>
                        </div>
                      </div>
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

      {/* Analysis Section with Distribution Pie */}
      <motion.div 
        id="global-sentiment-card"
        initial={isExportingPDF || isExportingImage ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={isExportingPDF || isExportingImage ? { opacity: 1, y: 0 } : undefined}
        whileInView={isExportingPDF || isExportingImage ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={cn("p-8 md:p-12 lg:p-16 rounded-[4rem] border shadow-2xl overflow-hidden relative group", isPrime ? "bg-slate-900 border-white/5" : "bg-white border-slate-200 ")}
      >
        <div className={cn("absolute top-0 right-0 w-[500px] h-[500px] -mr-64 -mt-64 rounded-full blur-[80px] pointer-events-none transition-colors duration-1000", isPrime ? "bg-brand-accent/5 group-hover:bg-brand-accent/10" : "bg-brand-blue/5 group-hover:bg-brand-blue/10")}></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 lg:gap-20 relative z-10">
          <div className="lg:w-1/2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-2xl border flex items-center justify-center", isPrime ? "bg-brand-accent/10 border-brand-accent/20 text-brand-accent" : "bg-brand-blue/5 border-brand-blue/10 text-brand-blue")}>
                   <PieIcon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Auditoría de {isPrime ? 'Lealtad Premium' : 'Sentimiento'}</span>
                <button 
                  onClick={() => captureChart("global-sentiment-card", "Mix_Performance_Global")}
                  className={cn("ml-auto lg:hidden w-10 h-10 rounded-2xl border flex items-center justify-center transition-all shadow-sm", isPrime ? "bg-slate-800 border-white/10 text-white hover:bg-brand-accent hover:text-slate-900" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-brand-blue hover:text-white")}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
              <h3 className={cn("text-3xl md:text-4xl xl:text-5xl font-display font-black uppercase tracking-tight leading-[0.95]", isPrime ? "text-white" : "text-slate-900")}>
                Distribución <br className="hidden md:block" />
                <span className={cn("italic", isPrime ? "text-brand-accent" : "text-brand-blue")}>Métrica {isPrime ? 'Premium' : 'Global'}</span> de Lealtad
              </h3>
            </div>
            
            <p className={cn("text-sm md:text-base leading-relaxed max-w-xl font-medium", isPrime ? "text-slate-400" : "text-slate-500")}>
              Estructura porcentual de la lealtad de sus clientes basada en el Net Promoter Score. 
              El balance óptimo es un crecimiento sostenido de los <span className="text-emerald-600 font-black">Promotores</span> minimizando el impacto de los detractores.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 pt-4">
              <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 transition-transform hover:scale-105">
                <span className="text-[9px] font-black text-emerald-600 uppercase mb-2 block tracking-widest">Promotores</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-700">{kpiBreakdown.p_pct?.toFixed(1)}</span>
                  <span className="text-xs font-bold text-emerald-600/50">%</span>
                </div>
              </div>
              <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 transition-transform hover:scale-105">
                <span className="text-[9px] font-black text-amber-600 uppercase mb-2 block tracking-widest">Neutros</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-amber-700">{kpiBreakdown.n_pct?.toFixed(1)}</span>
                  <span className="text-xs font-bold text-amber-600/50">%</span>
                </div>
              </div>
              <div className="p-6 rounded-[2rem] bg-rose-50 border border-rose-100 transition-transform hover:scale-105">
                <span className="text-[9px] font-black text-rose-600 uppercase mb-2 block tracking-widest">Detractores</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-rose-700">{kpiBreakdown.d_pct?.toFixed(1)}</span>
                  <span className="text-xs font-bold text-rose-600/50">%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 flex flex-col items-center justify-center w-full max-w-[450px] lg:max-w-[550px] mx-auto">
            <div className="aspect-square w-full relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center flex-col z-0 pointer-events-none backdrop-blur-[1px] rounded-full">
                <span className={cn("text-6xl md:text-8xl font-display font-black italic tracking-tighter leading-none", isPrime ? "text-brand-accent drop-shadow-2xl" : "text-brand-blue")}>{(stats.nps || 0).toFixed(1)}</span>
                <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">NPS Global</span>
              </div>
              <ResponsiveContainer width={isExportingPDF || isExportingImage ? 450 : "100%"} height={isExportingPDF || isExportingImage ? 450 : "100%"}>
                <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                  <Pie
                    data={[
                      { name: 'Promotores', value: kpiBreakdown.promoters || 0, color: '#10b981' },
                      { name: 'Neutros', value: kpiBreakdown.neutrals || 0, color: '#f59e0b' },
                      { name: 'Detractores', value: kpiBreakdown.detractors || 0, color: '#ef4444' }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius="75%"
                    outerRadius="98%"
                    paddingAngle={4}
                    dataKey="value"
                    stroke={isPrime ? "#0f172a" : "white"}
                    strokeWidth={isPrime ? 6 : 3}
                    isAnimationActive={!isExportingPDF && !isExportingImage}
                    activeShape={(props: any) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                      return (
                        <g>
                          <Sector
                            cx={cx}
                            cy={cy}
                            innerRadius={innerRadius}
                            outerRadius={outerRadius + 12}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            fill={fill}
                          />
                        </g>
                      );
                    }}
                  >
                    {[
                      { name: 'Promotores', value: kpiBreakdown.promoters || 0, color: '#10b981' },
                      { name: 'Neutros', value: kpiBreakdown.neutrals || 0, color: '#f59e0b' },
                      { name: 'Detractores', value: kpiBreakdown.detractors || 0, color: '#ef4444' }
                    ].filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px rgba(0,0,0,0.15)', padding: '20px', backgroundColor: isPrime ? '#1e293b' : 'white', color: isPrime ? 'white' : 'black', fontSize: '13px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {(() => {
              const total = (kpiBreakdown.promoters || 0) + (kpiBreakdown.neutrals || 0) + (kpiBreakdown.detractors || 0);
              const getPct = (val: number) => total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return (
                <div className="flex flex-wrap justify-center gap-12 mt-10">
                  <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-[#10b981] mb-2 shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
                      <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Promotores</span>
                      <span className={cn("text-2xl font-black", isPrime ? "text-white" : "text-slate-900")}>{getPct(kpiBreakdown.promoters || 0)}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-[#f59e0b] mb-2 shadow-[0_0_15px_rgba(245,158,11,0.4)]"></div>
                      <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Neutros</span>
                      <span className={cn("text-2xl font-black", isPrime ? "text-white" : "text-slate-900")}>{getPct(kpiBreakdown.neutrals || 0)}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-[#ef4444] mb-2 shadow-[0_0_15px_rgba(239,68,68,0.4)]"></div>
                      <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Detractores</span>
                      <span className={cn("text-2xl font-black", isPrime ? "text-white" : "text-slate-900")}>{getPct(kpiBreakdown.detractors || 0)}%</span>
                  </div>
                </div>
              );
            })()}
            
            <button 
              onClick={() => captureChart("global-sentiment-card", "Mix_Performance_Global")}
              className={cn("hidden lg:flex absolute bottom-4 right-4 w-12 h-12 rounded-2xl border items-center justify-center transition-all shadow-xl active:scale-95", isPrime ? "bg-slate-800 border-white/10 text-white hover:bg-brand-accent hover:text-slate-900" : "bg-white border-slate-200 text-slate-400 hover:bg-brand-blue hover:text-white")}
              title="Descargar Reporte"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        id="historical-trend-section"
        initial={isExportingPDF || isExportingImage ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
        animate={isExportingPDF || isExportingImage ? { opacity: 1, scale: 1 } : undefined}
        whileInView={isExportingPDF || isExportingImage ? undefined : { opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className={cn(
          "p-8 md:p-12 lg:p-16 rounded-[4rem] border shadow-2xl overflow-hidden relative transition-all duration-500", 
          isPrime ? "bg-slate-900 border-white/5 shadow-brand-accent/5" : "bg-white border-slate-200"
        )}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center transition-all", isPrime ? "bg-brand-accent/10 border-brand-accent/20 text-brand-accent" : "bg-brand-blue/5 border-brand-blue/10 text-brand-blue")}>
                 <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Monitor de Satisfacción Diaria</span>
            </div>
            <h3 className={cn("text-4xl md:text-5xl font-display font-black uppercase tracking-tighter leading-none", isPrime ? "text-white" : "text-slate-900")}>
               SEGUIMIENTO <span className={cn("italic", isPrime ? "text-brand-accent" : "text-brand-blue")}>DIARIO DE NPS</span>
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Monitoreo de tendencia diaria v.s. acumulado</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className={cn("flex flex-col items-center justify-center px-8 py-5 rounded-[2.5rem] border backdrop-blur-sm", isPrime ? "bg-slate-800/30 border-white/5" : "bg-slate-50/50 border-slate-100/50")}>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mínimo</span>
              <span className="text-3xl font-display font-black text-rose-500 italic">
                {(() => {
                  const vals = (data.timeline || []).filter((t: any) => t.nps !== null).map((t: any) => t.nps);
                  return (vals.length > 0 ? Math.min(...vals) : 0).toFixed(0);
                })()}%
              </span>
            </div>

            <div className={cn("flex flex-col items-center justify-center px-10 py-5 rounded-[2.5rem] border shadow-lg transition-transform hover:scale-105", isPrime ? "bg-brand-accent/10 border-brand-accent/20" : "bg-brand-blue/5 border-brand-blue/10")}>
               <span className={cn("text-[9px] font-black uppercase tracking-widest mb-1", isPrime ? "text-brand-accent" : "text-brand-blue")}>PROMEDIO PERIODO</span>
               <span className={cn("text-4xl font-display font-black italic", isPrime ? "text-white" : "text-slate-900")}>
                 {(data.stats?.nps || 0).toFixed(1)}%
               </span>
            </div>

            <div className={cn("flex flex-col items-center justify-center px-8 py-5 rounded-[2.5rem] border backdrop-blur-sm", isPrime ? "bg-slate-800/30 border-white/5" : "bg-slate-50/50 border-slate-100/50")}>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Máximo</span>
              <span className="text-3xl font-display font-black text-emerald-500 italic">
                {(() => {
                  const vals = (data.timeline || []).filter((t: any) => t.nps !== null).map((t: any) => t.nps);
                  return (vals.length > 0 ? Math.max(...vals) : 0).toFixed(0);
                })()}%
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => captureChart("historical-trend-chart-nps", "Cierre_NPS_Diario")}
            className={cn(isExportingPDF ? "hidden" : "hidden lg:flex", "w-14 h-14 rounded-2xl border items-center justify-center transition-all shadow-xl active:scale-95 shrink-0", isPrime ? "bg-slate-800 border-white/10 text-white hover:bg-brand-accent hover:text-slate-900" : "bg-white border-slate-200 text-slate-400 hover:bg-brand-blue hover:text-white")}
            title="Descargar Imagen"
          >
            <Download className="w-6 h-6" />
          </button>
        </div>

        <div className="h-[550px] w-full" id="historical-trend-chart-nps">
          <ResponsiveContainer width={isExportingPDF || isExportingImage ? 1100 : "100%"} height={isExportingPDF || isExportingImage ? 500 : "100%"}>
            <ComposedChart data={data.timeline} margin={{ top: 20, right: 30, left: 10, bottom: 80 }}>
              <defs>
                <linearGradient id="colorRunningNps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPrime ? "#CDAC5D" : "#004691"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPrime ? "#CDAC5D" : "#004691"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isPrime ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
              
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                dy={15}
                  tickFormatter={(val) => {
                    try {
                      // val is YYYY-MM-DD
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
                  yAxisId="nps"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                  domain={[-100, 100]}
                  dx={-10}
                />
                
                <Tooltip 
                  cursor={{ fill: isPrime ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      // Parse YYYY-MM-DD manually to avoid timezone shifts
                      let formattedDate = d.date;
                      try {
                        const parts = d.date.split('-');
                        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                        formattedDate = `${parts[2]} de ${monthNames[parseInt(parts[1]) - 1]}`;
                      } catch(e) {}
                      
                      return (
                        <div className={cn(
                          "p-4 rounded-3xl border shadow-2xl backdrop-blur-md", 
                          isPrime ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200"
                        )}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                             {formattedDate}
                          </p>
                        <div className="space-y-3">
                          <div className="flex justify-between gap-6">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Enviadas:</span>
                            <span className="font-black text-slate-400">{d.sent || 0}</span>
                          </div>
                          <div className="flex justify-between gap-6">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Recibidas:</span>
                            <span className="font-black text-slate-600">{d.count}</span>
                          </div>
                          <div className="flex justify-between gap-6">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">NPS Diario:</span>
                            <span className={cn("font-black", d.nps > 50 ? "text-emerald-500" : d.nps > 0 ? "text-amber-500" : "text-rose-500")}>
                               {d.nps !== null ? `${d.nps.toFixed(1)}%` : 'Sin datos'}
                            </span>
                          </div>
                          <div className="flex justify-between gap-6">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Tendencia:</span>
                            <span className={cn("font-black text-brand-accent")}>{d.running_nps?.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              <Bar 
                yAxisId="nps"
                dataKey="nps" 
                radius={[8, 8, 0, 0]}
                barSize={30}
                isAnimationActive={!isExportingPDF && !isExportingImage}
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
                yAxisId="nps"
                type="monotone" 
                dataKey="running_nps" 
                stroke={isPrime ? "#CDAC5D" : "#004691"} 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorRunningNps)" 
                isAnimationActive={!isExportingPDF && !isExportingImage}
                name="Tendencia Acumulada"
              />
              
              <Legend 
                verticalAlign="bottom" 
                align="center" 
                wrapperStyle={{ paddingTop: '30px' }}
                content={() => (
                  <div className="flex justify-center items-center gap-8">
                    <div className="flex items-center gap-2">
                       <div className={cn("w-3 h-3 rounded-full", isPrime ? "bg-brand-accent" : "bg-brand-blue")}></div>
                       <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tendencia</span>
                         <span className={cn("text-xs font-bold", isPrime ? "text-white" : "text-slate-900")}>Progreso Acumulado</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={cn("w-3 h-1 rounded-full", isPrime ? "bg-emerald-500/40" : "bg-slate-400")}></div>
                       <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diario</span>
                         <span className={cn("text-xs font-bold", isPrime ? "text-white" : "text-slate-900")}>Volatilidad por día</span>
                       </div>
                    </div>
                  </div>
                )}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Hidden legacy trend removed */}
      <div id="operational-kpis-section" className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className={cn("p-8 rounded-[2.5rem] relative group overflow-hidden shadow-2xl", isPrime ? "bg-slate-900 border border-brand-accent/20 text-white" : "bg-brand-blue text-white")}>
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700", isPrime ? "bg-brand-accent/5" : "bg-white/5")}></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300 mb-8 opacity-60">Benchmarks Operativos</p>
            <div className="space-y-10 relative z-10">
               <div className="flex items-center gap-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shadow-xl backdrop-blur-md", isPrime ? "bg-brand-accent/10 border-brand-accent/20" : "bg-white/10 border-white/10")}>✨</div>
                <div className="flex flex-col">
                  <span className={cn("text-3xl font-display font-black italic tracking-tighter", isPrime ? "text-brand-accent" : "text-brand-accent")}>{(stats.avg_cx || 0).toFixed(1)}</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200">CX Index {isPrime ? 'Prime' : 'Global'}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shadow-xl backdrop-blur-md", isPrime ? "bg-brand-accent/10 border-brand-accent/20" : "bg-white/10 border-white/10")}>📈</div>
                <div className="flex flex-col">
                  <span className={cn("text-3xl font-display font-black italic tracking-tighter", isPrime ? "text-white" : "text-white")}>{stats.total_responses}</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200">Data Points</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          {/* Charts Grid */}
          <div id="operational-kpis-grid" className={cn("p-8 md:p-12 rounded-[3.5rem] border shadow-xl overflow-hidden relative", isPrime ? "bg-slate-900 border-white/5" : "bg-white border-slate-200")}>
            <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 opacity-50", isPrime ? "bg-brand-accent/5" : "bg-slate-50")}></div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 relative z-10">
              <div className="space-y-2">
                <h4 className={cn("text-2xl font-display font-black uppercase tracking-tight italic", isPrime ? "text-white" : "text-slate-900")}>Métricas de <span className={cn(isPrime ? "text-brand-accent" : "text-brand-blue")}>Eficiencia {isPrime ? 'Prime' : ''}</span></h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">Desglose porcentual por categoría crítica</p>
              </div>
              <div className={cn("flex items-center gap-6 px-6 py-3 backdrop-blur-sm rounded-2xl border", isPrime ? "bg-slate-800/80 border-white/5" : "bg-slate-50/80 border-slate-100")}>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div><span className="text-[8px] font-black text-slate-500 uppercase">Top</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div><span className="text-[8px] font-black text-slate-500 uppercase">Mid</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div><span className="text-[8px] font-black text-slate-500 uppercase">Low</span></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              {operationalKPIs.map((kpi, idx) => {
                const isNPS = kpi.isNPS;
                const score = kpi.score;
                const dist = kpi.dist;
                
                const pieData = [
                  { name: 'P', value: Number(dist.promoters) || 0, color: '#10b981' },
                  { name: 'N', value: Number(dist.neutrals) || 0, color: '#f59e0b' },
                  { name: 'D', value: Number(dist.detractors) || 0, color: '#ef4444' }
                ].filter(d => d.value > 0);

                return (
                  <motion.div 
                    key={kpi.id || idx}
                    id={`op-card-${idx}`}
                    initial={isExportingPDF || isExportingImage ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                    animate={isExportingPDF || isExportingImage ? { opacity: 1, scale: 1 } : undefined}
                    whileInView={isExportingPDF || isExportingImage ? undefined : { opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={isExportingPDF || isExportingImage ? { duration: 0 } : { delay: idx * 0.1 }}
                    className={cn("p-8 border rounded-[2.5rem] hover:shadow-2xl hover:bg-white transition-all group flex flex-col items-center", isPrime ? "bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-brand-accent/20" : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-brand-blue/10")}
                  >
                    <div className="w-full flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] block leading-none", isPrime ? "text-brand-accent" : "text-brand-blue")}>{kpi.label}</span>
                        <div className="flex items-baseline gap-2">
                          {/* Goal comparison for operational KPIs */}
                          {getGoal(kpi.label, kpi.id) && (
                            <div className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                              (Number(score) || 0) >= (getGoal(kpi.label, kpi.id)?.target || 0) ? "bg-emerald-500/10 text-emerald-500" : 
                              (Number(score) || 0) >= (getGoal(kpi.label, kpi.id)?.target || 0) * 0.9 ? "bg-amber-500/10 text-amber-500" : 
                              "bg-rose-500/10 text-rose-600 font-bold"
                            )}>
                              {(Number(score) || 0) >= (getGoal(kpi.label, kpi.id)?.target || 0) ? 'Logrado' : 'Bajo Meta'}
                            </div>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          captureChart(`op-card-${idx}`, `Indicador_${kpi.label.replace(/\s+/g, '_')}`);
                        }}
                        className={cn("w-9 h-9 rounded-xl border flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm", isPrime ? "bg-slate-900 border-white/10 text-white hover:bg-brand-accent hover:text-slate-900" : "bg-white border-slate-100 text-slate-300 hover:bg-brand-blue hover:text-white")}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-full flex flex-col items-center justify-center max-w-[320px] md:max-w-[360px] mx-auto mt-6">
                      <div className="aspect-square w-full relative flex items-center justify-center">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 backdrop-blur-[1px] rounded-full">
                          <span className={cn("font-display font-black italic tracking-tighter leading-none", 
                            isNPS ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl",
                            isPrime ? "text-brand-accent drop-shadow-md" : "text-brand-blue"
                          )}>
                            {Number(score || 0).toFixed(1)}{isNPS ? '' : '%'}
                          </span>
                          <span className="text-[8px] max-w-[100px] text-center font-black text-slate-400 uppercase tracking-[0.2em] mt-2 shadow-sm leading-tight">
                            {isNPS ? 'Score NPS' : kpi.label}
                          </span>
                        </div>
                        <ResponsiveContainer width={isExportingPDF || isExportingImage ? 300 : "100%"} height={isExportingPDF || isExportingImage ? 300 : "100%"}>
                          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius="72%"
                              outerRadius="98%"
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                              isAnimationActive={!isExportingPDF && !isExportingImage}
                              activeShape={(props: any) => {
                                const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                                return (
                                  <g>
                                    <Sector
                                      cx={cx}
                                      cy={cy}
                                      innerRadius={innerRadius}
                                      outerRadius={outerRadius + 8}
                                      startAngle={startAngle}
                                      endAngle={endAngle}
                                      fill={fill}
                                    />
                                  </g>
                                );
                              }}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '11px', backgroundColor: isPrime ? '#1e293b' : 'white', color: isPrime ? 'white' : 'black' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {(() => {
                        return (
                          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-8 px-2 pb-2">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-[#10b981] mb-2 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{isNPS ? 'Prom.' : 'Top / Prom.'}</span>
                              <span className={cn("text-xl font-black", isPrime ? "text-white" : "text-slate-900")}>{dist.p_pct?.toFixed(1)}%</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-[#f59e0b] mb-2 shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{isNPS ? 'Neut.' : 'Mid / Neut.'}</span>
                              <span className={cn("text-xl font-black", isPrime ? "text-white" : "text-slate-900")}>{dist.n_pct?.toFixed(1)}%</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-[#ef4444] mb-2 shadow-[0_0_10px_rgba(239,68,68,0.3)]"></div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{isNPS ? 'Detr.' : 'Low / Detr.'}</span>
                              <span className={cn("text-xl font-black", isPrime ? "text-white" : "text-slate-900")}>{dist.d_pct?.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div id="branch-ranking-section" className="w-full">
          <div id="branch-ranking-card" className={cn("p-8 md:p-12 rounded-[3.5rem] shadow-2xl relative group overflow-hidden border", isPrime ? "bg-slate-900/50 border-white/5 backdrop-blur-md" : "bg-white border-slate-200")}>
             <div className={cn("absolute top-0 left-0 w-2 h-full", isPrime ? "bg-brand-accent" : "bg-brand-blue")}></div>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative z-10">
               <div className="space-y-2">
                 <div className="flex items-center gap-3">
                   <h3 className={cn("text-2xl font-display font-black tracking-tight uppercase italic", isPrime ? "text-white" : "text-slate-900")}>
                     Ranking <span className={isPrime ? "text-brand-accent underline decoration-brand-accent/30 underline-offset-8" : "text-brand-blue underline decoration-brand-blue/30 underline-offset-8"}>NPS Sedes {isPrime ? 'Prime' : ''}</span>
                   </h3>
                   <button 
                    onClick={() => captureChart("branch-ranking-card", "Ranking_Sedes")}
                    className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-brand-blue hover:text-white text-slate-400 border border-slate-100 flex items-center justify-center transition-all active:scale-95 shadow-sm opacity-0 group-hover:opacity-100"
                   >
                    <Download className="w-4 h-4" />
                   </button>
                 </div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Benchmarking detallado por unidad de negocio</p>
               </div>
               <div className="px-5 py-2 bg-slate-50 rounded-2xl border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest shadow-inner">
                 Total sedes: {data.branchPerformance?.length || 0}
               </div>
             </div>
             
             <div className="relative z-10 overflow-x-auto custom-scrollbar pb-2 -mx-8 md:mx-0 px-8 md:px-0">
               <table className="w-full border-separate border-spacing-y-3 min-w-[600px]">
                 <thead>
                   <tr className="text-left font-sans">
                     <th className="pb-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sede Operativa</th>
                     <th className="pb-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">NPS Score</th>
                     <th className="pb-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Sat. Indice</th>
                     <th className="pb-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Perform.</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm">
                   {(data.branchPerformance || [])
                     .filter((b: any) => true) // Rely on server filtering
                     .sort((a: any, b: any) => (b.nps || 0) - (a.nps || 0))
                     .map((b: any, bidx: number) => (
                     <motion.tr 
                       key={b.branch_id || b.branch_name}
                       initial={isExportingPDF || isExportingImage ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                       animate={isExportingPDF || isExportingImage ? { opacity: 1, x: 0 } : undefined}
                       whileInView={isExportingPDF || isExportingImage ? undefined : { opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       transition={isExportingPDF || isExportingImage ? { duration: 0 } : { delay: bidx * 0.05 }}
                       className="group/row hover:translate-x-1 transition-transform"
                     >
                       <td className="px-6 py-5 bg-slate-50/50 rounded-l-2xl border-y border-l border-slate-100 group-hover/row:bg-white transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-brand-blue shadow-sm">
                               {String(bidx + 1).padStart(2, '0')}
                             </div>
                             <span className="font-black text-slate-900 uppercase italic text-xs tracking-tight">{b.branch_name}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5 bg-slate-50/50 border-y border-slate-100 text-center font-black group-hover/row:bg-white transition-colors">
                         <span className={cn(
                           "text-base tracking-tighter",
                           b.nps > 30 ? "text-emerald-600" : b.nps > 0 ? "text-amber-600" : "text-rose-600"
                         )}>
                           {(b.nps || 0).toFixed(1)}
                         </span>
                       </td>
                       <td className="px-6 py-5 bg-slate-50/50 border-y border-slate-100 text-center text-slate-500 font-bold group-hover/row:bg-white transition-colors">
                         {(b.csat || 0).toFixed(1)}%
                       </td>
                       <td className="px-6 py-5 bg-slate-50/50 rounded-r-2xl border-y border-r border-slate-100 text-right group-hover/row:bg-white transition-colors">
                          <span className={cn(
                            "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm",
                            b.nps > 30 ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : 
                            b.nps > 0 ? "bg-amber-100 text-amber-700 border border-amber-200" : 
                            "bg-rose-100 text-rose-700 border border-rose-200"
                          )}>
                            {b.nps > 30 ? 'High' : b.nps > 0 ? 'Normal' : 'Low'}
                          </span>
                       </td>
                     </motion.tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

      {/* Refactored Recent Comments Section - Professional Table Layout */}
       <div id="feedback-hub-section" className="space-y-8">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
           <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]", isPrime ? "bg-brand-accent/20 text-brand-accent" : "bg-brand-blue/10 text-brand-blue")}>Feedback Hub</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feed Directo</span>
              </div>
            </div>
            <h3 className={cn("text-3xl font-display font-black uppercase tracking-tight leading-none", isPrime ? "text-white" : "text-slate-900")}>
              Voz del <span className={cn("italic", isPrime ? "text-brand-accent" : "text-brand-blue")}>Cliente Cineplanet {isPrime ? 'Prime' : ''}</span>
            </h3>
            <p className={cn("text-xs font-medium max-w-xl", isPrime ? "text-slate-400" : "text-slate-500")}>
              Registro detallado de comentarios y observaciones por KPI operativo.
            </p>
          </div>
          <div className={cn("flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest px-5 py-3 rounded-xl border shadow-sm", isPrime ? "bg-slate-800 border-white/10 text-slate-300" : "bg-white border-slate-100 text-slate-400")}>
            <Calendar className={cn("w-3.5 h-3.5", isPrime ? "text-brand-accent" : "text-brand-blue")} />
            Actualizado: {new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}
          </div>
        </div>
       </div>

        <div id="detailed-comments-table" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
          {(data.recentComments || []).length === 0 ? (
             <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                   <MessageSquare className="w-10 h-10 text-slate-200" />
                </div>
                <h4 className="text-slate-900 font-black uppercase tracking-tighter text-lg mb-2">Buzón Silencioso</h4>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-xs mx-auto">No hemos detectado feedback en el rango de fechas seleccionado</p>
             </div>
          ) : 
            data.recentComments
              .map((r: any, idx: number) => (
              <motion.div 
                key={r.response_id}
                initial={isExportingPDF || isExportingImage ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={isExportingPDF || isExportingImage ? { duration: 0 } : { delay: idx * 0.05, type: 'spring', damping: 20 }}
                className={cn("p-7 rounded-[2rem] border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all group relative flex flex-col overflow-hidden", isPrime ? "bg-slate-900 border-white/5" : "bg-white border-slate-200")}
              >
                {/* Sentiment Bar Accent */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1.5",
                  r.nps_score >= 9 ? "bg-emerald-500" : 
                  r.nps_score >= 7 ? "bg-amber-400" : 
                  "bg-rose-500"
                )}></div>

                <div className="flex justify-between items-start mb-6">
                   <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "w-3 h-3 rounded-full",
                           r.nps_score >= 9 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                           r.nps_score >= 7 ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : 
                           "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                         )}></div>
                         <span className={cn("text-[11px] font-black uppercase tracking-tight", isPrime ? "text-white" : "text-slate-900")}>{r.branch_name}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Calendar className="w-2.5 h-2.5 text-slate-300" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                           {new Date(r.timestamp).toLocaleDateString('es-PE', { 
                             timeZone: 'America/Lima',
                             day: '2-digit', 
                             month: 'short', 
                             year: 'numeric' 
                           })}
                        </span>
                      </div>
                   </div>
                   <div className={cn(
                      "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm transition-colors",
                      r.nps_score >= 9 ? "bg-emerald-50/50 text-emerald-600 border-emerald-100/50" : 
                      r.nps_score >= 7 ? "bg-amber-50/50 text-amber-600 border-amber-100/50" : 
                      "bg-rose-50/50 text-rose-600 border-rose-100/50"
                   )}>
                      {r.nps_score >= 9 ? 'Promotor' : r.nps_score >= 7 ? 'Neutro' : 'Detractor'}
                   </div>
                </div>

                <div className="space-y-5 relative">
                   <Quote className={cn("absolute -top-3 -left-3 w-10 h-10 transition-colors", isPrime ? "text-white/5 group-hover:text-brand-accent/5" : "text-slate-100 group-hover:text-brand-blue/5")} />
                   
                   {r.general_comment && (
                      <div className="relative z-10 flex flex-col gap-2">
                        <div className={cn("backdrop-blur-sm p-4 rounded-2xl border relative shadow-inner", isPrime ? "bg-slate-800/80 border-white/5" : "bg-slate-50/80 border-slate-100")}>
                           <p className={cn("text-[13px] font-bold leading-relaxed italic relative z-10 ring-offset-white", isPrime ? "text-slate-200" : "text-slate-800")}>
                             "{r.general_comment}"
                           </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                           <div className={cn("w-4 h-[1px]", isPrime ? "bg-brand-accent/30" : "bg-brand-blue/30")}></div>
                           <span className={cn("text-[7px] font-black uppercase tracking-[0.2em]", isPrime ? "text-brand-accent" : "text-brand-blue")}>Comentario General</span>
                        </div>
                      </div>
                   )}

                   {r.question_comments && (
                      <div className={cn("space-y-4 pt-4 border-t", isPrime ? "border-white/5" : "border-slate-100/60")}>
                        {r.question_comments.split(' | ').map((qc: string, qIdx: number) => {
                          const parts = qc.split(': ');
                          const text = parts.length > 1 ? parts.slice(1).join(': ') : parts[0];
                          const label = parts.length > 1 ? parts[0] : null;
                          
                          if (!text || text.trim() === '') return null;

                          // Clean label
                          const cleanLabel = (label || "").toUpperCase()
                            .replace(/_/g, ' ')
                            .replace('KPI ', '')
                            .replace('CSAT ', '')
                            .trim();

                          return (
                            <div key={`${r.response_id}-${qIdx}`} className="flex flex-col gap-1.5 group/msg">
                               <div className="flex items-center gap-2">
                                  <MessageSquare className={cn("w-2 h-2", isPrime ? "text-brand-accent/40" : "text-brand-blue/40")} />
                                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{cleanLabel || 'Feedback'}</span>
                               </div>
                               <div className={cn("p-3 rounded-xl border group-hover/msg:border-brand-blue/10 transition-all shadow-sm", isPrime ? "bg-slate-800/30 border-white/5" : "bg-white border-slate-100")}>
                                 <p className={cn("text-[11px] font-medium leading-snug", isPrime ? "text-slate-400" : "text-slate-600")}>
                                   {text}
                                 </p>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                   )}
                </div>
                
                <div className={cn("mt-6 flex items-center justify-between pt-5 border-t", isPrime ? "border-white/5" : "border-slate-100")}>
                   <div className="flex items-center gap-3">
                      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg border", isPrime ? "bg-brand-accent/10 border-brand-accent/20" : "bg-brand-nav/5 border-brand-nav/10")}>
                         <span className={cn("text-[9px] font-black", isPrime ? "text-brand-accent" : "text-brand-nav")}>{(r.cx_score || 0).toFixed(1)}</span>
                         <span className="text-[6px] font-bold text-slate-400 uppercase">CX</span>
                      </div>
                      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg", isPrime ? "bg-slate-800" : "bg-slate-50")}>
                         <span className={cn("text-[9px] font-black", isPrime ? "text-white" : "text-slate-900")}>{r.nps_score}</span>
                         <span className="text-[6px] font-bold text-slate-400 uppercase">NPS</span>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))
          }
        </div>
      </div>
    ) : (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      {/* Summary Cards for Goals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={cn("p-6 rounded-[2rem] border shadow-md transition-all duration-500", isPrime ? "bg-slate-900 border-brand-accent/20" : "bg-white border-slate-200 shadow-sm")}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Meta Promedio NPS</p>
          <h3 className={cn("text-3xl font-display font-black transition-all", isPrime ? "text-brand-accent" : "text-brand-blue")}>
            {goals.filter(g => g.indicator === 'NPS').length > 0
              ? (goals.filter(g => g.indicator === 'NPS').reduce((acc: number, g: any) => acc + Number(g.target), 0) / (goals.filter(g => g.indicator === 'NPS').length)).toFixed(0)
              : (isPrime ? "55" : "45")}%
          </h3>
        </div>
        <div className={cn("p-6 rounded-[2rem] border shadow-md transition-all duration-500", isPrime ? "bg-slate-900 border-brand-accent/20" : "bg-white border-slate-200 shadow-sm")}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Meta CX Index</p>
          <h3 className={cn("text-3xl font-display font-black transition-all", isPrime ? "text-brand-accent" : "text-brand-blue")}>
            {goals.filter(g => g.indicator === 'CX Index').length > 0
               ? (goals.filter(g => g.indicator === 'CX Index').reduce((acc: number, g: any) => acc + Number(g.target), 0) / (goals.filter(g => g.indicator === 'CX Index').length)).toFixed(1)
               : (isPrime ? "9.0" : "8.5")}
          </h3>
        </div>
        <div className={cn("p-6 rounded-[2rem] border shadow-md transition-all duration-500", isPrime ? "bg-slate-900 border-brand-accent/20" : "bg-white border-slate-200 shadow-sm")}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estatus General</p>
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full animate-pulse", isPrime ? "bg-brand-accent shadow-[0_0_8px_rgba(205,172,93,0.5)]" : "bg-emerald-500")} shadown-inner></div>
            <h3 className={cn("text-lg font-black uppercase italic transition-all", isPrime ? "text-white" : "text-slate-900")}>
               {isPrime ? 'Premium Quality' : 'Operativo'}
            </h3>
          </div>
        </div>
        <div className={cn("p-6 rounded-[2rem] border shadow-md transition-all duration-500", isPrime ? "bg-slate-900 border-brand-accent/20" : "bg-white border-slate-200 shadow-sm")}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cumplimiento Global</p>
          <h3 className={cn("text-3xl font-display font-black transition-all", (stats.nps || 0) >= (isPrime ? 55 : 45) ? "text-emerald-500" : "text-rose-500")}>
            {((Number(stats.nps || 0) / (goals.find(g => g.indicator === 'NPS')?.target || (isPrime ? 55 : 45))) * 100).toFixed(1)}%
          </h3>
        </div>
      </div>

      <div className={cn("p-8 md:p-12 rounded-[3.5rem] border shadow-2xl", isPrime ? "bg-slate-900 border-white/5" : "bg-white border-slate-200")}>
        <div className="flex items-center gap-4 mb-10">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isPrime ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-blue/5 text-brand-blue")}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className={cn("text-2xl font-display font-black uppercase tracking-tight", isPrime ? "text-white" : "text-slate-900")}>Seguimiento Real-Meta</h3>
            <p className="text-xs text-slate-400 font-medium tracking-wide">Cuadro comparativo histórico de cumplimiento mensual.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={isPrime ? "bg-slate-800/50" : "bg-slate-50"}>
                <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest", isPrime ? "text-slate-400" : "text-slate-500")}>Mes / Periodo</th>
                <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest", isPrime ? "text-slate-400" : "text-slate-500")}>Sede / Zona</th>
                <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest", isPrime ? "text-slate-400" : "text-slate-500")}>Meta Asignada</th>
                <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest", isPrime ? "text-slate-400" : "text-slate-500")}>Valor Alcanzado</th>
                <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest", isPrime ? "text-slate-400" : "text-slate-500")}>Diferencia</th>
                <th className={cn("px-6 py-4 text-[10px] font-black uppercase tracking-widest", isPrime ? "text-slate-400" : "text-slate-500")}>Efectividad (%)</th>
              </tr>
            </thead>
            <tbody className={isPrime ? "text-slate-300" : "text-slate-600"}>
              {(!data.goal_tracking || data.goal_tracking.length === 0) ? (
                <tr>
                   <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                         <div className={cn("w-16 h-16 rounded-full flex items-center justify-center border border-dashed", isPrime ? "border-brand-accent/20 bg-brand-accent/5" : "border-slate-200 bg-slate-50")}>
                            <Target className="w-8 h-8 text-slate-400" />
                         </div>
                         <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aún no se han configurado metas para este periodo y tipo de cine</p>
                      </div>
                   </td>
                </tr>
              ) : 
                data.goal_tracking.map((row: any, i: number) => {
                const diff = row.diff || 0;
                const percent = row.percent || 0;
                return (
                  <tr key={i} className={cn("border-t transition-colors", isPrime ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50")}>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className={cn("text-sm font-bold", isPrime ? "text-white" : "text-slate-900")}>{row.month}</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Indicador: NPS</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn("text-[10px] font-black uppercase tracking-wider", isPrime ? "text-slate-400" : "text-slate-500")}>
                        {row.location || '---'}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold">{Number(row.target).toFixed(1)}</td>
                    <td className="px-6 py-5 font-bold">{Number(row.actual).toFixed(1)}</td>
                    <td className={cn("px-6 py-5 font-black italic", diff >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                          <div className={cn("h-full", percent >= 100 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${Math.min(100, percent)}%` }}></div>
                        </div>
                        <span className="text-xs font-black">{percent.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
    )}
    </div>

    {/* Hidden PDF exclusive print layout */}
    <div 
      style={{ 
        position: "absolute", 
        left: "-9999px", 
        top: "-9999px", 
        width: "800px", 
        pointerEvents: "none",
        opacity: isExportingPDF ? 1 : 0 
      }}
    >
      {isExportingPDF && (
        <PDFReportLayout 
          data={data}
          selectedBranch={selectedBranch}
          selectedSurvey={selectedSurvey}
          branches={branches}
          surveys={surveys}
          startDate={startDate}
          endDate={endDate}
          user={user}
          isPrime={isPrime}
          kpiConfigs={kpiConfigs}
          operationalKPIs={operationalKPIs}
        />
      )}
    </div>
  </div>
  );
}

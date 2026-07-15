import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  MapPin, 
  Settings, 
  Trophy,
  Target,
  LogOut, 
  Film,
  Menu,
  X,
  Bell,
  ChevronDown,
  ChevronRight,
  BarChart3,
  History,
  Trash2,
  Search
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MenuItem {
  title: string;
  icon: any;
  path: string;
  roles: string[];
}

interface MenuSection {
  id: string;
  title: string;
  icon?: any;
  roles: string[];
  items?: MenuItem[];
  path?: string;
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { notifications, clearNotifications } = useNotifications();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  
  const navigate = useNavigate();
  const location = useLocation();

  const navigation: MenuSection[] = [
    {
      id: 'history',
      title: (user?.role === 'CREATOR' || user?.role === 'ANALISTA') ? "Gestión de Encuestas" : "Historial de Encuestas",
      icon: History,
      path: "/responses-history",
      roles: ['CREATOR', 'ADMINISTRADOR', 'ANALISTA', 'ZONAL']
    },
    {
      id: 'dashboard',
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      roles: ['CREATOR', 'ADMINISTRADOR', 'ANALISTA', 'ZONAL']
    },
    {
      id: 'performance',
      title: "Desempeño",
      roles: ['CREATOR', 'ADMINISTRADOR', 'ANALISTA', 'ZONAL'],
      items: [
        { 
          title: "Seguimiento", 
          icon: BarChart3, 
          path: "/tracking", 
          roles: ['CREATOR', 'ADMINISTRADOR', 'ANALISTA', 'ZONAL'] 
        },
        { 
          title: "Gestión de Metas", 
          icon: Target, 
          path: "/goals", 
          roles: ['CREATOR', 'ANALISTA'] 
        }
      ]
    },
    {
      id: 'operations',
      title: "Operaciones",
      roles: ['ENCUESTADOR', 'CREATOR', 'ADMINISTRADOR', 'ZONAL', 'ANALISTA'],
      items: [
        { 
          title: "Evaluación", 
          icon: ClipboardList, 
          path: "/survey", 
          roles: ['ENCUESTADOR', 'CREATOR', 'ADMINISTRADOR'] 
        },
        { 
          title: "Mis Estadísticas", 
          icon: Trophy, 
          path: "/surveyor-stats", 
          roles: ['ENCUESTADOR'] 
        },
        { 
          title: "Solicitudes", 
          icon: Bell, 
          path: "/requests", 
          roles: ['CREATOR', 'ADMINISTRADOR', 'ANALISTA', 'ZONAL'] 
        }
      ]
    },
    {
      id: 'config',
      title: "Configuración",
      roles: ['CREATOR', 'ANALISTA'],
      items: [
        { 
          title: "Usuarios", 
          icon: Users, 
          path: "/users", 
          roles: ['CREATOR', 'CREADOR', 'ANALISTA'] 
        },
        { 
          title: "Sedes y Zonas", 
          icon: MapPin, 
          path: "/branches", 
          roles: ['CREATOR', 'CREADOR', 'ADMINISTRADOR'] 
        },
        { 
          title: "Administrador de Formularios", 
          icon: Settings, 
          path: "/surveys-config", 
          roles: ['CREATOR', 'CREADOR', 'ADMINISTRADOR'] 
        },
        { 
          title: "Indicadores KPI", 
          icon: Trophy, 
          path: "/kpis", 
          roles: ['CREATOR', 'CREADOR', 'ADMINISTRADOR'] 
        },
        { 
          title: "Auditoría de Acciones", 
          icon: History, 
          path: "/audit-logs", 
          roles: ['CREATOR', 'CREADOR', 'ANALISTA'] 
        },
      ]
    }
  ].filter(section => {
    const userRole = (user?.role || '').toUpperCase();
    const hasSectionPermission = section.roles.some(r => r.toUpperCase() === userRole);
    if (!hasSectionPermission) return false;
    
    // Filter individual items within section
    if (section.items) {
      section.items = section.items.filter(item => item.roles.some(r => r.toUpperCase() === userRole));
    }
    
    return true;
  });

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    // Submenus stay closed as per user request to have them closed by default
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden relative">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-brand-blue border-b border-white/10 flex items-center justify-between px-4 z-50 shadow-lg">
        <button onClick={() => setSidebarOpen(true)} className="text-white p-2">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/logo.png" alt="Cineplanet" className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-display font-black tracking-tight uppercase italic text-sm">Cineplanet <span className="text-brand-blue-light">CX</span></span>
        </div>
        <button onClick={handleLogout} className="text-white p-2">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-brand-nav text-white z-50 transform transition-transform duration-500 ease-out lg:translate-x-0 lg:static lg:h-screen flex flex-col shadow-2xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/logo.png" alt="Cineplanet Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-xl tracking-tighter leading-none text-white uppercase italic">Cineplanet</span>
            <span className="text-brand-accent font-bold text-[10px] tracking-[0.2em] mt-1 uppercase block">CX Manager</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-white/50 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-5 mt-6 flex-1 overflow-y-auto custom-scrollbar">
          <nav className="space-y-6 font-sans pb-10">
            {navigation.map(section => (
              <div key={section.id} className="space-y-1">
                {section.path ? (
                  <Link 
                    to={section.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative overflow-hidden",
                      location.pathname === section.path 
                        ? "bg-white text-brand-blue shadow-xl shadow-blue-900/40 font-bold" 
                        : "text-blue-200 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {location.pathname === section.path && (
                      <motion.div 
                        layoutId="activeNavHighlight"
                        className="absolute inset-y-0 left-0 w-1 bg-brand-accent"
                      />
                    )}
                    {section.icon && (
                      <section.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", location.pathname === section.path ? "text-brand-blue" : "text-blue-300 group-hover:text-white")} />
                    )}
                    <span className="text-[11px] font-black uppercase tracking-wider">{section.title}</span>
                  </Link>
                ) : (
                  <>
                    <button 
                      onClick={() => toggleSubmenu(section.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-blue-400 group hover:text-white transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.15em]">{section.title}</span>
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-500", openSubmenus[section.id] ? "rotate-180" : "")} />
                    </button>
                    
                    <motion.div 
                      initial={false}
                      animate={{ 
                        height: openSubmenus[section.id] ? 'auto' : 0,
                        opacity: openSubmenus[section.id] ? 1 : 0
                      }}
                      className="overflow-hidden space-y-1"
                    >
                      {section.items?.map(item => (
                        <Link 
                          key={item.path} 
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ml-2",
                            location.pathname === item.path 
                              ? "bg-white/10 text-brand-accent font-bold" 
                              : "text-blue-200 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <item.icon className={cn("w-4 h-4", location.pathname === item.path ? "text-brand-accent" : "text-blue-300 group-hover:text-white")} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{item.title}</span>
                          {location.pathname === item.path && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-accent" />
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5 space-y-4 bg-black/10">
          <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 border border-white/5 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center font-black text-brand-nav text-lg shadow-xl shadow-brand-accent/20">
              {user?.full_name ? user.full_name.split(' ').map((n:any) => n[0]).join('').slice(0, 2).toUpperCase() : user?.username[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest leading-none mb-2">{user?.role}</p>
              <p className="text-[11px] font-bold text-white truncate max-w-[120px]">{user?.full_name || user?.username}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-4 w-full text-blue-300 hover:text-white hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.1em] group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen lg:h-screen lg:overflow-hidden mt-16 lg:mt-0 relative w-full">
        <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-10 items-center justify-between hidden lg:flex shrink-0 z-10 shadow-sm w-full">
          <div className="flex items-center gap-6 min-w-0">
            <h1 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-lg bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center shrink-0">
                {(() => {
                  const items = (navigation as any).flatMap((s: any) => s.path ? [s] : (s.items || []));
                  const currentItem = items.find((i: any) => i.path === location.pathname);
                  const Icon = currentItem?.icon;
                  return Icon ? <Icon className="w-4 h-4 text-brand-blue" /> : <LayoutDashboard className="w-4 h-4 text-brand-blue" />;
                })()}
              </div>
              <span className="truncate">
                {(() => {
                   const items = (navigation as any).flatMap((s: any) => s.path ? [s] : (s.items || []));
                   const currentItem = items.find((i: any) => i.path === location.pathname);
                   return currentItem?.title || "Resumen Operativo";
                })()}
              </span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
             <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></div>
                <span className="text-[10px] font-black text-brand-nav uppercase tracking-[0.1em]">Sincronizado</span>
             </div>
             
             <div className="relative">
               <button 
                 onClick={() => setNotificationsOpen(!isNotificationsOpen)}
                 className={cn(
                   "relative p-3 rounded-xl border transition-all shadow-sm",
                   isNotificationsOpen 
                     ? "bg-brand-blue text-white border-brand-blue" 
                     : "bg-slate-50 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 border-slate-100"
                 )}
               >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
                  )}
               </button>

               <AnimatePresence>
                 {isNotificationsOpen && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0.95, y: 10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 10 }}
                     className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 z-[100] overflow-hidden"
                   >
                     <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                       <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Notificaciones</span>
                       <button 
                         onClick={clearNotifications}
                         className="text-[9px] font-bold text-brand-blue-light hover:text-brand-blue uppercase"
                       >
                         Limpiar
                       </button>
                     </div>
                     <div className="max-h-[400px] overflow-y-auto">
                       {notifications.length === 0 ? (
                         <div className="p-10 text-center">
                           <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                             <Bell className="w-5 h-5 text-slate-300" />
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sin nuevas alertas</p>
                         </div>
                       ) : (
                         notifications.map(n => (
                           <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                             <div className="flex gap-3">
                               <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                 <X className="w-4 h-4 text-red-500" />
                               </div>
                               <div>
                                 <p className="text-[11px] font-black text-slate-800 leading-tight mb-1">{n.title}</p>
                                 <p className="text-[10px] text-slate-500 leading-tight mb-2">{n.message}</p>
                                 <div className="flex items-center justify-between">
                                   <span className="text-[8px] font-black text-brand-blue-light uppercase tracking-tighter">{n.branch_name}</span>
                                   <span className="text-[8px] font-bold text-slate-400">
                                     {new Date(n.timestamp).toLocaleTimeString('es-PE', { 
                                       timeZone: 'America/Lima',
                                       hour: '2-digit', 
                                       minute: '2-digit' 
                                     })}
                                   </span>
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 xl:p-12 relative bg-[#f8fafc]/50">
          <div className="max-w-[1920px] mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

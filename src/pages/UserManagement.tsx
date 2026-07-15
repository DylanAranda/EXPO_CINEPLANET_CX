import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Plus, 
  Trash2,
  Edit2,
  UserPlus,
  Search,
  X,
  Check,
  Loader2,
  AlertTriangle,
  MapPin,
  RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export default function UserManagement() {
  const { token, user: currentUser, fetchWithAuth, logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    dni: "",
    role: "ENCUESTADOR",
    branch_ids: [] as string[],
    zone_ids: [] as string[]
  });

  const [zones, setZones] = useState<any[]>([]);

  useEffect(() => {
    const role = (formData.role || '').toUpperCase();
    if (role === 'ANALISTA' || role === 'CREATOR' || role === 'CREADOR') {
      setFormData(prev => ({ ...prev, branch_ids: [], zone_ids: [] }));
    } else if (formData.role === 'ZONAL') {
      setFormData(prev => ({ ...prev, branch_ids: [] }));
    } else {
      setFormData(prev => ({ ...prev, zone_ids: [] }));
    }
  }, [formData.role]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{id: string, name: string} | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fetchData = async () => {
    try {
      const uRes = await fetchWithAuth("/api/users");
      const bRes = await fetchWithAuth("/api/branches");
      const zRes = await fetchWithAuth("/api/zones");
      
      if (!uRes.ok) throw new Error("Error cargando usuarios");
      if (!bRes.ok) throw new Error("Error cargando sedes");
      if (!zRes.ok) throw new Error("Error cargando zonas");

      const uData = await uRes.json();
      const bData = await bRes.json();
      const zData = await zRes.json();
      
      setUsers(Array.isArray(uData) ? uData : []);
      setBranches(Array.isArray(bData) ? bData : []);
      setZones(Array.isArray(zData) ? zData : []);
    } catch (e: any) {
      console.error(e);
      setUsers([]);
      setBranches([]);
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const url = editingUserId ? `/api/users/${editingUserId}` : "/api/users";
    const method = editingUserId ? "PUT" : "POST";

    // Enforce username = dni
    const finalFormData = {
      ...formData,
      username: formData.dni
    };

    try {
      const res = await fetchWithAuth(url, {
        method,
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(finalFormData)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingUserId(null);
        setFormData({ 
          username: "", 
          password: "", 
          full_name: "",
          dni: "",
          role: "ENCUESTADOR", 
          branch_ids: [],
          zone_ids: []
        });
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      password: "",
      full_name: user.full_name || "",
      dni: user.dni || "",
      role: user.role,
      branch_ids: user.branch_ids || [],
      zone_ids: user.zone_ids || []
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm || isSubmitting) return;
    setIsSubmitting(true);
    const { id } = showDeleteConfirm;
    
    try {
      const res = await fetchWithAuth(`/api/users/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setShowDeleteConfirm(null);
        fetchData();
        alert("Operador desvinculado del sistema.");
      } else {
        const err = await res.json().catch(() => ({ error: "Rechazo de permisos" }));
        alert(`ACCESO DENEGADO: ${err.error}`);
      }
    } catch (e: any) {
      alert(`ERROR TERMINAL: ${e.message || "Error de conexión"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBranch = (id: string) => {
    setFormData(prev => ({
      ...prev,
      branch_ids: prev.branch_ids.includes(id) 
        ? prev.branch_ids.filter(bid => bid !== id) 
        : [...prev.branch_ids, id]
    }));
  };

  const filteredUsers = users.filter(u => {
    const isAnalista = (currentUser?.role || '').toUpperCase() === 'ANALISTA';
    const targetRole = (u.role || '').toUpperCase();
    if (isAnalista && (targetRole === 'CREATOR' || targetRole === 'CREADOR')) return false;
    return u.username.toLowerCase().includes(search.toLowerCase()) || 
           (u.full_name || '').toLowerCase().includes(search.toLowerCase());
  });

  const handleResetData = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/admin/reset-data", {
        method: "POST"
      });
      if (res.ok) {
        setShowResetConfirm(false);
        alert("Todos los datos de encuestas han sido eliminados. El contador volverá a cero.");
        // We could also trigger a dashboard refresh here if needed
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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-blue w-8 h-8" /></div>;

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(252,209,22,0.5)]"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administración de Red</span>
          </div>
          <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Gestión de <span className="text-brand-blue border-b-4 border-brand-accent pb-1">Operadores</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs max-w-xl">
            Control de acceso centralizado y asignación de activos corporativos en tiempo real.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {(currentUser?.role?.toUpperCase() === 'CREATOR' || currentUser?.role?.toUpperCase() === 'CREADOR') && (
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="px-6 py-4 bg-white text-brand-red border border-brand-red/20 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-brand-red/5 hover:bg-brand-red hover:text-white active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <RefreshCcw className="w-4 h-4" />
              REINICIAR DATOS
            </button>
          )}
          {((currentUser?.role || '').toUpperCase() === 'CREATOR' || (currentUser?.role || '').toUpperCase() === 'CREADOR' || (currentUser?.role || '').toUpperCase() === 'ANALISTA') && (
            <button 
              onClick={() => {
                setEditingUserId(null);
                setFormData({ 
                  username: "", 
                  password: "", 
                  full_name: "", 
                  dni: "", 
                  role: "ENCUESTADOR", 
                  branch_ids: [],
                  zone_ids: []
                });
                setShowModal(true);
              }}
              className="group relative px-8 py-4 bg-brand-nav text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/10 active:scale-95 transition-all overflow-hidden"
            >
              <div className="flex items-center gap-3 relative z-10">
                <UserPlus className="w-5 h-5 text-brand-accent" />
                REGISTRAR COLABORADOR
              </div>
            </button>
          )}
        </div>
    </header>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
          <input 
            type="text" 
            placeholder="BUSCAR COLABORADOR POR NOMBRE..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-blue/40 font-bold text-sm uppercase tracking-tight text-slate-900 transition-all placeholder:text-slate-300 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] overflow-hidden relative border border-slate-200 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Matrícula / Identidad</th>
              <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rango Operativo</th>
              <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jurisdicción</th>
              <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Módulo de Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="group hover:bg-slate-50 transition-all">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center font-black text-brand-blue text-xl shadow-inner group-hover:rotate-3 group-hover:scale-105 transition-transform shrink-0">
                      {u.full_name ? u.full_name.split(' ').map((n:any) => n[0]).join('').slice(0, 2).toUpperCase() : u.username[0].toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-lg text-slate-900 tracking-tight leading-none">{u.full_name || u.username}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        {u.username} • DNI: {u.dni || 'S/D'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-8">
                  <span className={cn(
                    "px-4 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-widest border inline-block shadow-sm",
                    u.role === 'CREATOR' || u.role === 'CREADOR'
                      ? "bg-brand-blue text-white border-brand-blue" 
                      : u.role === 'ANALISTA'
                        ? "bg-blue-400/10 text-blue-600 border-blue-200"
                        : u.role === 'ADMINISTRADOR'
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                          : u.role === 'ENCUESTADOR'
                            ? "bg-amber-500/10 text-amber-600 border-amber-200"
                            : u.role === 'ZONAL'
                              ? "bg-purple-500/10 text-purple-600 border-purple-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-8">
                  <div className="flex flex-wrap gap-2 max-w-xs">
                    {u.role === 'CREATOR' || u.role === 'CREADOR' || u.role === 'ANALISTA' ? (
                       <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Acceso Global
                       </span>
                    ) : u.role === 'ZONAL' ? (
                      u.zone_ids && u.zone_ids.length > 0 ? (
                        u.zone_ids.map((zid: string) => {
                          const zone = zones.find(z => z.id === zid);
                          return (
                            <span key={zid} className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg text-[9px] font-bold text-purple-500 uppercase tracking-widest transition-all">
                              ZONA: {zone?.name || zid}
                            </span>
                          );
                        })
                      ) : <span className="text-red-400 font-bold text-[9px] uppercase tracking-widest italic">Sin Zonas</span>
                    ) : (
                      u.branch_ids && u.branch_ids.length > 0 ? (
                        u.branch_ids.map((bid: string) => {
                          const branch = branches.find(b => b.id === bid);
                          return (
                            <span key={bid} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-widest transition-all">
                              {branch?.name || bid}
                            </span>
                          );
                        })
                      ) : <span className="text-red-400 font-bold text-[9px] uppercase tracking-widest italic">Sin Sedes</span>
                    )}
                  </div>
                </td>
                <td className="px-10 py-8 text-right">
                  {((currentUser?.role || '').toUpperCase() === 'CREATOR' || (currentUser?.role || '').toUpperCase() === 'CREADOR' || (currentUser?.role || '').toUpperCase() === 'ANALISTA') && (
                    <div className="flex justify-end gap-3 opacity-100 transition-opacity">
                      {/* Analista cannot edit Creador (already filtered out but adding safety check) */}
                      {((currentUser?.role || '').toUpperCase() === 'ANALISTA' && (u.role === 'CREATOR' || u.role === 'CREADOR')) ? null : (
                        <>
                          <button 
                            onClick={() => handleEdit(u)}
                            className="px-5 py-2 bg-white text-brand-blue rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-200 hover:border-brand-blue hover:bg-brand-blue hover:text-white transition-all flex items-center gap-2 shadow-sm active:scale-95"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            EDITAR
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm({id: u.id, name: u.username})}
                            className={cn(
                              "px-5 py-2 bg-white text-brand-red rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-200 hover:border-brand-red hover:bg-brand-red hover:text-white transition-all flex items-center gap-2 shadow-sm active:scale-95",
                              (u.id === currentUser?.id || u.username.toLowerCase() === 'admin') ? "opacity-0 pointer-events-none" : ""
                            )}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            BORRAR
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-10 py-20 text-center">
                  <p className="text-slate-300 font-bold text-lg uppercase tracking-widest italic animate-pulse">
                    No se han encontrado registros
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    <AnimatePresence>
      {showResetConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowResetConfirm(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center border border-slate-200 shadow-2xl"
          >
            <div className="w-20 h-20 bg-brand-red/10 text-brand-red rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <RefreshCcw className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-display font-black text-slate-900 uppercase mb-3 leading-none italic">¿Reiniciar Seguimiento?</h3>
            <p className="text-slate-500 text-sm mb-10 font-medium leading-relaxed">
              Esta acción eliminará <span className="text-brand-red font-bold underline decoration-brand-red/30 underline-offset-4">TODAS</span> las encuestas, respuestas y alertas registradas hasta hoy. <br/><br/>
              <b>Esta operación es irreversible.</b>
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowResetConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleResetData}
                disabled={isSubmitting}
                className="flex-1 py-5 bg-brand-red text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-brand-red/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                {isSubmitting ? "RESÈTEANDO..." : "SÍ, REINICIAR TODO"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center border border-slate-200 shadow-2xl"
          >
            <div className="w-20 h-20 bg-brand-red/10 text-brand-red rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-display font-black text-slate-900 uppercase mb-3 leading-none">¿Eliminar Operador?</h3>
            <p className="text-slate-500 text-sm mb-10 font-medium leading-relaxed">
              Estás a punto de desvincular permanentemente la autorización de <span className="text-brand-red font-bold underline decoration-brand-red/30 underline-offset-4">"{showDeleteConfirm.name}"</span>.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isSubmitting}
                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 py-5 bg-brand-red text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-brand-red/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isSubmitting ? "PROCESANDO..." : "ELIMINAR"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowModal(false);
              setEditingUserId(null);
              setFormData({ 
                username: "", 
                password: "", 
                full_name: "", 
                dni: "", 
                role: "ENCUESTADOR", 
                branch_ids: [],
                zone_ids: []
              });
            }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-[3rem] p-0 overflow-hidden shadow-2xl border border-slate-200 flex flex-col h-[85vh] max-h-[800px]"
          >
             {/* Modal Header */}
             <div className="p-10 border-b border-slate-100 bg-slate-50/30 shrink-0">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-1.5 h-10 bg-brand-accent rounded-full shadow-[0_0_15px_rgba(252,209,22,0.5)]"></div>
                   <div className="flex flex-col">
                     <h3 className="text-3xl font-display font-black italic tracking-tight text-slate-900 uppercase leading-none">
                       {editingUserId ? "Editar Usuario" : "Nuevo Colaborador"}
                     </h3>
                     <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">ID: {editingUserId ? editingUserId.substring(0,12) : "Autogenerado"}</span>
                   </div>
                 </div>
                 <button 
                  onClick={() => setShowModal(false)}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-brand-blue flex items-center justify-center transition-all group shadow-sm"
                 >
                   <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                 </button>
               </div>
             </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Nombre Completo</label>
                    <input 
                      required
                      value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-slate-900 focus:outline-none focus:border-brand-blue/40 transition-all font-bold placeholder:text-slate-300 text-lg shadow-inner"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">DNI / ID Fiscal (Usuario de Ingreso)</label>
                    <input 
                      required
                      value={formData.dni}
                      onChange={e => setFormData({...formData, dni: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-slate-900 focus:outline-none focus:border-brand-blue/40 transition-all font-bold placeholder:text-slate-300 text-lg shadow-inner"
                      placeholder="77777777"
                    />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2">Este será el usuario para iniciar sesión</p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Contraseña</label>
                    <input 
                      type="password"
                      required={!editingUserId}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-slate-900 focus:outline-none focus:border-brand-blue/40 transition-all font-bold placeholder:text-slate-300 text-lg shadow-inner"
                      placeholder={editingUserId ? "••••••••" : "Clave de acceso"}
                    />
                    {editingUserId && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2">Dejar en blanco para no cambiar</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Rol del Usuario</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['ENCUESTADOR', 'ANALISTA', 'ZONAL', 'ADMINISTRADOR', 'CREATOR']
                      .filter(r => (currentUser?.role?.toUpperCase() === 'CREATOR' || currentUser?.role?.toUpperCase() === 'CREADOR') || (currentUser?.role === 'ANALISTA' && ['ENCUESTADOR', 'ZONAL', 'ADMINISTRADOR'].includes(r)))
                      .map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({...formData, role: r})}
                          className={cn(
                            "py-5 rounded-2xl font-bold text-[10px] uppercase tracking-widest border transition-all active:scale-95 group relative overflow-hidden",
                            formData.role === r 
                              ? "bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20" 
                              : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                  </div>
                </div>

                {formData.role === 'ZONAL' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zonas Asignadas</label>
                      <span className="text-[9px] font-bold text-brand-blue uppercase tracking-widest">{formData.zone_ids.length} Seleccionadas</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-inner max-h-[250px] overflow-y-auto">
                      {zones.map(z => (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              zone_ids: prev.zone_ids.includes(z.id) 
                                ? prev.zone_ids.filter(zid => zid !== z.id) 
                                : [...prev.zone_ids, z.id]
                            }));
                          }}
                          className={cn(
                            "px-5 py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest border transition-all flex items-center justify-between group shadow-sm",
                            formData.zone_ids.includes(z.id)
                              ? "bg-white text-brand-blue border-brand-blue shadow-md" 
                              : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className={cn("w-3.5 h-3.5", formData.zone_ids.includes(z.id) ? "text-brand-blue" : "text-slate-300")} />
                            {z.name}
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-md border transition-all flex items-center justify-center",
                            formData.zone_ids.includes(z.id) ? "bg-brand-blue border-brand-blue" : "bg-transparent border-slate-200"
                          )}>
                            {formData.zone_ids.includes(z.id) && <Check className="w-3 h-3 text-white stroke-[4]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(formData.role !== 'ANALISTA' && formData.role !== 'CREATOR') && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sedes Asignadas</label>
                      <span className="text-[9px] font-bold text-brand-blue uppercase tracking-widest">{formData.branch_ids.length} Seleccionadas</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-inner max-h-[250px] overflow-y-auto">
                      {branches.map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggleBranch(b.id)}
                          className={cn(
                            "px-5 py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest border transition-all flex items-center justify-between group shadow-sm",
                            formData.branch_ids.includes(b.id)
                              ? "bg-white text-brand-blue border-brand-blue shadow-md" 
                              : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className={cn("w-3.5 h-3.5", formData.branch_ids.includes(b.id) ? "text-brand-blue" : "text-slate-300")} />
                            {b.name}
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-md border transition-all flex items-center justify-center",
                            formData.branch_ids.includes(b.id) ? "bg-brand-blue border-brand-blue" : "bg-transparent border-slate-200"
                          )}>
                            {formData.branch_ids.includes(b.id) && <Check className="w-3 h-3 text-white stroke-[4]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {((formData.role || '').toUpperCase() === 'ANALISTA' || (formData.role || '').toUpperCase() === 'CREATOR' || (formData.role || '').toUpperCase() === 'CREADOR') && (
                  <div className="p-10 border border-brand-blue/10 bg-brand-blue/5 rounded-[2.5rem] text-center space-y-4 shadow-inner">
                    <div className="w-12 h-12 bg-white text-brand-blue rounded-xl flex items-center justify-center mx-auto shadow-md">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-brand-nav font-bold text-lg uppercase tracking-tight italic">Acceso Global Habilitado</h4>
                      <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest">Este rol tiene visibilidad sobre todas las sedes del sistema.</p>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-10 bg-slate-50/50 border-t border-slate-100 shrink-0">
               <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setShowModal(false);
                      setEditingUserId(null);
                      setFormData({ 
                        username: "", 
                        password: "", 
                        full_name: "", 
                        dni: "", 
                        role: "ENCUESTADOR", 
                        branch_ids: [],
                        zone_ids: []
                      });
                    }}
                    className="flex-1 py-5 bg-white text-slate-500 border border-slate-200 rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
                  >
                    REGRESAR
                  </button>
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    form="user-form"
                    className="flex-[2] py-5 bg-brand-nav text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-xl shadow-brand-blue/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-brand-blue disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {isSubmitting ? "PROCESANDO..." : (editingUserId ? "ACTUALIZAR DATOS" : "REGISTRAR COLABORADOR")}
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

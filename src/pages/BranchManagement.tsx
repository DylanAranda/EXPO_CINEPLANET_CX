import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Map, Loader2, Edit2, AlertTriangle, X, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  location: string;
  zone_id?: string;
  zone_name?: string;
  tipo_cine: "PRIME" | "CLASICO";
}

interface Zone {
  id: string;
  name: string;
}

export default function BranchManagement() {
  const { token, fetchWithAuth, user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", location: "", zone_id: "", tipo_cine: "CLASICO" });
  const [newZoneName, setNewZoneName] = useState("");
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Branch | null>(null);
  const [deletingZoneId, setDeletingZoneId] = useState<string | null>(null);
  const [confirmingDeleteZoneId, setConfirmingDeleteZoneId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [bRes, zRes] = await Promise.all([
        fetchWithAuth("/api/branches"),
        fetchWithAuth("/api/zones")
      ]);
      
      if (bRes.ok && zRes.ok) {
        const bData = await bRes.json();
        const zData = await zRes.json();
        setBranches(Array.isArray(bData) ? bData : []);
        setZones(Array.isArray(zData) ? zData : []);
      } else {
        const errB = !bRes.ok ? await bRes.json().catch(() => ({error: 'Fail'})) : null;
        const errZ = !zRes.ok ? await zRes.json().catch(() => ({error: 'Fail'})) : null;
        console.error("Fetch failed", errB, errZ);
        setBranches([]);
        setZones([]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim()) return toast.error("El nombre de la sede es requerido");
    
    setSaving(true);
    const url = editingBranchId ? `/api/branches/${editingBranchId}` : "/api/branches";
    const method = editingBranchId ? "PUT" : "POST";

    try {
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranch)
      });
      if (res.ok) {
        setNewBranch({ name: "", location: "", zone_id: "", tipo_cine: "CLASICO" });
        setEditingBranchId(null);
        setIsAdding(false);
        toast.success(editingBranchId ? "Sede actualizada correctamente" : "Sede creada correctamente");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({ error: "Error al guardar" }));
        toast.error(`Error: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Error de conexión: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return toast.error("El nombre de la zona es requerido");

    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newZoneName })
      });
      if (res.ok) {
        setNewZoneName("");
        setIsAddingZone(false);
        toast.success("Zona creada con éxito");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({ error: "Error al crear zona" }));
        toast.error(`ERROR: ${data.error || "No se pudo crear la zona"}`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Error de conexión al servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (confirmingDeleteZoneId !== id) {
      setConfirmingDeleteZoneId(id);
      // Auto-reset after 3 seconds if not clicked again
      setTimeout(() => {
        setConfirmingDeleteZoneId(prev => prev === id ? null : prev);
      }, 3000);
      return;
    }

    setDeletingZoneId(id);
    setConfirmingDeleteZoneId(null);
    try {
      const res = await fetchWithAuth(`/api/zones/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Zona eliminada");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({ error: "Fallo al eliminar" }));
        toast.error(`Error: ${data.error}`);
      }
    } catch (e) { 
      console.error(e);
      toast.error("Error al intentar eliminar");
    } finally {
      setDeletingZoneId(null);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setNewBranch({ 
      name: branch.name, 
      location: branch.location, 
      zone_id: branch.zone_id || "",
      tipo_cine: branch.tipo_cine || "CLASICO"
    });
    setIsAdding(true);
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    const { id } = showDeleteConfirm;
    
    try {
      const res = await fetchWithAuth(`/api/branches/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setShowDeleteConfirm(null);
        fetchData();
        alert("Sede eliminada del sistema");
      } else {
        const data = await res.json().catch(() => ({ error: "No se pudo obtener el motivo del fallo" }));
        alert(`RESTRICCIÓN DE SEGURIDAD: ${data.error}`);
      }
    } catch (err: any) {
      alert(`ERROR DE TRANSACCIÓN: ${err.message || "Error de conexión al intentar eliminar"}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-blue w-8 h-8" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(252,209,22,0.5)]"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Infraestructura Corporativa</span>
          </div>
          <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Centros de <span className="text-brand-blue border-b-4 border-brand-accent pb-1">Experiencia</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs max-w-xl">
            Gestión de puntos de contacto y nodos operativos de la red Cineplanet.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setEditingBranchId(null);
              setNewBranch({ name: "", location: "", zone_id: "", tipo_cine: "CLASICO" });
              setIsAdding(true);
            }}
            className="group relative px-8 py-4 bg-brand-nav text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/10 active:scale-95 transition-all overflow-hidden"
          >
            <div className="flex items-center gap-3 relative z-10">
              <Plus className="w-5 h-5 text-brand-accent" />
              REGISTRAR NUEVA SEDE
            </div>
          </button>
          
          <button 
            onClick={() => setIsAddingZone(true)}
            className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue transition-all active:scale-95"
          >
            GESTIÓN DE ZONAS
          </button>
        </div>
      </header>

      {/* Zones Section if wanted or just the button above */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {branches.map((b) => (
            <motion.div
              layout
              key={b.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
              
              <div className="relative mb-8">
                <div className="flex items-center justify-between mb-6">
                   <div className={`w-14 h-14 ${b.tipo_cine === 'PRIME' ? 'bg-slate-900 ring-4 ring-brand-accent/30' : 'bg-brand-blue'} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform`}>
                     <Building2 className={`w-7 h-7 ${b.tipo_cine === 'PRIME' ? 'text-brand-accent' : 'text-white'}`} />
                   </div>
                   <div className="flex items-center gap-2">
                     {b.tipo_cine === 'PRIME' ? (
                       <div className="px-3 py-1 bg-slate-900 border border-brand-accent text-brand-accent rounded-full shadow-[0_0_10px_rgba(252,209,22,0.3)]">
                         <span className="text-[9px] font-black italic tracking-widest uppercase">PRIME</span>
                       </div>
                     ) : (
                       <div className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-500 rounded-full">
                         <span className="text-[9px] font-black italic tracking-widest uppercase text-[#0141f2]">CLASICO</span>
                       </div>
                     )}
                     <div className="flex gap-1 ml-2">
                       <button 
                        onClick={() => handleEdit(b)}
                        className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand-blue hover:border-brand-blue transition-all"
                       >
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => setShowDeleteConfirm(b)}
                        className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand-red hover:border-brand-red transition-all"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight italic group-hover:text-brand-blue transition-colors leading-none">{b.name}</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-brand-accent" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{b.location}</span>
                    </div>
                    {b.zone_name && (
                      <div className="flex items-center gap-2">
                        <Map className="w-3 h-3 text-brand-blue-light" />
                        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">Zona: {b.zone_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block">IDENTIFICADOR DE NODO</span>
                  <code className="text-[10px] font-mono text-brand-blue font-bold tracking-tighter">CP_{b.id.substring(0,8).toUpperCase()}</code>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest">Activo</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {branches.length === 0 && (
           <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-dashed border-2 border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-slate-200 animate-bounce" />
              </div>
              <p className="text-slate-300 font-bold uppercase text-lg tracking-widest animate-pulse italic">
                No se han detectado sedes en la red
              </p>
           </div>
        )}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center border border-slate-200 shadow-2xl">
              <div className="w-20 h-20 bg-brand-red/10 text-brand-red rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-display font-black text-slate-900 uppercase mb-3">¿Eliminar Sede?</h3>
              <p className="text-slate-500 text-sm mb-10 font-medium leading-relaxed">Estás a punto de desvincular permanentemente la sede <span className="text-brand-red font-bold underline decoration-brand-red/30 underline-offset-4 font-display italic uppercase">"{showDeleteConfirm.name}"</span> del servidor central.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">CANCELAR</button>
                <button onClick={handleDelete} className="flex-1 py-5 bg-brand-red text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-brand-red/20 active:scale-95 transition-all text-sm">ELIMINAR</button>
              </div>
            </motion.div>
          </div>
        )}

        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="max-w-lg w-full bg-white rounded-[3rem] p-0 shadow-2xl relative overflow-hidden border border-slate-200">
             <div className="p-10 border-b border-slate-100 bg-slate-50/50">
               <div className="flex items-center gap-4">
                 <div className="w-1.5 h-10 bg-brand-accent rounded-full shadow-[0_0_15px_rgba(252,209,22,0.5)]"></div>
                 <div className="flex flex-col">
                   <h3 className="text-3xl font-display font-black italic tracking-tight text-slate-900 uppercase leading-none">
                     {editingBranchId ? "Editar Sede" : "Nuevo Complejo"}
                   </h3>
                   <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">ID: {editingBranchId ? editingBranchId.substring(0,12).toUpperCase() : "AUTOGENERADO"}</span>
                 </div>
                 <button onClick={() => setIsAdding(false)} className="ml-auto w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-brand-blue flex items-center justify-center transition-all group shadow-sm">
                   <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                 </button>
               </div>
             </div>
            
            <form onSubmit={handleSubmit} className="p-12 space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Nombre de la Sede</label>
                <input type="text" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 text-slate-900 focus:outline-none focus:border-brand-blue/40 transition-all font-bold placeholder:text-slate-300 text-lg shadow-inner" placeholder="EJ: Cineplanet Prime" required />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Ubicación / Ciudad</label>
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input type="text" value={newBranch.location} onChange={e => setNewBranch({...newBranch, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-8 py-5 text-slate-900 focus:outline-none focus:border-brand-blue/40 transition-all font-bold placeholder:text-slate-300 text-lg shadow-inner" placeholder="EJ: Miraflores, Lima" required />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Tipo de Cine</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setNewBranch({...newBranch, tipo_cine: "CLASICO"})}
                    className={`py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 transition-all ${newBranch.tipo_cine === 'CLASICO' ? 'bg-brand-blue/5 border-brand-blue text-brand-blue' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  >
                    CLASICO
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewBranch({...newBranch, tipo_cine: "PRIME"})}
                    className={`py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 transition-all ${newBranch.tipo_cine === 'PRIME' ? 'bg-slate-900 border-brand-accent text-brand-accent shadow-lg shadow-brand-accent/10' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  >
                    PRIME
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Zona Geográfica</label>
                <div className="relative">
                  <Map className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <select 
                      value={newBranch.zone_id} 
                      onChange={e => setNewBranch({...newBranch, zone_id: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-8 py-5 text-slate-900 focus:outline-none focus:border-brand-blue/40 transition-all font-bold text-lg shadow-inner appearance-none"
                    >
                      <option value="">Sin Zona Asignada</option>
                      {Array.isArray(zones) && zones.map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button type="button" disabled={saving} onClick={() => { setIsAdding(false); setEditingBranchId(null); setNewBranch({ name: "", location: "", zone_id: "", tipo_cine: "CLASICO" }); }} className="flex-1 py-5 bg-white text-slate-500 border border-slate-200 rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-sm disabled:opacity-50">CANCELAR</button>
                <button type="submit" disabled={saving} className="flex-[2] py-5 bg-brand-nav text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-xl shadow-brand-blue/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-brand-blue disabled:opacity-70 disabled:cursor-not-allowed">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingBranchId ? "ACTUALIZAR SEDE" : "REGISTRAR SEDE")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
        )}

        {isAddingZone && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="max-w-xl w-full bg-white rounded-[3rem] p-0 shadow-2xl relative overflow-hidden border border-slate-200">
               <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                 <div className="flex items-center justify-between">
                   <h3 className="text-3xl font-display font-black italic tracking-tight text-slate-900 uppercase leading-none">Gestión de Zonas</h3>
                   <button onClick={() => setIsAddingZone(false)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400">
                     <X className="w-6 h-6" />
                   </button>
                 </div>
               </div>
               
               <div className="p-10 space-y-8">
                 <form onSubmit={handleAddZone} className="flex gap-4">
                   <input 
                    type="text" 
                    value={newZoneName} 
                    onChange={e => setNewZoneName(e.target.value)} 
                    placeholder="NOMBRE DE LA NUEVA ZONA..." 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:border-brand-blue/40 shadow-inner" 
                    required 
                   />
                   <button type="submit" disabled={saving} className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50">
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "AGREGAR"}
                    </button>
                 </form>

                 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                   {zones.map(z => (
                     <div key={z.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-brand-blue/30 transition-all">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center"><Map className="w-5 h-5 text-brand-blue" /></div>
                         <span className="font-bold text-sm text-slate-700 uppercase tracking-tight">{z.name}</span>
                       </div>
                       <button 
                        onClick={() => handleDeleteZone(z.id)} 
                        disabled={deletingZoneId === z.id}
                        className={`min-w-[40px] h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 ${
                          confirmingDeleteZoneId === z.id 
                            ? "bg-red-500 text-white px-4 ring-4 ring-red-500/20" 
                            : "text-slate-300 hover:bg-red-50 hover:text-red-500"
                        }`}
                       >
                         {deletingZoneId === z.id ? (
                           <Loader2 className="w-4 h-4 animate-spin" />
                         ) : confirmingDeleteZoneId === z.id ? (
                           <span className="text-[9px] font-black tracking-tighter uppercase whitespace-nowrap">¿CONFIRMAR?</span>
                         ) : (
                           <Trash2 className="w-4 h-4" />
                         )}
                       </button>
                     </div>
                   ))}
                   {zones.length === 0 && <p className="text-center py-10 text-slate-400 font-bold text-[10px] uppercase tracking-widest">No hay zonas registradas</p>}
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

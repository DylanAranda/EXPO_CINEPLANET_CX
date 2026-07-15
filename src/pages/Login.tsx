import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Film, Lock, User, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
      
      login(data.token, data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans bg-[#001529]">
      {/* Cinematic Background with the User's Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("/login-bg.jpg")',
          backgroundColor: '#001529'
        }}
      >
        {/* Semi-transparent overlay to ensure legibility and professional look */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-nav/70 via-brand-nav/40 to-brand-nav/80 backdrop-blur-[1px]"></div>
      </div>
      
      {/* Ambient Gradient Overlays for extra depth and Cineplanet brand feel */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-brand-nav/60 via-transparent to-brand-blue/20 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,21,41,0.6)_100%)] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full relative z-10 my-auto"
      >
        <div className="bg-white/90 backdrop-blur-3xl p-0 rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] border border-white/40 ring-1 ring-white/10">
          <div className="p-6 sm:p-10 text-center relative pb-3 sm:pb-3">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-brand-blue/5 rounded-full blur-2xl -mt-12"></div>
            
            <motion.div 
              initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10"
            >
              <img src="/logo.png" alt="Cineplanet Logo" className="w-full h-full object-contain drop-shadow-xl" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative z-10"
            >
              <h1 className="text-2xl sm:text-3xl font-display font-black text-brand-nav tracking-tighter uppercase italic leading-none">
                Cineplanet <span className="text-brand-blue block text-base sm:text-lg not-italic mt-1.5 font-medium tracking-normal">Experience Manager</span>
              </h1>
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="h-[1px] flex-1 bg-slate-200/50"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Portal de Acceso</span>
                <div className="h-[1px] flex-1 bg-slate-200/50"></div>
              </div>
            </motion.div>
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 pb-8 sm:px-10 sm:pb-10 pt-1 space-y-4 sm:space-y-5 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50/80 backdrop-blur-sm text-red-600 p-3 sm:p-4 rounded-xl text-[10px] border border-red-100/30 flex items-center gap-3 font-bold uppercase tracking-wider"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <span className="flex-1 leading-tight text-left">{error}</span>
              </motion.div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1.5">Credencial de Usuario</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-50/80 rounded-lg flex items-center justify-center group-focus-within:bg-brand-blue group-focus-within:text-white transition-all duration-300 shadow-sm border border-slate-100">
                  <User className="w-4 h-4 opacity-50 group-focus-within:opacity-100" />
                </div>
                <input 
                   type="text" 
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                   className="w-full bg-slate-50/40 border-2 border-slate-100 rounded-xl pl-16 pr-4 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/20 transition-all font-bold placeholder:text-slate-300 text-sm shadow-inner"
                   placeholder="Nombre de Usuario"
                   required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1.5">Código de Seguridad</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-50/80 rounded-lg flex items-center justify-center group-focus-within:bg-brand-blue group-focus-within:text-white transition-all duration-300 shadow-sm border border-slate-100">
                  <Lock className="w-4 h-4 opacity-50 group-focus-within:opacity-100" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/40 border-2 border-slate-100 rounded-xl pl-16 pr-12 py-3 text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue/20 transition-all font-bold placeholder:text-slate-300 text-sm shadow-inner"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-blue transition-all outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-brand-nav text-white rounded-xl font-black uppercase tracking-[0.25em] hover:bg-brand-blue transition-all shadow-[0_15px_30px_-10px_rgba(0,0,0,0.35)] hover:shadow-brand-blue/40 active:scale-[0.98] disabled:opacity-50 text-[10px] sm:text-xs group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.15s]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                    </div>
                  ) : "Iniciar Sesión"}
                </span>
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse shadow-[0_0_8px_rgba(252,209,22,0.8)]"></div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Conexión Encriptada</p>
              </div>
              <p className="text-[8px] font-bold text-slate-350 uppercase tracking-tighter">
                Tecnología de Datos Cineplanet © 2026
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

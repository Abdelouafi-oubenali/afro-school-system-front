import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, loading, error, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const isTeacherRole = (role?: string) => {
    const normalized = (role || "").toLowerCase();
    return normalized.includes("enseign");
  };

  useEffect(() => {
    if (user) {
      const destination = isTeacherRole(user.role) ? "/enseignant" : "/dashboard";
      console.log("✅ Redirection post-login:", destination, user);
      navigate(destination);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    console.log("[Login] submit", {
      rawEmail: email,
      normalizedEmail,
      passwordLength: password.length,
    });
    await login(normalizedEmail, password);
  };

  return (
   <div className="min-h-screen flex bg-gradient-to-br from-ice to-white font-['Inter']">
  {/* LEFT SIDE - IMAGE & BRANDING */}
  <div className="hidden lg:flex lg:w-1/2 relative bg-navy overflow-hidden">
    {/* Background Image avec overlay gradient */}
    <div className="absolute inset-0">
      <img
        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
        alt="Students collaborating"
        className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-700"
      />
      {/* Overlay gradient sophistiqué */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/80 to-teal/30 mix-blend-multiply" />
      
      {/* Pattern overlay subtil */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
    </div>

    {/* Content avec animation */}
    <div className="relative z-10 w-full flex flex-col justify-between p-16">
      {/* Logo et branding */}
      <div className="animate-slideDown">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-teal to-teal-dark shadow-lg shadow-teal/20">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.18L20.49 9 12 12.82 3.51 9 12 5.18zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
          <div>
            <h1 className="font-['Clash_Display'] text-white text-4xl font-bold tracking-tight">
              Afro School System
            </h1>
            <span className="font-['Satoshi'] text-teal-lt text-sm font-medium tracking-wider">
              Gestion Scolaire Intelligente
            </span>
          </div>
        </div>
      </div>

      {/* Message central avec effet de glassmorphism */}
      <div className="space-y-6 animate-fadeIn">
        <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 border border-white/10">
          <h2 className="font-['Cabinet_Grotesk'] text-white text-5xl font-bold leading-tight mb-6">
            Ensemble pour<br />réussir
          </h2>
          
          <div className="space-y-4 text-slate text-lg">
            <p className="font-['Inter'] flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Élèves, enseignants, administration : unis</span>
            </p>
            <p className="font-['Inter'] flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Communication fluide et instantanée</span>
            </p>
            <p className="font-['Inter'] flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Tous vos outils en un seul endroit</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer avec statistiques */}
      <div className="grid grid-cols-3 gap-4 animate-slideUp">
        <div className="text-center">
          <div className="font-['Satoshi'] text-white text-2xl font-bold">5000+</div>
          <div className="font-['Inter'] text-slate text-sm">Étudiants</div>
        </div>
        <div className="text-center">
          <div className="font-['Satoshi'] text-white text-2xl font-bold">300+</div>
          <div className="font-['Inter'] text-slate text-sm">Enseignants</div>
        </div>
        <div className="text-center">
          <div className="font-['Satoshi'] text-white text-2xl font-bold">50+</div>
          <div className="font-['Inter'] text-slate text-sm">Établissements</div>
        </div>
      </div>
    </div>
  </div>

  {/* RIGHT SIDE - LOGIN FORM */}
  <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
    {/* Background pattern subtil */}
    <div className="absolute inset-0 opacity-5" style={{
      backgroundImage: `radial-gradient(circle at 1px 1px, #1A2B4A 1px, transparent 0)`,
      backgroundSize: '40px 40px'
    }} />
    
    <div className="w-full max-w-md relative z-10">
      {/* En-tête avec animation */}
      <div className="text-center mb-10 animate-slideDown">
        <div className="lg:hidden flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-teal to-teal-dark shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.18L20.49 9 12 12.82 3.51 9 12 5.18zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
        </div>
        <h2 className="font-['Clash_Display'] text-3xl font-bold text-navy mb-2">Bienvenue 👋</h2>
        <p className="font-['Inter'] text-slate">Connectez-vous à votre espace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl flex items-start gap-3 bg-coral/10 border border-coral/20 text-coral text-sm animate-slideIn">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="font-['Inter']">{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="font-['Satoshi'] text-sm font-semibold text-navy flex items-center gap-2">
            <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Adresse Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate group-focus-within:text-teal transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <input
              type="email"
              placeholder="admin@afroschool.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-['Inter'] block w-full pl-11 pr-4 py-3.5 bg-ice border border-navy/10 rounded-xl text-navy placeholder-slate/60 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all group-hover:border-navy/20"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-['Satoshi'] text-sm font-semibold text-navy flex items-center gap-2">
              <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Mot de passe
            </label>
            <a href="#" className="font-['Satoshi'] text-xs font-semibold text-teal hover:text-teal-dark transition-colors">
              Mot de passe oublié ?
            </a>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate group-focus-within:text-teal transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-['Inter'] block w-full pl-11 pr-4 py-3.5 bg-ice border border-navy/10 rounded-xl text-navy placeholder-slate/60 tracking-widest focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all group-hover:border-navy/20"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <input 
            type="checkbox" 
            id="remember" 
            className="w-4 h-4 rounded text-teal focus:ring-teal/30 border-navy/20 cursor-pointer"
          />
          <label htmlFor="remember" className="font-['Inter'] text-sm text-slate select-none cursor-pointer hover:text-navy transition-colors">
            Se souvenir de moi
          </label>
        </div>

        <button
          type="submit"
          className="font-['Satoshi'] w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-teal to-teal-dark shadow-lg shadow-teal/25"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connexion en cours...
            </span>
          ) : "Se connecter"}
        </button>
      </form>

      <p className="font-['Inter'] text-center text-sm text-slate mt-8">
        Vous n'avez pas de compte ?{" "}
        <a href="#" className="font-['Satoshi'] font-semibold text-navy hover:text-teal transition-colors border-b border-navy/20 hover:border-teal pb-0.5">
          Contacter le support
        </a>
      </p>

      {/* Sécurité badge */}
      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="font-['Inter']">Connexion sécurisée SSL</span>
      </div>
    </div>
  </div>
</div>
  );
}
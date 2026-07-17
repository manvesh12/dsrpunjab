import { useState } from "react";
import { ArrowRight, Lock, User, ShieldCheck, Home, FileCheck2, UsersRound, ScanSearch, Eye } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../security/auth.context";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"staff" | "authority">("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nicId, setNicId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate backend API call
    setTimeout(() => {
      let role = "SUPER_ADMIN";
      const loginEmail = activeTab === "staff" ? email : nicId;
      
      if (loginEmail.includes("deo") || loginEmail.includes("data")) {
        role = "DATA_ENTRY_OPERATOR";
      } else if (loginEmail.includes("reviewer") || loginEmail.includes("review")) {
        role = "REVIEWER";
      } else if (loginEmail.includes("district")) {
        role = "DISTRICT_ADMIN";
      }
      
      // Mock a successful login response matching our AuthState
      login({
        accessToken: "mock_jwt_token_header.mock_jwt_token_payload.mock_signature",
        user: {
          id: activeTab === "staff" ? "usr_staff" : "usr_gov",
          name: activeTab === "staff" ? "Staff Coordinator" : "Govt Authority",
          email: activeTab === "staff" ? (email || "staff@punjab.gov.in") : (nicId || "nic_admin"),
          role: role as any,
          department: "DSR Administration",
        },
      });

      setIsLoading(false);
      
      // Redirect to the page they tried to visit, or dashboard
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex relative overflow-hidden font-sans transition-colors">
      
      {/* Absolute Back to Home */}
      <div className="absolute top-6 left-6 z-50">
        <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white bg-slate-800/50 hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold transition-all border border-slate-700 dark:border-slate-800">
          <Home size={16} /> Back to Home
        </Link>
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-center lg:w-[50%] bg-slate-900 relative p-16 z-10 border-r border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
        
        <div className="relative z-10">
          <div className="mb-8">
            <img src="/assets/dsr-logo.png" alt="Smart DSR Portal" className="h-20 object-contain brightness-0 invert" />
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            District Survey Reports,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">made simpler.</span>
          </h1>
          
          <p className="text-lg text-slate-400 mb-12 max-w-md font-medium leading-relaxed">
            One secure workspace for preparing, reviewing and publishing compliant District Survey Reports for sand mining.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-blue-900/50 border border-blue-800/50 flex items-center justify-center shrink-0 text-blue-400">
                <FileCheck2 size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Structured reporting</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Standardised chapters, annexures and front matter</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/50 border border-emerald-800/50 flex items-center justify-center shrink-0 text-emerald-400">
                <UsersRound size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Role-based workflow</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Coordinators, reviewers and authorities in one portal</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-800/50 flex items-center justify-center shrink-0 text-purple-400">
                <ScanSearch size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Live validation</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Preview and review report content before publishing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[50%] flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 relative transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-50"></div>
        
        <div className="w-full max-w-md relative z-10 animate-[fadeInUp_0.6s_ease-out_forwards]">
          
          {/* Logo for mobile only */}
          <div className="lg:hidden mb-8 flex justify-center">
            <img src="/assets/dsr-logo.png" alt="Smart DSR Portal" className="h-16 object-contain dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            
            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950/50 p-2 gap-2 border-b border-slate-200 dark:border-slate-800 transition-colors">
              <button 
                onClick={() => setActiveTab("staff")}
                className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeTab === "staff" 
                    ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                }`}
              >
                Faculty / Staff
              </button>
              <button 
                onClick={() => setActiveTab("authority")}
                className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeTab === "authority" 
                    ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                }`}
              >
                Govt. Authority
              </button>
            </div>

            <div className="p-8 md:p-10">
              
              {activeTab === "staff" ? (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Staff Portal</h2>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Sign in to your DSR Coordinator / Reviewer account</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Username</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                          type="text" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all placeholder:text-slate-400"
                          placeholder="e.g. super.admin"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
                        <a href="#" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Forgot?</a>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all placeholder:text-slate-400"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    {isLoading ? "Authenticating..." : (
                      <>Login to Portal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                  
                  <div className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 pt-4">
                    Don't have an account? <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Sign Up</a>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Govt. Portal</h2>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Sign in with your NIC credentials</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">NIC ID</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                          type="text" 
                          required
                          value={nicId}
                          onChange={(e) => setNicId(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all placeholder:text-slate-400"
                          placeholder="Enter NIC ID"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Security PIN</label>
                        <a href="#" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Forgot PIN?</a>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                          type={showPin ? "text" : "password"}
                          required
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all placeholder:text-slate-400"
                          placeholder="••••••"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <Eye size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-emerald-600/30 transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    {isLoading ? "Verifying..." : (
                      <>Verify & Login <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </form>
              )}
              
            </div>
          </div>
          
          <div className="text-center mt-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Secure access is restricted to authorized personnel only.
          </div>
        </div>
      </div>
      
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowRight, User, Lock, Mail, Phone, Briefcase, Building2,
  ShieldCheck, Eye, EyeOff, CheckCircle2, Home, AlertCircle,
  FileCheck2, UsersRound, ScanSearch, ChevronRight
} from "lucide-react";

const PUNJAB_DISTRICTS = [
  "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
  "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
  "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Pathankot",
  "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur",
  "Shaheed Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran",
];

const ROLES = [
  { value: "SDO", label: "SDO (Sub-Divisional Officer)" },
  { value: "AXEN", label: "AXEN (Assistant Executive Engineer)" },
  { value: "REVIEWER", label: "Reviewer" },
  { value: "REVIEWER_1", label: "Reviewer 1" },
  { value: "REVIEWER_2", label: "Reviewer 2" },
  { value: "DISTRICT_OFFICER", label: "District Officer (Data Entry)" },
  { value: "DISTRICT_ADMIN", label: "District Admin" },
  { value: "STATE_ADMIN", label: "State Admin" },
];

type RegistrationStep = "details" | "password" | "otp" | "success";

interface FormData {
  fullName: string;
  email: string;
  mobile: string;
  employeeId: string;
  department: string;
  designation: string;
  district: string;
  gender: string;
  role: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

const initialForm: FormData = {
  fullName: "",
  email: "",
  mobile: "",
  employeeId: "",
  department: "",
  designation: "",
  district: "",
  gender: "",
  role: "",
  password: "",
  confirmPassword: "",
  terms: false,
};

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "12+ characters", pass: password.length >= 12 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Lowercase letter", pass: /[a-z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-500", "bg-red-400", "bg-amber-400", "bg-lime-400", "bg-emerald-500"];
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Strength: <span className="text-slate-700 dark:text-slate-200">{labels[Math.max(0, score - 1)] || "Very Weak"}</span>
      </p>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-1.5 text-xs font-medium ${c.pass ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
            <CheckCircle2 size={12} className={c.pass ? "opacity-100" : "opacity-30"} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("token");
  const invitedEmail = searchParams.get("email");

  const [step, setStep] = useState<RegistrationStep>("details");
  const [form, setForm] = useState<FormData>({
    ...initialForm,
    email: invitedEmail || "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(600);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInvited = !!inviteToken;

  // OTP timer
  useEffect(() => {
    if (step !== "otp") return;
    const timer = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) { clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const set = (key: keyof FormData, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateDetails = () => {
    const errs: typeof errors = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email is required";
    if (!form.mobile.trim() || !/^\d{10}$/.test(form.mobile)) errs.mobile = "Valid 10-digit mobile number required";
    if (!form.employeeId.trim()) errs.employeeId = "Employee ID is required";
    if (!form.department.trim()) errs.department = "Department is required";
    if (!form.district) errs.district = "Please select a district";
    if (!form.gender) errs.gender = "Please select gender";
    if (!form.role) errs.role = "Please select a role";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePassword = () => {
    const errs: typeof errors = {};
    if (form.password.length < 12) errs.password = "Minimum 12 characters required";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!form.terms) errs.terms = "You must accept the terms";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleDetailsNext = () => {
    if (validateDetails()) setStep("password");
  };

  const handlePasswordNext = () => {
    if (!validatePassword()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("otp");
      setOtpTimer(600);
    }, 1200);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // In real app: verify OTP with backend
      setStep("success");
    }, 1200);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-slate-900 flex relative overflow-hidden font-sans">
      {/* Grid bg */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Login */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          to="/login"
          className="flex items-center gap-2 text-white/70 hover:text-white bg-slate-800/60 hover:bg-slate-800 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold transition-all border border-slate-700"
        >
          <Home size={15} /> Back to Login
        </Link>
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-center w-[42%] bg-slate-900/80 backdrop-blur-sm relative p-16 z-10 border-r border-slate-800/80">
        <div className="mb-10">
          <img src="/assets/dsr-logo.png" alt="DSR Portal" className="h-16 object-contain brightness-0 invert opacity-90" />
        </div>

        <div className="mb-2">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full">
            <ShieldCheck size={12} /> Government of Punjab
          </span>
        </div>
        <h1 className="text-4xl font-black text-white leading-tight mb-4 mt-4">
          Join the DSR<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Portal Platform
          </span>
        </h1>
        <p className="text-slate-400 font-medium leading-relaxed mb-10 max-w-sm">
          {isInvited
            ? "You've been invited to join the Smart DSR Portal. Complete your registration below to gain access."
            : "Register as a coordinator, reviewer, or officer for the Department of Mines & Geology."}
        </p>

        {/* Step indicator */}
        <div className="space-y-3">
          {[
            { step: "details", label: "Personal & Role Details", icon: User },
            { step: "password", label: "Set Secure Password", icon: Lock },
            { step: "otp", label: "Verify Email OTP", icon: Mail },
            { step: "success", label: "Account Activated", icon: CheckCircle2 },
          ].map((s, idx) => {
            const steps = ["details", "password", "otp", "success"];
            const currentIdx = steps.indexOf(step);
            const sIdx = steps.indexOf(s.step);
            const isActive = step === s.step;
            const isDone = sIdx < currentIdx;

            return (
              <div key={s.step} className={`flex items-center gap-3 transition-all ${isActive ? "opacity-100" : isDone ? "opacity-60" : "opacity-30"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border transition-all ${
                  isDone ? "bg-emerald-500 border-emerald-500 text-white" :
                  isActive ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/40" :
                  "bg-slate-800 border-slate-700 text-slate-500"
                }`}>
                  {isDone ? <CheckCircle2 size={14} /> : idx + 1}
                </div>
                <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-400"}`}>{s.label}</span>
                {isActive && <ChevronRight size={14} className="text-blue-400 ml-auto" />}
              </div>
            );
          })}
        </div>

        {/* Features */}
        <div className="mt-10 pt-8 border-t border-slate-800 space-y-3">
          {[
            { icon: FileCheck2, text: "Structured DSR reporting workflow" },
            { icon: UsersRound, text: "Role-based access & collaboration" },
            { icon: ScanSearch, text: "Live validation & compliance checks" },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-sm text-slate-500">
              <f.icon size={14} className="text-slate-600" />
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[58%] flex items-center justify-center p-6 lg:p-10 relative z-10 overflow-y-auto">
        <div className="w-full max-w-xl">

          {/* Mobile logo */}
          <div className="lg:hidden mb-6 flex items-center gap-3">
            <img src="/assets/dsr-logo.png" alt="DSR Portal" className="h-10 object-contain brightness-0 invert" />
            <span className="text-white font-black text-lg">DSR Portal</span>
          </div>

          {/* Step: Details */}
          {step === "details" && (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl border border-slate-700/80 p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-1">
                {isInvited ? "Complete Your Registration" : "Create Account"}
              </h2>
              <p className="text-sm font-semibold text-slate-400 mb-7">
                {isInvited ? `You were invited to join as ${invitedEmail}` : "Register as a new Coordinator / Staff"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => set("fullName", e.target.value)}
                      className={`w-full bg-slate-900/50 border ${errors.fullName ? "border-red-500" : "border-slate-700"} text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-sm placeholder:text-slate-600 transition-all`}
                      placeholder="Officer's full name"
                    />
                  </div>
                  {errors.fullName && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div className={isInvited ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      readOnly={isInvited}
                      className={`w-full bg-slate-900/50 border ${errors.email ? "border-red-500" : "border-slate-700"} text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm placeholder:text-slate-600 transition-all ${isInvited ? "opacity-60 cursor-not-allowed" : ""}`}
                      placeholder="user@domain.gov.in"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
                </div>

                {/* Mobile */}
                {!isInvited && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        value={form.mobile}
                        onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={`w-full bg-slate-900/50 border ${errors.mobile ? "border-red-500" : "border-slate-700"} text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm placeholder:text-slate-600 transition-all`}
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    {errors.mobile && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.mobile}</p>}
                  </div>
                )}

                {/* Mobile for invited */}
                {isInvited && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        value={form.mobile}
                        onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={`w-full bg-slate-900/50 border ${errors.mobile ? "border-red-500" : "border-slate-700"} text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm placeholder:text-slate-600 transition-all`}
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    {errors.mobile && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.mobile}</p>}
                  </div>
                )}

                {/* Employee ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Employee ID *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="text"
                      value={form.employeeId}
                      onChange={(e) => set("employeeId", e.target.value)}
                      className={`w-full bg-slate-900/50 border ${errors.employeeId ? "border-red-500" : "border-slate-700"} text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm placeholder:text-slate-600 transition-all`}
                      placeholder="Employee / official ID"
                    />
                  </div>
                  {errors.employeeId && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.employeeId}</p>}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Department *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => set("department", e.target.value)}
                      className={`w-full bg-slate-900/50 border ${errors.department ? "border-red-500" : "border-slate-700"} text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm placeholder:text-slate-600 transition-all`}
                      placeholder="e.g. Mines & Geology"
                    />
                  </div>
                  {errors.department && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.department}</p>}
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Designation</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => set("designation", e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm placeholder:text-slate-600 transition-all"
                    placeholder="e.g. SDO"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Gender *</label>
                  <select
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                    className={`w-full bg-slate-900/50 border ${errors.gender ? "border-red-500" : "border-slate-700"} text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  {errors.gender && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.gender}</p>}
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">District *</label>
                  <select
                    value={form.district}
                    onChange={(e) => set("district", e.target.value)}
                    className={`w-full bg-slate-900/50 border ${errors.district ? "border-red-500" : "border-slate-700"} text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all`}
                  >
                    <option value="">Select district</option>
                    {PUNJAB_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.district && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.district}</p>}
                </div>

                {/* Role */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Role / Access Level *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => set("role", r.value)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          form.role === r.value
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  {errors.role && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.role}</p>}
                </div>
              </div>

              <button
                onClick={handleDetailsNext}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-bold text-base shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center gap-2 group"
              >
                Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-center text-sm font-semibold text-slate-500 mt-5">
                Already registered?{" "}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline">Sign In</Link>
              </p>
            </div>
          )}

          {/* Step: Password */}
          {step === "password" && (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl border border-slate-700/80 p-8 shadow-2xl">
              <button onClick={() => setStep("details")} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold mb-6 transition-colors">
                ← Back
              </button>
              <h2 className="text-2xl font-black text-white mb-1">Set Your Password</h2>
              <p className="text-sm font-semibold text-slate-400 mb-7">Choose a strong, secure password for your account</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Create Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      className={`w-full bg-slate-900/50 border ${errors.password ? "border-red-500" : "border-slate-700"} text-white rounded-xl pl-10 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-600 transition-all`}
                      placeholder="Minimum 12 characters"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.password}</p>}
                  <PasswordStrength password={form.password} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                      className={`w-full bg-slate-900/50 border ${errors.confirmPassword ? "border-red-500" : form.confirmPassword && form.confirmPassword === form.password ? "border-emerald-500" : "border-slate-700"} text-white rounded-xl pl-10 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-600 transition-all`}
                      placeholder="Re-enter your password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.confirmPassword}</p>}
                  {form.confirmPassword && form.confirmPassword === form.password && (
                    <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={11} />Passwords match</p>
                  )}
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`relative mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 transition-all shrink-0 ${form.terms ? "bg-blue-600 border-blue-600" : "bg-transparent border-slate-600 group-hover:border-slate-400"}`}>
                    <input type="checkbox" className="sr-only" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} />
                    {form.terms && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-xs font-medium text-slate-400 leading-relaxed">
                    I accept the Smart DSR Portal <span className="text-blue-400 hover:underline cursor-pointer">Terms of Use</span> and confirm this account is being registered by the invited email owner.
                  </span>
                </label>
                {errors.terms && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={11} />{errors.terms}</p>}
              </div>

              <button
                onClick={handlePasswordNext}
                disabled={isSubmitting}
                className="w-full mt-7 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl py-3.5 font-bold text-base shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center gap-2 group"
              >
                {isSubmitting ? "Sending OTP..." : <><span>Continue</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </div>
          )}

          {/* Step: OTP */}
          {step === "otp" && (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl border border-slate-700/80 p-8 shadow-2xl text-center">
              <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Mail size={32} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Verify Your Email</h2>
              <p className="text-sm font-semibold text-slate-400 mb-1">
                A 6-digit OTP was sent to
              </p>
              <p className="text-blue-400 font-bold mb-7">{form.email}</p>

              <div className="flex gap-3 justify-center mb-6">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(idx, e)}
                    maxLength={1}
                    className="w-12 h-14 text-center text-2xl font-black text-white bg-slate-900/70 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                ))}
              </div>

              <p className="text-sm font-semibold text-slate-400 mb-6">
                OTP expires in{" "}
                <span className={`font-black ${otpTimer < 60 ? "text-red-400" : "text-amber-400"}`}>
                  {formatTime(otpTimer)}
                </span>
              </p>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.join("").length < 6 || isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold text-base shadow-lg shadow-emerald-600/30 transition-all flex justify-center items-center gap-2"
              >
                {isSubmitting ? "Verifying..." : "Complete Registration →"}
              </button>

              {otpTimer === 0 && (
                <button
                  onClick={() => { setOtpTimer(600); setOtp(["", "", "", "", "", ""]); }}
                  className="w-full mt-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl py-3 font-bold text-sm transition-all"
                >
                  Resend OTP
                </button>
              )}

              <p className="text-xs text-slate-500 mt-4">Demo: enter any 6 digits to proceed</p>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl border border-slate-700/80 p-10 shadow-2xl text-center">
              <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6 animate-[pulse_2s_ease-in-out_infinite]">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Registration Complete!</h2>
              <p className="text-slate-400 font-medium mb-3 text-sm leading-relaxed">
                Your account has been registered successfully. An administrator will review and activate your account within 24 hours.
              </p>
              <div className="bg-slate-900/60 rounded-xl p-4 mb-7 text-left border border-slate-700">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Summary</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="text-white font-semibold">{form.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-blue-400 font-semibold">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">District</span><span className="text-white font-semibold">{form.district}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="text-amber-400 font-semibold">{form.role}</span></div>
                </div>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-bold text-base shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center gap-2"
              >
                Go to Login →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { ArrowRight, FileText, LifeBuoy, Map, Search, Bell, MapPin, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublicSettingsStore } from "../../stores/publicSettingsStore";
import ThemeToggle from "../../components/ui/ThemeToggle";

export default function HomePage() {
  const { announcements } = usePublicSettingsStore();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors">
      {/* Pre-header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 z-50 relative shadow-sm transition-colors">
        <div>
          <span>भारत सरकार / Government of Punjab</span>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <a href="#main-content" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Skip to Main Content</a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Sitemap</a>
          <div className="flex gap-2 font-bold">
            <button className="hover:text-blue-600 dark:hover:text-blue-400">A+</button>
            <button className="hover:text-blue-600 dark:hover:text-blue-400">A</button>
          </div>
          <span className="text-blue-600 dark:text-blue-400">English</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white dark:bg-slate-900 py-4 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 z-40 relative shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <img 
              src="/assets/Emblem_of_India.svg.png" 
              alt="Punjab Emblem" 
              className="h-16 w-auto object-contain"
            />
            <div className="h-10 w-px bg-slate-300 hidden md:block"></div>
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Government of Punjab</div>
              <div className="flex items-center gap-2 mt-1 mb-0.5">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">District Survey Report Portal</h1>
                <img src="/assets/dsr-logo.png" alt="Smart DSR" className="h-6 object-contain hidden md:block dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
              </div>
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">Department of Mining and Geology</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Technical Support</div>
              <div className="font-black text-slate-800 dark:text-slate-200">IIT Ropar</div>
            </div>
            <img src="/assets/sensrs-final-logo.webp" alt="IIT Ropar" className="h-12 w-auto object-contain hidden md:block" />
          </div>
        </div>
      </header>

      {/* Navbar */}
      <nav className="bg-slate-900 dark:bg-slate-950 sticky top-0 z-30 shadow-lg dark:border-b dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex justify-between items-center overflow-x-auto hide-scrollbar">
          <ul className="flex items-center gap-6 h-full">
            <li className="h-full flex items-center">
              <a href="#" className="text-white font-bold border-b-2 border-amber-400 pb-1 h-full flex items-center whitespace-nowrap">Home</a>
            </li>
            <li className="h-full flex items-center">
              <a href="#about" className="text-slate-300 hover:text-white hover:text-amber-400 font-semibold transition-colors whitespace-nowrap">About DSR</a>
            </li>
            <li className="h-full flex items-center">
              <a href="#services" className="text-slate-300 hover:text-white hover:text-amber-400 font-semibold transition-colors whitespace-nowrap">Services</a>
            </li>
            <li className="h-full flex items-center">
              <a href="#reports" className="text-slate-300 hover:text-white hover:text-amber-400 font-semibold transition-colors whitespace-nowrap">District Reports</a>
            </li>
            <li className="h-full flex items-center">
              <a href="#helpdesk" className="text-slate-300 hover:text-white hover:text-amber-400 font-semibold transition-colors whitespace-nowrap">Helpdesk</a>
            </li>
          </ul>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login" className="bg-amber-500 text-slate-900 px-5 py-2 rounded-lg font-bold hover:bg-amber-400 hover:shadow-lg transition-all shadow-sm whitespace-nowrap hidden md:block">
              Official Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Login Button */}
      <Link to="/login" className="md:hidden block w-full bg-amber-500 hover:bg-amber-400 text-center text-slate-900 py-3 font-bold sticky top-14 z-20 shadow-sm">
        Official Login
      </Link>

      <main id="main-content">
        {/* Hero Section */}
        <section className="relative bg-white overflow-hidden border-b border-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-30 z-0"></div>
          
          {/* Big Background Logo */}
          <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-[0.18]">
            <img src="/assets/dsr-logo.png" alt="Watermark" className="w-[800px] h-auto object-contain drop-shadow-md filter grayscale contrast-[1.4]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 pt-16 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
              <div className="lg:col-span-7 flex flex-col gap-4 relative z-10">
                <div className="inline-flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest">
                  <span className="w-8 h-px bg-blue-600"></span>
                  Digital Public Service Platform
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                  District Survey Reports <br className="hidden md:block"/>
                  <span className="text-slate-400 font-normal">for a transparent Punjab</span>
                </h2>
                <p className="text-lg font-medium text-slate-600 max-w-2xl mt-4 leading-relaxed">
                  Access, prepare and monitor District Survey Reports through a unified, secure portal for the Department of Mining and Geology, Government of Punjab.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Link to="/login" className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg group">
                    Access DSR Portal
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a href="#reports" className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-lg">
                    View Public Reports
                    <FileText size={20} />
                  </a>
                </div>
              </div>
              
              <div className="lg:col-span-5 relative flex justify-center items-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-50 dark:bg-amber-900/20"></div>
                
                {/* Floating Notice Board */}
                <div className="relative z-10 w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-amber-200 dark:border-amber-900/50 overflow-hidden flex flex-col h-[400px]">
                  <div className="bg-amber-500 text-slate-900 dark:bg-amber-600 dark:text-slate-50 font-black px-6 py-4 flex items-center justify-between shadow-sm">
                    <span className="uppercase tracking-wider">Notice Board</span>
                    <Bell size={20} className="animate-pulse" />
                  </div>
                  
                  <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-950/50">
                    <div className="absolute inset-0 flex flex-col hover:[animation-play-state:paused] animate-[marquee-vertical_20s_linear_infinite] px-6">
                      
                      {/* Notice Items */}
                      <div className="py-4 border-b border-slate-200 last:border-0">
                        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase mb-1 inline-block">New</span>
                        <p className="font-semibold text-slate-800 text-sm leading-tight hover:text-blue-600 cursor-pointer transition-colors">
                          Guidelines for submission of DSR for the financial year 2026-27 have been updated.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">17 July 2026</p>
                      </div>

                      <div className="py-4 border-b border-slate-200 last:border-0">
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase mb-1 inline-block">Update</span>
                        <p className="font-semibold text-slate-800 text-sm leading-tight hover:text-blue-600 cursor-pointer transition-colors">
                          District Survey Reports for Patiala and Ludhiana are now available for public review.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">14 July 2026</p>
                      </div>

                      <div className="py-4 border-b border-slate-200 last:border-0">
                        <p className="font-semibold text-slate-800 text-sm leading-tight hover:text-blue-600 cursor-pointer transition-colors">
                          Training session for Data Entry Operators scheduled for next week.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">10 July 2026</p>
                      </div>

                      <div className="py-4 border-b border-slate-200 last:border-0">
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded uppercase mb-1 inline-block">Alert</span>
                        <p className="font-semibold text-slate-800 text-sm leading-tight hover:text-blue-600 cursor-pointer transition-colors">
                          Scheduled maintenance on the portal this Sunday from 2 AM to 4 AM.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">05 July 2026</p>
                      </div>
                      
                      {/* Duplicated for seamless loop */}
                      <div className="py-4 border-b border-slate-200 dark:border-slate-800 last:border-0">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded uppercase mb-1 inline-block">New</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                          Guidelines for submission of DSR for the financial year 2026-27 have been updated.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">17 July 2026</p>
                      </div>

                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 text-center z-10 relative">
                    <a href="#" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 uppercase tracking-wide">View All Notices</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements Section */}
        {announcements && announcements.length > 0 && (
          <section className="bg-white dark:bg-slate-900 py-12 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <Bell size={20} className="text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Public Notices & Announcements</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.filter(a => a.active).map((ann, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 rounded-xl hover:shadow-md dark:hover:border-slate-600 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {ann.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ann.date}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg leading-tight mb-2">{ann.title}</h3>
                    <a href="#" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                      Read Details <ArrowRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Services Grid */}
        <section id="services" className="py-20 bg-slate-50 dark:bg-slate-950 px-4 md:px-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 block">Core Offerings</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">Portal Services</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <FileText size={32} />, title: "Create DSR", desc: "Start or continue a district report." },
                { icon: <Map size={32} />, title: "View Reports", desc: "Browse district-wise report records." },
                { icon: <Search size={32} />, title: "Guidelines", desc: "Check formats and instructions." },
                { icon: <LifeBuoy size={32} />, title: "Support", desc: "Raise a portal support request." }
              ].map((svc, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl hover:shadow-xl dark:hover:shadow-slate-900/50 hover:border-blue-200 dark:hover:border-blue-900 transition-all group cursor-pointer">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {svc.icon}
                  </div>
                  <h3 className="font-black text-slate-800 dark:text-slate-200 text-xl mb-2">{svc.title}</h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{svc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#F5F1E9] dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 w-full transition-colors" id="footer">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-12 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="flex items-center gap-6">
              <img alt="IIT Ropar Logo" className="h-14 w-auto object-contain mix-blend-multiply contrast-125 dark:mix-blend-normal dark:contrast-100 dark:brightness-200" src="/assets/sensrs-final-logo.webp" />
              <img alt="Punjab Govt Logo" className="h-14 w-auto object-contain mix-blend-multiply contrast-125 dark:mix-blend-normal dark:contrast-100 dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" src="/assets/state-emblem.png" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">District Survey Report Portal</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-sm">
                A digital platform by the Department of Mining and Geology, Government of Punjab, developed with technical support from IIT Ropar and SEnSRS for managing District Survey Reports and related mining workflow data.
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider mb-6">Institute Links</h4>
            <ul className="flex flex-col gap-4 text-sm font-medium text-slate-600">
              <li><a className="hover:text-amber-600 transition-colors flex items-center gap-2" href="https://www.iitrpr.ac.in/guest-house" target="_blank">Guest House</a></li>
              <li><a className="hover:text-amber-600 transition-colors flex items-center gap-2" href="https://www.iitrpr.ac.in/" target="_blank">IIT Ropar</a></li>
              <li><a className="hover:text-amber-600 transition-colors flex items-center gap-2" href="https://www.iitrpr.ac.in/institute-bus-facility" target="_blank">Institute Bus Facility</a></li>
              <li><a className="hover:text-amber-600 transition-colors flex items-center gap-2" href="https://iitrpr.ac.in/medical-center/" target="_blank">Medical Center</a></li>
              <li><a className="hover:text-amber-600 transition-colors flex items-center gap-2" href="https://www.iitrpr.ac.in/RnD/download-form.php" target="_blank">Download Forms</a></li>
              <li><a className="hover:text-amber-600 transition-colors flex items-center gap-2" href="https://www.iitrpr.ac.in/list-holidays" target="_blank">List of Holidays</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider mb-6">Quick Links</h4>
            <ul className="flex flex-col gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
              <li><a className="hover:text-amber-600 transition-colors" href="https://sensrs.com/publications/" target="_blank">Publications</a></li>
              <li><a className="hover:text-amber-600 transition-colors" href="https://sensrs.com/opportunities/" target="_blank">Careers</a></li>
              <li><a className="hover:text-amber-600 transition-colors" href="https://sensrs.com/events/" target="_blank">Events</a></li>
              <li><a className="hover:text-amber-600 transition-colors" href="https://sensrs.com/gallery/" target="_blank">Gallery</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider mb-6">Contact Info</h4>
            <ul className="flex flex-col gap-4 mb-6 text-sm font-medium text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin size={18} className="mt-0.5 shrink-0" />
                <a href="https://www.google.com/maps/search/?api=1&query=Indian%20Institute%20of%20Technology%20Ropar%20Punjab%20India" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 dark:hover:text-amber-400">Indian Institute of Technology Ropar,<br/>Punjab, India</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={18} />
                <a href="mailto:coe@sensrs.com" className="hover:text-amber-600 dark:hover:text-amber-400">coe@sensrs.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={18} />
                <a href="tel:+01881-232632" className="hover:text-amber-600 dark:hover:text-amber-400">+01881-232632</a>
              </li>
            </ul>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/coesensrs/" target="_blank" className="w-8 h-8 rounded-full bg-[#9c7a52] dark:bg-amber-700/50 text-white flex items-center justify-center hover:bg-slate-900 dark:hover:bg-amber-600 transition-colors font-bold text-[10px]">Fb</a>
              <a href="https://www.instagram.com/coesensrs/" target="_blank" className="w-8 h-8 rounded-full bg-[#9c7a52] dark:bg-amber-700/50 text-white flex items-center justify-center hover:bg-slate-900 dark:hover:bg-amber-600 transition-colors font-bold text-[10px]">Ig</a>
              <a href="https://www.linkedin.com/company/coesensrs/" target="_blank" className="w-8 h-8 rounded-full bg-[#9c7a52] dark:bg-amber-700/50 text-white flex items-center justify-center hover:bg-slate-900 dark:hover:bg-amber-600 transition-colors font-bold text-[10px]">In</a>
              <a href="https://x.com/coesensrs" target="_blank" className="w-8 h-8 rounded-full bg-[#9c7a52] dark:bg-amber-700/50 text-white flex items-center justify-center hover:bg-slate-900 dark:hover:bg-amber-600 transition-colors font-bold text-[10px]">X</a>
              <a href="https://youtube.com/@coe.sensrs?si=fMohfceQB8dcfBms" target="_blank" className="w-8 h-8 rounded-full bg-[#9c7a52] dark:bg-amber-700/50 text-white flex items-center justify-center hover:bg-slate-900 dark:hover:bg-amber-600 transition-colors font-bold text-[10px]">Yt</a>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-300 dark:border-slate-800/50 py-6 px-4 md:px-8 bg-slate-100 dark:bg-slate-900/50 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center text-xs text-slate-500 dark:text-slate-400 font-medium text-center">
            <p>© 2026 Department of Mines & Geology, Government of Punjab. <span className="mx-2 hidden md:inline">|</span><br className="md:hidden" /> Technical Support, Design & Development by IIT Ropar</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

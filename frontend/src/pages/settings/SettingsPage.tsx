import { useState } from "react";
import {
  Settings,
  UserCircle,
  Sliders,
  Users,
  Megaphone,
  Bell,
  Phone,
  Plus,
  Save,
  MailPlus,
  UserPlus,
  Trash2,
  Lock,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { usePublicSettingsStore } from "../../stores/publicSettingsStore";

type Tab = "profile" | "general" | "users";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // General Config State
  const { noticeText, announcements, setNoticeText, setAnnouncements } = usePublicSettingsStore();
  
  const [contactInfo, setContactInfo] = useState([
    { icon: "🏢", title: "Nodal Office", content: "Punjab DSR Cell, Chandigarh" },
    { icon: "📧", title: "Email", content: "support.dsr@punjab.gov.in" },
    { icon: "📞", title: "Helpline", content: "0172-274-Demo" },
    { icon: "🕙", title: "Demo Hours", content: "Mon-Fri, 10:00 AM-5:00 PM" },
  ]);

  // Users State
  const users = [
    { email: "admin@punjab.gov.in", role: "Super Admin", status: "Active" },
    { email: "officer.jalandhar@punjab.gov.in", role: "District Officer", status: "Active" },
    { email: "reviewer@punjab.gov.in", role: "Reviewer", status: "Inactive" },
  ];

  const handleAddAnnouncement = () => {
    setAnnouncements([{ date: "", title: "", category: "Information", active: true }, ...announcements]);
  };

  const handleRemoveAnnouncement = (index: number) => {
    setAnnouncements(announcements.filter((_, i) => i !== index));
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="System configuration, global notifications, and user scope management"
        action={
          <div className="flex items-center gap-2 text-slate-500 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200">
            <Settings size={16} />
            <span className="text-sm font-semibold">Admin Mode</span>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/40 border border-slate-200/60 rounded-xl mb-6 w-fit shadow-sm backdrop-blur-sm">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeTab === "profile"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-600 hover:bg-white hover:text-blue-700"
          }`}
        >
          <UserCircle size={16} />
          Profile
        </button>
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeTab === "general"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-600 hover:bg-white hover:text-blue-700"
          }`}
        >
          <Sliders size={16} />
          General Config
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeTab === "users"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-600 hover:bg-white hover:text-blue-700"
          }`}
        >
          <Users size={16} />
          User Management
        </button>
      </div>

      <div className="min-h-[600px]">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
                <UserCircle size={18} className="text-blue-600" />
                <h2 className="font-bold text-slate-800">My Profile</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Name
                  </label>
                  <div className="text-lg font-bold text-slate-800">Admin User</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <div className="text-slate-600">admin@punjab.gov.in</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Role
                  </label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    System Administrator
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button className="module-btn">
                    <Lock size={16} /> Request Password Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General Config Tab */}
        {activeTab === "general" && (
          <div className="space-y-6 max-w-5xl">
            {/* Notice Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
                <Megaphone size={18} className="text-amber-500" />
                <h2 className="font-bold text-slate-800">Scrolling Notice Bar</h2>
              </div>
              <div className="p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Announcement Text</label>
                <textarea
                  rows={3}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="Enter notice text to be displayed across the portal..."
                  className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  This text will scroll horizontally at the top of all portal views.
                </p>
                <div className="mt-4">
                  <button className="module-btn-primary bg-amber-500 hover:bg-amber-600 border-amber-600 text-white">
                    <Save size={16} /> Save Notice Bar
                  </button>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
              {/* Announcements */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-emerald-500" />
                    <h2 className="font-bold text-slate-800">Homepage Notices</h2>
                  </div>
                  <button onClick={handleAddAnnouncement} className="module-btn text-xs py-1.5 px-3">
                    <Plus size={14} /> Add Notice
                  </button>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {announcements.map((ann, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Date"
                              value={ann.date}
                              onChange={(e) => {
                                const newAnn = [...announcements];
                                newAnn[idx].date = e.target.value;
                                setAnnouncements(newAnn);
                              }}
                              className="w-32 px-3 py-1.5 text-xs rounded border border-slate-200 outline-none focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Notice Title"
                              value={ann.title}
                              onChange={(e) => {
                                const newAnn = [...announcements];
                                newAnn[idx].title = e.target.value;
                                setAnnouncements(newAnn);
                              }}
                              className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-200 outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button onClick={() => handleRemoveAnnouncement(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <div className="text-center text-sm text-slate-500 py-4">No notices yet.</div>
                    )}
                  </div>
                  <button className="module-btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-700">
                    <Save size={16} /> Save Announcements
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <Phone size={18} className="text-purple-500" />
                  <h2 className="font-bold text-slate-800">Contact Support</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {contactInfo.map((info, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="text-2xl w-8 text-center">{info.icon}</div>
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={info.title}
                            onChange={(e) => {
                              const newInfo = [...contactInfo];
                              newInfo[idx].title = e.target.value;
                              setContactInfo(newInfo);
                            }}
                            className="w-full px-2 py-1 text-xs font-bold rounded border border-transparent hover:border-slate-200 focus:border-blue-500 outline-none transition-colors"
                          />
                          <input
                            type="text"
                            value={info.content}
                            onChange={(e) => {
                              const newInfo = [...contactInfo];
                              newInfo[idx].content = e.target.value;
                              setContactInfo(newInfo);
                            }}
                            className="w-full px-2 py-1 text-xs rounded border border-transparent hover:border-slate-200 focus:border-blue-500 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="module-btn-primary bg-purple-600 hover:bg-purple-700 border-purple-700">
                    <Save size={16} /> Save Contact Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="max-w-6xl">
            <div className="flex justify-end gap-3 mb-4">
              <button className="module-btn">
                <MailPlus size={16} /> Bulk Invite
              </button>
              <button className="module-btn-primary">
                <UserPlus size={16} /> Add User
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600">Email</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Role</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-800">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:underline text-xs font-bold">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

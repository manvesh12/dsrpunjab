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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../../api/settings.api";
import { toast } from "sonner";
import { useAuth } from "../../security/auth.context";
import { AddUserModal, BulkInviteModal, type PortalUser } from "../../features/users/components/UserManagementPanel";

type Tab = "profile" | "general" | "users";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: noticeSetting } = useQuery({
    queryKey: ["settings", "notice_text"],
    queryFn: () => settingsApi.get("notice_text"),
  });
  
  const { data: announcementsSetting } = useQuery({
    queryKey: ["settings", "announcements"],
    queryFn: () => settingsApi.get("announcements"),
  });

  const [localNoticeText, setLocalNoticeText] = useState("");
  const [localAnnouncements, setLocalAnnouncements] = useState<any[]>([]);

  // Update local state when data loads
  import { useEffect } from "react";
  useEffect(() => {
    if (noticeSetting?.value) setLocalNoticeText(noticeSetting.value);
  }, [noticeSetting]);

  useEffect(() => {
    if (announcementsSetting?.value) {
      try {
        setLocalAnnouncements(JSON.parse(announcementsSetting.value));
      } catch (e) {
        setLocalAnnouncements([]);
      }
    }
  }, [announcementsSetting]);

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => settingsApi.update(key, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["settings", variables.key] });
      toast.success("Settings updated successfully");
    },
    onError: () => toast.error("Failed to update settings"),
  });

  const handleSaveNotice = () => updateSetting.mutate({ key: "notice_text", value: localNoticeText });
  const handleSaveAnnouncements = () => updateSetting.mutate({ key: "announcements", value: JSON.stringify(localAnnouncements) });
  
  const [contactInfo, setContactInfo] = useState([
    { icon: "🏢", title: "Nodal Office", content: "Punjab DSR Cell, Chandigarh" },
    { icon: "📧", title: "Email", content: "support.dsr@punjab.gov.in" },
    { icon: "📞", title: "Helpline", content: "0172-274-Demo" },
    { icon: "🕙", title: "Demo Hours", content: "Mon-Fri, 10:00 AM-5:00 PM" },
  ]);

  // Users State
  const [users, setUsers] = useState([
    { email: "admin@punjab.gov.in", role: "Super Admin", status: "Active" },
    { email: "officer.jalandhar@punjab.gov.in", role: "District Officer", status: "Active" },
    { email: "reviewer@punjab.gov.in", role: "Reviewer", status: "Inactive" },
  ]);

  const handleAddUserSuccess = (newUser: PortalUser) => {
    setUsers([{ email: newUser.email, role: newUser.role, status: "Pending" }, ...users]);
    setShowAddUser(false);
    alert(`Invitation sent successfully to ${newUser.email}`);
  };

  const handleAddAnnouncement = () => {
    setLocalAnnouncements([{ date: "", title: "", category: "Information", active: true }, ...localAnnouncements]);
  };

  const handleRemoveAnnouncement = (index: number) => {
    setLocalAnnouncements(localAnnouncements.filter((_, i) => i !== index));
  };

  return (
    <>
      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} onSuccess={handleAddUserSuccess} />}
      {showBulkInvite && <BulkInviteModal onClose={() => setShowBulkInvite(false)} />}
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
                  <div className="text-lg font-bold text-slate-800">{user?.fullName || user?.username}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <div className="text-slate-600">{user?.email}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Role
                  </label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {user?.uiRole}
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
                  value={localNoticeText}
                  onChange={(e) => setLocalNoticeText(e.target.value)}
                  placeholder="Enter notice text to be displayed across the portal..."
                  className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  This text will scroll horizontally at the top of all portal views.
                </p>
                <div className="mt-4">
                  <button onClick={handleSaveNotice} className="module-btn-primary bg-amber-500 hover:bg-amber-600 border-amber-600 text-white">
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
                    {localAnnouncements.map((ann, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Date"
                              value={ann.date}
                              onChange={(e) => {
                                const newAnn = [...localAnnouncements];
                                newAnn[idx].date = e.target.value;
                                setLocalAnnouncements(newAnn);
                              }}
                              className="w-32 px-3 py-1.5 text-xs rounded border border-slate-200 outline-none focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Notice Title"
                              value={ann.title}
                              onChange={(e) => {
                                const newAnn = [...localAnnouncements];
                                newAnn[idx].title = e.target.value;
                                setLocalAnnouncements(newAnn);
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
                    {localAnnouncements.length === 0 && (
                      <div className="text-center text-sm text-slate-500 py-4">No notices yet.</div>
                    )}
                  </div>
                  <button onClick={handleSaveAnnouncements} className="module-btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-700">
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
            <div className="p-10 bg-slate-50 text-center rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg mb-2">User Management Moved</h3>
              <p className="text-slate-500 text-sm">Please navigate to the Users tab in the sidebar to manage users.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, Lock, MapPin, Save, Shield, User } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../API/axios";
import { updateUser } from "../../redux/userSlice";
import { useNotificationStore } from "../../stores/notificationStore";

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#4c84a4] focus:bg-white focus:ring-2 focus:ring-[#4c84a4]/20";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#4c84a4]" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-5" : "left-0.5"}`}
      />
    </button>
  );
}

export default function ProfileSettings() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [tab, setTab] = useState("profile");
  const [mfaEnabled, setMfaEnabled] = useState(Boolean(user?.mfa_enabled));
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const { preferences, updatePreferences } = useNotificationStore();

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    home_address: user?.home_address || "",
    secondary_addresses: user?.secondary_addresses?.join("\n") || "",
  });

  const { data: preferenceData, refetch: refetchPreference } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: async () => {
      const res = await api.get("/accounts/notification-preferences/");
      return res.data?.data;
    },
  });

  useEffect(() => {
    if (!preferenceData) return;
    updatePreferences({
      sms: preferenceData.sms_notifications,
      email: preferenceData.email_receipts,
      marketing: preferenceData.marketing_updates,
    });
  }, [preferenceData, updatePreferences]);

  useEffect(() => {
    setMfaEnabled(Boolean(user?.mfa_enabled));
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone_number: form.phone_number,
        home_address: form.home_address,
        secondary_addresses: form.secondary_addresses
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
      };
      const res = await api.patch("/accounts/me/", payload);
      return res.data?.data;
    },
    onSuccess: (data) => {
      dispatch(updateUser(data));
      toast.success("Profile updated.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Unable to update profile."),
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.post("/accounts/change-password/", passwordForm),
    onSuccess: () => {
      toast.success("Password changed successfully.");
      setPasswordForm({ old_password: "", new_password: "", confirm: "" });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Password update failed."),
  });

  const mfaMutation = useMutation({
    mutationFn: (mfa_enabled) => api.patch("/accounts/security-settings/", { mfa_enabled }),
    onSuccess: (_res, nextValue) => {
      setMfaEnabled(nextValue);
      dispatch(updateUser({ ...user, mfa_enabled: nextValue }));
      toast.success("Security settings saved.");
    },
    onError: () => toast.error("Failed to update MFA setting."),
  });

  const preferenceMutation = useMutation({
    mutationFn: (nextPrefs) =>
      api.patch("/accounts/notification-preferences/", {
        sms_notifications: nextPrefs.sms,
        email_receipts: nextPrefs.email,
        marketing_updates: nextPrefs.marketing,
      }),
    onSuccess: () => {
      toast.success("Notification preferences saved.");
      refetchPreference();
    },
    onError: () => toast.error("Unable to save preferences."),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900">Profile & Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your profile, addresses, security and alert preferences.</p>

      <div className="mt-6 flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm md:flex-row">
        <div className="w-full border-b border-gray-100 bg-gray-50 p-4 md:w-64 md:border-b-0 md:border-r">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "security", label: "Security", icon: Lock },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`mb-2 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${
                  tab === item.id ? "bg-white text-[#4c84a4]" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 p-6">
          {tab === "profile" && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                profileMutation.mutate();
              }}
            >
              <h2 className="text-lg font-bold text-gray-900">Personal Info</h2>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Full Name</label>
                <input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Email</label>
                  <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Phone Number</label>
                  <input className={inputCls} value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Home Address</label>
                <textarea className={`${inputCls} h-20 resize-none`} value={form.home_address} onChange={(e) => setForm({ ...form, home_address: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
                  <MapPin size={14} /> Secondary Addresses (one per line)
                </label>
                <textarea
                  className={`${inputCls} h-24 resize-none`}
                  value={form.secondary_addresses}
                  onChange={(e) => setForm({ ...form, secondary_addresses: e.target.value })}
                  placeholder={"Office - Bole\nFamily Home - Piassa"}
                />
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl bg-[#4c84a4] px-5 py-3 text-sm font-bold text-white">
                <Save size={16} /> Save Profile
              </button>
            </form>
          )}

          {tab === "security" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passwordForm.new_password !== passwordForm.confirm) {
                    toast.error("Password confirmation does not match.");
                    return;
                  }
                  passwordMutation.mutate();
                }}
              >
                <input
                  className={inputCls}
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                />
                <input
                  className={inputCls}
                  type="password"
                  placeholder="New password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                />
                <input
                  className={inputCls}
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                />
                <button className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white">Change Password</button>
              </form>

              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Shield size={16} /> Multi-Factor Authentication (MFA)
                  </p>
                  <p className="text-xs text-gray-500">Add extra account security with OTP verification.</p>
                </div>
                <Toggle checked={mfaEnabled} onChange={() => mfaMutation.mutate(!mfaEnabled)} />
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
              {[
                { key: "sms", title: "SMS Notifications", desc: "Receive status updates by SMS." },
                { key: "email", title: "Email Receipts", desc: "Receive your final receipt by email." },
                { key: "marketing", title: "Marketing Updates", desc: "Receive promotions and offers." },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{pref.title}</p>
                    <p className="text-xs text-gray-500">{pref.desc}</p>
                  </div>
                  <Toggle
                    checked={Boolean(preferences[pref.key])}
                    onChange={() => {
                      const next = { ...preferences, [pref.key]: !preferences[pref.key] };
                      updatePreferences(next);
                      preferenceMutation.mutate(next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilLine, Shield, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { AccessLevel } from "../../constants/roles";
import { useToast } from "../../components/admin/ToastContainer";
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
  userManagementQueryKeys,
} from "../../services/userManagementApi";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone_number: "",
  password: "",
  access_level: "staff",
  is_active: true,
  is_verified: true,
};

function levelLabel(user) {
  if (user.is_superuser) return "Superadmin";
  if (user.role === "admin" && user.is_staff) return "Manager";
  if (user.role === "admin") return "Staff";
  return user.role;
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user: currentUser, accessLevel } = useAuth();
  const isSuperadmin = accessLevel === AccessLevel.SUPERADMIN;

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const params = useMemo(
    () => ({
      role: "admin",
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [search],
  );

  const { data: users = [], isLoading } = useQuery({
    queryKey: userManagementQueryKeys.all(params),
    queryFn: () => fetchAdminUsers(params),
  });

  const refreshUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      toast.success("Admin user created.");
      setForm(EMPTY_FORM);
      refreshUsers();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.detail || "Could not create user."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminUser(id, payload),
    onSuccess: () => {
      toast.success("User updated.");
      setEditingId(null);
      setForm(EMPTY_FORM);
      refreshUsers();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.detail || "Could not update user."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success("User deleted.");
      refreshUsers();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.detail || "Could not delete user."),
  });

  const saveUser = () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.phone_number.trim()) {
      toast.error("Name, email, and phone are required.");
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      role: "admin",
      access_level: isSuperadmin ? form.access_level : "staff",
      is_active: Boolean(form.is_active),
      is_verified: Boolean(form.is_verified),
    };

    if (form.password.trim()) payload.password = form.password.trim();

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      if (!payload.password) {
        toast.error("Password is required for new user.");
        return;
      }
      createMutation.mutate(payload);
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setForm({
      full_name: u.full_name || "",
      email: u.email || "",
      phone_number: u.phone_number || "",
      password: "",
      access_level: u.is_staff ? "manager" : "staff",
      is_active: Boolean(u.is_active),
      is_verified: Boolean(u.is_verified),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const toggleSuspend = (u) => {
    updateMutation.mutate({
      id: u.id,
      payload: { is_active: !u.is_active },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Shield size={24} className="text-[#4c84a4]" />
          User management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage manager/staff operator accounts with RBAC guardrails and audit trails.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {editingId ? "Edit operator account" : "Create operator account"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.full_name}
            onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
            placeholder="Full name"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
          <input
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
          <input
            value={form.phone_number}
            onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
            placeholder="Phone number"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder={editingId ? "Set new password (optional)" : "Password"}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
          <select
            value={isSuperadmin ? form.access_level : "staff"}
            onChange={(e) => setForm((prev) => ({ ...prev, access_level: e.target.value }))}
            disabled={!isSuperadmin}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 disabled:opacity-60"
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
          </select>
          <div className="flex items-center gap-5 text-sm text-gray-700 dark:text-gray-300">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_verified}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, is_verified: e.target.checked }))
                }
              />
              Verified
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveUser}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4c84a4] text-white font-semibold"
          >
            <UserPlus size={16} />
            {editingId ? "Update user" : "Create user"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search operator by name/email/phone..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-left font-semibold">Level</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No admin users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = Number(u.id) === Number(currentUser?.id);
                  const rowIsSuperadmin = Boolean(u.is_superuser);
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                        {u.full_name}
                      </td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.phone_number}</td>
                      <td className="px-4 py-3">{levelLabel(u)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${
                            u.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {u.is_active ? "active" : "suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={rowIsSuperadmin && !isSuperadmin}
                            onClick={() => startEdit(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            <PencilLine size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isSelf || (rowIsSuperadmin && !isSuperadmin)}
                            onClick={() => toggleSuspend(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold disabled:opacity-50"
                          >
                            {u.is_active ? "Suspend" : "Activate"}
                          </button>
                          <button
                            type="button"
                            disabled={isSelf || (rowIsSuperadmin && !isSuperadmin)}
                            onClick={() => {
                              if (window.confirm("Delete this account?")) {
                                deleteMutation.mutate(u.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


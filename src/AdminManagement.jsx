import React, { useState, useEffect } from "react";
import { BookPlus, UserPlus, Link2, Megaphone, Pencil, Trash2, X, ListChecks, KeyRound, ShieldPlus, Receipt, UserMinus, Contact } from "lucide-react";
import { useAuth } from "./AuthProvider";
import {
  useProfilesByRole,
  useAllClasses,
  createClass,
  linkParentToStudent,
  postAnnouncement,
  updateClass,
  deleteClass,
  useRegistrationCodes,
  addRegistrationCodes,
  deleteRegistrationCode,
  useStaffAndParents,
  promoteToAdmin,
  useAdmins,
  demoteAdmin,
  useStudentBills,
  postBill,
  setBillPaid,
  deleteBill,
  editBill,
  recordPayment,
  useParentLinksList,
  unlinkParentStudent,
  updateParentLink,
  removeStaffMember,
  useAnnouncements,
  deleteAnnouncement,
  useStudentsByClass,
  useParentsOfStudent,
  useStudentFeeSummary,
  useStudentDetails,
  saveStudentDetails,
} from "./dataHooks";

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-[#EDEEF5] rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#EDEEF5]">
        {Icon && <Icon size={16} className="text-[#0B6B2B]" />}
        <h3 className="text-xs font-semibold tracking-wide uppercase text-[#0B6B2B]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-[#6B7280]">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full mt-1 bg-transparent border-b border-[#E3A400] focus:outline-none focus:border-[#DC2626] py-1 text-[#1F2937] text-sm";

function StatusLine({ status }) {
  if (!status) return null;
  return <p className={`text-sm ${status.ok ? "text-[#0B6B2B]" : "text-[#DC2626]"}`}>{status.message}</p>;
}

function CreateClassForm({ onCreated }) {
  const teachers = useProfilesByRole("teacher");
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [room, setRoom] = useState("");
  const [period, setPeriod] = useState("");
  const [timeRange, setTimeRange] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await createClass({ name, teacherId, room, period, timeRange });
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    setStatus({ ok: true, message: `Created "${name}".` });
    setName(""); setRoom(""); setPeriod(""); setTimeRange("");
    onCreated?.();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Class name">
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Algebra II — Period 1" />
      </Field>
      <Field label="Teacher">
        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={inputClass}>
          <option value="">— unassigned —</option>
          {(teachers.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.full_name}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Room">
          <input value={room} onChange={(e) => setRoom(e.target.value)} className={inputClass} placeholder="Rm 214" />
        </Field>
        <Field label="Period">
          <input value={period} onChange={(e) => setPeriod(e.target.value)} className={inputClass} placeholder="1" />
        </Field>
        <Field label="Time">
          <input value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className={inputClass} placeholder="8:00 – 8:50" />
        </Field>
      </div>
      <StatusLine status={status} />
      <button disabled={busy} className="text-sm bg-[#0B6B2B] text-[#FFFFFF] px-4 py-1.5 rounded-sm hover:bg-[#084F20] disabled:opacity-60">
        {busy ? "Creating…" : "Create class"}
      </button>
    </form>
  );
}

function EditClassRow({ cls, teachers, onSaved, onCancel }) {
  const [name, setName] = useState(cls.name ?? "");
  const [teacherId, setTeacherId] = useState(cls.teacher_id ?? "");
  const [room, setRoom] = useState(cls.room ?? "");
  const [period, setPeriod] = useState(cls.period ?? "");
  const [timeRange, setTimeRange] = useState(cls.time_range ?? "");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await updateClass({ id: cls.id, name, teacherId, room, period, timeRange });
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    onSaved();
  };

  return (
    <li className="py-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Class name" />
        <select value={teacherId ?? ""} onChange={(e) => setTeacherId(e.target.value)} className={inputClass}>
          <option value="">— unassigned —</option>
          {(teachers.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.full_name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input value={room} onChange={(e) => setRoom(e.target.value)} className={inputClass} placeholder="Room" />
        <input value={period} onChange={(e) => setPeriod(e.target.value)} className={inputClass} placeholder="Period" />
        <input value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className={inputClass} placeholder="Time" />
      </div>
      <StatusLine status={status} />
      <div className="flex gap-2">
        <button disabled={busy} onClick={save} className="text-xs bg-[#0B6B2B] text-[#FFFFFF] px-3 py-1 rounded-sm hover:bg-[#084F20] disabled:opacity-60">
          {busy ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1 rounded-sm border border-[#E7E9F3] text-[#5C5340] hover:border-[#DC2626]">
          Cancel
        </button>
      </div>
    </li>
  );
}

function ClassList() {
  const classes = useAllClasses();
  const teachers = useProfilesByRole("teacher");
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [status, setStatus] = useState(null);

  const remove = async (id) => {
    const { error } = await deleteClass(id);
    if (error) {
      setStatus({ ok: false, message: error.message });
    } else {
      setStatus(null);
      classes.refetch();
    }
    setConfirmDeleteId(null);
  };

  return (
    <Panel title="Existing Classes" icon={ListChecks}>
      <StatusLine status={status} />
      {classes.loading ? (
        <p className="text-sm text-[#6B7280]">Loading classes…</p>
      ) : classes.error ? (
        <p className="text-sm text-[#DC2626]">Couldn't load classes: {classes.error}</p>
      ) : !classes.data?.length ? (
        <p className="text-sm text-[#6B7280]">No classes yet — create one above.</p>
      ) : (
        <ul className="text-sm divide-y divide-[#EDEEF5]">
          {classes.data.map((c) =>
            editingId === c.id ? (
              <EditClassRow
                key={c.id}
                cls={c}
                teachers={teachers}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  classes.refetch();
                }}
              />
            ) : (
              <li key={c.id} className="py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[#1F2937] font-medium">{c.name}</p>
                  <p className="text-xs text-[#6B7280]">
                    {c.profiles?.full_name ?? "Unassigned"} · {c.room} · {c.time_range}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditingId(c.id)} className="text-[#0B6B2B] hover:text-[#DC2626]" aria-label={`Edit ${c.name}`}>
                    <Pencil size={15} />
                  </button>
                  {confirmDeleteId === c.id ? (
                    <>
                      <button onClick={() => remove(c.id)} className="text-xs text-[#DC2626] underline">Confirm delete</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-[#6B7280]"><X size={15} /></button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(c.id)} className="text-[#DC2626] hover:opacity-70" aria-label={`Delete ${c.name}`}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </Panel>
  );
}

function EnrollStudentForm() {
  const students = useProfilesByRole("student");
  const [studentId, setStudentId] = useState("");
  const [className, setClassName] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await saveStudentDetails(studentId, { class: className });
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    setStatus({ ok: true, message: "Class assigned." });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Student">
        <select required value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputClass}>
          <option value="">Choose a student…</option>
          {(students.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </Field>
      <Field label="Class">
        <select required value={className} onChange={(e) => setClassName(e.target.value)} className={inputClass}>
          <option value="">Choose a class…</option>
          {CLASS_LIST.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <StatusLine status={status} />
      <button disabled={busy} className="text-sm bg-[#0B6B2B] text-[#FFFFFF] px-4 py-1.5 rounded-sm hover:bg-[#084F20] disabled:opacity-60">
        {busy ? "Saving…" : "Assign class"}
      </button>
    </form>
  );
}

function LinkParentForm() {
  const parents = useProfilesByRole("parent");
  const students = useProfilesByRole("student");
  const [parentId, setParentId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await linkParentToStudent({ parentId, studentId });
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    setStatus({ ok: true, message: "Linked." });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Parent">
        <select required value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputClass}>
          <option value="">Choose a parent…</option>
          {(parents.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      </Field>
      <Field label="Student">
        <select required value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputClass}>
          <option value="">Choose a student…</option>
          {(students.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </Field>
      <StatusLine status={status} />
      <button disabled={busy} className="text-sm bg-[#0B6B2B] text-[#FFFFFF] px-4 py-1.5 rounded-sm hover:bg-[#084F20] disabled:opacity-60">
        {busy ? "Linking…" : "Link parent to student"}
      </button>
    </form>
  );
}

function PostAnnouncementForm() {
  const { profile } = useAuth();
  const [text, setText] = useState("");
  const [pinned, setPinned] = useState(true);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const list = useAnnouncements();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await postAnnouncement({ authorId: profile.id, text, pinned });
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    setStatus({ ok: true, message: "Posted." });
    setText("");
    list.refetch();
  };

  const remove = async (id) => {
    const { error } = await deleteAnnouncement(id);
    if (error) {
      setStatus({ ok: false, message: error.message });
    } else {
      list.refetch();
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Message">
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Fall picture day moved to Sept 12…"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-[#1F2937]">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Pin to the top
        </label>
        <StatusLine status={status} />
        <button disabled={busy} className="text-sm bg-[#0B6B2B] text-[#FFFFFF] px-4 py-1.5 rounded-sm hover:bg-[#084F20] disabled:opacity-60">
          {busy ? "Posting…" : "Post announcement"}
        </button>
      </form>

      <div className="border-t border-[#EDEEF5] pt-3">
        {list.loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : !list.data?.length ? (
          <p className="text-sm text-[#6B7280]">No announcements posted yet.</p>
        ) : (
          <ul className="text-sm divide-y divide-[#EDEEF5] max-h-56 overflow-y-auto">
            {list.data.map((a) => (
              <li key={a.id} className="py-2 flex items-start justify-between gap-2">
                <p className="text-[#1F2937]">
                  {a.text}
                  {a.pinned && <span className="text-xs text-[#E3A400] ml-1">(pinned)</span>}
                </p>
                <button onClick={() => remove(a.id)} className="text-[#DC2626] hover:opacity-70 shrink-0" aria-label="Delete announcement">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RegistrationCodesPanel() {
  const { data, loading, error, refetch } = useRegistrationCodes();
  const [bulkText, setBulkText] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const addCodes = async (e) => {
    e.preventDefault();
    const codes = bulkText
      .split(/[\n,]/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (!codes.length) return;
    setBusy(true);
    const { error } = await addRegistrationCodes(codes);
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    setStatus({ ok: true, message: `Added ${codes.length} registration number${codes.length === 1 ? "" : "s"}.` });
    setBulkText("");
    refetch();
  };

  const remove = async (code) => {
    const { error } = await deleteRegistrationCode(code);
    if (error) {
      setStatus({ ok: false, message: error.message });
    } else {
      refetch();
    }
  };

  return (
    <Panel title="Registration Numbers" icon={KeyRound}>
      <p className="text-sm text-[#5C5340] mb-3">
        Add the registration numbers issued to students. A student can only sign up once with a number that's here
        and hasn't already been used.
      </p>
      <form onSubmit={addCodes} className="space-y-2">
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder={"One per line, or comma-separated:\nYES2026001\nYES2026002"}
        />
        <StatusLine status={status} />
        <button disabled={busy} className="text-sm bg-[#0B6B2B] text-[#FFFFFF] px-4 py-1.5 rounded-sm hover:bg-[#084F20] disabled:opacity-60">
          {busy ? "Adding…" : "Add registration numbers"}
        </button>
      </form>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : error ? (
          <p className="text-sm text-[#DC2626]">Couldn't load: {error}</p>
        ) : !data?.length ? (
          <p className="text-sm text-[#6B7280]">No registration numbers added yet.</p>
        ) : (
          <ul className="text-sm divide-y divide-[#EDEEF5] max-h-64 overflow-y-auto">
            {data.map((c) => (
              <li key={c.code} className="py-2 flex items-center justify-between gap-2">
                <span className="text-[#1F2937] font-mono">{c.code}</span>
                <span className={`text-xs ${c.used ? "text-[#6B7280]" : "text-[#0B6B2B]"}`}>
                  {c.used ? "used" : "available"}
                </span>
                <button onClick={() => remove(c.code)} className="text-[#DC2626] hover:opacity-70" aria-label={`Remove ${c.code}`}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

export function GrantAdminPanel() {
  const { data, loading, error, refetch } = useStaffAndParents();
  const [confirmId, setConfirmId] = useState(null);
  const [status, setStatus] = useState(null);

  const promote = async (user) => {
    const { error } = await promoteToAdmin(user.id);
    if (error) {
      setStatus({ ok: false, message: error.message });
    } else {
      setStatus({ ok: true, message: `${user.full_name} is now an admin.` });
      refetch();
    }
    setConfirmId(null);
  };

  return (
    <Panel title="Grant Admin Access" icon={ShieldPlus}>
      <p className="text-sm text-[#5C5340] mb-3">
        Only accounts already signed up as Teacher or Parent are listed here — promote someone once you've verified
        who they are.
      </p>
      <StatusLine status={status} />
      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading…</p>
      ) : error ? (
        <p className="text-sm text-[#DC2626]">Couldn't load: {error}</p>
      ) : !data?.length ? (
        <p className="text-sm text-[#6B7280]">No teacher or parent accounts yet.</p>
      ) : (
        <ul className="text-sm divide-y divide-[#EDEEF5] max-h-64 overflow-y-auto">
          {data.map((u) => (
            <li key={u.id} className="py-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-[#1F2937] font-medium">{u.full_name}</p>
                <p className="text-xs text-[#6B7280] capitalize">{u.role} · {u.email}</p>
              </div>
              {confirmId === u.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => promote(u)} className="text-xs text-[#0B6B2B] underline">Confirm</button>
                  <button onClick={() => setConfirmId(null)} className="text-[#6B7280]"><X size={14} /></button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(u.id)}
                  className="text-xs px-2 py-1 rounded-sm border border-[#0B6B2B] text-[#0B6B2B] hover:bg-[#F5FAF6] shrink-0"
                >
                  Make admin
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function ManageAdminsPanel() {
  const { profile } = useAuth();
  const { data, loading, error, refetch } = useAdmins();
  const [confirmId, setConfirmId] = useState(null);
  const [roleChoice, setRoleChoice] = useState({});
  const [status, setStatus] = useState(null);

  const demote = async (user) => {
    const newRole = roleChoice[user.id] || "teacher";
    const { error } = await demoteAdmin(user.id, newRole);
    if (error) {
      setStatus({ ok: false, message: error.message });
    } else {
      setStatus({ ok: true, message: `${user.full_name} is no longer an admin (now ${newRole}).` });
      refetch();
    }
    setConfirmId(null);
  };

  return (
    <Panel title="Current Admins" icon={ShieldPlus}>
      <p className="text-sm text-[#5C5340] mb-3">
        Remove someone's admin access by moving them back to Teacher or Parent.
      </p>
      <StatusLine status={status} />
      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading…</p>
      ) : error ? (
        <p className="text-sm text-[#DC2626]">Couldn't load: {error}</p>
      ) : !data?.length ? (
        <p className="text-sm text-[#6B7280]">No admins found.</p>
      ) : (
        <ul className="text-sm divide-y divide-[#EDEEF5]">
          {data.map((u) => (
            <li key={u.id} className="py-2 flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-[#1F2937] font-medium">
                  {u.full_name} {u.id === profile.id && <span className="text-xs text-[#6B7280]">(you)</span>}
                </p>
                <p className="text-xs text-[#6B7280]">{u.email}</p>
              </div>
              {confirmId === u.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={roleChoice[u.id] || "teacher"}
                    onChange={(e) => setRoleChoice((r) => ({ ...r, [u.id]: e.target.value }))}
                    className="text-xs bg-transparent border-b border-[#E3A400] py-0.5"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                  </select>
                  <button onClick={() => demote(u)} className="text-xs text-[#DC2626] underline">Confirm</button>
                  <button onClick={() => setConfirmId(null)} className="text-[#6B7280]"><X size={14} /></button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(u.id)}
                  className="text-xs px-2 py-1 rounded-sm border border-[#DC2626] text-[#DC2626] hover:bg-[#F5FAF6] shrink-0"
                >
                  Remove admin
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function BillRow({ bill, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(bill.description);
  const [amount, setAmount] = useState(bill.amount);
  const [dueDate, setDueDate] = useState(bill.due_date ?? "");
  const [payAmount, setPayAmount] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const outstanding = Number(bill.amount) - Number(bill.amount_paid ?? 0);
  const statusLabel = bill.paid ? "Paid" : Number(bill.amount_paid ?? 0) > 0 ? "Partial" : "Unpaid";

  const saveEdit = async () => {
    setBusy(true);
    const { error } = await editBill(bill.id, { description, amount: Number(amount), due_date: dueDate || null });
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    setEditing(false);
    onChanged();
  };

  const pay = async () => {
    if (!payAmount) return;
    setBusy(true);
    const { error } = await recordPayment(bill, Number(payAmount));
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    setPayAmount("");
    onChanged();
  };

  const remove = async () => {
    const { error } = await deleteBill(bill.id);
    if (!error) onChanged();
  };

  if (editing) {
    return (
      <li className="py-3 space-y-2 border-b border-[#EDEEF5]">
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Description" />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder="Amount" />
          <input type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
        </div>
        <StatusLine status={status} />
        <div className="flex gap-2">
          <button disabled={busy} onClick={saveEdit} className="text-xs bg-[#0B6B2B] text-white px-3 py-1 rounded-sm">
            {busy ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setEditing(false)} className="text-xs px-3 py-1 rounded-sm border border-[#E7E9F3] text-[#6B7280]">
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="py-2 border-b border-[#EDEEF5] last:border-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[#1F2937] font-medium">{bill.description} — GHS {Number(bill.amount).toFixed(2)}</p>
          <p className="text-xs text-[#6B7280]">
            {bill.session}{bill.due_date ? ` · due ${bill.due_date}` : ""} · paid GHS {Number(bill.amount_paid ?? 0).toFixed(2)}
            {outstanding > 0 ? ` · owes GHS ${outstanding.toFixed(2)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs px-2 py-1 rounded-sm border ${
              statusLabel === "Paid"
                ? "bg-[#0B6B2B] text-white border-[#0B6B2B]"
                : statusLabel === "Partial"
                ? "text-[#E3A400] border-[#E3A400]"
                : "text-[#DC2626] border-[#DC2626]"
            }`}
          >
            {statusLabel}
          </span>
          <button onClick={() => setEditing(true)} className="text-[#0B6B2B] hover:opacity-70" aria-label="Edit bill">
            <Pencil size={14} />
          </button>
          <button onClick={remove} className="text-[#DC2626] hover:opacity-70" aria-label="Delete bill">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {!bill.paid && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="Record payment (e.g. half now)"
            className={inputClass + " flex-1"}
          />
          <button onClick={pay} disabled={busy} className="text-xs px-3 py-1.5 rounded-sm border border-[#0B6B2B] text-[#0B6B2B] hover:bg-[#F1FBF3] shrink-0">
            Record
          </button>
        </div>
      )}
    </li>
  );
}

function PreviousBalanceField({ studentId }) {
  const details = useStudentDetails(studentId);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(details.data?.previous_balance ?? 0);
  }, [details.data]);

  const save = async () => {
    setBusy(true);
    const { error } = await saveStudentDetails(studentId, { previous_balance: Number(value) || 0 });
    setBusy(false);
    setStatus(error ? { ok: false, message: error.message } : { ok: true, message: "Saved." });
    if (!error) details.refetch();
  };

  return (
    <div className="flex items-end gap-2 mt-3 border-t border-[#EDEEF5] pt-3">
      <Field label="Balance from previous academic year (GHS)">
        <input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />
      </Field>
      <button disabled={busy} onClick={save} className="text-xs px-3 py-1.5 rounded-sm border border-[#0B6B2B] text-[#0B6B2B] hover:bg-[#F1FBF3] shrink-0 mb-0.5">
        {busy ? "Saving…" : "Save"}
      </button>
      {status && <span className={`text-xs ${status.ok ? "text-[#0B6B2B]" : "text-[#DC2626]"} shrink-0 mb-1.5`}>{status.message}</span>}
    </div>
  );
}

function FeesSummary({ studentId, bills }) {
  const details = useStudentDetails(studentId);
  const data = bills.data ?? [];
  const totalAmount = data.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalPaid = data.reduce((sum, b) => sum + Number(b.amount_paid ?? (b.paid ? b.amount : 0)), 0);
  const previousBalance = Number(details.data?.previous_balance ?? 0);
  const payable = previousBalance + totalAmount - totalPaid;

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm border border-[#EDEEF5] rounded-md p-3 mt-3">
      <span className="text-[#6B7280]">Balance from previous academic year:</span>
      <span className="text-[#1F2937] text-right">GHS {previousBalance.toFixed(2)}</span>
      <span className="text-[#6B7280]">Total Tuition Fee:</span>
      <span className="text-[#1F2937] text-right">GHS {totalAmount.toFixed(2)}</span>
      <span className="text-[#6B7280]">Amount Paid:</span>
      <span className="text-[#1F2937] text-right">GHS {totalPaid.toFixed(2)}</span>
      <span className="text-[#1F2937] font-semibold border-t border-[#EDEEF5] pt-1 mt-1">Amount Payable:</span>
      <span className={`text-right font-semibold border-t border-[#EDEEF5] pt-1 mt-1 ${payable > 0 ? "text-[#DC2626]" : "text-[#0B6B2B]"}`}>
        GHS {payable.toFixed(2)}
      </span>
    </div>
  );
}

function FeesPanel({ initialStudentId }) {
  const students = useProfilesByRole("student");
  const [studentId, setStudentId] = useState(initialStudentId || "");
  const [session, setSession] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialStudentId) setStudentId(initialStudentId);
  }, [initialStudentId]);

  const bills = useStudentBills(studentId || null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await postBill({ studentId, session, description, amount: Number(amount), dueDate });
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    setStatus({ ok: true, message: "Bill posted." });
    setDescription("");
    setAmount("");
    setDueDate("");
    bills.refetch();
  };

  return (
    <Panel title="Fees" icon={Receipt}>
      <Field label="Student">
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputClass}>
          <option value="">Choose a student…</option>
          {(students.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </Field>

      {studentId && (
        <>
          <PreviousBalanceField studentId={studentId} />

          <form onSubmit={submit} className="space-y-3 mt-3 border-t border-[#EDEEF5] pt-3">
            <Field label="Term / session">
              <input required value={session} onChange={(e) => setSession(e.target.value)} className={inputClass} placeholder="2026/2027 First Term" />
            </Field>
            <Field label="Description">
              <input required value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Tuition fee" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount">
                <input required type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Due date">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <StatusLine status={status} />
            <button disabled={busy} className="text-sm bg-[#0B6B2B] text-[#FFFFFF] px-4 py-1.5 rounded-sm hover:bg-[#084F20] disabled:opacity-60">
              {busy ? "Posting…" : "Post bill"}
            </button>
          </form>

          <div className="mt-4">
            {bills.loading ? (
              <p className="text-sm text-[#6B7280]">Loading bills…</p>
            ) : !bills.data?.length ? (
              <p className="text-sm text-[#6B7280]">No bills posted yet for this student.</p>
            ) : (
              <>
                <FeesSummary studentId={studentId} bills={bills} />
                <ul className="text-sm mt-3">
                  {bills.data.map((b) => (
                    <BillRow key={b.id} bill={b} onChanged={bills.refetch} />
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}

function ParentLinksPanel() {
  const { data, loading, error, refetch } = useParentLinksList();
  const parents = useProfilesByRole("parent");
  const [confirmId, setConfirmId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [reassignTo, setReassignTo] = useState("");
  const [status, setStatus] = useState(null);

  const remove = async (linkId) => {
    const { error } = await unlinkParentStudent(linkId);
    if (error) {
      setStatus({ ok: false, message: error.message });
    } else {
      setStatus({ ok: true, message: "Unlinked." });
      refetch();
    }
    setConfirmId(null);
  };

  const saveReassign = async (linkId) => {
    if (!reassignTo) return;
    const { error } = await updateParentLink(linkId, reassignTo);
    if (error) {
      setStatus({ ok: false, message: error.message });
    } else {
      setStatus({ ok: true, message: "Updated." });
      refetch();
    }
    setEditId(null);
    setReassignTo("");
  };

  return (
    <Panel title="Parent Links" icon={Link2}>
      <p className="text-sm text-[#5C5340] mb-3">See which parent is linked to each student. Change or remove a link that's wrong.</p>
      <StatusLine status={status} />
      {loading ? (
        <p className="text-sm text-[#8C7B4E]">Loading…</p>
      ) : error ? (
        <p className="text-sm text-[#8C3B3B]">Couldn't load: {error}</p>
      ) : !data?.length ? (
        <p className="text-sm text-[#8C7B4E]">No parent-student links yet.</p>
      ) : (
        <ul className="text-sm divide-y divide-[#E4D9AE]">
          {data.map((link) => (
            <li key={link.id} className="py-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[#2F2B20]">
                  <span className="font-medium">{link.parent?.full_name}</span>
                  <span className="text-[#8C7B4E]"> → </span>
                  <span className="font-medium">{link.student?.full_name}</span>
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {confirmId === link.id ? (
                    <>
                      <button onClick={() => remove(link.id)} className="text-xs text-[#8C3B3B] underline">Confirm delete</button>
                      <button onClick={() => setConfirmId(null)} className="text-[#8C7B4E]"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditId(editId === link.id ? null : link.id);
                          setReassignTo(link.parent_id ?? "");
                        }}
                        className="text-[#0B6B2B] hover:opacity-70"
                        aria-label="Change parent"
                      >
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmId(link.id)} className="text-[#8C3B3B] hover:opacity-70" aria-label="Unlink">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editId === link.id && (
                <div className="flex items-center gap-2 mt-2">
                  <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className={inputClass + " flex-1"}>
                    {(parents.data ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                  <button onClick={() => saveReassign(link.id)} className="text-xs px-3 py-1.5 rounded-sm bg-[#0B6B2B] text-white shrink-0">
                    Save
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RemoveStaffPanel() {
  const teachers = useProfilesByRole("teacher");
  const [confirmId, setConfirmId] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async (person) => {
    setBusy(true);
    const { error } = await removeStaffMember(person.id);
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
    } else {
      setStatus({ ok: true, message: `${person.full_name} removed from the directory and unassigned from classes.` });
      teachers.refetch();
    }
    setConfirmId(null);
  };

  return (
    <Panel title="Remove Staff" icon={UserMinus}>
      <p className="text-sm text-[#5C5340] mb-3">
        For a teacher who's left the school. This removes them from the directory and unassigns their classes. To
        fully delete their login too (so the email can be reused), do that separately in Supabase's dashboard under
        Authentication → Users.
      </p>
      <StatusLine status={status} />
      {teachers.loading ? (
        <p className="text-sm text-[#8C7B4E]">Loading…</p>
      ) : !teachers.data?.length ? (
        <p className="text-sm text-[#8C7B4E]">No teacher accounts yet.</p>
      ) : (
        <ul className="text-sm divide-y divide-[#E4D9AE]">
          {teachers.data.map((t) => (
            <li key={t.id} className="py-2 flex items-center justify-between gap-2">
              <span className="text-[#2F2B20]">{t.full_name}</span>
              {confirmId === t.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button disabled={busy} onClick={() => remove(t)} className="text-xs text-[#8C3B3B] underline">
                    {busy ? "Removing…" : "Confirm"}
                  </button>
                  <button onClick={() => setConfirmId(null)} className="text-[#8C7B4E]"><X size={14} /></button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(t.id)}
                  className="text-xs px-2 py-1 rounded-sm border border-[#8C3B3B] text-[#8C3B3B] hover:bg-[#F5FAF6] shrink-0"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

const DETAIL_FIELDS = [
  { key: "first_name", label: "First Name" },
  { key: "middle_name", label: "Middle Name" },
  { key: "surname", label: "Surname" },
  { key: "gender", label: "Gender" },
  { key: "date_of_birth", label: "Date of Birth", type: "date" },
  { key: "hometown", label: "Hometown" },
  { key: "class", label: "Class" },
  { key: "father_name", label: "Father's Name" },
  { key: "father_phone", label: "Father's Cellphone" },
  { key: "mother_name", label: "Mother's Name" },
  { key: "mother_phone", label: "Mother's Cellphone" },
  { key: "postal_address", label: "Postal Address" },
];

function emptyDetails() {
  return DETAIL_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {});
}

function PersonalDetailsPanel({ initialStudentId }) {
  const students = useProfilesByRole("student");
  const [studentId, setStudentId] = useState(initialStudentId || "");
  const [form, setForm] = useState(emptyDetails());
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const details = useStudentDetails(studentId || null);

  useEffect(() => {
    if (initialStudentId) setStudentId(initialStudentId);
  }, [initialStudentId]);

  React.useEffect(() => {
    if (details.data) {
      const next = emptyDetails();
      DETAIL_FIELDS.forEach((f) => {
        next[f.key] = details.data[f.key] ?? "";
      });
      setForm(next);
    } else {
      setForm(emptyDetails());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, details.data]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await saveStudentDetails(studentId, form);
    setBusy(false);
    setStatus(error ? { ok: false, message: error.message } : { ok: true, message: "Saved." });
    if (!error) details.refetch();
  };

  return (
    <Panel title="Personal Details" icon={Contact}>
      <Field label="Student">
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputClass}>
          <option value="">Choose a student…</option>
          {(students.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </Field>

      {studentId && (
        <form onSubmit={submit} className="mt-3 pt-3 border-t border-[#EDEEF5] space-y-3">
          {details.loading ? (
            <p className="text-sm text-[#8C7B4E]">Loading existing details…</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {DETAIL_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <input
                    type={f.type ?? "text"}
                    value={form[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>
          )}
          <StatusLine status={status} />
          <button disabled={busy} className="text-sm bg-[#0B6B2B] text-[#FFFFFF] px-4 py-1.5 rounded-sm hover:bg-[#084F20] disabled:opacity-60">
            {busy ? "Saving…" : "Save details"}
          </button>
        </form>
      )}
    </Panel>
  );
}

export default function AdminManagement({ initialStudentId }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Panel title="Create a Class" icon={BookPlus}>
        <CreateClassForm onCreated={() => setRefreshKey((k) => k + 1)} />
      </Panel>
      <RegistrationCodesPanel />
      <PersonalDetailsPanel initialStudentId={initialStudentId} />
      <FeesPanel initialStudentId={initialStudentId} />
      <ClassList key={`classlist-${refreshKey}`} />
      <Panel title="Enroll a Student" icon={UserPlus}>
        <EnrollStudentForm />
      </Panel>
      <Panel title="Link a Parent to a Student" icon={Link2}>
        <LinkParentForm />
      </Panel>
      <ParentLinksPanel />
      <RemoveStaffPanel />
      <Panel title="Post an Announcement" icon={Megaphone}>
        <PostAnnouncementForm />
      </Panel>
    </div>
  );
}

export const CLASS_LIST = [
  "Nursery",
  "Kindergarten One",
  "Kindergarten Two",
  "Basic One",
  "Basic Two",
  "Basic 3",
  "Basic 4",
  "Basic 5",
  "Basic 6",
  "JHS 1",
  "JHS 2",
  "JHS 3",
];

function StudentClassCard({ row, onEditPersonalDetails, onEditFees }) {
  const parents = useParentsOfStudent(row.student_id);
  const fees = useStudentFeeSummary(row.student_id);
  const [confirmUnlinkId, setConfirmUnlinkId] = useState(null);

  const outstanding = (fees.data ?? []).reduce(
    (sum, b) => sum + (Number(b.amount) - Number(b.amount_paid ?? 0)),
    0
  );

  const unlink = async (linkId) => {
    const { error } = await unlinkParentStudent(linkId);
    if (!error) parents.refetch();
    setConfirmUnlinkId(null);
  };

  return (
    <div className="bg-white border border-[#EDEEF5] rounded-xl shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="font-medium text-[#1F2937]">{row.profiles?.full_name}</p>
          <p className="text-xs text-[#6B7280]">Reg No: {row.profiles?.reg_number ?? "—"}</p>
        </div>
        <button onClick={() => onEditPersonalDetails(row.student_id)} className="text-xs px-2 py-1 rounded-sm border border-[#0B6B2B] text-[#0B6B2B] hover:bg-[#F1FBF3]">
          Edit details
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-xs text-[#6B7280]">
        <p>Gender: <span className="text-[#1F2937]">{row.gender || "—"}</span></p>
        <p>DOB: <span className="text-[#1F2937]">{row.date_of_birth || "—"}</span></p>
        <p>Hometown: <span className="text-[#1F2937]">{row.hometown || "—"}</span></p>
        <p>Father: <span className="text-[#1F2937]">{row.father_name || "—"} {row.father_phone ? `(${row.father_phone})` : ""}</span></p>
        <p>Mother: <span className="text-[#1F2937]">{row.mother_name || "—"} {row.mother_phone ? `(${row.mother_phone})` : ""}</span></p>
      </div>

      <div className="mt-3 pt-3 border-t border-[#EDEEF5] flex items-center justify-between">
        <p className="text-xs text-[#6B7280]">
          Fees: {fees.loading ? "…" : outstanding > 0 ? <span className="text-[#DC2626]">Owes GHS {outstanding.toFixed(2)}</span> : <span className="text-[#0B6B2B]">Up to date</span>}
        </p>
        <button onClick={() => onEditFees(row.student_id)} className="text-xs px-2 py-1 rounded-sm border border-[#E7E9F3] text-[#6B7280] hover:bg-[#F5FAF6]">
          Manage fees
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-[#EDEEF5]">
        <p className="text-xs text-[#6B7280] mb-1">Linked parents</p>
        {parents.loading ? (
          <p className="text-xs text-[#6B7280]">Loading…</p>
        ) : !parents.data?.length ? (
          <p className="text-xs text-[#6B7280]">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {parents.data.map((link) => (
              <li key={link.id} className="flex items-center justify-between text-xs">
                <span className="text-[#1F2937]">{link.profiles?.full_name}</span>
                {confirmUnlinkId === link.id ? (
                  <span className="flex items-center gap-1.5">
                    <button onClick={() => unlink(link.id)} className="text-[#DC2626] underline">Confirm</button>
                    <button onClick={() => setConfirmUnlinkId(null)} className="text-[#6B7280]">
                      <X size={12} />
                    </button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmUnlinkId(link.id)} className="text-[#DC2626] hover:opacity-70">
                    <Trash2 size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ClassRosterView({ className, onEditPersonalDetails, onEditFees }) {
  const { data, loading, error } = useStudentsByClass(className);

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#0B6B2B] mb-4">{className}</h2>
      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading students…</p>
      ) : error ? (
        <p className="text-sm text-[#DC2626]">Couldn't load: {error}</p>
      ) : !data?.length ? (
        <p className="text-sm text-[#6B7280]">
          No students placed in this class yet — set a student's "Class" in Personal Details to add them here.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.map((row) => (
            <StudentClassCard key={row.student_id} row={row} onEditPersonalDetails={onEditPersonalDetails} onEditFees={onEditFees} />
          ))}
        </div>
      )}
    </div>
  );
}

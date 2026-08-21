import React, { useState, useEffect } from "react";
import { BookPlus, UserPlus, Link2, Megaphone, Pencil, Trash2, X, ListChecks, KeyRound, ShieldPlus, Receipt, UserMinus, Contact, RefreshCw } from "lucide-react";
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
  enrollStudentWithCode,
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
  useUnclaimedByClass,
  useParentsOfStudent,
  useStudentFeeSummary,
  useStudentDetails,
  saveStudentDetails,
  updateRegNumber,
  deleteStudentRecord,
  useClassSubjects,
  addClassSubject,
  renameClassSubject,
  deleteClassSubject,
  useStudentTermGrades,
  useAllStudentGrades,
  saveSubjectGrade,
  deleteSubjectGrade,
} from "./dataHooks";

const ACCENTS = {
  green: { bar: "#0B6B2B", iconBg: "#E7F5EB", iconFg: "#0B6B2B" },
  gold: { bar: "#B45309", iconBg: "#FFF7E6", iconFg: "#B45309" },
  indigo: { bar: "#4338CA", iconBg: "#EEF1FF", iconFg: "#4338CA" },
  blue: { bar: "#1D4ED8", iconBg: "#EAF1FF", iconFg: "#1D4ED8" },
  teal: { bar: "#0F766E", iconBg: "#E7F8F5", iconFg: "#0F766E" },
  rose: { bar: "#BE123C", iconBg: "#FFEEF1", iconFg: "#BE123C" },
  slate: { bar: "#334155", iconBg: "#F1F5F9", iconFg: "#334155" },
};

function Panel({ title, icon: Icon, accent = "green", children }) {
  const a = ACCENTS[accent] ?? ACCENTS.green;
  return (
    <div className="bg-white border border-[#EDEEF5] rounded-xl shadow-sm overflow-hidden">
      <div className="h-1" style={{ background: a.bar }} />
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#EDEEF5]">
        {Icon && (
          <span className="flex items-center justify-center h-7 w-7 rounded-lg" style={{ background: a.iconBg }}>
            <Icon size={15} style={{ color: a.iconFg }} />
          </span>
        )}
        <h3 className="text-xs font-semibold tracking-wide uppercase" style={{ color: a.bar }}>{title}</h3>
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

// A student dropdown that can be manually refreshed — since a student
// signing up on their own device doesn't automatically update lists
// already open in the admin's browser tab.
function StudentPicker({ students, value, onChange, label = "Student" }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-1.5">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass + " flex-1"}>
          <option value="">Choose a student…</option>
          {(students.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => students.refetch()}
          title="Refresh the student list"
          className="shrink-0 p-1.5 text-[#6B7280] hover:text-[#0B6B2B]"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </Field>
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
    <Panel title="Existing Classes" icon={ListChecks} accent="slate">
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
      <StudentPicker students={students} value={studentId} onChange={setStudentId} />
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
        <div className="flex items-center gap-1.5">
          <select required value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputClass + " flex-1"}>
            <option value="">Choose a parent…</option>
            {(parents.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
          <button type="button" onClick={() => parents.refetch()} title="Refresh the parent list" className="shrink-0 p-1.5 text-[#6B7280] hover:text-[#0B6B2B]">
            <RefreshCw size={14} />
          </button>
        </div>
      </Field>
      <StudentPicker students={students} value={studentId} onChange={setStudentId} />
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

function SubjectsPanel() {
  const [className, setClassName] = useState("");
  const subjects = useClassSubjects(className || null);
  const [newSubject, setNewSubject] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setBusy(true);
    const { error } = await addClassSubject(className, newSubject);
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    setNewSubject("");
    subjects.refetch();
  };

  const saveRename = async (id) => {
    const { error } = await renameClassSubject(id, editValue);
    if (!error) {
      setEditingId(null);
      subjects.refetch();
    }
  };

  const remove = async (id) => {
    const { error } = await deleteClassSubject(id);
    if (!error) subjects.refetch();
  };

  return (
    <Panel title="Subjects" icon={ListChecks} accent="slate">
      <Field label="Class">
        <select value={className} onChange={(e) => setClassName(e.target.value)} className={inputClass}>
          <option value="">Choose a class…</option>
          {CLASS_LIST.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      {className && (
        <>
          <form onSubmit={add} className="flex items-end gap-2 mt-3">
            <div className="flex-1">
              <Field label="Add a subject">
                <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className={inputClass} placeholder="Mathematics" />
              </Field>
            </div>
            <button disabled={busy} className="text-sm bg-[#0B6B2B] text-white px-3 py-1.5 rounded-sm hover:bg-[#084F20] disabled:opacity-60 shrink-0">
              Add
            </button>
          </form>
          <StatusLine status={status} />

          <div className="mt-3 pt-3 border-t border-[#EDEEF5]">
            {subjects.loading ? (
              <p className="text-sm text-[#6B7280]">Loading…</p>
            ) : !subjects.data?.length ? (
              <p className="text-sm text-[#6B7280]">No subjects added yet for {className}.</p>
            ) : (
              <ul className="text-sm divide-y divide-[#EDEEF5]">
                {subjects.data.map((s) => (
                  <li key={s.id} className="py-2 flex items-center justify-between gap-2">
                    {editingId === s.id ? (
                      <>
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className={inputClass + " flex-1"} />
                        <button onClick={() => saveRename(s.id)} className="text-xs text-[#0B6B2B] underline shrink-0">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-[#6B7280] shrink-0"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <span className="text-[#1F2937]">{s.subject}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => { setEditingId(s.id); setEditValue(s.subject); }} className="text-[#0B6B2B] hover:opacity-70">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => remove(s.id)} className="text-[#DC2626] hover:opacity-70">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}

const TERMS = ["1st Term", "2nd Term", "3rd Term"];

export function TermGradesPanel({ initialStudentId }) {
  const students = useProfilesByRole("student");
  const [studentId, setStudentId] = useState(initialStudentId || "");
  const [term, setTerm] = useState(TERMS[0]);
  const details = useStudentDetails(studentId || null);
  const className = details.data?.class;
  const subjects = useClassSubjects(className || null);
  const grades = useStudentTermGrades(studentId || null, term, className || null);
  const history = useAllStudentGrades(studentId || null);
  const [inputs, setInputs] = useState({});
  const [status, setStatus] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (initialStudentId) setStudentId(initialStudentId);
  }, [initialStudentId]);

  const gradeFor = (subject) => grades.data?.find((g) => g.subject === subject);

  const save = async (subject) => {
    const value = inputs[subject] ?? gradeFor(subject)?.grade ?? "";
    if (!value) return;
    const { error } = await saveSubjectGrade({ studentId, className, term, subject, grade: value });
    setStatus(error ? { ok: false, message: error.message } : { ok: true, message: "Saved." });
    if (!error) {
      grades.refetch();
      history.refetch();
    }
  };

  const remove = async (id) => {
    const { error } = await deleteSubjectGrade(id);
    if (!error) {
      grades.refetch();
      history.refetch();
    }
  };

  // Group every grade this student has ever earned by the class they were
  // in at the time, in class-list order, so a promotion never hides or
  // overwrites what came before — it's all still here, just organized by
  // which class it belongs to.
  const historyByClass = CLASS_LIST.map((c) => ({
    className: c,
    rows: (history.data ?? []).filter((g) => g.class_name === c),
  })).filter((c) => c.rows.length > 0);

  return (
    <Panel title="Term Grades" icon={ListChecks} accent="indigo">
      <StudentPicker students={students} value={studentId} onChange={setStudentId} />

      {studentId && (
        <>
          <div className="mt-3">
            <Field label="Term">
              <select value={term} onChange={(e) => setTerm(e.target.value)} className={inputClass}>
                {TERMS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          {!className ? (
            <p className="text-sm text-[#6B7280] mt-3">
              This student doesn't have a class set yet — set it in Personal Details first.
            </p>
          ) : !subjects.data?.length ? (
            <p className="text-sm text-[#6B7280] mt-3">
              No subjects added yet for {className} — add some in the Subjects panel first.
            </p>
          ) : (
            <div className="mt-3 pt-3 border-t border-[#EDEEF5] space-y-2">
              <p className="text-xs text-[#6B7280]">Entering grades for their current class — {className}</p>
              <StatusLine status={status} />
              {subjects.data.map((s) => {
                const existing = gradeFor(s.subject);
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-sm text-[#1F2937] flex-1">{s.subject}</span>
                    <input
                      value={inputs[s.subject] ?? existing?.grade ?? ""}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [s.subject]: e.target.value }))}
                      className={inputClass + " w-20"}
                      placeholder="Grade"
                    />
                    <button onClick={() => save(s.subject)} className="text-xs px-2 py-1 rounded-sm border border-[#0B6B2B] text-[#0B6B2B] hover:bg-[#F1FBF3] shrink-0">
                      Save
                    </button>
                    {existing && (
                      <button onClick={() => remove(existing.id)} className="text-[#DC2626] hover:opacity-70 shrink-0" aria-label="Delete grade">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-[#EDEEF5]">
            <button onClick={() => setShowHistory((s) => !s)} className="text-xs text-[#6B7280] hover:text-[#0B6B2B] underline">
              {showHistory ? "Hide" : "Show"} full academic history (all classes, all terms)
            </button>
            {showHistory && (
              <div className="mt-3 space-y-3">
                {!historyByClass.length ? (
                  <p className="text-sm text-[#6B7280]">No grades recorded for this student yet.</p>
                ) : (
                  historyByClass.map(({ className: c, rows }) => (
                    <div key={c}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#0B6B2B] mb-1">{c}</p>
                      {TERMS.map((t) => {
                        const termRows = rows.filter((r) => r.term === t);
                        if (!termRows.length) return null;
                        return (
                          <div key={t} className="mb-2">
                            <p className="text-xs text-[#6B7280] mb-0.5">{t}</p>
                            <ul className="text-sm divide-y divide-[#EDEEF5]">
                              {termRows.map((r) => (
                                <li key={r.id} className="py-1 flex justify-between">
                                  <span className="text-[#1F2937]">{r.subject}</span>
                                  <span className="font-medium text-[#0B6B2B]">{r.grade}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Panel>
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
    <Panel title="Registration Numbers" icon={KeyRound} accent="teal">
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
                <div>
                  <span className="text-[#1F2937] font-mono">{c.code}</span>
                  {(c.first_name || c.surname) && (
                    <span className="block text-xs text-[#6B7280]">
                      {[c.first_name, c.surname].filter(Boolean).join(" ")}
                      {c.class ? ` · ${c.class}` : ""}
                    </span>
                  )}
                </div>
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

function EnrollStudentPanel() {
  const [code, setCode] = useState("");
  const [form, setForm] = useState(emptyDetails());
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await enrollStudentWithCode(code, form);
    setBusy(false);
    if (error) {
      setStatus({ ok: false, message: error.message });
      return;
    }
    setStatus({ ok: true, message: `Enrolled — give "${code}" to the student so they can sign up.` });
    setCode("");
    setForm(emptyDetails());
  };

  return (
    <Panel title="Enroll a Student" icon={UserPlus} accent="teal">
      <p className="text-sm text-[#5C5340] mb-3">
        Enter a new student's details and pick their registration number here first. Once you hand them the number,
        they sign up with it and their details will already be filled in.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Registration Number">
          <input required value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} placeholder="YES2026003" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {DETAIL_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <DetailFieldInput
                field={f}
                value={form[f.key]}
                onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              />
            </Field>
          ))}
        </div>
        <StatusLine status={status} />
        <button disabled={busy} className="text-sm bg-[#0B6B2B] text-[#FFFFFF] px-4 py-1.5 rounded-sm hover:bg-[#084F20] disabled:opacity-60">
          {busy ? "Enrolling…" : "Enroll student"}
        </button>
      </form>
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
    <Panel title="Grant Admin Access" icon={ShieldPlus} accent="rose">
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
    <Panel title="Current Admins" icon={ShieldPlus} accent="rose">
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
  const [amountPaid, setAmountPaid] = useState(bill.amount_paid ?? 0);
  const [dueDate, setDueDate] = useState(bill.due_date ?? "");
  const [payAmount, setPayAmount] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const outstanding = Number(bill.amount) - Number(bill.amount_paid ?? 0);
  const statusLabel = bill.paid ? "Paid" : Number(bill.amount_paid ?? 0) > 0 ? "Partial" : "Unpaid";

  const saveEdit = async () => {
    setBusy(true);
    const paidValue = Number(amountPaid) || 0;
    const { error } = await editBill(bill.id, {
      description,
      amount: Number(amount),
      due_date: dueDate || null,
      amount_paid: paidValue,
      paid: paidValue >= Number(amount),
    });
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
        <div>
          <label className="text-xs text-[#6B7280]">Amount Paid</label>
          <input type="number" step="0.01" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className={inputClass} placeholder="Amount paid" />
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

export function FeesPanel({ initialStudentId }) {
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
    <Panel title="Fees" icon={Receipt} accent="gold">
      <StudentPicker students={students} value={studentId} onChange={setStudentId} />

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
    <Panel title="Parent Links" icon={Link2} accent="teal">
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
    <Panel title="Remove Staff" icon={UserMinus} accent="rose">
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

function DetailFieldInput({ field, value, onChange }) {
  if (field.key === "class") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">— not set —</option>
        {CLASS_LIST.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    );
  }
  if (field.key === "gender") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">— not set —</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
    );
  }
  return (
    <input
      type={field.type ?? "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

export function PersonalDetailsPanel({ initialStudentId, onStudentsChanged }) {
  const students = useProfilesByRole("student");
  const [studentId, setStudentId] = useState(initialStudentId || "");
  const [form, setForm] = useState(emptyDetails());
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const details = useStudentDetails(studentId || null);

  const [regNumber, setRegNumber] = useState("");
  const [regStatus, setRegStatus] = useState(null);
  const [regBusy, setRegBusy] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const selectedStudent = (students.data ?? []).find((s) => s.id === studentId);

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
    setConfirmDelete(false);
    setDeleteStatus(null);
    setRegStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, details.data]);

  useEffect(() => {
    setRegNumber(selectedStudent?.reg_number ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?.reg_number, studentId]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await saveStudentDetails(studentId, form);
    setBusy(false);
    setStatus(error ? { ok: false, message: error.message } : { ok: true, message: "Saved." });
    if (!error) details.refetch();
  };

  const saveRegNumber = async () => {
    setRegBusy(true);
    const { error } = await updateRegNumber(studentId, regNumber);
    setRegBusy(false);
    setRegStatus(
      error
        ? { ok: false, message: error.message }
        : { ok: true, message: "Saved. Note: this only changes the number shown — it doesn't change what they type to sign in." }
    );
    if (!error) students.refetch();
  };

  const doDelete = async () => {
    setDeleteBusy(true);
    const { error } = await deleteStudentRecord(studentId);
    setDeleteBusy(false);
    if (error) {
      setDeleteStatus({ ok: false, message: error.message });
      return;
    }
    setStudentId("");
    students.refetch();
    onStudentsChanged?.();
  };

  return (
    <Panel title="Personal Details" icon={Contact} accent="teal">
      <StudentPicker students={students} value={studentId} onChange={setStudentId} />

      {studentId && (
        <>
          <div className="mt-3 pt-3 border-t border-[#EDEEF5] flex items-end gap-2">
            <div className="flex-1">
              <Field label="Registration Number">
                <input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <button
              disabled={regBusy}
              onClick={saveRegNumber}
              className="text-xs px-3 py-1.5 rounded-sm border border-[#0B6B2B] text-[#0B6B2B] hover:bg-[#F5FAF6] disabled:opacity-60 shrink-0"
            >
              {regBusy ? "Saving…" : "Save"}
            </button>
          </div>
          <StatusLine status={regStatus} />

          <form onSubmit={submit} className="mt-3 pt-3 border-t border-[#EDEEF5] space-y-3">
            {details.loading ? (
              <p className="text-sm text-[#8C7B4E]">Loading existing details…</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {DETAIL_FIELDS.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <DetailFieldInput
                      field={f}
                      value={form[f.key]}
                      onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
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

          <div className="mt-4 pt-3 border-t border-[#EDEEF5]">
            <p className="text-xs text-[#6B7280] mb-2">
              Deleting removes this student's personal details, grades, attendance, fees, and parent links
              permanently. Their login stays in Supabase's Authentication system until removed there separately.
            </p>
            <StatusLine status={deleteStatus} />
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  disabled={deleteBusy}
                  onClick={doDelete}
                  className="text-xs px-3 py-1.5 rounded-sm bg-[#DC2626] text-white hover:opacity-90 disabled:opacity-60"
                >
                  {deleteBusy ? "Deleting…" : "Yes, delete this student"}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-[#6B7280]">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs px-3 py-1.5 rounded-sm border border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2]"
              >
                Delete this student
              </button>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}

export default function AdminManagement({ initialStudentId }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [studentsVersion, setStudentsVersion] = useState(0);
  const bumpStudents = () => setStudentsVersion((v) => v + 1);

  return (
    <div className="space-y-8">
      <Section title="Students">
        <EnrollStudentPanel onStudentsChanged={bumpStudents} />
        <RegistrationCodesPanel />
        <PersonalDetailsPanel key={`details-${studentsVersion}`} initialStudentId={initialStudentId} onStudentsChanged={bumpStudents} />
        <FeesPanel key={`fees-${studentsVersion}`} initialStudentId={initialStudentId} />
        <Panel title="Assign a Student's Class" icon={UserPlus} accent="teal">
          <EnrollStudentForm key={`assign-${studentsVersion}`} />
        </Panel>
      </Section>

      <Section title="Classes">
        <Panel title="Create a Class" icon={BookPlus}>
          <CreateClassForm onCreated={() => setRefreshKey((k) => k + 1)} />
        </Panel>
        <ClassList key={`classlist-${refreshKey}`} />
        <SubjectsPanel />
      </Section>

      <Section title="Academics">
        <TermGradesPanel initialStudentId={initialStudentId} />
      </Section>

      <Section title="Parents">
        <Panel title="Link a Parent to a Student" icon={Link2} accent="teal">
          <LinkParentForm key={`link-${studentsVersion}`} />
        </Panel>
        <ParentLinksPanel key={`parentlinks-${studentsVersion}`} />
      </Section>

      <Section title="Staff">
        <RemoveStaffPanel />
      </Section>

      <Section title="Announcements">
        <Panel title="Post an Announcement" icon={Megaphone} accent="blue">
          <PostAnnouncementForm />
        </Panel>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0B6B2B] mb-3 pb-2 border-b-2 border-[#E7E9F3] flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#0B6B2B]" />
        {title}
      </h2>
      <div className="grid md:grid-cols-2 gap-5">{children}</div>
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
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-[#1F2937]">{row.profiles?.full_name}</p>
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#F1FBF3] text-[#0B6B2B] border border-[#0B6B2B]">
              Signed up
            </span>
          </div>
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

function PendingStudentCard({ row, onChanged }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    const { error } = await deleteRegistrationCode(row.code);
    setBusy(false);
    if (!error) onChanged();
  };

  const name = [row.first_name, row.middle_name, row.surname].filter(Boolean).join(" ") || "(name not entered)";

  return (
    <div className="bg-white border border-dashed border-[#D97706] rounded-xl shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-[#1F2937]">{name}</p>
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#D97706]">
              Not signed up yet
            </span>
          </div>
          <p className="text-xs text-[#6B7280] font-mono">Reg No: {row.code}</p>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <button disabled={busy} onClick={remove} className="text-[#DC2626] underline">
              {busy ? "Removing…" : "Confirm"}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-[#6B7280]"><X size={12} /></button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs px-2 py-1 rounded-sm border border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2] shrink-0"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-xs text-[#6B7280]">
        <p>Gender: <span className="text-[#1F2937]">{row.gender || "—"}</span></p>
        <p>DOB: <span className="text-[#1F2937]">{row.date_of_birth || "—"}</span></p>
        <p>Hometown: <span className="text-[#1F2937]">{row.hometown || "—"}</span></p>
        <p>Father: <span className="text-[#1F2937]">{row.father_name || "—"} {row.father_phone ? `(${row.father_phone})` : ""}</span></p>
        <p>Mother: <span className="text-[#1F2937]">{row.mother_name || "—"} {row.mother_phone ? `(${row.mother_phone})` : ""}</span></p>
      </div>

      <p className="text-xs text-[#B45309] mt-3 pt-3 border-t border-[#EDEEF5]">
        Give this registration number to the student so they can sign up.
      </p>
    </div>
  );
}

export function ClassRosterView({ className, onEditPersonalDetails, onEditFees }) {
  const signedUp = useStudentsByClass(className);
  const pending = useUnclaimedByClass(className);

  const refetchAll = () => {
    signedUp.refetch();
    pending.refetch();
  };

  const loading = signedUp.loading || pending.loading;
  const error = signedUp.error || pending.error;
  const totalCount = (signedUp.data?.length ?? 0) + (pending.data?.length ?? 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-[#0B6B2B]">{className}</h2>
        <button onClick={refetchAll} title="Refresh this class list" className="p-1 text-[#6B7280] hover:text-[#0B6B2B]">
          <RefreshCw size={14} />
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading students…</p>
      ) : error ? (
        <p className="text-sm text-[#DC2626]">Couldn't load: {error}</p>
      ) : totalCount === 0 ? (
        <p className="text-sm text-[#6B7280]">
          No students placed in this class yet — set a student's "Class" in Personal Details, or enroll a new one, to
          add them here.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(pending.data ?? []).map((row) => (
            <PendingStudentCard key={row.code} row={row} onChanged={refetchAll} />
          ))}
          {(signedUp.data ?? []).map((row) => (
            <StudentClassCard key={row.student_id} row={row} onEditPersonalDetails={onEditPersonalDetails} onEditFees={onEditFees} />
          ))}
        </div>
      )}
    </div>
  );
}

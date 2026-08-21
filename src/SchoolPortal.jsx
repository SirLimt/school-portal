import React, { useState } from "react";
import {
  GraduationCap,
  BookOpenCheck,
  Building2,
  Users,
  UserCircle2,
  Bell,
  CalendarDays,
  ClipboardList,
  CheckSquare,
  Square,
  BarChart3,
  LogOut,
  Receipt,
  Search,
  Contact,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import Login, { ResetPasswordScreen } from "./Login";
import AdminManagement, { CLASS_LIST, ClassRosterView, GrantAdminPanel, ManageAdminsPanel, PersonalDetailsPanel, FeesPanel, TermGradesPanel } from "./AdminManagement";
import crest from "./assets/crest.jpg";
import {
  useAnnouncements,
  useStudentData,
  useTeacherClasses,
  useRoster,
  recordAttendance,
  useAdminStats,
  useParentChildren,
  postGrade,
  deleteGrade,
  useStudentBills,
  useStudentDetails,
  useAllStudentGrades,
} from "./dataHooks";

const SCHOOL = "Young Executive School Complex";

const ROLE_META = {
  student: { label: "Student", icon: GraduationCap },
  teacher: { label: "Teacher", icon: BookOpenCheck },
  admin: { label: "Administration", icon: Building2 },
  parent: { label: "Parent", icon: Users },
};

const notebookLines = {};

function Ledger({ id, title, icon: Icon, children }) {
  return (
    <div id={id} className="bg-white border border-[#EDEEF5] rounded-xl shadow-sm overflow-hidden scroll-mt-28">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#EDEEF5]">
        {Icon && <Icon size={16} className="text-[#0B6B2B]" />}
        <h3 className="text-xs font-semibold tracking-wide uppercase text-[#0B6B2B]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PinnedNote({ text, from }) {
  return (
    <div className="bg-[#F5FAF6] border border-[#EDEEF5] rounded-lg p-4">
      <p className="text-sm leading-snug text-[#1F2937]">{text}</p>
      <p className="text-xs mt-2 text-[#6B7280] uppercase tracking-wide">— {from}</p>
    </div>
  );
}

function Loading({ label }) {
  return <p className="text-sm text-[#6B7280]">Loading {label}…</p>;
}

function ErrorNote({ message }) {
  return <p className="text-sm text-[#DC2626]">Couldn't load this: {message}</p>;
}

function AnnouncementsPanel() {
  const { data, loading, error } = useAnnouncements();
  if (loading) return <Loading label="announcements" />;
  if (error) return <ErrorNote message={error} />;
  const pinned = (data ?? []).filter((a) => a.pinned);
  if (pinned.length === 0) return <p className="text-sm text-[#6B7280]">No pinned announcements right now.</p>;
  return (
    <div className="space-y-3">
      {pinned.map((a) => (
        <PinnedNote key={a.id} text={a.text} from={a.profiles?.full_name ?? "Staff"} />
      ))}
    </div>
  );
}

function FieldBox({ label, value, wide }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-sm text-[#374151] mb-1">{label}</p>
      <div className="border border-[#D1D5DB] rounded-md px-3 py-2.5 bg-[#F9FAFB] text-[#1F2937]">
        {value || <span className="text-[#9CA3AF]">—</span>}
      </div>
    </div>
  );
}

function FeesLedger({ studentId, profile }) {
  const bills = useStudentBills(studentId);
  const details = useStudentDetails(studentId);
  if (bills.loading) return <Loading label="fees" />;
  if (bills.error) return <ErrorNote message={bills.error} />;

  const data = bills.data ?? [];
  const totalAmount = data.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalPaid = data.reduce((sum, b) => sum + Number(b.amount_paid ?? (b.paid ? b.amount : 0)), 0);
  const previousBalance = Number(details.data?.previous_balance ?? 0);
  const payable = previousBalance + totalAmount - totalPaid;
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="border border-[#D1D5DB] rounded-lg overflow-hidden print:border-0">
      <div className="bg-[#0B6B2B] px-6 py-5 text-center text-white">
        <img src={crest} alt={`${SCHOOL} crest`} className="mx-auto h-12 w-12 rounded-full object-cover mb-2" />
        <p className="text-lg font-semibold leading-tight">{SCHOOL.toUpperCase()}</p>
        <p className="text-xs text-[#D9F2E1] mt-0.5">Directorate of Finance</p>
        <p className="text-xs text-[#D9F2E1]">Bill Statement</p>
      </div>

      <div className="p-6">
        <p className="text-center font-semibold text-[#1F2937] tracking-wide">STUDENT FEE STATEMENT</p>
        <p className="text-center text-xs text-[#6B7280] mb-5">As of {today}</p>

        <div className="grid grid-cols-2 gap-y-1 text-sm mb-5">
          <p className="text-[#6B7280]">Student ID / Reg. Number:</p>
          <p className="text-[#1F2937] font-medium">{profile?.reg_number ?? "—"}</p>
          <p className="text-[#6B7280]">Student Name:</p>
          <p className="text-[#1F2937] font-medium">{profile?.full_name ?? "—"}</p>
          <p className="text-[#6B7280]">Class:</p>
          <p className="text-[#1F2937] font-medium">{details.data?.class || "—"}</p>
          <p className="text-[#6B7280]">Currency:</p>
          <p className="text-[#1F2937] font-medium">GHS</p>
        </div>

        {!data.length ? (
          <p className="text-sm text-[#6B7280]">No bills posted yet.</p>
        ) : (
          <>
            <table className="w-full text-sm border border-[#D1D5DB] rounded-md overflow-hidden">
              <thead>
                <tr className="bg-[#F3F4F6] text-left text-[#374151]">
                  <th className="px-3 py-2 font-medium w-10">Sn</th>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium text-right">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((b, i) => (
                  <tr key={b.id} className="border-t border-[#EDEEF5]">
                    <td className="px-3 py-2 text-[#6B7280]">{i + 1}</td>
                    <td className="px-3 py-2 text-[#1F2937]">
                      {b.description}
                      <span className="block text-xs text-[#6B7280]">
                        {b.session}{b.due_date ? ` · due ${b.due_date}` : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-[#1F2937]">{Number(b.amount).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t border-[#D1D5DB] font-semibold">
                  <td className="px-3 py-2" colSpan={2}>Total Tuition Fee</td>
                  <td className="px-3 py-2 text-right">{totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs text-sm space-y-1">
                <div className="flex justify-between"><span className="text-[#6B7280]">Balance from previous academic year:</span><span className="text-[#1F2937]">{previousBalance.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">Total Tuition Fee:</span><span className="text-[#1F2937]">{totalAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">Amount Paid:</span><span className="text-[#1F2937]">{totalPaid.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-[#D1D5DB] pt-1 font-semibold">
                  <span className="text-[#1F2937]">Amount Payable:</span>
                  <span className={payable > 0 ? "text-[#DC2626]" : "text-[#0B6B2B]"}>{payable.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="mt-5 text-sm bg-[#0B6B2B] text-white px-4 py-2 rounded-md hover:bg-[#084F20] print:hidden"
            >
              Print Statement
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const DETAIL_LABELS = [
  ["first_name", "First Name"],
  ["middle_name", "Middle Name"],
  ["surname", "Surname"],
  ["gender", "Gender"],
  ["date_of_birth", "Date of Birth"],
  ["hometown", "Hometown"],
  ["class", "Class"],
  ["father_name", "Father's Name"],
  ["father_phone", "Father's Cellphone"],
  ["mother_name", "Mother's Name"],
  ["mother_phone", "Mother's Cellphone"],
  ["postal_address", "Postal Address", true],
];

function PersonalDetailsView({ profile }) {
  const { data, loading, error } = useStudentDetails(profile.id);
  if (loading) return <Loading label="personal details" />;
  if (error) return <ErrorNote message={error} />;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <FieldBox label="Registration Number" value={profile.reg_number} wide />
        {DETAIL_LABELS.map(([key, label, wide]) => (
          <FieldBox key={key} label={label} value={data?.[key]} wide={wide} />
        ))}
      </div>
      {!data && (
        <p className="text-xs text-[#6B7280] mt-3">
          These haven't been filled in yet — ask the school office to add them.
        </p>
      )}
    </div>
  );
}

const TERM_ORDER = ["1st Term", "2nd Term", "3rd Term"];

function TermGradesView({ studentId }) {
  const { data, loading, error } = useAllStudentGrades(studentId);
  if (loading) return <Loading label="grades" />;
  if (error) return <ErrorNote message={error} />;
  if (!data?.length) return <p className="text-sm text-[#6B7280]">No grades posted yet.</p>;

  const byTerm = TERM_ORDER.map((term) => ({ term, rows: data.filter((g) => g.term === term) })).filter(
    (t) => t.rows.length > 0
  );

  return (
    <div className="space-y-4">
      {byTerm.map(({ term, rows }) => (
        <div key={term}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B6B2B] mb-1">{term}</p>
          <ul className="text-sm divide-y divide-[#EDEEF5]">
            {rows.map((g) => (
              <li key={g.id} className="py-2 flex justify-between">
                <span className="text-[#1F2937]">{g.subject}</span>
                <span className="font-semibold text-[#0B6B2B]">{g.grade}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function StudentView({ profile, activeSection }) {
  const { enrollments, assignments, grades } = useStudentData(profile.id);

  return (
    <div className="max-w-3xl">
      {activeSection === "personal-details" && (
        <Ledger id="personal-details" title="Personal Details" icon={Contact}>
          <PersonalDetailsView profile={profile} />
        </Ledger>
      )}

      {activeSection === "classes" && (
        <Ledger id="classes" title="My Classes" icon={CalendarDays}>
          {enrollments.loading ? (
            <Loading label="schedule" />
          ) : enrollments.error ? (
            <ErrorNote message={enrollments.error} />
          ) : !enrollments.data?.length ? (
            <p className="text-sm text-[#6B7280]">No classes enrolled yet — ask the front office to add you to a class.</p>
          ) : (
            <ul className="text-sm divide-y divide-[#EDEEF5]">
              {enrollments.data.map((e, i) => (
                <li key={i} className="py-2 flex justify-between">
                  <span className="text-[#1F2937] font-medium">{e.classes?.name}</span>
                  <span className="text-[#6B7280]">{e.classes?.time_range} · {e.classes?.room}</span>
                </li>
              ))}
            </ul>
          )}
        </Ledger>
      )}

      {activeSection === "assignments" && (
        <Ledger id="assignments" title="Assignments" icon={ClipboardList}>
          {assignments.loading ? (
            <Loading label="assignments" />
          ) : assignments.error ? (
            <ErrorNote message={assignments.error} />
          ) : !assignments.data?.length ? (
            <p className="text-sm text-[#6B7280]">Nothing due — enjoy it.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {assignments.data.map((a) => (
                <li key={a.id}>
                  <p className="font-medium text-[#1F2937]">{a.title}</p>
                  <p className="text-xs text-[#6B7280]">{a.classes?.name} · due {a.due_date}</p>
                </li>
              ))}
            </ul>
          )}
        </Ledger>
      )}

      {activeSection === "grades" && (
        <Ledger id="grades" title="Grades" icon={BarChart3}>
          <TermGradesView studentId={profile.id} />
        </Ledger>
      )}

      {activeSection === "announcements" && (
        <Ledger id="announcements" title="Announcements" icon={Bell}>
          <AnnouncementsPanel />
        </Ledger>
      )}

      {activeSection === "fees" && (
        <Ledger id="fees" title="Fees" icon={Receipt}>
          <FeesLedger studentId={profile.id} profile={profile} />
        </Ledger>
      )}
    </div>
  );
}

function RollCall({ classId }) {
  const { data, loading, error, refetch } = useRoster(classId);
  const [marked, setMarked] = useState({});

  const mark = async (studentId, present) => {
    setMarked((m) => ({ ...m, [studentId]: present }));
    await recordAttendance(classId, studentId, present);
  };

  if (loading) return <Loading label="roster" />;
  if (error) return <ErrorNote message={error} />;
  if (!data?.length) return <p className="text-sm text-[#6B7280]">No students enrolled in this class yet.</p>;

  return (
    <ul className="text-sm space-y-2">
      {data.map((e, i) => {
        const s = e.profiles;
        const present = marked[s?.id] ?? true;
        return (
          <li key={i} className="flex items-center justify-between">
            <span className="text-[#1F2937]">{s?.full_name}</span>
            <button
              onClick={() => mark(s.id, !present)}
              className={`text-xs px-2 py-1 rounded-sm border ${
                present ? "bg-[#0B6B2B] text-[#FFFFFF] border-[#0B6B2B]" : "bg-transparent text-[#DC2626] border-[#DC2626]"
              }`}
            >
              {present ? "Present" : "Absent"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PostGrade({ classId }) {
  const { data, loading, error } = useRoster(classId);
  const [gradeInputs, setGradeInputs] = useState({});
  const [status, setStatus] = useState(null);

  const submit = async (studentId) => {
    const grade = gradeInputs[studentId];
    if (!grade) return;
    const { error } = await postGrade({ studentId, classId, grade });
    setStatus(error ? { ok: false, message: error.message } : { ok: true, message: "Saved." });
  };

  const clear = async (studentId) => {
    const { error } = await deleteGrade({ studentId, classId });
    setStatus(error ? { ok: false, message: error.message } : { ok: true, message: "Cleared." });
    setGradeInputs((g) => ({ ...g, [studentId]: "" }));
  };

  if (loading) return <Loading label="roster" />;
  if (error) return <ErrorNote message={error} />;
  if (!data?.length) return <p className="text-sm text-[#6B7280]">No students enrolled in this class yet.</p>;

  return (
    <div className="space-y-2">
      {status && <StatusLine status={status} />}
      <ul className="text-sm space-y-2">
        {data.map((e, i) => {
          const s = e.profiles;
          return (
            <li key={i} className="flex items-center gap-2">
              <span className="text-[#1F2937] flex-1">{s?.full_name}</span>
              <input
                placeholder="B+"
                value={gradeInputs[s?.id] ?? ""}
                onChange={(ev) => setGradeInputs((g) => ({ ...g, [s.id]: ev.target.value }))}
                className="w-16 bg-transparent border-b border-[#E3A400] focus:outline-none focus:border-[#DC2626] py-1 text-[#1F2937]"
              />
              <button
                onClick={() => submit(s.id)}
                className="text-xs px-2 py-1 rounded-sm border border-[#0B6B2B] text-[#0B6B2B] hover:bg-[#F5FAF6]"
              >
                Save
              </button>
              <button
                onClick={() => clear(s.id)}
                className="text-xs px-2 py-1 rounded-sm border border-[#E7E9F3] text-[#6B7280] hover:border-[#DC2626] hover:text-[#DC2626]"
              >
                Clear
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusLine({ status }) {
  if (!status) return null;
  return <p className={`text-sm ${status.ok ? "text-[#0B6B2B]" : "text-[#DC2626]"}`}>{status.message}</p>;
}

function TeacherView({ profile, activeSection }) {
  const { data: classes, loading, error } = useTeacherClasses(profile.id);
  const [selected, setSelected] = useState(null);
  const activeClass = selected ?? classes?.[0]?.id ?? null;

  return (
    <div className="max-w-3xl">
      {activeSection === "classes" && (
        <Ledger id="classes" title="My Classes" icon={BookOpenCheck}>
          {loading ? (
            <Loading label="classes" />
          ) : error ? (
            <ErrorNote message={error} />
          ) : !classes?.length ? (
            <p className="text-sm text-[#6B7280]">No classes assigned yet — ask an admin to set them up.</p>
          ) : (
            <ul className="text-sm divide-y divide-[#EDEEF5]">
              {classes.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelected(c.id)}
                    className={`w-full text-left py-2 flex justify-between ${activeClass === c.id ? "font-semibold" : ""}`}
                  >
                    <span className="text-[#1F2937]">{c.name}</span>
                    <span className="text-[#6B7280]">{c.room}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Ledger>
      )}

      {activeSection === "roll" && (
        <Ledger id="roll" title="Take Roll" icon={CheckSquare}>
          {activeClass ? <RollCall classId={activeClass} /> : <p className="text-sm text-[#6B7280]">Pick a class to take roll.</p>}
        </Ledger>
      )}

      {activeSection === "postgrades" && (
        <Ledger id="postgrades" title="Post Grades" icon={BarChart3}>
          {activeClass ? <PostGrade classId={activeClass} /> : <p className="text-sm text-[#6B7280]">Pick a class to post grades.</p>}
        </Ledger>
      )}

      {activeSection === "announcements" && (
        <Ledger id="announcements" title="Announcements" icon={Bell}>
          <AnnouncementsPanel />
        </Ledger>
      )}
    </div>
  );
}

function AdminView({ tab, setTab }) {
  const { students, staff, staffDirectory } = useAdminStats();
  const [focusStudentId, setFocusStudentId] = useState(null);
  const [returnTab, setReturnTab] = useState(null);

  const openStudentEdit = (studentId) => {
    setFocusStudentId(studentId);
    setReturnTab(CLASS_LIST.includes(tab) ? tab : returnTab);
    setTab("edit-student");
  };

  if (tab === "edit-student") {
    return (
      <div className="max-w-2xl">
        <button
          onClick={() => setTab(returnTab ?? "overview")}
          className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0B6B2B] mb-4"
        >
          <ChevronLeft size={16} />
          Back{returnTab ? ` to ${returnTab}` : ""}
        </button>
        <div className="space-y-5">
          <PersonalDetailsPanel initialStudentId={focusStudentId} />
          <TermGradesPanel initialStudentId={focusStudentId} />
          <FeesPanel initialStudentId={focusStudentId} />
        </div>
      </div>
    );
  }

  if (CLASS_LIST.includes(tab)) {
    return (
      <ClassRosterView
        className={tab}
        onEditPersonalDetails={openStudentEdit}
        onEditFees={openStudentEdit}
      />
    );
  }

  if (tab === "grant-admin") {
    return (
      <div className="max-w-2xl">
        <GrantAdminPanel />
      </div>
    );
  }

  if (tab === "current-admins") {
    return (
      <div className="max-w-2xl">
        <ManageAdminsPanel />
      </div>
    );
  }

  return (
    <div>
      {tab === "manage" ? (
        <AdminManagement />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          <Ledger id="overview" title="School at a Glance" icon={Building2}>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#EDEEF5] rounded-lg p-3">
                <p className="text-2xl font-semibold text-[#0B6B2B]">
                  {students.loading ? "…" : students.data ?? 0}
                </p>
                <p className="text-xs text-[#6B7280] mt-1">Enrolled students</p>
              </div>
              <div className="border border-[#EDEEF5] rounded-lg p-3">
                <p className="text-2xl font-semibold text-[#0B6B2B]">
                  {staff.loading ? "…" : staff.data ?? 0}
                </p>
                <p className="text-xs text-[#6B7280] mt-1">Staff on record</p>
              </div>
            </div>
          </Ledger>

          <Ledger id="directory" title="Staff Directory" icon={Users}>
            {staffDirectory.loading ? (
              <Loading label="directory" />
            ) : staffDirectory.error ? (
              <ErrorNote message={staffDirectory.error} />
            ) : (
              <ul className="text-sm divide-y divide-[#EDEEF5]">
                {(staffDirectory.data ?? []).map((s, i) => (
                  <li key={i} className="py-2 flex justify-between">
                    <span className="text-[#1F2937] font-medium">{s.full_name}</span>
                    <span className="text-[#6B7280] capitalize">{s.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </Ledger>

          <Ledger id="announcements" title="Announcements" icon={Bell}>
            <AnnouncementsPanel />
          </Ledger>
        </div>
      )}
    </div>
  );
}

function ParentView({ profile, activeSection }) {
  const { data, loading, error } = useParentChildren(profile.id);

  return (
    <div className="max-w-3xl">
      {activeSection === "children" && (
        <Ledger id="children" title="Your Children" icon={GraduationCap}>
          {loading ? (
            <Loading label="children" />
          ) : error ? (
            <ErrorNote message={error} />
          ) : !data?.length ? (
            <p className="text-sm text-[#6B7280]">No linked students yet — ask the front office to link your account.</p>
          ) : (
            <ul className="text-sm divide-y divide-[#EDEEF5]">
              {data.map((link, i) => (
                <li key={i} className="py-2 text-[#1F2937] font-medium">
                  {link.profiles?.full_name}
                </li>
              ))}
            </ul>
          )}
        </Ledger>
      )}

      {activeSection === "announcements" && (
        <Ledger id="announcements" title="Announcements" icon={Bell}>
          <AnnouncementsPanel />
        </Ledger>
      )}

      {activeSection === "fees" &&
        (data ?? []).map((link, i) => (
          <Ledger key={i} id="fees" title={`Fees — ${link.profiles?.full_name}`} icon={Receipt}>
            <FeesLedger studentId={link.profiles?.id} profile={link.profiles} />
          </Ledger>
        ))}
    </div>
  );
}

function AccountView({ profile }) {
  return (
    <div className="max-w-md">
      <Ledger id="account" title="Account" icon={UserCircle2}>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">Name</p>
            <p className="text-[#1F2937]">{profile.full_name}</p>
          </div>
          {profile.reg_number ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-[#6B7280]">Registration number</p>
              <p className="text-[#1F2937]">{profile.reg_number}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-wide text-[#6B7280]">Email</p>
              <p className="text-[#1F2937]">{profile.email}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">Role</p>
            <p className="text-[#1F2937] capitalize">{profile.role}</p>
          </div>
        </div>
      </Ledger>
    </div>
  );
}

const SIDEBAR_ITEMS = {
  student: [
    { id: "personal-details", label: "Personal Details" },
    { id: "classes", label: "My Classes" },
    { id: "assignments", label: "Assignments" },
    { id: "grades", label: "Grades" },
    { id: "announcements", label: "Announcements" },
    { id: "fees", label: "Fees" },
  ],
  teacher: [
    { id: "classes", label: "My Classes" },
    { id: "roll", label: "Take Roll" },
    { id: "postgrades", label: "Post Grades" },
    { id: "announcements", label: "Announcements" },
  ],
  admin: [
    { id: "overview", label: "Overview" },
    { id: "manage", label: "Manage" },
    { id: "grant-admin", label: "Grant Admin Access" },
    { id: "current-admins", label: "Current Admins" },
    ...CLASS_LIST.map((name) => ({ id: name, label: name })),
  ],
  parent: [
    { id: "children", label: "Your Children" },
    { id: "announcements", label: "Announcements" },
    { id: "fees", label: "Fees" },
  ],
};

function Sidebar({ items, adminTab, onNavigate }) {
  return (
    <aside className="hidden md:block w-56 shrink-0 border-r border-[#EDEEF5] bg-white min-h-[calc(100vh-64px)]">
      <nav className="py-4">
        {items.map((item) => {
          const active = adminTab !== undefined ? adminTab === item.id : false;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-6 py-2.5 text-sm ${
                active ? "bg-[#E6F7EA] text-[#0B6B2B] font-medium border-r-2 border-[#0B6B2B]" : "text-[#374151] hover:bg-[#F1FBF3]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
        <button
          onClick={() => onNavigate("account")}
          className="w-full text-left px-6 py-2.5 text-sm text-[#374151] hover:bg-[#F1FBF3] border-t border-[#EDEEF5] mt-2 pt-3"
        >
          Account
        </button>
      </nav>
    </aside>
  );
}

function Banner({ firstName, roleLabel, items, onNavigate }) {
  return (
    <div className="relative bg-[#0B6B2B] px-6 md:px-10 pt-10 pb-14 overflow-hidden">
      <p className="text-[11px] uppercase tracking-[0.25em] text-[#D9F2C4]">{roleLabel}</p>
      <h2 className="text-2xl md:text-3xl font-semibold text-white mt-1">Hello, {firstName}.</h2>
      <p className="text-[#D9F2E1] mt-1 text-sm">Here's what's new.</p>

      <div className="mt-6 max-w-xl relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          disabled
          placeholder="Search coming soon…"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white text-sm text-gray-500 placeholder:text-gray-400"
        />
      </div>

      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="text-xs px-3 py-1.5 rounded-full bg-[#0F7D34] text-white hover:bg-[#332A78]"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <svg className="absolute left-0 right-0 bottom-0 w-full" height="24" viewBox="0 0 1440 24" preserveAspectRatio="none">
        <path d="M0,12 C240,24 480,0 720,12 C960,24 1200,0 1440,12 L1440,24 L0,24 Z" fill="#F5FAF6" />
      </svg>
    </div>
  );
}

function PortalShell() {
  const { profile, signOut } = useAuth();
  const [showAccount, setShowAccount] = useState(false);
  const [adminTab, setAdminTab] = useState("overview");
  const meta = ROLE_META[profile.role];
  const firstName = (profile.full_name ?? "").split(" ")[0] || "there";
  const items = SIDEBAR_ITEMS[profile.role] ?? [];
  const [activeSection, setActiveSection] = useState(items[0]?.id ?? "");

  const navigate = (id) => {
    if (id === "account") {
      setShowAccount(true);
      return;
    }
    setShowAccount(false);
    if (profile.role === "admin") {
      setAdminTab(id);
      return;
    }
    setActiveSection(id);
  };

  return (
    <div className="min-h-screen bg-[#F5FAF6] text-[#1F2937]" style={{ fontFamily: "'Inter', 'Space Grotesk', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <header className="bg-white border-b border-[#EDEEF5] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src={crest} alt={`${SCHOOL} crest`} className="h-9 w-9 rounded-full object-cover" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#E3A400] font-medium">{SCHOOL}</p>
            <h1 className="text-sm font-semibold text-[#0B6B2B]">{showAccount ? "Account" : `${meta?.label ?? "Portal"} Portal`}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Signed in as</p>
            <p className="text-sm font-medium text-[#0B6B2B]">{profile.full_name}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-[#0B6B2B] text-white flex items-center justify-center text-sm font-semibold">
            {(profile.full_name ?? "?").charAt(0).toUpperCase()}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[#EDEEF5] text-[#374151] hover:bg-[#F1FBF3]"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="flex">
        <Sidebar
          items={items}
          adminTab={profile.role === "admin" ? adminTab : activeSection}
          onNavigate={navigate}
        />

        <div className="flex-1 min-w-0">
          {!showAccount && (
            <Banner firstName={firstName} roleLabel={`${meta?.label ?? "Portal"} Portal`} items={items} onNavigate={navigate} />
          )}
          <main className="p-6 md:p-8 -mt-6">
            {showAccount ? (
              <AccountView profile={profile} />
            ) : profile.role === "student" ? (
              <StudentView profile={profile} activeSection={activeSection} />
            ) : profile.role === "teacher" ? (
              <TeacherView profile={profile} activeSection={activeSection} />
            ) : profile.role === "admin" ? (
              <AdminView tab={adminTab} setTab={setAdminTab} />
            ) : (
              <ParentView profile={profile} activeSection={activeSection} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SchoolPortal() {
  const { session, profile, loading, recoveryMode } = useAuth();

  if (recoveryMode) return <ResetPasswordScreen />;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5FAF6] flex items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading…</p>
      </div>
    );
  }
  if (!session) return <Login />;
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F5FAF6] flex items-center justify-center">
        <p className="text-sm text-[#DC2626]">Signed in, but no profile was found. Check the sign-up trigger in schema.sql ran correctly.</p>
      </div>
    );
  }
  return <PortalShell />;
}

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Small shared helper: run a query, track loading/error, expose a refetch.
function useQuery(fn, deps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    const { data, error } = await fn();
    if (error) setError(error.message);
    setData(data);
    setLoading(false);
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Quietly refresh whenever the person comes back to this tab — catches
  // changes made elsewhere (another admin, another tab, a student signing
  // up) without needing a manual page reload.
  useEffect(() => {
    const onFocus = () => run();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run };
}

export function useAnnouncements() {
  return useQuery(
    () =>
      supabase
        .from("announcements")
        .select("id, text, pinned, created_at, profiles(full_name)")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10),
    []
  );
}

export function useStudentData(studentId) {
  const enrollments = useQuery(
    () =>
      supabase
        .from("enrollments")
        .select("classes(id, name, room, period, time_range)")
        .eq("student_id", studentId),
    [studentId]
  );
  const assignments = useQuery(
    () =>
      supabase
        .from("assignments")
        .select("id, title, due_date, classes(name)")
        .in(
          "class_id",
          (enrollments.data ?? []).map((e) => e.classes?.id).filter(Boolean)
        )
        .order("due_date", { ascending: true }),
    [studentId, enrollments.data]
  );
  const grades = useQuery(
    () => supabase.from("grades").select("grade, classes(name)").eq("student_id", studentId),
    [studentId]
  );
  return { enrollments, assignments, grades };
}

export function useTeacherClasses(teacherId) {
  return useQuery(
    () =>
      supabase
        .from("classes")
        .select("id, name, room, period, enrollments(count)")
        .eq("teacher_id", teacherId),
    [teacherId]
  );
}

export function useRoster(classId) {
  return useQuery(
    () =>
      supabase
        .from("enrollments")
        .select("id, profiles(id, full_name)")
        .eq("class_id", classId),
    [classId]
  );
}

export async function recordAttendance(classId, studentId, present) {
  return supabase
    .from("attendance")
    .upsert(
      { class_id: classId, student_id: studentId, date: new Date().toISOString().slice(0, 10), present },
      { onConflict: "class_id,student_id,date" }
    );
}

function useCount(fn, deps) {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    const { count, error } = await fn();
    if (error) setError(error.message);
    setCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const onFocus = () => run();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { count, loading, error, refetch: run };
}

export function useAdminStats() {
  const students = useCount(() => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"), []);
  const staff = useCount(() => supabase.from("profiles").select("id", { count: "exact", head: true }).in("role", ["teacher", "admin"]), []);
  const staffDirectory = useQuery(() => supabase.from("profiles").select("full_name, role").in("role", ["teacher", "admin"]), []);
  return { students, staff, staffDirectory };
}

export function useGenderCounts() {
  return useQuery(() => supabase.from("student_details").select("gender"), []);
}

export function useProfile(id) {
  return useQuery(
    () => supabase.from("profiles").select("id, full_name, reg_number, role, photo_url").eq("id", id).maybeSingle(),
    [id]
  );
}

export async function uploadPhotoId(userId, file) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/photo.${ext}`;
  const uploaded = await supabase.storage.from("photo-ids").upload(path, file, { upsert: true });
  if (uploaded.error) return uploaded;
  const { data } = supabase.storage.from("photo-ids").getPublicUrl(path);
  // Cache-bust so a re-uploaded photo shows immediately instead of an old
  // cached image at the same URL.
  const url = `${data.publicUrl}?t=${Date.now()}`;
  return supabase.from("profiles").update({ photo_url: url }).eq("id", userId);
}

export function useParentChildren(parentId) {
  return useQuery(
    () => supabase.from("parent_links").select("profiles!parent_links_student_id_fkey(id, full_name, reg_number)").eq("parent_id", parentId),
    [parentId]
  );
}

// ---- Admin management: lists for dropdowns, and write actions ----

export function useProfilesByRole(role) {
  return useQuery(
    () => supabase.from("profiles").select("id, full_name, reg_number").eq("role", role).order("full_name"),
    [role]
  );
}

export function useAllClasses() {
  return useQuery(
    () => supabase.from("classes").select("id, name, room, period, time_range, profiles(full_name)").order("name"),
    []
  );
}

export async function createClass({ name, teacherId, room, period, timeRange }) {
  return supabase.from("classes").insert({
    name,
    teacher_id: teacherId || null,
    room,
    period,
    time_range: timeRange,
  });
}

export async function enrollStudent({ classId, studentId }) {
  return supabase.from("enrollments").insert({ class_id: classId, student_id: studentId });
}

export async function linkParentToStudent({ parentId, studentId }) {
  return supabase.from("parent_links").insert({ parent_id: parentId, student_id: studentId });
}

export async function postAnnouncement({ authorId, text, pinned }) {
  return supabase.from("announcements").insert({ author_id: authorId, text, pinned });
}

export async function deleteAnnouncement(id) {
  return supabase.from("announcements").delete().eq("id", id);
}

export async function updateClass({ id, name, teacherId, room, period, timeRange }) {
  return supabase
    .from("classes")
    .update({ name, teacher_id: teacherId || null, room, period, time_range: timeRange })
    .eq("id", id);
}

export async function deleteClass(id) {
  return supabase.from("classes").delete().eq("id", id);
}

export async function deleteEnrollment(enrollmentId) {
  return supabase.from("enrollments").delete().eq("id", enrollmentId);
}

export async function deleteGrade({ studentId, classId }) {
  return supabase.from("grades").delete().eq("student_id", studentId).eq("class_id", classId);
}

export async function postGrade({ studentId, classId, grade }) {
  return supabase
    .from("grades")
    .upsert(
      { student_id: studentId, class_id: classId, grade, updated_at: new Date().toISOString() },
      { onConflict: "student_id,class_id" }
    );
}

// ---- Registration numbers (admin-issued, for student sign-up) ----

export function useRegistrationCodes() {
  return useQuery(
    () => supabase.from("registration_codes").select("code, used, created_at, first_name, surname, class").order("created_at", { ascending: false }),
    []
  );
}

export async function addRegistrationCodes(codes) {
  const rows = codes.map((code) => ({ code: code.trim() })).filter((r) => r.code);
  return supabase.from("registration_codes").insert(rows);
}

export async function enrollStudentWithCode(code, details) {
  return supabase.from("registration_codes").insert({ code: code.trim(), ...details });
}

export async function deleteRegistrationCode(code) {
  return supabase.from("registration_codes").delete().eq("code", code);
}

// ---- Granting admin access (existing admin only, via RLS) ----

export function useStaffAndParents() {
  return useQuery(
    () =>
      supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("role", ["teacher", "parent"])
        .order("full_name"),
    []
  );
}

export async function promoteToAdmin(userId) {
  return supabase.from("profiles").update({ role: "admin" }).eq("id", userId);
}

export function useAdmins() {
  return useQuery(
    () => supabase.from("profiles").select("id, full_name, email").eq("role", "admin").order("full_name"),
    []
  );
}

export async function demoteAdmin(userId, newRole) {
  return supabase.from("profiles").update({ role: newRole }).eq("id", userId);
}

// ---- Fee bills ----

export function useStudentBills(studentId) {
  return useQuery(
    () =>
      supabase
        .from("fee_bills")
        .select("id, session, description, amount, amount_paid, due_date, paid, paid_at")
        .eq("student_id", studentId)
        .order("due_date", { ascending: true }),
    [studentId]
  );
}

export async function postBill({ studentId, session, description, amount, dueDate }) {
  return supabase.from("fee_bills").insert({
    student_id: studentId,
    session,
    description,
    amount,
    due_date: dueDate || null,
  });
}

export async function editBill(billId, fields) {
  return supabase.from("fee_bills").update(fields).eq("id", billId);
}

export async function recordPayment(bill, amountToAdd) {
  const newAmountPaid = Number(bill.amount_paid ?? 0) + Number(amountToAdd);
  const paid = newAmountPaid >= Number(bill.amount);
  return supabase.from("fee_bills").update({ amount_paid: newAmountPaid, paid, paid_at: paid ? new Date().toISOString() : null }).eq("id", bill.id);
}

export async function setBillPaid(billId, paid) {
  return supabase
    .from("fee_bills")
    .update({ paid, paid_at: paid ? new Date().toISOString() : null })
    .eq("id", billId);
}

export async function deleteBill(billId) {
  return supabase.from("fee_bills").delete().eq("id", billId);
}

// ---- Parent-student link management ----

export function useParentLinksList() {
  return useQuery(
    () =>
      supabase
        .from("parent_links")
        .select("id, parent_id, parent:profiles!parent_links_parent_id_fkey(full_name), student:profiles!parent_links_student_id_fkey(full_name)"),
    []
  );
}

export async function unlinkParentStudent(linkId) {
  return supabase.from("parent_links").delete().eq("id", linkId);
}

export async function updateParentLink(linkId, newParentId) {
  return supabase.from("parent_links").update({ parent_id: newParentId }).eq("id", linkId);
}

// ---- Removing a staff member who's no longer with the school ----

export async function removeStaffMember(profileId) {
  // Unassign their classes first, since classes.teacher_id can't point at a
  // deleted profile.
  const unassign = await supabase.from("classes").update({ teacher_id: null }).eq("teacher_id", profileId);
  if (unassign.error) return unassign;
  return supabase.from("profiles").delete().eq("id", profileId);
}

// ---- Student personal details (admin-managed) ----

export function useStudentDetails(studentId) {
  return useQuery(
    () => supabase.from("student_details").select("*").eq("student_id", studentId).maybeSingle(),
    [studentId]
  );
}

export async function saveStudentDetails(studentId, fields) {
  return supabase
    .from("student_details")
    .upsert({ student_id: studentId, ...fields, updated_at: new Date().toISOString() }, { onConflict: "student_id" });
}

// ---- Editing or removing a student's own account/record (admin only) ----

export async function updateRegNumber(studentId, newRegNumber) {
  return supabase.from("profiles").update({ reg_number: newRegNumber.trim() }).eq("id", studentId);
}

export async function deleteStudentRecord(studentId) {
  // Cascades to student_details, grades, attendance, fee_bills, enrollments,
  // and parent_links automatically, since those all reference this row with
  // ON DELETE CASCADE. Their login itself stays in Supabase's Authentication
  // system until removed there separately.
  return supabase.from("profiles").delete().eq("id", studentId);
}

// ---- Subjects per class, and term-based subject grades (admin-managed) ----

export function useClassSubjects(className) {
  return useQuery(
    () => supabase.from("class_subjects").select("id, subject").eq("class_name", className).order("subject"),
    [className]
  );
}

export async function addClassSubject(className, subject) {
  return supabase.from("class_subjects").insert({ class_name: className, subject: subject.trim() });
}

export async function renameClassSubject(id, subject) {
  return supabase.from("class_subjects").update({ subject: subject.trim() }).eq("id", id);
}

export async function deleteClassSubject(id) {
  return supabase.from("class_subjects").delete().eq("id", id);
}

export function useStudentTermGrades(studentId, term, className) {
  return useQuery(
    () =>
      supabase
        .from("subject_grades")
        .select("id, subject, grade, class_name, academic_year, updated_at")
        .eq("student_id", studentId)
        .eq("term", term)
        .eq("class_name", className)
        .order("subject"),
    [studentId, term, className]
  );
}

export function useAllStudentGrades(studentId) {
  return useQuery(
    () =>
      supabase
        .from("subject_grades")
        .select("id, term, subject, grade, class_name, academic_year")
        .eq("student_id", studentId)
        .order("term")
        .order("subject"),
    [studentId]
  );
}

export async function saveSubjectGrade({ studentId, className, term, subject, grade, academicYear }) {
  return supabase.from("subject_grades").upsert(
    {
      student_id: studentId,
      class_name: className,
      term,
      subject,
      grade,
      academic_year: academicYear || "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,class_name,term,subject" }
  );
}

export async function deleteSubjectGrade(id) {
  return supabase.from("subject_grades").delete().eq("id", id);
}

export function useStudentsByClass(className) {
  return useQuery(
    () =>
      supabase
        .from("student_details")
        .select("student_id, first_name, surname, gender, date_of_birth, hometown, father_name, father_phone, mother_name, mother_phone, profiles(full_name, reg_number)")
        .eq("class", className)
        .order("surname", { ascending: true }),
    [className]
  );
}

// Students an admin has already enrolled (with a registration number
// waiting to be handed out) but who haven't signed up for an account yet.
export function useUnclaimedByClass(className) {
  return useQuery(
    () =>
      supabase
        .from("registration_codes")
        .select("code, first_name, middle_name, surname, gender, date_of_birth, hometown, father_name, father_phone, mother_name, mother_phone, created_at")
        .eq("class", className)
        .eq("used", false)
        .order("surname", { ascending: true }),
    [className]
  );
}

export function useParentsOfStudent(studentId) {
  return useQuery(
    () =>
      supabase
        .from("parent_links")
        .select("id, profiles!parent_links_parent_id_fkey(id, full_name, email)")
        .eq("student_id", studentId),
    [studentId]
  );
}

export function useStudentFeeSummary(studentId) {
  return useQuery(
    () => supabase.from("fee_bills").select("amount, amount_paid").eq("student_id", studentId),
    [studentId]
  );
}

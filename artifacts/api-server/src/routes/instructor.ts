import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  moduleSettingsTable,
  moduleExtensionsTable,
  moduleSubmissionsTable,
} from "@workspace/db/schema";
import { and, eq, or, ilike } from "drizzle-orm";
import {
  GetGradebookResponse as GradebookDataSchema,
  GetSettingsResponse as SettingsDataSchema,
  UpdateModuleWindowsResponse as MessageResponseSchema,
} from "@workspace/api-zod";

const ErrorResponseSchema = { parse: (v: any) => v };

const router: IRouter = Router();

function requireInstructor(req: Request, res: Response, next: () => void) {
  if (!req.session.userId) {
    return res.status(401).json(ErrorResponseSchema.parse({ error: "Not authenticated" }));
  }
  if (req.session.userRole !== "instructor") {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "Instructor access only" }));
  }
  next();
}

router.get("/gradebook", requireInstructor, async (req: Request, res: Response) => {
  const search = (req.query.search as string)?.trim() ?? "";
  const section = (req.query.section as string)?.trim() ?? "";

  let students = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      studentId: usersTable.studentId,
      section: usersTable.section,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  if (search) {
    students = students.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId.toLowerCase().includes(search.toLowerCase()),
    );
  }

  if (section) {
    students = students.filter((s) => s.section === section);
  }

  const allSubmissions = await db.select().from(moduleSubmissionsTable);

  const rows = students.map((student) => {
    const subs = allSubmissions.filter((s) => s.userId === student.id);
    const m1 = subs.find((s) => s.moduleKey === "M1");
    const m2 = subs.find((s) => s.moduleKey === "M2");
    const m3 = subs.find((s) => s.moduleKey === "M3");

    const m1Score = m1?.score ?? 0;
    const m2Score = m2?.score ?? 0;
    const m3Score = m3?.score ?? 0;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      section: student.section ?? "",
      m1Score,
      m1Submitted: m1?.submittedAt?.toISOString() ?? null,
      m2Score,
      m2Submitted: m2?.submittedAt?.toISOString() ?? null,
      m3Score,
      m3Submitted: m3?.submittedAt?.toISOString() ?? null,
      total: m1Score + m2Score + m3Score,
    };
  });

  const allStudents = await db
    .select({ section: usersTable.section })
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  const sections = [
    ...new Set(allStudents.map((s) => s.section).filter(Boolean) as string[]),
  ].sort();

  return res.json(
    GradebookDataSchema.parse({
      students: rows,
      sections,
      totalStudents: rows.length,
    }),
  );
});

router.get("/gradebook/export", requireInstructor, async (req: Request, res: Response) => {
  const students = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  const allSubmissions = await db.select().from(moduleSubmissionsTable);

  const lines: string[] = [
    "Name,Email,Student_ID,Section,M1_Score,M1_Submitted,M2_Score,M2_Submitted,M3_Score,M3_Submitted,Total_Points",
  ];

  for (const student of students) {
    const subs = allSubmissions.filter((s) => s.userId === student.id);
    const m1 = subs.find((s) => s.moduleKey === "M1");
    const m2 = subs.find((s) => s.moduleKey === "M2");
    const m3 = subs.find((s) => s.moduleKey === "M3");
    const m1Score = m1?.score ?? 0;
    const m2Score = m2?.score ?? 0;
    const m3Score = m3?.score ?? 0;
    lines.push(
      [
        student.name,
        student.email,
        student.studentId,
        student.section ?? "",
        m1Score,
        m1?.submittedAt?.toISOString() ?? "",
        m2Score,
        m2?.submittedAt?.toISOString() ?? "",
        m3Score,
        m3?.submittedAt?.toISOString() ?? "",
        m1Score + m2Score + m3Score,
      ].join(","),
    );
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=gradebook.csv");
  return res.send(lines.join("\n"));
});

router.get("/settings", requireInstructor, async (req: Request, res: Response) => {
  const windows = await db.select().from(moduleSettingsTable);
  const extensions = await db
    .select({
      id: moduleExtensionsTable.id,
      studentName: usersTable.name,
      studentId: usersTable.studentId,
      moduleKey: moduleExtensionsTable.moduleKey,
      extendedEnd: moduleExtensionsTable.extendedEndAt,
      note: moduleExtensionsTable.note,
    })
    .from(moduleExtensionsTable)
    .innerJoin(usersTable, eq(moduleExtensionsTable.userId, usersTable.id));

  return res.json(
    SettingsDataSchema.parse({
      windows: windows.map((w) => ({
        moduleKey: w.moduleKey,
        title: w.title,
        startAt: w.startAt.toISOString(),
        endAt: w.endAt.toISOString(),
        isEnabled: w.isEnabled,
      })),
      extensions: extensions.map((e) => ({
        id: e.id,
        studentName: e.studentName,
        studentId: e.studentId,
        moduleKey: e.moduleKey,
        extendedEnd: e.extendedEnd.toISOString(),
        note: e.note ?? "",
      })),
    }),
  );
});

router.put("/settings/windows", requireInstructor, async (req: Request, res: Response) => {
  const { windows } = req.body as {
    windows: Array<{
      moduleKey: string;
      startAt: string;
      endAt: string;
      isEnabled: boolean;
    }>;
  };

  if (!Array.isArray(windows)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid data" }));
  }

  for (const w of windows) {
    if (!["M1", "M2", "M3"].includes(w.moduleKey)) continue;
    await db
      .update(moduleSettingsTable)
      .set({
        startAt: new Date(w.startAt),
        endAt: new Date(w.endAt),
        isEnabled: w.isEnabled,
        updatedAt: new Date(),
      })
      .where(
        eq(moduleSettingsTable.moduleKey, w.moduleKey as "M1" | "M2" | "M3"),
      );
  }

  return res.json(MessageResponseSchema.parse({ message: "Module windows updated" }));
});

router.post("/extensions", requireInstructor, async (req: Request, res: Response) => {
  const { studentId, moduleKey, extendedEnd, note } = req.body;

  if (!studentId || !moduleKey || !extendedEnd) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Missing required fields" }));
  }

  if (!["M1", "M2", "M3"].includes(moduleKey)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid module key" }));
  }

  const [student] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.studentId, studentId), eq(usersTable.role, "student")))
    .limit(1);

  if (!student) {
    return res.status(404).json(ErrorResponseSchema.parse({ error: "Student not found" }));
  }

  await db
    .insert(moduleExtensionsTable)
    .values({
      userId: student.id,
      moduleKey: moduleKey as "M1" | "M2" | "M3",
      extendedEndAt: new Date(extendedEnd),
      note: note ?? null,
    })
    .onConflictDoUpdate({
      target: [moduleExtensionsTable.userId, moduleExtensionsTable.moduleKey],
      set: {
        extendedEndAt: new Date(extendedEnd),
        note: note ?? null,
        createdAt: new Date(),
      },
    });

  return res.json(
    MessageResponseSchema.parse({ message: `Extension added for student ${studentId}` }),
  );
});

router.delete("/extensions/:extensionId", requireInstructor, async (req: Request, res: Response) => {
  const id = parseInt(req.params.extensionId, 10);

  if (isNaN(id)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid extension ID" }));
  }

  await db
    .delete(moduleExtensionsTable)
    .where(eq(moduleExtensionsTable.id, id));

  return res.json(MessageResponseSchema.parse({ message: "Extension removed" }));
});

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  moduleSettingsTable,
  moduleExtensionsTable,
  moduleSubmissionsTable,
  simulationRunsTable,
  configTable,
} from "@workspace/db/schema";
import { and, eq, or, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { mkdirSync } from "fs";
import {
  GetGradebookResponse as GradebookDataSchema,
  GetSettingsResponse as SettingsDataSchema,
  UpdateModuleWindowsResponse as MessageResponseSchema,
  GetInstructorAnalyticsResponse as AnalyticsDataSchema,
} from "@workspace/api-zod";

const ErrorResponseSchema = { parse: (v: any) => v };

const router: IRouter = Router();

const uploadsDir = path.resolve(process.cwd(), "artifacts/api-server/public/uploads");
mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

function requireInstructor(req: Request, res: Response, next: () => void) {
  if (!req.session.userId) {
    return res.status(401).json(ErrorResponseSchema.parse({ error: "Not authenticated" }));
  }
  if (req.session.userRole !== "instructor") {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "Instructor access only" }));
  }
  return next();
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
  const allRuns = await db.select().from(simulationRunsTable);

  function getModuleStatus(userId: number, moduleKey: string, submissions: typeof allSubmissions, runs: typeof allRuns): "not_started" | "in_progress" | "submitted" {
    const sub = submissions.find((s) => s.userId === userId && s.moduleKey === moduleKey);
    if (sub?.submittedAt) return "submitted";
    const hasRuns = runs.some((r) => r.userId === userId && r.moduleKey === moduleKey);
    if (hasRuns) return "in_progress";
    return "not_started";
  }

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
      m1Status: getModuleStatus(student.id, "M1", allSubmissions, allRuns),
      m2Status: getModuleStatus(student.id, "M2", allSubmissions, allRuns),
      m3Status: getModuleStatus(student.id, "M3", allSubmissions, allRuns),
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

router.get("/analytics", requireInstructor, async (req: Request, res: Response) => {
  const allStudents = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  const totalStudents = allStudents.length;

  const allSubmissions = await db.select().from(moduleSubmissionsTable);
  const allRuns = await db.select().from(simulationRunsTable);

  const moduleKeys = ["M1", "M2", "M3"] as const;

  const moduleCompletion = moduleKeys.map((moduleKey) => {
    let notStarted = 0;
    let inProgress = 0;
    let submitted = 0;

    for (const student of allStudents) {
      const sub = allSubmissions.find(
        (s) => s.userId === student.id && s.moduleKey === moduleKey,
      );
      if (sub?.submittedAt) {
        submitted++;
      } else {
        const hasRuns = allRuns.some(
          (r) => r.userId === student.id && r.moduleKey === moduleKey,
        );
        if (hasRuns) {
          inProgress++;
        } else {
          notStarted++;
        }
      }
    }

    return { moduleKey, notStarted, inProgress, submitted };
  });

  let fullyComplete = 0;
  let totalScoreSum = 0;
  let scoredStudentCount = 0;

  function letterGrade(total: number): string {
    const pct = (total / 165) * 100;
    if (pct >= 90) return "A";
    if (pct >= 80) return "B";
    if (pct >= 70) return "C";
    if (pct >= 60) return "D";
    return "F";
  }

  const gradeBuckets: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };

  for (const student of allStudents) {
    const studentSubs = allSubmissions.filter((s) => s.userId === student.id);
    const hasAllThree = moduleKeys.every((mk) =>
      studentSubs.some((s) => s.moduleKey === mk && s.submittedAt),
    );
    if (hasAllThree) {
      fullyComplete++;

      const m1Score =
        studentSubs.find((s) => s.moduleKey === "M1")?.score ?? 0;
      const m2Score =
        studentSubs.find((s) => s.moduleKey === "M2")?.score ?? 0;
      const m3Score =
        studentSubs.find((s) => s.moduleKey === "M3")?.score ?? 0;
      const studentTotal = m1Score + m2Score + m3Score;

      totalScoreSum += studentTotal;
      scoredStudentCount++;

      const grade = letterGrade(studentTotal);
      gradeBuckets[grade]++;
    }
  }

  const completionRate =
    totalStudents > 0 ? (fullyComplete / totalStudents) * 100 : 0;
  const avgTotalScore =
    scoredStudentCount > 0 ? totalScoreSum / scoredStudentCount : 0;

  const gradeDistribution = ["A", "B", "C", "D", "F"].map((grade) => ({
    grade,
    count: gradeBuckets[grade],
  }));

  return res.json(
    AnalyticsDataSchema.parse({
      totalStudents,
      completionRate: Math.round(completionRate * 10) / 10,
      avgTotalScore: Math.round(avgTotalScore * 10) / 10,
      moduleCompletion,
      gradeDistribution,
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
  const id = parseInt(req.params.extensionId as string, 10);

  if (isNaN(id)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid extension ID" }));
  }

  await db
    .delete(moduleExtensionsTable)
    .where(eq(moduleExtensionsTable.id, id));

  return res.json(MessageResponseSchema.parse({ message: "Extension removed" }));
});

router.delete("/students/:userId", requireInstructor, async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId as string, 10);

  if (isNaN(userId)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid user ID" }));
  }

  const [target] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!target) {
    return res.status(404).json(ErrorResponseSchema.parse({ error: "User not found" }));
  }

  if (target.role !== "student") {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "Cannot remove instructor accounts" }));
  }

  await db.transaction(async (tx) => {
    await tx.delete(simulationRunsTable).where(eq(simulationRunsTable.userId, userId));
    await tx.delete(moduleSubmissionsTable).where(eq(moduleSubmissionsTable.userId, userId));
    await tx.delete(moduleExtensionsTable).where(eq(moduleExtensionsTable.userId, userId));
    await tx.delete(usersTable).where(eq(usersTable.id, userId));
  });

  return res.status(204).send();
});

router.post("/students/:userId/reset-password", requireInstructor, async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId as string, 10);

  if (isNaN(userId)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid user ID" }));
  }

  const rawPassword = (req.body as { newPassword?: string }).newPassword ?? "";
  const newPassword = rawPassword.trim();
  if (newPassword.length < 1) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "New password is required" }));
  }

  const [target] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!target) {
    return res.status(404).json(ErrorResponseSchema.parse({ error: "User not found" }));
  }

  if (target.role !== "student") {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "Cannot reset instructor passwords" }));
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, userId));

  return res.json(MessageResponseSchema.parse({ message: "Password reset successfully" }));
});

router.get("/instructors", requireInstructor, async (req: Request, res: Response) => {
  const instructors = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      studentId: usersTable.studentId,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "instructor"))
    .orderBy(usersTable.createdAt);

  return res.json({
    instructors: instructors.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    })),
  });
});

router.post("/instructors", requireInstructor, async (req: Request, res: Response) => {
  const { name, email, studentId, password } = req.body as {
    name?: string;
    email?: string;
    studentId?: string;
    password?: string;
  };

  if (!name?.trim() || !email?.trim() || !studentId?.trim() || !password?.trim()) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "All fields are required" }));
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(or(eq(usersTable.email, normalizedEmail), eq(usersTable.studentId, studentId.trim())))
    .limit(1);

  if (existing) {
    return res.status(409).json(ErrorResponseSchema.parse({ error: "Email or username already in use" }));
  }

  const passwordHash = await bcrypt.hash(password.trim(), 10);

  const [created] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      email: normalizedEmail,
      studentId: studentId.trim(),
      role: "instructor",
      passwordHash,
    })
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      studentId: usersTable.studentId,
      createdAt: usersTable.createdAt,
    });

  return res.status(201).json({
    instructor: { ...created, createdAt: created.createdAt.toISOString() },
  });
});

router.delete("/instructors/:id", requireInstructor, async (req: Request, res: Response) => {
  const targetId = parseInt(req.params.id as string, 10);

  if (isNaN(targetId)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid instructor ID" }));
  }

  if (targetId === req.session.userId) {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "You cannot remove your own account" }));
  }

  const [target] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, targetId))
    .limit(1);

  if (!target) {
    return res.status(404).json(ErrorResponseSchema.parse({ error: "Instructor not found" }));
  }

  if (target.role !== "instructor") {
    return res.status(403).json(ErrorResponseSchema.parse({ error: "Can only remove instructor accounts from this endpoint" }));
  }

  await db.delete(usersTable).where(eq(usersTable.id, targetId));

  return res.status(204).send();
});

router.delete("/submissions/:userId/:moduleKey", requireInstructor, async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId as string, 10);
  const moduleKey = req.params.moduleKey as string;

  if (isNaN(userId)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid user ID" }));
  }

  if (!["M1", "M2", "M3"].includes(moduleKey)) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid module key" }));
  }

  const [student] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), eq(usersTable.role, "student")))
    .limit(1);

  if (!student) {
    return res.status(404).json(ErrorResponseSchema.parse({ error: "Student not found" }));
  }

  await db
    .delete(moduleSubmissionsTable)
    .where(
      and(
        eq(moduleSubmissionsTable.userId, userId),
        eq(moduleSubmissionsTable.moduleKey, moduleKey as "M1" | "M2" | "M3"),
      ),
    );

  return res.json(MessageResponseSchema.parse({ message: "Submission reset successfully" }));
});

router.get("/disruption-config", requireInstructor, async (_req: Request, res: Response) => {
  const [row] = await db.select().from(configTable).where(eq(configTable.key, "disruption_config")).limit(1);
  const cfg = row ? JSON.parse(row.value) : { M2: "none", M3: "none" };
  return res.json(cfg);
});

router.put("/disruption-config", requireInstructor, async (req: Request, res: Response) => {
  const cfg = req.body ?? {};
  await db
    .insert(configTable)
    .values({ key: "disruption_config", value: JSON.stringify(cfg) })
    .onConflictDoUpdate({ target: configTable.key, set: { value: JSON.stringify(cfg) } });
  return res.json({ message: "Disruption config updated" });
});

router.get("/image-config", requireInstructor, async (_req: Request, res: Response) => {
  const [row] = await db.select().from(configTable).where(eq(configTable.key, "image_config")).limit(1);
  const overrides = row ? JSON.parse(row.value) : {};
  return res.json(overrides);
});

router.put("/image-config", requireInstructor, async (req: Request, res: Response) => {
  const overrides = req.body ?? {};
  await db
    .insert(configTable)
    .values({ key: "image_config", value: JSON.stringify(overrides) })
    .onConflictDoUpdate({ target: configTable.key, set: { value: JSON.stringify(overrides) } });
  return res.json({ message: "Image config updated" });
});

router.post(
  "/upload-image",
  requireInstructor,
  upload.single("image"),
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file received" });
    }
    const url = `/api/uploads/${req.file.filename}`;
    return res.json({ url });
  },
);

export default router;

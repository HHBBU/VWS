import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  RegisterUserBody as RegisterRequestSchema,
  LoginUserBody as LoginRequestSchema,
  LoginUserResponse as AuthResponseSchema,
  GetCurrentUserResponse as UserProfileSchema,
  LogoutUserResponse as MessageResponseSchema,
} from "@workspace/api-zod";

const ErrorResponseSchema = { parse: (v: any) => v };

const router: IRouter = Router();

declare module "express-session" {
  interface SessionData {
    userId: number;
    userRole: string;
    userName: string;
  }
}

router.post("/register", async (req: Request, res: Response) => {
  const parsed = RegisterRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid request data" }));
  }

  const { name, email, studentId, password, confirmPassword, section } = parsed.data;

  if (!email.toLowerCase().endsWith(".edu")) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Email must end with .edu" }));
  }

  if (password !== confirmPassword) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Passwords do not match" }));
  }

  if (password.length < 8) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Password must be at least 8 characters" }));
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(usersTable)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        studentId: studentId.trim(),
        section: section?.trim() || null,
        role: "student",
        passwordHash,
      })
      .returning();

    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;

    return res.status(201).json(
      AuthResponseSchema.parse({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          section: user.section,
          role: user.role,
        },
        message: "Account created successfully",
      }),
    );
  } catch (err: any) {
    const msg = err?.message?.toLowerCase() ?? "";
    if (msg.includes("unique") && msg.includes("email")) {
      return res.status(400).json(ErrorResponseSchema.parse({ error: "Email already registered" }));
    }
    if (msg.includes("unique") && msg.includes("student_id")) {
      return res.status(400).json(ErrorResponseSchema.parse({ error: "Student ID already registered" }));
    }
    return res.status(500).json(ErrorResponseSchema.parse({ error: "Registration failed" }));
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = LoginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(ErrorResponseSchema.parse({ error: "Invalid request data" }));
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.trim().toLowerCase()))
    .limit(1);

  if (!user) {
    return res.status(401).json(ErrorResponseSchema.parse({ error: "Invalid email or password" }));
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json(ErrorResponseSchema.parse({ error: "Invalid email or password" }));
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.userName = user.name;

  return res.json(
    AuthResponseSchema.parse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        section: user.section,
        role: user.role,
      },
      message: "Login successful",
    }),
  );
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {});
  return res.json(MessageResponseSchema.parse({ message: "Logged out successfully" }));
});

router.get("/me", async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json(ErrorResponseSchema.parse({ error: "Not authenticated" }));
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId))
    .limit(1);

  if (!user) {
    return res.status(401).json(ErrorResponseSchema.parse({ error: "User not found" }));
  }

  return res.json(
    UserProfileSchema.parse({
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      section: user.section,
      role: user.role,
    }),
  );
});

export default router;

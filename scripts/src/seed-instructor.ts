import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const EMAIL = "huvet@ggc.edu";
const PASSWORD = "Beyza2015";
const NAME = "Prof. Hasan Uvet";
const STUDENT_ID = "INSTRUCTOR_HUVET";

async function main() {
  const [existing] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, EMAIL))
    .limit(1);

  if (existing) {
    console.log(`Already exists: ${EMAIL} (id=${existing.id})`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const [created] = await db
    .insert(usersTable)
    .values({
      name: NAME,
      email: EMAIL,
      studentId: STUDENT_ID,
      role: "instructor",
      passwordHash,
    })
    .returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });

  console.log(`Instructor account created: ${created.email} (id=${created.id}, role=${created.role})`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err?.message ?? err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Entry point: node scripts/seed-instructor.js
 *
 * Thin launcher — canonical logic lives in scripts/src/seed-instructor.ts,
 * which uses @workspace/db and bcryptjs.
 */
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const dir = dirname(fileURLToPath(import.meta.url));
const tsx = join(dir, "node_modules", ".bin", "tsx");
const script = join(dir, "src", "seed-instructor.ts");

const result = spawnSync(tsx, [script], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 0);

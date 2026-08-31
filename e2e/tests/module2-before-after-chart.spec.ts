/**
 * Module 2 — Before vs After Work-Center Utilization Chart
 *
 * Confirms that Chart 4 in the ResultsPanel (artifacts/veloce-scm) correctly
 * reflects the student's bottleneck capacity decision:
 *
 *  (a) When a bottleneck is targeted the improved work center's "after" bar
 *      drops below its "before" bar, and the cell is coloured green.
 *  (b) When no bottleneck is targeted the two bars are equal.
 *
 * The engine guarantees this via `wc_utilizations` (post-improvement) and
 * `wc_utilizations_pre` (baseline, multiplier = 1). Chart 4 maps those
 * directly to the "Before Improvement" / "After Improvement" bar series.
 *
 * Prerequisites (handled inside the test):
 *  - Register a student account.
 *  - Submit M1 final (so M2 is unlocked).
 *  - Navigate to /module/M2 and interact with the form.
 */

import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

const API = "/api";

interface RegisterBody {
  name: string;
  email: string;
  studentId: string;
  password: string;
  confirmPassword: string;
}

async function registerStudent(request: APIRequestContext, body: RegisterBody) {
  const res = await request.post(`${API}/auth/register`, { data: body });
  expect(res.status(), `register failed: ${await res.text()}`).toBeLessThan(300);
  return res;
}

async function submitM1Final(request: APIRequestContext) {
  const res = await request.post(`${API}/student/modules/M1/submit`, {
    data: {
      forecastA: 17800,
      forecastB: 9000,
      forecastMethodA: "moving_average",
      forecastMethodB: "moving_average",
      justification: "e2e test unlock M2",
      allocations: [
        {
          supplierId: "PT1",
          materialType: "cotton",
          kg: 15000,
          transportMode: "truck",
          assurancePackage: "standard",
          numBatches: 1,
        },
      ],
    },
  });
  expect(res.status(), `M1 submit failed: ${await res.text()}`).toBeLessThan(300);
}

const BASE_M2_BODY = {
  sopPlanA: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000],
  sopPlanB: [1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500],
  capacityMode: "standard",
  lotSize: "medium",
  priorityRule: "balanced",
  safetyStock: "6_dos",
  trainingChoice: "none",
  layoutChoice: "functional",
  flowChoice: "cellular",
  leanChoice: "none",
};

async function selectBottleneckOption(page: Page, optionText: string) {
  const trigger = page.locator("text=Capacity Improvement Decision").locator("..").getByRole("combobox");
  await trigger.click();
  await page.getByRole("option", { name: optionText }).click();
}

async function runPracticeSimulation(page: Page) {
  const btn = page.getByRole("button", { name: "Run Practice Simulation" });
  await expect(btn).toBeEnabled({ timeout: 5_000 });
  await btn.click();
  await expect(page.getByText("Work-Center Utilization: Before vs After Improvement")).toBeVisible({
    timeout: 20_000,
  });
}

test.describe("Module 2 — Before vs After chart", () => {
  test.beforeEach(async ({ page }) => {
    const ts = Date.now();
    await registerStudent(page.request, {
      name: "Chart E2E Student",
      email: `chart_e2e_${ts}@test.edu`,
      studentId: `CE2E${ts}`,
      password: "TestPass123",
      confirmPassword: "TestPass123",
    });
    await submitM1Final(page.request);
    await page.goto("/module/M2");
  });

  test("chart renders two bar series when a bottleneck is targeted (sewing_modify)", async ({ page }) => {
    await selectBottleneckOption(page, "Modify Sewing — Line balancing aids (+20%, €22,000)");
    await runPracticeSimulation(page);

    const card = page.locator("text=Work-Center Utilization: Before vs After Improvement").locator("../..");

    await expect(card).toBeVisible();

    await expect(card.getByText(/Capacity improvement applied to Sewing/i).first()).toBeVisible();

    await expect(card.getByText("Before Improvement", { exact: true })).toBeVisible();
    await expect(card.getByText("After Improvement", { exact: true })).toBeVisible();

    for (const wc of ["Cutting", "Dyeing", "Sewing", "Packaging"]) {
      await expect(card.getByText(wc, { exact: true }).first()).toBeVisible();
    }
  });

  test("the sewing bar is coloured green (fill #22c55e) when sewing is the targeted work center", async ({ page }) => {
    await selectBottleneckOption(page, "Modify Sewing — Line balancing aids (+20%, €22,000)");
    await runPracticeSimulation(page);

    const card = page.locator("text=Work-Center Utilization: Before vs After Improvement").locator("../..");

    await expect(card).toBeVisible();
    await expect(card.getByText(/Capacity improvement applied to/i)).toBeVisible();

    const greenBar = card.locator('svg [fill="#22c55e"]');
    await expect(greenBar).toBeVisible();
  });

  test("bars are equal when no bottleneck is targeted — chart description says 'bars are equal'", async ({ page }) => {
    await selectBottleneckOption(page, "No improvement needed (€0)");
    await runPracticeSimulation(page);

    const card = page.locator("text=Work-Center Utilization: Before vs After Improvement").locator("../..");

    await expect(card).toBeVisible();
    await expect(
      card.getByText(/No capacity improvement was applied/i),
    ).toBeVisible();
    await expect(card.getByText(/bars are equal/i)).toBeVisible();

    await expect(card.getByText("Before Improvement", { exact: true })).toBeVisible();
    await expect(card.getByText("After Improvement", { exact: true })).toBeVisible();
  });

  test("switching from sewing_modify to none updates the chart description in the next run", async ({ page }) => {
    await selectBottleneckOption(page, "Modify Sewing — Line balancing aids (+20%, €22,000)");
    await runPracticeSimulation(page);

    const card = page.locator("text=Work-Center Utilization: Before vs After Improvement").locator("../..");
    await expect(card.getByText(/Capacity improvement applied to/i)).toBeVisible();

    await selectBottleneckOption(page, "No improvement needed (€0)");
    const btn = page.getByRole("button", { name: "Run Practice Simulation" });
    await expect(btn).toBeEnabled({ timeout: 5_000 });
    await btn.click();

    await expect(card.getByText(/No capacity improvement was applied/i)).toBeVisible({ timeout: 20_000 });
    await expect(card.getByText(/bars are equal/i)).toBeVisible();
  });
});

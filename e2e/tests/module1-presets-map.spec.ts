/**
 * Module 1 — Procurement Strategy Presets
 *
 * Confirms that each preset updates the allocation rows and active map routes,
 * replays the map route-draw animation, and marks only the selected preset as
 * active. A subsequent supplier edit must switch the strategy indicator to
 * Custom.
 */

import { test, expect, type Page } from "@playwright/test";

const API = "/api";

const PRESETS = [
  {
    label: "Nearshore Focus",
    supplierIds: ["PT2", "TR1", "PT1", "TR2"],
    routeKeys: ["PT2:truck", "TR1:truck", "PT1:truck", "TR2:rail"],
  },
  {
    label: "Balanced Mix",
    supplierIds: ["PT1", "VN2", "TR2", "MX2"],
    routeKeys: ["PT1:truck", "VN2:ocean", "TR2:rail", "MX2:ocean"],
  },
  {
    label: "Offshore Focus",
    supplierIds: ["VN1", "MX1", "VN2"],
    routeKeys: ["VN1:ocean", "MX1:ocean", "VN2:ocean"],
  },
] as const;

async function registerStudent(page: Page) {
  const timestamp = Date.now();
  const response = await page.request.post(`${API}/auth/register`, {
    data: {
      name: "Preset Animation E2E Student",
      email: `preset_animation_${timestamp}@test.edu`,
      studentId: `PAE2E${timestamp}`,
      password: "TestPass123",
      confirmPassword: "TestPass123",
    },
  });

  expect(
    response.status(),
    `student registration failed: ${await response.text()}`,
  ).toBeLessThan(300);
}

test.describe("Module 1 — preset map redraw", () => {
  test.beforeEach(async ({ page }) => {
    await registerStudent(page);
    await page.goto("/module/M1");
    await expect(
      page.getByRole("heading", { name: "Module 1: Global Sourcing" }),
    ).toBeVisible();

    // Presets derive quantities from the forecasts, so give them valid inputs
    // before exercising the allocation strategy controls.
    await page.locator("#forecastA").fill("17800");
    await page.locator("#forecastB").fill("9000");
    await expect(page.getByText("Calculated Material Requirements:")).toBeVisible();
  });

  test("each preset updates allocations, routes, animation, and active state", async ({
    page,
  }) => {
    const map = page.getByTestId("supplier-world-map");
    const allocationTable = page.getByRole("table").filter({
      has: page.getByRole("columnheader", { name: "Supplier" }),
    });
    const allocationRows = allocationTable.locator("tbody tr");

    for (const preset of PRESETS) {
      const presetButton = page.getByRole("button", { name: preset.label });
      await presetButton.click();

      await expect(presetButton).toHaveAttribute("aria-pressed", "true");
      await expect(presetButton).toHaveClass(/ring-2/);

      await expect(allocationRows).toHaveCount(preset.supplierIds.length);
      await expect
        .poll(async () =>
          allocationRows.evaluateAll((rows) =>
            rows.map((row) =>
              row
                .querySelector("button[role=combobox]")
                ?.textContent?.trim()
                .split(/\s/)[0],
            ),
          ),
        )
        .toEqual(preset.supplierIds);

      const routes = map.getByTestId("supplier-route");
      await expect(routes).toHaveCount(preset.routeKeys.length);
      await expect
        .poll(async () =>
          routes.evaluateAll((routeGroups) =>
            routeGroups.map((route) => route.getAttribute("data-route-key")),
          ),
        )
        .toEqual(preset.routeKeys);

      // Strategy switches temporarily hide routes, then remount them with an
      // inline staggered routeDraw animation. Check while that replay window
      // is still active rather than merely checking that the routes exist.
      await expect
        .poll(
          async () =>
            routes.evaluateAll((routeGroups) =>
              routeGroups.every((route) =>
                route.querySelector("path.rp")?.getAttribute("style")?.includes("routeDraw"),
              ),
            ),
          { timeout: 3_000 },
        )
        .toBe(true);

      await expect(page.getByText("Active", { exact: true })).toBeVisible();
      await expect(page.getByText("Custom", { exact: true })).toHaveCount(0);
    }

    // Editing any allocation row leaves the selected preset and exposes the
    // custom strategy indicator.
    const firstSupplier = allocationRows.first().getByRole("combobox").first();
    await firstSupplier.click();
    await page.getByRole("option", { name: /PT1\s+–\s+Lusitex Premium/ }).click();

    await expect(page.getByText("Custom", { exact: true })).toBeVisible();
    await expect(page.getByText("Active", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Offshore Focus" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
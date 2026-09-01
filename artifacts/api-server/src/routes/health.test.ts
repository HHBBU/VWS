import { describe, expect, it } from "vitest";
import healthRouter, { createHealthCheckResponse } from "./health";

type RouterLayer = {
  route?: {
    path: string;
  };
};

describe("API readiness checks", () => {
  it("returns the dependency-free health payload", () => {
    expect(createHealthCheckResponse()).toEqual({ status: "ok" });
  });

  it("registers both the coordinator path and the legacy health path", () => {
    const paths = (healthRouter as unknown as { stack: RouterLayer[] }).stack
      .map((layer) => layer.route?.path)
      .filter((path): path is string => Boolean(path));

    expect(paths).toEqual(expect.arrayContaining(["/", "/healthz"]));
  });
});
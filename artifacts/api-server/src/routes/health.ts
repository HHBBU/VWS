import { Router, type IRouter, type Request, type Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

export function createHealthCheckResponse() {
  return HealthCheckResponse.parse({ status: "ok" });
}

function sendHealthCheck(_req: Request, res: Response) {
  res.json(createHealthCheckResponse());
}

router.get("/", sendHealthCheck);
router.get("/healthz", sendHealthCheck);

export default router;

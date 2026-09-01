import { Router, type IRouter } from "express";
import authRouter from "./auth";
import studentRouter from "./student";
import instructorRouter from "./instructor";

const router: IRouter = Router();

router.use("/auth", authRouter);
router.use("/student", studentRouter);
router.use("/instructor", instructorRouter);

export default router;

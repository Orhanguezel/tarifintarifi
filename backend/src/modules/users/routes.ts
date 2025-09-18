import { Router } from "express";
import * as C from "./controller";
import { requireAuth } from "@/middleware/auth/requireAuth";

const r = Router();

/** bootstrap için serbest; dilersen env bazlı kapatabilirsin */
r.post("/register", C.registerAdmin);

r.post("/login", C.login);
r.post("/refresh", C.refresh);
r.post("/logout", C.logout);

r.get("/me", requireAuth, C.me);
r.post("/change-password", requireAuth, C.changePassword);

export default r;

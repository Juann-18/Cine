import { Router } from "express";
import { buyMovieEntrances, getMovieEntrances } from "../controllers/entrances.controller.js";
import { authRequired, roleCheck } from "../middlewares/validateToken.js";

const router = Router();

router.get("/:id", getMovieEntrances)

router.post("/:id", authRequired, roleCheck, buyMovieEntrances)

export default router;
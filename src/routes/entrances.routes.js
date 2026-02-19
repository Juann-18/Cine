import { Router } from "express";
import { buyMovieEntrances, getMovieEntrances } from "../controllers/entrances.controller.js";

const router = Router();

router.get("/:id", getMovieEntrances)

router.post("/:id", buyMovieEntrances)

export default router;
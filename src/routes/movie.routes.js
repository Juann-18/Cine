import { Router } from "express";
import { authRequired, roleCheck } from "../middlewares/validateToken.js";
import {createMovie, getMovieById, getMovies } from "../controllers/movie.controller.js";

const router = Router();

router.post("/",authRequired, roleCheck, createMovie)

// router.post("/:id",)

router.get("/", getMovies)

router.get("/:id", getMovieById)



export default router;  

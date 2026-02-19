import { Router } from "express";
import {createMovie, getMovieById, getMovies } from "../controllers/movie.controller.js";

const router = Router();

router.post("/",createMovie)

router.post("/:id")

router.get("/", getMovies)

router.get("/:id", getMovieById)



export default router;  

import 'dotenv/config'
import app from "./app.js"
import express from 'express'
import morgan from "morgan"
import moviesRouter from "./routes/movie.routes.js"
import entrancesRouter from "./routes/entrances.routes.js"
import authRouter from "./routes/auth.routes.js"


app.listen(3000)

app.use(morgan("dev"));
app.use(express.json())

app.use("/movie",moviesRouter)
app.use("/entrances", entrancesRouter)
app.use("/auth", authRouter)
console.log("servidor iniciado....")
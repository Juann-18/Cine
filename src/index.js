import app from "./app.js"
import express from 'express'
import moviesRouter from "./routes/movie.routes.js"
import entrancesRouter from "./routes/entrances.routes.js"


app.listen(3000)
app.use(express.json())
app.use("/movie",moviesRouter)
app.use("/entrances", entrancesRouter)
console.log("servidor iniciado....")
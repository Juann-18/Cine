export const getMovieEntrances = (req, res) => {
  res.send("entradas disponibles para la pelicula " + req.params.id)
}

export const buyMovieEntrances = (req, res) => {
  res.send("compra de entradas para la pelicula " + req.params.id)
} 
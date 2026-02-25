import sql from 'mssql';
import cloudinary from '../config.js';
import getCongetion from '../database/connetion.js';


//Verificar si se guarda la imagen 
//crear la pelicula en la base de datos y guarda la imagen 
export const createMovie = async (req, res) => {
  try {

    const pool = await getCongetion();
    const result = await pool.request()
      .input("title", sql.VarChar, req.body.title)
      .input("description", sql.VarChar, req.body.description)
      .input("duration_min", sql.Int, req.body.duration_min)
      .query(
        'INSERT INTO Movie (title, description, duration_min) VALUES (@title, @description, @duration_min) SELECT SCOPE_IDENTITY() AS id_movie'
      );

      const resultCloudinary = await cloudinary.uploader.upload(req.body.image, )
      console.log(resultCloudinary) 

      const update = await pool.request()
      .input("id", sql.Int, result.recordset[0].id_movie)
      .input("image", sql.VarChar, resultCloudinary.secure_url)
      .query("UPDATE Movie SET image = @image WHERE id_movie = @id")

    res.json({
      id_movie: result.recordset[0].id_movie,
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      duration_min: req.body.duration_min
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export const createShow = async (req, res)  => {
  try {
    const pool = await getCongetion();

    const result = await pool.request()
    .input("id_movie", sql.Int, req.body.id_movie)
    .input("id_room", sql.Int, req.body.id_room)
    .input("date_time", sql.DateTime, req.body.date_time)
    .query(`
      INSERT INTO Show (id_movie, id_room, date_time) 
      VALUES (@id_movie, @id_room, @date_time) SELECT SCOPE_IDENTITY() AS id_show; 
    `)

    res.json({ id_show: result.recordset[0].id_show})
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: error.message })
}
}

//obtiene todas las peliculas 
export const getMovies = async (req, res) => {
  const pool = await getCongetion();
  const result = pool.request().query('SELECT * FROM Movie')
  console.log(result)
  res.json(result.recordset)
}

//obtinen una pelicula por el id
export const getMovieById = async (req,res) => {
  try {
    const id_movie = req.params.id;
    
    if(!id_movie){
      return res.status(400).json({ success: false, error: "El id de la pelicula es requerido"})
    }

    const pool = await getCongetion();

    const movieResult = await pool.request()
    .input("id", sql.Int, id_movie)
    .query(`SELECT 
        p.id_movie, p.title, p.description, p.image, p.duration_min
      FROM Movie p
        WHERE p.id_movie = @id`)

    if(movieResult.recordset.length === 0 ){
      return res.status(404).json({ error: "Pelicula no encotrada"})
    }

    const showResult = await pool.request()
    .input("id", sql.Int, id_movie)
    .query(`SELECT f.*, s.name AS room
      FROM Show f
      INNER JOIN Room s ON f.id_room = s.id_room
      WHERE f.id_movie = @id`)

      if(showResult.recordset.length === 0){
        return res.status(404).json({ error: "Funciones no encontradas"})
      }

      console.log("Funciones encontradas:", showResult.recordset); 

    const data = movieResult.recordset[0];

    res.json({
      movie: {
        id: data.id_movie,
        title: data.title,
        description: data.description,
        image: data.image,
        duration_min: data.duration_min
      },
      show: showResult.recordset
    })
  } catch (error) {
    console.log(error.message, "este mensaje")
    res.status(500).json({ success: false, error: error.message})
  }

}


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

      // Insertar géneros si se proporcionan
      if (req.body.genres && Array.isArray(req.body.genres) && req.body.genres.length > 0) {
        const movieId = result.recordset[0].id_movie;
        for (const genreId of req.body.genres) {
          await pool.request()
            .input("id_movie", sql.Int, movieId)
            .input("id_genre", sql.Int, genreId)
            .query("INSERT INTO Movie_Genre (id_movie, id_genre) VALUES (@id_movie, @id_genre)");
        }
      }

    res.json({
      id_movie: result.recordset[0].id_movie,
      title: req.body.title,
      description: req.body.description,
      duration_min: req.body.duration_min,
      genres: req.body.genres || []
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

//obtiene todas las peliculas con sus géneros y shows
export const getMovies = async (req, res) => {
  try {
    const pool = await getCongetion();

    // Obtener películas con géneros
    const moviesResult = await pool.request().query(`
      SELECT
        m.id_movie,
        m.title,
        m.description,
        m.image,
        m.duration_min,
        STRING_AGG(g.name, ', ') AS genres
      FROM Movie m
      LEFT JOIN Movie_Genre mg ON m.id_movie = mg.id_movie
      LEFT JOIN Genre g ON mg.id_genre = g.id_genre
      GROUP BY m.id_movie, m.title, m.description, m.image, m.duration_min
      ORDER BY m.title
    `)

    // Obtener shows para todas las películas
    const showsResult = await pool.request().query(`
      SELECT
        s.id_movie,
        s.id_show,
        s.id_room,
        s.date_time,
        r.name AS room
      FROM Show s
      INNER JOIN Room r ON s.id_room = r.id_room
      WHERE s.date_time >= GETDATE()
      ORDER BY s.id_movie, s.date_time
    `)

    // Combinar películas con sus shows
    const moviesWithShows = moviesResult.recordset.map(movie => {
      const movieShows = showsResult.recordset.filter(show => show.id_movie === movie.id_movie)
      return {
        ...movie,
        genres: movie.genres || '',
        shows: movieShows.map(show => ({
          id_show: show.id_show,
          id_room: show.id_room,
          date_time: show.date_time,
          room: show.room
        }))
      }
    })

    res.json(moviesWithShows)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message})
  }
}

//obtinen una pelicula por el id con géneros y shows
export const getMovieById = async (req,res) => {
  try {
    const id_movie = req.params.id;

    if(!id_movie){
      return res.status(400).json({ success: false, error: "El id de la pelicula es requerido"})
    }

    const pool = await getCongetion();

    const movieResult = await pool.request()
    .input("id", sql.Int, id_movie)
    .query(`
      SELECT
        m.id_movie,
        m.title,
        m.description,
        m.image,
        m.duration_min,
        STRING_AGG(g.name, ', ') AS genres
      FROM Movie m
      LEFT JOIN Movie_Genre mg ON m.id_movie = mg.id_movie
      LEFT JOIN Genre g ON mg.id_genre = g.id_genre
      WHERE m.id_movie = @id
      GROUP BY m.id_movie, m.title, m.description, m.image, m.duration_min
    `)

    if(movieResult.recordset.length === 0 ){
      return res.status(404).json({ error: "Pelicula no encontrada"})
    }

    const showResult = await pool.request()
    .input("id", sql.Int, id_movie)
    .query(`
      SELECT
        s.id_show,
        s.id_room,
        s.date_time,
        r.name AS room,
        r.capacity
      FROM Show s
      INNER JOIN Room r ON s.id_room = r.id_room
      WHERE s.id_movie = @id
      AND s.date_time >= GETDATE()
      ORDER BY s.date_time
    `)

    const movie = movieResult.recordset[0];

    res.json({
      movie: {
        id: movie.id_movie,
        title: movie.title,
        description: movie.description,
        image: movie.image,
        duration_min: movie.duration_min,
        genres: movie.genres || ''
      },
      shows: showResult.recordset
    })
  } catch (error) {
    console.log(error.message, "este mensaje")
    res.status(500).json({ success: false, error: error.message})
  }
}



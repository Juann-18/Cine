import sql from 'mssql';
import cloudinary from '../config.js';
import getCongetion from '../database/connetion.js';


//Verificar si se guarda la imagen 
//crear la pelicula en la base de datos y guarda la imagen 
export const createMovie = async (req, res) => {
  try {

    const pool = await getCongetion();
    const result = await pool.request()
      .input("titulo", sql.VarChar, req.body.titulo)
      .input("descripcion", sql.VarChar, req.body.descripcion)
      .input("duracion_min", sql.Int, req.body.duracion_min)
      .query(
        'INSERT INTO Pelicula (titulo, descripcion, duracion_min) VALUES (@titulo, @descripcion, @duracion_min) SELECT SCOPE_IDENTITY() AS id_pelicula'
      );

      const resultCloudinary = await cloudinary.uploader.upload(req.body.imagen, )
      console.log(resultCloudinary) 

      const update = await pool.request()
      .input("id", sql.Int, result.recordset[0].id_pelicula)
      .input("imagen", sql.VarChar, resultCloudinary.secure_url)
      .query("UPDATE Pelicula SET imagen = @imagen WHERE id_pelicula = @id")

    res.json({
      id_pelicula: result.recordset[0].id_pelicula,
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      imagen: req.body.imagen,
      duracion_min: req.body.duracion_min
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export const createFuncion = async (req, res)  => {
  try {
    const pool = await getCongetion();

    const result = await pool.request()
    .input("id_pelicula", sql.Int, req.body.id_pelicula)
    .input("id_sala", sql.Int, req.body.id_sala)
    .query(`
      INSERT INTO Funcion (id_pelicula, id_sala, fecha_hora) 
      VALLUES (@id_pelicula, @id_sala, @fecha_hora, GETDATE()) SELECT SCOPE_IDENTITY() AS id_Funcion; 
    `)

    res.json({ id_funcion: result.recordset[0].id_funcion})
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: error.message })
}
}

//obtiene todas las peliculas 
export const getMovies = async (req, res) => {
  const pool = await getCongetion();
  const result = pool.request().query('SELECT * FROM Pelicula')
  console.log(result)
  res.json(result.recordset)
}

//obtinen una pelicula por el id
export const getMovieById = async (req,res) => {
  try {
    const id_pelicula = req.params.id;
    
    if(!id_pelicula){
      return res.status(400).json({ success: false, error: "El id de la pelicula es requerido"})
    }

    const pool = await getCongetion();

    const movieResult = await pool.request()
    .input("id", sql.Int, id_pelicula)
    .query(`SELECT 
        p.id_pelicula, p.titulo, p.descripcion, p.imagen, p.duracion_min
      FROM Pelicula p
        WHERE p.id_pelicula = @id`)

    if(movieResult.recordset.length === 0 ){
      return res.status(404).json({ error: "Pelicula no encotrada"})
    }

    const funcionResult = await pool.request()
    .input("id", sql.Int, id_pelicula)
    .query(`SELECT f.*, s.nombre AS sala
      FROM Funcion f
      INNER JOIN Sala s ON f.id_sala = s.id_sala
      WHERE f.id_pelicula = @id`)

      if(funcionResult.recordset.length === 0){
        return res.status(404).json({ error: "Funciones no encontradas"})
      }

      console.log("Funciones encontradas:", funcionResult.recordset); 

    const data = movieResult.recordset[0];

    res.json({
      movie: {
        id: data.id_pelicula,
        titulo: data.titulo,
        descripcion: data.descripcion,
        imagen: data.imagen,
        duracion_min: data.duracion_min
      },
      function: funcionResult.recordset
    })
  } catch (error) {
    console.log(error.message, "este mensaje")
    res.status(500).json({ success: false, error: error.message})
  }

}


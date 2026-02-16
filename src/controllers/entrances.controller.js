import sql from "mssql"
import getConnection from "../database/connetion.js";

export const getMovieEntrances = async (req, res) => {
  const id_funcion = req.params.id;

  if(!id_funcion){
    return res.status(404).json({ succes: false, error: "El id de la funcion es requerido"})
  }
  const pool = await getConnection();

  const result = await pool.request()
  .input("id_funcion", sql.Int, id_funcion)
  .query(`
    SELECT 
      a.id_asiento,
      a.fila + CAST(a.numero AS varchar) AS asiento
      FROM Funcion f
    INNER JOIN Asiento a ON a.id_sala = f.id_sala
    LEFT JOIN Boleto b ON a.id_asiento = b.id_asiento AND b.id_funcion = f.id_funcion
    WHERE f.id_funcion = @id_funcion
      AND b.id_boleto IS NULL; 
  `)

  if(result.recordset.length === 0){
    return res.status(404).json({ succes: false, error: "No hay asientos disponibles"})
  }

  res.json(result.recordset)


}

export const buyMovieEntrances = (req, res) => {
  input("id_funcion", sql.Int, req.body.id_funcion)
  .input("id_usuario", sql.Int, req.body.id_usuario)
  .input("id_asiento", sql.Int, req.body.id_asiento)
  .input("estado", sql.VarChar, req.body.estado)
  .input("fecha_compra", sql.DateTime, new Date())
  res.send("compra de entradas para la pelicula " + req.params.id)
} 
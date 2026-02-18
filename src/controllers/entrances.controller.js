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

export const buyMovieEntrances = async (req, res) => {
  const id_funcion = req.params.id;

  if(!id_funcion){
    return res.status(404).json({succes: false, error: "El id de la funcion es requerido"})
  }

  const pool = await getConnection()

  const verification = await pool.request()
  .input("id_funcion",  sql.VarChar, id_funcion)
  .query(`
    SELECT 
      f.id_funcion,
      COUNT(b.id_boleto) AS boletos_reservados,
      s.capacidad - COUNT(b.id_boleto) AS asientos_disponibles
    FROM Funcion f
    INNER JOIN Sala s ON f.id_sala = s.id_sala
    LEFT JOIN Boleto b ON b.id_funcion = f.id_funcion 
      AND b.estado = 'RESERVADO' 
    WHERE f.id_funcion = @id_funcion
    GROUP BY f.id_funcion, f.fecha_hora, s.nombre, s.capacidad;
  `) 

  if(verification.recordset[0].asientos_disponibles === 0){
    return res.status(404).json({ message: "Sin asientos disponibles"})
  }

  const result = await pool.request()
  .input('id_funcion', sql.Int, id_funcion)  
  .input('id_usuario', sql.Int, req.body.id_usuario)          
  .input('id_asiento', sql.Int, req.body.id_asiento)  
  .query(`
    INSERT INTO Boleto (id_funcion, id_usuario, id_asiento, estado, fecha_compra)
    VALUES (@id_funcion, @id_usuario, @id_asiento, 'RESERVADO', GETDATE()) SELECT SCOPE_IDENTITY() AS id_boleto;
  `);

  res.send(result.recordset[0].id_boleto)
} 
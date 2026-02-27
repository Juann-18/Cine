import sql from "mssql"
import getConnection from "../database/connetion.js";

//recopila y devuel los asientos libres de una funcion 
export const getMovieEntrances = async (req, res) => {
  try {
    const id_show = req.params.id;

    if(!id_show){
      return res.status(404).json({ succes: false, error: "El id de la funcion es requerido"})
    }
    const pool = await getConnection();

    const result = await pool.request()
    .input("id_show", sql.Int, id_show)
    .query(`
      SELECT 
        a.id_seat,
        a.row + CAST(a.number AS varchar) AS seat
        FROM Show f
      INNER JOIN Seat a ON a.id_room = f.id_room
      LEFT JOIN Ticket b ON a.id_seat = b.id_seat AND b.id_show = f.id_show
      WHERE f.id_show = @id_show
        AND b.id_ticket IS NULL; 
    `)

    if(result.recordset.length === 0){
      return res.status(404).json({ succes: false, error: "No hay asientos disponibles"})
    }

    res.json(result.recordset)

  } catch (error) {
    console.log(error)
    res.status(500).json({succes: false, error: error.message})
  }
}

//compra una entrada a la pelicula 
export const buyMovieEntrances = async (req, res) => {
  try {
      const id_show = req.params.id;

  if(!id_show){
    return res.status(404).json({succes: false, error: "El id de la funcion es requerido"})
  }

  const pool = await getConnection()

  const verification = await pool.request()
  .input("id_show",  sql.VarChar, id_show)
  .query(`
    SELECT 
      f.id_show,
      COUNT(b.id_ticket) AS tickets_reserved,
      s.capacity - COUNT(b.id_ticket) AS seats_available
    FROM Show f
    INNER JOIN Room s ON f.id_room = s.id_room
    LEFT JOIN Ticket b ON b.id_show = f.id_show 
      AND b.status = 'RESERVED' 
    WHERE f.id_show = @id_show
    GROUP BY f.id_show, f.date_time, s.name, s.capacity;
  `) 

  if(verification.recordset[0].seats_available === 0){
    return res.status(404).json({ message: "Sin asientos disponibles"})
  }

  const result = await pool.request()
  .input('id_show', sql.Int, id_show)  
  .input('id_user', sql.Int, req.body.id_user)          
  .input('id_seat', sql.Int, req.body.id_seat)  
  .query(`
    INSERT INTO Ticket (id_show, id_user, id_seat, status, purchase_date)
    VALUES (@id_show, @id_user, @id_seat, 'RESERVED', GETDATE()) SELECT SCOPE_IDENTITY() AS id_ticket;
  `);

  res.send(result.recordset[0].id_ticket)
  } catch (error) {
    console.log(error)
    res.status(500).json({succes: false, error: error.message})
  }
} 
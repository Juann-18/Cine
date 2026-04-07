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
  let transaction;

  try {
    const id_show = parseInt(req.params.id, 10);
    const { selectedSeats, id_user } = req.body;
    console.log(selectedSeats)

    if (!id_show) {
      return res.status(404).json({ succes: false, error: "El id de la función es requerido" });
    }

    if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ succes: false, error: "selectedSeats es requerido y debe ser una lista de ids de asiento" });
    }

    if (!Number.isInteger(id_user) || id_user <= 0) {
      return res.status(400).json({ succes: false, error: "id_user es requerido y debe ser un número válido" });
    }

    const seatIds = selectedSeats.map((seat) => parseInt(seat, 10));
    if (seatIds.some((seat) => !Number.isInteger(seat) || seat <= 0)) {
      return res.status(400).json({ succes: false, error: "selectedSeats debe contener sólo ids de asiento válidos" });
    }

    if (new Set(seatIds).size !== seatIds.length) {
      return res.status(400).json({ succes: false, error: "selectedSeats no debe contener asientos duplicados" });
    }

    const pool = await getConnection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const verificationRequest = transaction.request().input("id_show", sql.Int, id_show);
    const verification = await verificationRequest.query(`
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
    `);

    if (verification.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ succes: false, error: "Función no encontrada" });
    }

    const seatsToReserve = seatIds.length;
    if (verification.recordset[0].seats_available < seatsToReserve) {
      await transaction.rollback();
      return res.status(400).json({ succes: false, error: "No hay suficientes asientos disponibles para la reserva" });
    }

    const seatParams = seatIds.map((seat, index) => `@seat${index}`).join(", ");
    const seatCheckRequest = transaction.request().input("id_show", sql.Int, id_show);
    seatIds.forEach((seat, index) => seatCheckRequest.input(`seat${index}`, sql.Int, seat));

    const takenSeats = await seatCheckRequest.query(`
      SELECT b.id_seat
      FROM Ticket b
      WHERE b.id_show = @id_show
        AND b.status = 'RESERVED'
        AND b.id_seat IN (${seatParams});
    `);

    if (takenSeats.recordset.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        succes: false,
        error: "Algunos asientos ya están reservados",
        reservedSeats: takenSeats.recordset.map((row) => row.id_seat),
      });
    }

    const seatExistRequest = transaction.request().input("id_show", sql.Int, id_show);
    seatIds.forEach((seat, index) => seatExistRequest.input(`seat${index}`, sql.Int, seat));
    const seatExistResult = await seatExistRequest.query(`
      SELECT COUNT(*) AS valid_seat_count
      FROM Show f
      INNER JOIN Seat a ON a.id_room = f.id_room
      WHERE f.id_show = @id_show
        AND a.id_seat IN (${seatParams});
    `);

    if (seatExistResult.recordset[0].valid_seat_count !== seatsToReserve) {
      await transaction.rollback();
      return res.status(400).json({ succes: false, error: "Uno o más asientos no existen para esta función" });
    }

    const insertRequest = transaction.request().input("id_show", sql.Int, id_show).input("id_user", sql.Int, id_user);
    seatIds.forEach((seat, index) => insertRequest.input(`seat${index}`, sql.Int, seat));

    const insertQuery = `
      INSERT INTO Ticket (id_show, id_user, id_seat, status, purchase_date)
      OUTPUT inserted.id_ticket
      VALUES ${seatIds.map((_, index) => `(@id_show, @id_user, @seat${index}, 'RESERVED', GETDATE())`).join(", ")};
    `;

    const insertResult = await insertRequest.query(insertQuery);
    await transaction.commit();

    return res.status(201).json({
      succes: true,
      ticketIds: insertResult.recordset.map((row) => row.id_ticket),
    });
  } catch (error) {
    console.log(error);
    if (transaction && transaction._aborted !== true) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.log("Rollback error:", rollbackError);
      }
    }
    return res.status(500).json({ succes: false, error: error.message });
  }
} 
import sql from "mssql"
import bcrypt from "bcryptjs";
import getConnection from "../database/connetion.js"
import { createAccestToken } from "../libs/jwt.js";


export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  const pool = await getConnection();
  try {
    const emailFound = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`SELECT CASE 
        WHEN EXISTS(SELECT 1 FROM [User] WHERE email = @email) 
        THEN 1 ELSE 0 
        END AS exists_flag`)
    if (emailFound.recordset[0].exists_flag === 1) return res.status(400).json({ message: "An account already exists with this email address." })
    const passwordHash = await bcrypt.hash(password, 10)

    const result = await pool.request()
      .input("name", sql.VarChar, name)
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, passwordHash)
      .input("role", sql.VarChar, role)
      .query(`INSERT INTO [User] (name, email, password, role ) VALUES (@name, @email, @password, @role) SELECT SCOPE_IDENTITY() AS id_user;`)

    const token = await createAccestToken({ id: result.recordset[0].id_user, role: role })
    res.cookie("token", token)
    res.json({
      id_user: result.recordset[0].id_user,
      name: name,
      email: email,
      role: req.role
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }

}

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password)
  try {
    const pool = await getConnection();
    const userFound = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`SELECT * FROM [User] WHERE email = @email;`)
    console.log(userFound.recordset)
    if (userFound.recordset.length === 0) return res.status(400).json({ message: "User not found" })

    const isMatch = await bcrypt.compare(password, userFound.recordset[0].password)
    if (!isMatch) return res.status(400).json({ message: "Incorrect Password" })

    const token = await createAccestToken({ id: userFound.recordset[0].id_user, role: userFound.recordset[0].role })
    const data = userFound.recordset[0]
    res.cookie("token", token)
    res.json({
      id_user: data.id_user,
      name: data.name,
      email: data.email,
      role: data.role
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }

}

export const logout = (req, res) => {
  res.cookie("token", "", {
    expiret: new Date(0)
  })
  return res.sendStatus(200);
}

export const profile = async(req, res) => {
  try {
    const pool = await getConnection();
    const user = await pool.request()
    .input("id", sql.Int, req.user.id)
    .query("SELECT * FROM [User] WHERE id_user = @id")

    if(user.recordset[0].length === 0) return res.status(400).json({ message: "User not found."})
    
    const data = user.recordset[0]
    res.json({
      id: data.id_user,
      name: data.name,
      email: data.email
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
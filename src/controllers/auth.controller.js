import sql from "mssql"
import bcrypt from "bcryptjs";
import getConnection from "../database/connetion.js"
import { createAccestToken } from "../libs/jwt.js";


export const register = async (req, res)=> {
    const { name, email, password } = req.body;
    console.log(name,email,password)
    const pool = await getConnection();
    try {
        const passwordHash = await bcrypt.hash(password, 10)

        const result = await pool.request()
        .input("name", sql.VarChar, name)
        .input("email", sql.VarChar, email)
        .input("password", sql.VarChar, passwordHash)
        .query(`INSERT INTO Usuario (nombre, correo, contrasena ) VALUES (@name, @email, @password) SELECT SCOPE_IDENTITY() AS id_usuario;`)
        
        const token = await createAccestToken({ id: result.recordset[0].id_usuario })
        res.cookie("token", token)
        res.json({
            id_usuario: result.recordset[0].id_usuario,
            nombre: name,
            email: email
        })

    } catch (error) {
        res.status(500).json({ error: error.message})
    }

}

export const login = ( req, res ) =>{

    console.log("login", process.env.CLOUD_NAME,)
}
import sql from "mssql"

const config = {
    server: "localhost",
    port: 1433,                    // ← Ahora SÍ funciona
    database: "Cine",
    user: "sa",                    // ← AGREGAR usuario SQL
    password: "juan123",    // ← AGREGAR contraseña
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
}

const getConnection = async() => {
    try {
        const pool = await sql.connect(config)
        console.log("DB conectada")
        return pool
    } catch (error) {
        console.log(error)
    }
    
}

export default getConnection;
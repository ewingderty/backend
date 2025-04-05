require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// const db = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT
// });

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const tiempoEspera = 30000;
const numeroIntentos = 10;
function intentarConexion(reintentos) {
    db.connect(err => {
        if (err) {
            console.log(`Error conectando a BaseDatos (intento ${reintentos})`);

            if (reintentos < numeroIntentos) {
                console.log(`Reintentando en ${tiempoEspera / 1000} segundos... (${numeroIntentos - reintentos} intentos restantes)`);
                setTimeout(() => intentarConexion(reintentos + 1), tiempoEspera);
            } else {
                console.error("No se ha podido establecer conexión con BaseDatos");
                return;
            }
        } else {
            console.log(`✅Conectado a MySQl en el intento ${reintentos}`);
        }        
    });
}
intentarConexion(1);

// db.connect(err => {
//     if (err) {
//         console.error("Error conectando a MySQL:", err);
//         return;
//     }
//     console.log("Conectado a MySQL");
// });

app.get("/api/datos", (req, res) => {
    db.query("SELECT * FROM songs", (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

app.delete("/api/eliminar/:id", (req, res) => {
    const { id } = req.params;

    const query = "DELETE FROM songs WHERE id = ?";
    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Error eliminando la canción" });
        }
        res.status(200).json({ message: "Canción eliminada con éxito" });
    });
});

app.delete("/api/eliminartodo", (req, res) => {
    const { id } = req.params;

    const query = "DELETE FROM songs";
    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Error eliminando todas las canción" });
        }
        res.status(200).json({ message: "Canciones eliminadas con éxito" });
    });
});

// Ruta para agregar un nuevo registro
app.post("/api/agregar", (req, res) => {
    const { name, url } = req.body;

    if (!name || !url) {
        return res.status(400).json({ error: "Se necesita: Nombre y URL" });
    }

    const query = "INSERT INTO songs (name, url) VALUES (?, ?)";
    db.query(query, [name, url], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Error agregando canción" });
        }
        res.status(201).json({ message: "Se inserto la canción" });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en PORT: ${PORT}`));
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");

// Configuración de la base de datos
const pool = new Pool({
  user: "postgres",
  host: "192.168.0.8",
  database: "pruebas",
  password: "m,.-123qwe",
  port: 5432, // Puerto por defecto de PostgreSQL
});

const app = express();

//middleware
app.use(bodyParser.json());

//MAnejo de error del servidor 
const handleDatabaseError = (res, error) => {
  console.error("Error en la consulta a la base de datos:", error);
  res.status(500).json({ error: "Error interno del servidor" });
};

//  ruta que realiza una consulta a la base de datos
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM system_user");
    res.json(result.rows);
  } catch (error) {
    handleDatabaseError(res, error);
  }
});

// ruta con parametro buscar por ID
app.get("/users/:id", async (req, res) => {
  const userId = req.params.id; // Obtener el valor del parámetro id desde la URL

  try {
    const result = await pool.query("SELECT * FROM system_user WHERE Id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      // No se encontró ningún usuario con el ID proporcionado
      res.status(404).json({ error: "Usuario no encontrado" });
    } else {
      // Se encontró al menos un usuario, devolver los resultados
      res.json(result.rows);
    }
  } catch (error) {
    handleDatabaseError(res, error);
  }
});


// ruta para agregar un nuevo User
app.post("/users", async (req, res) => {
  const body = req.body;

  // Verificar que se proporcionen todos los campos necesarios
  const requiredFields = [
    "username",
    "password",
    "first_name",
    "last_name",
    "role",
  ];
  const missingFields = requiredFields.filter((field) => !(field in body));

  if (missingFields.length > 0) {
    return res.status(400).json({
        message: `Faltan campos requeridos: ${missingFields.join(", ")}`,
      });
  }

  try {
    // Insertar nuevo usuario en la base de datos
    const result = await pool.query(
      "INSERT INTO system_user (username, password, first_name, last_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        body.username,
        body.password,
        body.first_name,
        body.last_name,
        body.phone,
        body.role,
      ]
    );

    // Obtener el usuario recién insertado
    const newUser = result.rows[0];

    res.json({ newUser, message: "Tu registro fue creado existosamente" });
  } catch (error) {
    handleDatabaseError(res, error);
  }
});

//Ruta para actualizar user
app.put("/users/:userId", async (req, res) => {
  const userId = req.params.userId;
  const body = req.body;

  // Verificar que se proporcionen todos los campos necesarios
  const requiredFields = [
    "username",
    "password",
    "first_name",
    "last_name",
    "role",
  ];
  const missingFields = requiredFields.filter((field) => !(field in body));

  if (missingFields.length > 0) {
    return res
      .status(400)
      .json({
        message: `Faltan campos requeridos: ${missingFields.join(", ")}`,
      });
  }

  try {
    // Actualizar usuario en la base de datos
    const result = await pool.query(
      "UPDATE system_user SET username = $1, password = $2, first_name = $3, last_name = $4, phone = $5, role = $6 WHERE id = $7 RETURNING *",
      [
        body.username,
        body.password,
        body.first_name,
        body.last_name,
        body.phone,
        body.role,
        userId,
      ]
    );

    // Obtener el usuario actualizado
    const updatedUser = result.rows[0];

    // Verificar si se encontró y eliminó el usuario
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      updatedUser,
      message: "Tu registro fue actualizado exitosamente",
    });
  } catch (error) {
    handleDatabaseError(res, error);
  }
});

// Ruta para eliminar un usuario
app.delete("/users/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Eliminar usuario de la base de datos
    const result = await pool.query(
      "DELETE FROM system_user WHERE id = $1 RETURNING *",
      [userId]
    );

    // Obtener el usuario eliminado
    const deletedUser = result.rows[0];

    // Verificar si se encontró y eliminó el usuario
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      user: deletedUser,
      message: "El usuario fue eliminado exitosamente",
    });
  } catch (error) {
    handleDatabaseError(res, error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});

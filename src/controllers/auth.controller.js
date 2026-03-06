import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js'
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const registro = async (req, res) => {
    const { nombre, correo, password, nacionalidad, fecha_nacimiento, telefono, genero } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO usuarios (nombre, correo, password_hash, nacionalidad, fecha_nacimiento, telefono, genero)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, correo
        `;
        const values = [nombre, correo, passwordHash, nacionalidad, fecha_nacimiento, telefono, genero];
        const result = await pool.query(query, values);
        
        res.status(201).json({ 
            mensaje: "¡Bienvenido al Mundial! Usuario creado.", 
            usuario: result.rows[0] 
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: "El correo electrónico ya está registrado." });
        }
        console.error(err);
        res.status(500).json({ error: "Ocurrió un error inesperado en el servidor." });
    }
};

export const login = async (req, res) => {
    const { correo, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Credenciales incorrectas" });
        }

        const usuario = result.rows[0];

        if (!usuario.password_hash) {
            return res.status(400).json({ 
              error: "Esta cuenta está vinculada a Google. Usa el botón 'Continuar con Google'." 
            });
            }

        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido) {
            return res.status(400).json({ error: "Credenciales incorrectas" });
        }

        await pool.query('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [usuario.id]);

        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, perfilCompleto: true },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            mensaje: "Login exitoso",
            token,
            usuario: { nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

export const googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const { email, name, sub: googleId } = ticket.getPayload();
  
      let result = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);
      let usuario = result.rows[0];

      let esNuevo = false;
  
      if (!usuario) {
        const nuevo = await pool.query(
          'INSERT INTO usuarios (nombre, correo, google_id) VALUES ($1, $2, $3) RETURNING *',
          [name, email, googleId]
        );
        usuario = nuevo.rows[0];
        esNuevo = true;
      } else if (!usuario.google_id){
        const updateResult = await pool.query(
            'UPDATE usuarios SET google_id = $1 WHERE id = $2 RETURNING *',
            [googleId, usuario.id]
        );
    }
  
      const perfilCompleto = usuario.nacionalidad ? true : false;

      const appToken = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, perfilCompleto },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      res.json({
        token: appToken,
        esNuevo,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          perfilCompleto
        }
      });
  
    } catch (error) {
        if (error.message?.includes('Token used too late')) {
          return res.status(401).json({ error: "La sesión de Google expiró. Intenta de nuevo." });
        }
        return res.status(401).json({ error: "No se pudo verificar tu cuenta de Google." });
    }
};

export const completarPerfil = async (req, res) => {
    const usuarioId = req.usuario.id; 
    const { nacionalidad, fecha_nacimiento, telefono, genero } = req.body;

    try {
        const query = `
            UPDATE usuarios 
            SET nacionalidad = $1, 
                fecha_nacimiento = $2, 
                telefono = $3, 
                genero = $4,
                perfil_verificado = true
            WHERE id = $5 
            RETURNING *
        `;
        
        const values = [nacionalidad, fecha_nacimiento, telefono || null, genero || null, usuarioId];
        const result = await pool.query(query, values);
        const usuario = result.rows[0];

        const nuevoToken = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, perfilCompleto: true },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            mensaje: "Perfil actualizado correctamente",
            token: nuevoToken,
            usuario
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el perfil" });
    }
};
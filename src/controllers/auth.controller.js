import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js' // Ajustamos la ruta porque ahora estamos en subcarpetas

export const registro = async (req, res) => {
    const { nombre, correo, password, nacionalidad, fecha_nacimiento, telefono, genero } = req.body;

    try {
        // 1. Encriptar la contraseña antes de mandarla a Supabase
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 2. Insertar en la base de datos
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
        // 1. Buscar si el correo existe en la tabla de usuarios
        const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Credenciales incorrectas" });
        }

        const usuario = result.rows[0];

        // 2. Comparar la contraseña que envió el usuario con el hash de la DB
        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido) {
            return res.status(400).json({ error: "Credenciales incorrectas" });
        }

        // 3. Actualizar la fecha de último login (buena práctica que pediste)
        await pool.query('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [usuario.id]);

        // 4. Crear el Token de seguridad (JWT)
        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({ 
            mensaje: "Login exitoso", 
            token, 
            usuario: { nombre: usuario.nombre, correo: usuario.correo } 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

export const googleLogin = async (req, res) => {
    const { token } = req.body; 

    try {
        // 1. Verificar token con Google (Usando google-auth-library)
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { email, name, sub: googleId } = ticket.getPayload();

        // 2. Buscar si ya existe
        let result = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);
        let usuario = result.rows[0];

        let esNuevo = false;

        if (!usuario) {
            // 3. REGISTRO INICIAL: Solo datos mínimos
            const nuevo = await pool.query(
                'INSERT INTO usuarios (nombre, correo, google_id) VALUES ($1, $2, $3) RETURNING *',
                [name, email, googleId]
            );
            usuario = nuevo.rows[0];
            esNuevo = true;
        }

        // 4. Generar tu JWT de sesión
        const appToken = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token: appToken,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                // Si no tiene nacionalidad, Angular sabe que debe pedir los datos
                perfilCompleto: usuario.nacionalidad ? true : false 
            }
        });
    } catch (error) {
        res.status(401).json({ error: "Autenticación de Google fallida" });
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

        res.json({
            mensaje: "Perfil actualizado correctamente",
            usuario: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el perfil" });
    }
};
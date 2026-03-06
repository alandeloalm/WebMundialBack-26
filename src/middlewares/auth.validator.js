export const validarRegistro = (req, res, next) => {
    const { nombre, correo, password, nacionalidad, fecha_nacimiento, telefono, genero } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!nombre || !correo || !password || !nacionalidad || !fecha_nacimiento) {
        return res.status(400).json({ error: "Nombre, correo, password, nacionalidad y fecha de nacimiento son obligatorios." });
    }

    if (nombre.length < 3) {
        return res.status(400).json({ error: "El nombre debe tener al menos 3 caracteres." });
    }

    if (!emailRegex.test(correo)) {
        return res.status(400).json({ error: "El formato del correo es inválido." });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
    }

    if (!dateRegex.test(fecha_nacimiento)) {
        return res.status(400).json({ error: "El formato de fecha debe ser YYYY-MM-DD." });
    }

    const hoy = new Date();
    const nacimiento = new Date(fecha_nacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const mesNacimiento = nacimiento.getMonth();

    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }

    if (edad < 13) {
        return res.status(400).json({ error: "Debes tener al menos 13 años para registrarte." });
    }

    if (edad > 120) {
        return res.status(400).json({ error: "Fecha de nacimiento inválida." });
    }

    const generosValidos = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'];
    if (genero && !generosValidos.includes(genero)) {
        return res.status(400).json({ error: "El género seleccionado no es válido." });
    }

    if (telefono && (telefono.length < 10 || telefono.length > 15)) {
        return res.status(400).json({ error: "El teléfono debe tener entre 10 y 15 dígitos." });
    }
    
    next();
};
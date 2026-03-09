import pool from './db.js'; 

export async function seedAdmin() {
  try{
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const { rows } = await pool.query(
      `SELECT rol FROM usuarios WHERE correo = $1`,
      [adminEmail]
    );

    if (rows[0]?.rol === 'admin') return;

    await pool.query(
      `UPDATE usuarios SET rol = 'admin' WHERE correo = $1`,
      [adminEmail]
    );
  } catch (err) {
    console.error(err);
  } 
}
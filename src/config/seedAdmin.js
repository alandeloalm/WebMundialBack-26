import pool from './db.js'; 

export async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const result = await pool.query(
    `UPDATE usuarios SET rol = 'admin' WHERE correo = $1 AND rol != 'admin' RETURNING correo`,
    [adminEmail]
  );

  if (result.rowCount > 0) {
    console.log(`✓ Admin asegurado: ${adminEmail}`);
  }
}
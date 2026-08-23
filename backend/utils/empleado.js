async function obtenerEmpleadoId(pool, usuario) {
  if (!usuario || usuario.rol === "cliente") return null;

  const [emp] = await pool.query(
    "SELECT id FROM empleados WHERE usuario_id = ? AND activo = 1",
    [usuario.id]
  );

  if (emp.length > 0) return emp[0].id;

  if (usuario.rol === "admin") {
    const [fallback] = await pool.query(
      "SELECT id FROM empleados WHERE activo = 1 ORDER BY id LIMIT 1"
    );
    return fallback[0]?.id || null;
  }

  return null;
}

module.exports = { obtenerEmpleadoId };

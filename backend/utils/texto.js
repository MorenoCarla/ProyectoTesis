const PARTICULAS = new Set(["de", "del", "la", "las", "el", "los", "y", "e"]);

function capitalizarTexto(valor) {
  if (valor == null || typeof valor !== "string") return valor;

  const limpio = valor.trim().replace(/\s+/g, " ");
  if (!limpio) return limpio;

  return limpio
    .toLowerCase()
    .split(" ")
    .map((palabra, i) => {
      if (i > 0 && PARTICULAS.has(palabra)) return palabra;
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(" ");
}

function normalizarDatosPersonales({ nombre, apellido, ciudad, empresa } = {}) {
  return {
    nombre: nombre != null ? capitalizarTexto(nombre) : nombre,
    apellido: apellido != null ? capitalizarTexto(apellido) : apellido,
    ciudad: ciudad != null && String(ciudad).trim() ? capitalizarTexto(ciudad) : (ciudad || null),
    empresa: empresa != null && String(empresa).trim() ? capitalizarTexto(empresa) : (empresa || null)
  };
}

module.exports = { capitalizarTexto, normalizarDatosPersonales };

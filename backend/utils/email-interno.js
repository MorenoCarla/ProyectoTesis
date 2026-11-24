/** Emails técnicos generados cuando el formulario no pide mail (vitrina Próximamente). */
function esEmailInternoProximamente(email) {
  const e = String(email || "").trim().toLowerCase();
  return /^proximamente\.\d+@contacto\.ituarte/i.test(e);
}

function sanitizarEmailCliente(cliente) {
  if (!cliente || typeof cliente !== "object") return cliente;
  if (esEmailInternoProximamente(cliente.email)) {
    return { ...cliente, email: null, email_interno_proximamente: true };
  }
  return cliente;
}

module.exports = { esEmailInternoProximamente, sanitizarEmailCliente };
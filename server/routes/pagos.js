// routes/pagos.js
const mercadopago = require('mercadopago');

mercadopago.configure({
  access_token: 'TU_ACCESS_TOKEN_MERCADO_PAGO'
});

router.post('/create-preference', async (req, res) => {
  try {
    const preference = await mercadopago.preferences.create({
      items: [req.body],
      back_urls: {
        success: "https://tudominio.com/pago-exitoso",
        failure: "https://tudominio.com/pago-fallido",
      },
      auto_return: "approved"
    });
    res.json(preference.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
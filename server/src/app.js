const express = require('express');
const path = require('node:path');
const calculationRoutes = require('./routes/calculationRoutes');

const app = express();
const publicDirectory = path.resolve(__dirname, '../../public');

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', calculationRoutes);
app.use('/api', (req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota da API não encontrada.' } });
});

app.use(express.static(publicDirectory));

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'O corpo da requisição não contém um JSON válido.' }
    });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'A requisição excede o tamanho permitido.' }
    });
  }
  return next(error);
});

module.exports = app;

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Raiz disponível em http://localhost:${port}`);
  });
}
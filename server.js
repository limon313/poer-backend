// v4
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const pool = require('./config/db');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/bank', require('./routes/bankTransfer'));
app.use('/api/cards', require('./routes/cards'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => {
  console.log('POER calisiyor: ' + PORT);
});

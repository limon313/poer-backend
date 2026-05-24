const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token yok' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = d.userId;
    next();
  } catch { res.status(401).json({ error: 'Geçersiz token' }); }
}

// IBAN'dan banka tespiti
function detectBank(iban) {
  const clean = iban.replace(/\s/g, '');
  const code = clean.substring(4, 9);
  const banks = {
    '00062': 'Garanti BBVA', '00010': 'Ziraat Bankası', '00046': 'Akbank',
    '00067': 'Yapı Kredi', '00064': 'İş Bankası', '00134': 'Denizbank',
    '00012': 'Halkbank', '00015': 'Vakıfbank', '00111': 'QNB Finansbank',
    '00169': 'ING Bank', '00203': 'Papara'
  };
  return banks[code] || 'Bilinmeyen Banka';
}

// Papara ile transfer
async function paparaTransfer(iban, amount, receiverName, description) {
  const isProd = process.env.PAPARA_ENV === 'production';
  const baseUrl = isProd
    ? 'https://merchant-api.papara.com'
    : 'https://merchant-api.test.papara.com';

  const response = await axios.post(
    `${baseUrl}/masspayment/byphonenumber`,
    {
      phoneNumber: null,
      iban: iban.replace(/\s/g, ''),
      amount: parseFloat(amount),
      massPaymentUniqueString: uuidv4(),
      turkishNationalId: null,
      name: receiverName,
      description: description || 'POER Transfer'
    },
    {
      headers: {
        'ApiKey': process.env.PAPARA_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  return response.data;
}

// IBAN Transfer endpoint
router.post('/transfer', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { iban, amount, receiver_name, description } = req.body;
    if (!iban || !amount || !receiver_name) {
      return res.status(400).json({ error: 'IBAN, tutar ve alıcı adı zorunlu' });
    }

    // Kullanıcı bakiyesi kontrol
    const userRes = await client.query('SELECT * FROM users WHERE id=$1', [req.userId]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    if (parseFloat(user.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Yetersiz bakiye' });
    }

    const bankName = detectBank(iban);
    const refNo = 'REF-' + Date.now();

    // Papara transfer
    let paparaResult;
    try {
      paparaResult = await paparaTransfer(iban, amount, receiver_name, description);
    } catch (paparaErr) {
      await client.query('ROLLBACK');
      console.error('Papara hata:', paparaErr.response?.data || paparaErr.message);
      return res.status(502).json({ error: 'Transfer başarısız', detail: paparaErr.response?.data?.message });
    }

    // Bakiye düş
    await client.query('UPDATE users SET balance=balance-$1 WHERE id=$2', [amount, user.id]);

    // İşlem kaydet
    const txId = uuidv4();
    await client.query(
      `INSERT INTO transactions (id, user_id, type, amount, description, status, reference_no, metadata)
       VALUES ($1,$2,'transfer',$3,$4,'success',$5,$6)`,
      [txId, user.id, amount,
        `${receiver_name} - ${bankName}`, refNo,
        JSON.stringify({ iban, bank: bankName, papara_id: paparaResult?.data?.id })]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      reference_no: refNo,
      bank: bankName,
      amount,
      receiver_name,
      new_balance: parseFloat(user.balance) - parseFloat(amount)
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  } finally { client.release(); }
});

// Banka tespiti endpoint
router.post('/detect-bank', (req, res) => {
  const { iban } = req.body;
  if (!iban) return res.status(400).json({ error: 'IBAN gerekli' });
  res.json({ bank: detectBank(iban) });
});

module.exports = router;

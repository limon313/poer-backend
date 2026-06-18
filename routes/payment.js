const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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

// NFC ile ödeme
router.post('/pay', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { card_uid, merchant_id, amount, description } = req.body;
    if (!card_uid || !amount) return res.status(400).json({ error: 'Eksik alan' });

    const cardRes = await client.query(
      'SELECT u.* FROM nfc_cards c JOIN users u ON c.user_id=u.id WHERE c.card_uid=$1 AND c.is_active=true',
      [card_uid]
    );
    if (!cardRes.rows.length) return res.status(404).json({ error: 'Kart bulunamadı' });

    const user = cardRes.rows[0];
    if (parseFloat(user.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Yetersiz bakiye' });
    }

    await client.query('UPDATE users SET balance=balance-$1 WHERE id=$2', [amount, user.id]);

    const txId = uuidv4();
    await client.query(
      `INSERT INTO transactions (id, user_id, type, amount, description, status, reference_no)
       VALUES ($1,$2,'payment',$3,$4,'success',$5)`,
      [txId, user.id, amount, description || 'NFC Ödeme', 'TX-' + Date.now()]
    );

    await client.query('COMMIT');
    const newBalance = parseFloat(user.balance) - parseFloat(amount);
    res.json({ success: true, transaction_id: txId, new_balance: newBalance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Ödeme hatası' });
  } finally { client.release(); }
});

// Bakiye sorgula
router.get('/balance', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT balance FROM users WHERE id=$1', [req.userId]);
    res.json({ balance: r.rows[0]?.balance || 0 });
  } catch (err) { res.status(500).json({ error: 'Hata' }); }
});

// İşlem geçmişi
router.get('/history', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Hata' }); }
});
router.post('/topup', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: 'Tutar gerekli' });
    await pool.query('UPDATE users SET balance=balance+$1 WHERE id=$2', [amount, req.userId]);
    const txId = uuidv4();
    await pool.query(
      `INSERT INTO transactions (id, user_id, type, amount, description, status, reference_no) VALUES ($1,$2,'topup',$3,'Bakiye Yukleme','success',$4)`,
      [txId, req.userId, amount, 'TOP-'+Date.now()]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Hata' }); }
});
module.exports = router;

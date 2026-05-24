# POER Backend

NFC Odeme Sistemi - Node.js + PostgreSQL + Papara

## Kurulum

```bash
npm install
cp .env.example .env
# .env dosyasini duzenle
node server.js
```

## Railway Deploy

1. Bu kodu GitHub'a yukle
2. railway.app -> New Project -> GitHub repo sec
3. PostgreSQL ekle
4. Variables ekle (.env.example'a bak)
5. Domain al -> /health kontrol et

## API Endpoints

- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/profile
- POST /api/payment/pay
- GET  /api/payment/balance
- GET  /api/payment/history
- POST /api/bank/transfer
- POST /api/bank/detect-bank
- GET  /api/cards
- POST /api/cards/virtual
- GET  /health

## Veritabani

migrations/schema.sql dosyasini Railway PostgreSQL'de calistir.

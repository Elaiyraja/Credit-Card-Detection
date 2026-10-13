# India Payment Fraud & RBI Compliance Engine

Production-grade real-time fraud scoring for Indian payment rails (**UPI**, **RuPay**, **Domestic Credit Card**, **International Credit Card**, **Net Banking**).

## Features
- **RBI AFA (2FA/OTP)** regulatory tracking table and step-up challenge triggers.
- **NPCI SIM-Binding & Device Telemetry** anomaly evaluation.
- **Geo-Velocity / Impossible Travel** calculation via Haversine distance.
- **High-Risk MCC Monitoring** (Crypto, Foreign Forex, Unregulated Wallets).
- **Automated Webhook & WhatsApp/SMS alerts** for risk score > 80.

## Setup & Running Locally

1. Create a PostgreSQL database and apply schema:
```bash
psql -U postgres -d fintech_db -f schema.sql
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

4. Interactive Swagger documentation:
Visit `http://localhost:8000/docs`

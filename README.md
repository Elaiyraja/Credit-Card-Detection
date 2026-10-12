# CreditCardGuard 🛡️ — Real-Time Credit Card Detection, Fraud Risk Engine & Gateway Integration

A production-grade, full-stack web application designed for real-time credit card telemetry, optical card OCR ingestion, heuristic fraud risk scoring, PCI-DSS compliant vault tokenization, and live payment gateway processing.

---

## 🌟 Key Features

1. **Real-Time Card Input & Validation Engine**
   - **Live Luhn Algorithm (Mod 10)** checksum verification as you type.
   - **IIN/BIN Brand Detection:** Visa, Mastercard, American Express, Discover, JCB, and Diners Club with automatic CVV length and formatting adjustments.
   - **Optical Card Scanner & OCR Modal:** Web camera scanner reticle, image upload scanner, and pre-configured test presets.
   - **Interactive 3D Glassmorphism Card:** Dynamic theme gradients, EMV chip, and live status badges.

2. **Heuristic Fraud & Risk Scoring Engine**
   - **IP & Masked PAN Velocity:** Real-time burst detection flagging rapid transactions.
   - **Geo-IP & Issuing Bank Mismatch:** Detects discrepancies between cardholder billing country and issuer jurisdiction.
   - **Prepaid & Anonymous Tier Vulnerabilities:** Heuristic scrutiny on anonymous debit instruments.
   - **Transaction Magnitude Anomalies:** Automatic scoring based on transaction volume and threshold limits.
   - **Automated Routing Decisions:** `APPROVED` (Instant settlement), `REVIEW` (Step-up 3DS), or `BLOCKED` (Immediate decline).

3. **Live WebSocket Monitoring Dashboard**
   - **Socket.io Real-Time Telemetry:** Instant push of incoming transactions, fraud alerts, and KPI metrics.
   - **Sub-Second Processing Latency:** Telemetry tracking authorization latency in milliseconds.
   - **Dynamic KPI Cards:** Settled volume, approval rate %, blocked fraud attempts, and active gateway throughput.

4. **Security & PCI-DSS Compliance Architecture**
   - **Zero PAN Persistence:** Raw Primary Account Numbers (PAN) and CVV are never stored in databases.
   - **Ephemeral Vault Tokenization:** Generates isolated token references (`pm_...` or `tok_guard_...`) for payment capture.
   - **Strict Visual & Storage Masking:** First 6 and last 4 digits only (`411111******1111`), rendered as `•••• •••• •••• 1111`.

5. **Payment Gateway Integration Abstraction**
   - **Stripe Official SDK (`stripe`):** Plug-and-play support for live and sandbox Stripe API keys via `.env`.
   - **Braintree / PayPal Adapter Ready:** Extensible gateway connector.
   - **High-Fidelity Sandbox Simulator:** Realistic latency (180ms–350ms), simulated authorization codes, and toggleable decline paths.

---

## 🏗️ Project Architecture

```
credit-card-guard/
├── .env                       # Environment variables (Stripe keys, ports, risk thresholds)
├── package.json               # Backend dependencies and run scripts
├── test_runner.js             # Automated test suite for validation, fraud & gateway
├── src/
│   ├── server.js              # Express server + Socket.io WebSocket server
│   ├── routes/
│   │   └── api.js             # API routes: /validate-card, /risk-assessment, /process-payment, /metrics
│   ├── services/
│   │   ├── binService.js      # BIN/IIN lookup service (live API + fallback database)
│   │   ├── fraudEngine.js     # Heuristic fraud & velocity risk engine
│   │   └── paymentGateway.js  # Stripe SDK & sandbox gateway connector
│   └── utils/
│       └── cardValidator.js   # Luhn algorithm, brand detection, PCI masking
└── client/                    # React + Vite + Tailwind CSS frontend
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx            # Master dashboard UI with real-time state & forms
        ├── index.css          # Glassmorphism, glow effects, Tailwind styles
        └── components/
            ├── CardPreview.jsx             # 3D interactive credit card visualizer
            ├── CardScannerModal.jsx        # Camera scanner, upload OCR & test card vault
            ├── RiskScoreCard.jsx           # Composite risk gauge & flags breakdown
            └── LiveMonitoringDashboard.jsx # Real-time WebSocket KPI cards & event table
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Configure Environment Variables
Review or edit `.env` in the root folder:

```ini
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Payment Gateway (Leave as mock or enter live Stripe test key 'sk_test_...')
STRIPE_SECRET_KEY=sk_test_mock_secret_key_demo12345
STRIPE_WEBHOOK_SECRET=whsec_mock_demo_secret_67890

# Fraud Engine Configuration
RISK_THRESHOLD_HIGH=75
RISK_THRESHOLD_MEDIUM=45
MAX_HOURLY_VELOCITY_PER_IP=5
MAX_HOURLY_VELOCITY_PER_CARD=3
```

### 2. Run the Backend Server
From the root directory:
```bash
node src/server.js
```
The server will start on `http://localhost:5000` with WebSocket support enabled.

### 3. Run the Frontend Development Client
In a new terminal window:
```bash
cd client
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

To run the complete test suite verifying Luhn checksums, brand detection, PCI masking, fraud scoring, and payment gateway capture:

```bash
node test_runner.js
```

---

## 💳 Test Card Profiles

| Card Brand | Card Number | Exp | CVV | Scenario Tested |
| :--- | :--- | :--- | :--- | :--- |
| **Visa Classic (Chase)** | `4111 1111 1111 1111` | 12/28 | 382 | **Approved / Low Risk** |
| **Mastercard (UK)** | `5105 1076 2201 9845` | 09/27 | 741 | **Geo-Mismatch Flag** |
| **Amex Platinum** | `3782 8224 6310 005` | 04/29 | 8910 | **Approved / Low Risk** |
| **Discover It** | `6011 0089 3341 5520` | 08/28 | 512 | **Approved / Low Risk** |
| **Decline Trigger** | `4000 0002 0002 0002` | 12/28 | 123 | **Bank Declined Path** |

---

## 🔒 PCI-DSS & Security Notes
- **Storage Policy:** This application adheres to PCI-DSS Requirement 3. PANs are never written to disk or logs.
- **Tokenization:** Sensitive card details are converted to one-time vault tokens immediately.
- **Environment Isolation:** Secrets and webhook keys are kept out of source code via `.env`.

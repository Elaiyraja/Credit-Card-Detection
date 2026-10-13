"""
Indian FinTech Fraud Detection & RBI Regulatory Compliance Engine
Stack: FastAPI | PostgreSQL | Haversine Geo-Velocity | Async Webhooks
"""

import math
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from enum import Enum

from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, Field
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "dbname": "fintech_db",
    "user": "postgres",
    "password": "postgres_password",
    "host": "localhost",
    "port": 5432
}

HIGH_RISK_MCCS = {"6051", "7995", "6211", "5967"}
MAX_CREDIBLE_TRAVEL_SPEED_KMH = 800.0

app = FastAPI(
    title="India Payment Fraud Detection & RBI Compliance Engine",
    version="1.0.0",
    docs_url="/docs"
)

class PaymentChannel(str, Enum):
    UPI = "UPI"
    DOMESTIC_CC = "DOMESTIC_CC"
    INTERNATIONAL_CC = "INTERNATIONAL_CC"
    NET_BANKING = "NET_BANKING"
    RUPAY_DEBIT = "RUPAY_DEBIT"

class FraudAction(str, Enum):
    APPROVE = "APPROVE"
    CHALLENGE_WITH_OTP = "CHALLENGE_WITH_OTP"
    BLOCK = "BLOCK"

class GeoCoordinate(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    city: str
    country_code: str = Field(default="IND", max_length=3)

class TransactionPayload(BaseModel):
    transaction_id: str = Field(..., example="TXN_UPI_98234710293")
    user_id: str = Field(..., example="CUST_IN_98412")
    instrument_identifier: str = Field(..., description="VPA handle or PAN to be salted/hashed", example="rahul@okaxis")
    amount_in_inr: float = Field(..., gt=0.0, example=85000.00)
    merchant_name: str = Field(..., example="WazirX India / Offshore Exchange")
    mcc_category: str = Field(..., example="6051")
    device_fingerprint: str = Field(..., example="df_sha256_b3192a019e")
    sim_serial_hash: Optional[str] = Field(None, example="sim_hash_98231")
    ip_address: str = Field(..., example="103.21.244.0")
    geo: GeoCoordinate
    channel: PaymentChannel
    is_international_enabled: bool = Field(default=False)
    has_valid_sim_binding: bool = Field(default=True, description="NPCI mandate for UPI apps")

class EvaluationResponse(BaseModel):
    transaction_id: str
    user_id: str
    risk_score: int
    decision: FraudAction
    action_reason: str
    triggered_rules: List[Dict[str, Any]]
    dispatched_alert: bool
    processed_at: datetime

def get_db():
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()

class IndiaFraudEngine:
    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @classmethod
    def evaluate(cls, payload: TransactionPayload, db_conn) -> (int, FraudAction, str, List[Dict[str, Any]]):
        score = 0
        triggered_rules = []
        cur = db_conn.cursor()

        # 1. RBI Cross-Border Rule
        if payload.geo.country_code != "IND":
            if not payload.is_international_enabled and payload.channel in [PaymentChannel.DOMESTIC_CC, PaymentChannel.RUPAY_DEBIT]:
                score += 85
                triggered_rules.append({
                    "rule": "RBI_CROSS_BORDER_BLOCKED",
                    "severity": "CRITICAL",
                    "message": "Domestic card used from foreign IP without cross-border toggle enabled."
                })

        # High-Risk MCC Check
        if payload.mcc_category in HIGH_RISK_MCCS:
            score += 30
            triggered_rules.append({
                "rule": "HIGH_RISK_MCC_CATEGORY",
                "severity": "HIGH",
                "message": f"Merchant category code {payload.mcc_category} subject to RBI enhanced due diligence."
            })

        # 2. NPCI SIM & Device Binding Rule
        if payload.channel == PaymentChannel.UPI:
            if not payload.has_valid_sim_binding:
                score += 70
                triggered_rules.append({
                    "rule": "NPCI_SIM_BINDING_MISMATCH",
                    "severity": "CRITICAL",
                    "message": "UPI initiated without valid hardware SIM-binding signature."
                })

        # 3. Velocity Checks
        ten_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=10)
        cur.execute("""
            SELECT COUNT(*) AS tx_count, COALESCE(SUM(amount_in_inr), 0) AS total_amount
            FROM transactions
            WHERE user_id = %s AND timestamp >= %s;
        """, (payload.user_id, ten_mins_ago))
        velocity = cur.fetchone()

        if velocity and velocity["tx_count"] >= 4:
            score += 40
            triggered_rules.append({
                "rule": "BURST_VELOCITY_ANOMALY",
                "severity": "HIGH",
                "message": f"{velocity['tx_count']} transactions in last 10 minutes."
            })

        if velocity and (float(velocity["total_amount"]) + payload.amount_in_inr > 200000.0):
            score += 35
            triggered_rules.append({
                "rule": "HIGH_VALUE_VELOCITY_SPIKE",
                "severity": "HIGH",
                "message": "10-minute cumulative velocity exceeds INR 2,00,000 threshold."
            })

        # 4. Geo-Velocity / Impossible Travel
        cur.execute("""
            SELECT geo_latitude, geo_longitude, timestamp, geo_city
            FROM transactions
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT 1;
        """, (payload.user_id,))
        last_tx = cur.fetchone()

        if last_tx and last_tx["geo_latitude"] is not None and last_tx["geo_longitude"] is not None:
            time_diff_hours = (datetime.now(timezone.utc) - last_tx["timestamp"]).total_seconds() / 3600.0
            if 0 < time_diff_hours < 2.0:
                dist_km = cls.haversine_distance_km(
                    last_tx["geo_latitude"], last_tx["geo_longitude"],
                    payload.geo.latitude, payload.geo.longitude
                )
                speed_kmh = dist_km / time_diff_hours
                if speed_kmh > MAX_CREDIBLE_TRAVEL_SPEED_KMH:
                    score += 65
                    triggered_rules.append({
                        "rule": "GEO_IMPOSSIBLE_TRAVEL",
                        "severity": "CRITICAL",
                        "message": f"Impossible travel speed {speed_kmh:.1f} km/h between {last_tx['geo_city']} and {payload.geo.city}."
                    })

        final_score = min(score, 100)

        if final_score >= 80:
            decision = FraudAction.BLOCK
            reason = "Blocked per RBI guidelines: High probability fraudulent velocity/impersonation."
        elif final_score >= 40:
            decision = FraudAction.CHALLENGE_WITH_OTP
            reason = "Elevated risk profile. Mandatory 2FA/AFA Step-Up challenge."
        else:
            decision = FraudAction.APPROVE
            reason = "Transaction verified within safe operational thresholds."

        return final_score, decision, reason, triggered_rules

class IndiaNotificationService:
    @staticmethod
    async def dispatch_fraud_alert(payload: TransactionPayload, score: int, rules: List[Dict[str, Any]], db_conn):
        alert_body = {
            "template_name": "rbi_unauthorized_tx_alert",
            "user_id": payload.user_id,
            "message": (
                f"🚨 SECURITY ALERT - Bank / Issuer Notice\n"
                f"Suspicious activity detected on your {payload.channel.value}.\n"
                f"Amount: Rs. {payload.amount_in_inr:,.2f} at {payload.merchant_name}.\n"
                f"Risk Score: {score}/100.\n"
                f"If unauthorized, freeze immediately: https://bank.in/sec/freeze"
            ),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        cur = db_conn.cursor()
        cur.execute("""
            INSERT INTO fraud_alerts (transaction_id, user_id, risk_score, trigger_rules, dispatch_payload)
            VALUES (%s, %s, %s, %s, %s);
        """, (
            payload.transaction_id,
            payload.user_id,
            score,
            psycopg2.extras.Json(rules),
            psycopg2.extras.Json(alert_body)
        ))
        db_conn.commit()

@app.post("/api/v1/india/evaluate-transaction", response_model=EvaluationResponse)
async def evaluate_transaction(payload: TransactionPayload, db = Depends(get_db)):
    score, decision, reason, rules = IndiaFraudEngine.evaluate(payload, db)
    instrument_hash = hashlib.sha256(payload.instrument_identifier.encode('utf-8')).hexdigest()
    masked = payload.instrument_identifier if "@" in payload.instrument_identifier else f"****-****-****-{payload.instrument_identifier[-4:]}"

    cur = db.cursor()
    cur.execute("""
        INSERT INTO transactions (
            transaction_id, user_id, vpa_or_card_hash, masked_instrument,
            amount_in_inr, merchant_name, mcc_category, device_fingerprint,
            sim_serial_hash, ip_address, geo_latitude, geo_longitude,
            geo_city, geo_country_code, channel, is_international_enabled,
            risk_score, decision
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        );
    """, (
        payload.transaction_id, payload.user_id, instrument_hash, masked,
        payload.amount_in_inr, payload.merchant_name, payload.mcc_category,
        payload.device_fingerprint, payload.sim_serial_hash, payload.ip_address,
        payload.geo.latitude, payload.geo.longitude, payload.geo.city,
        payload.geo.country_code, payload.channel.value, payload.is_international_enabled,
        score, decision.value
    ))

    if decision == FraudAction.CHALLENGE_WITH_OTP:
        cur.execute("""
            INSERT INTO transaction_2fa_logs (transaction_id, otp_reference, validation_status)
            VALUES (%s, %s, 'PENDING');
        """, (payload.transaction_id, f"OTP_REF_{payload.transaction_id[-6:]}"))

    db.commit()

    dispatched = False
    if score > 80 or decision == FraudAction.BLOCK:
        await IndiaNotificationService.dispatch_fraud_alert(payload, score, rules, db)
        dispatched = True

    return EvaluationResponse(
        transaction_id=payload.transaction_id,
        user_id=payload.user_id,
        risk_score=score,
        decision=decision,
        action_reason=reason,
        triggered_rules=rules,
        dispatched_alert=dispatched,
        processed_at=datetime.now(timezone.utc)
    )

@app.get("/api/v1/india/fraud-status/{user_id}")
async def get_user_fraud_alerts(user_id: str, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT 
            fa.alert_id, fa.transaction_id, fa.risk_score, fa.trigger_rules,
            fa.status, fa.created_at, t.amount_in_inr, t.merchant_name,
            t.channel, t.masked_instrument
        FROM fraud_alerts fa
        JOIN transactions t ON fa.transaction_id = t.transaction_id
        WHERE fa.user_id = %s
        ORDER BY fa.created_at DESC LIMIT 20;
    """, (user_id,))
    alerts = cur.fetchall()
    return {"user_id": user_id, "total_alerts": len(alerts), "alerts": alerts}

import json
import os
import random
from pathlib import Path
from typing import Optional

import stripe
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# .env 파일 로드 (없으면 무시)
load_dotenv(Path(__file__).parent.parent / ".env")

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

app = FastAPI(title="Meal Calorie Tracker API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path(__file__).parent / "nutrition_db.json"
with open(DB_PATH, encoding="utf-8") as f:
    NUTRITION_DB: dict = json.load(f)


# ──────────────────────────────────────────
# 기본 엔드포인트
# ──────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Meal Calorie Tracker API is running",
        "stripe_configured": bool(STRIPE_SECRET_KEY),
    }


@app.get("/api/categories")
def get_categories():
    categories = sorted(set(v["category"] for v in NUTRITION_DB.values()))
    return {"categories": categories}


@app.get("/api/foods")
def get_foods(category: Optional[str] = None):
    if category:
        filtered = {k: v for k, v in NUTRITION_DB.items() if v["category"] == category}
        if not filtered:
            raise HTTPException(status_code=404, detail=f"Category '{category}' not found")
        return {"foods": filtered}
    return {"foods": NUTRITION_DB}


@app.get("/api/nutrition/{food_class}")
def get_nutrition(food_class: str):
    item = NUTRITION_DB.get(food_class)
    if not item:
        raise HTTPException(status_code=404, detail=f"Food '{food_class}' not found")
    return {"food_class": food_class, **item}


# ──────────────────────────────────────────
# ML 예측 엔드포인트 (모델 연결 전 Mock)
# ──────────────────────────────────────────

@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    # TODO: 실제 ML 모델 연결 예정
    food_class = random.choice(list(NUTRITION_DB.keys()))
    item = NUTRITION_DB[food_class]
    return {
        "predicted_class": food_class,
        "confidence": round(random.uniform(0.6, 0.99), 3),
        "nutrition": {"food_class": food_class, **item},
        "note": "모델 미연결 상태 - 랜덤 결과 반환",
    }


@app.post("/api/predict-with-hint")
async def predict_with_hint(
    file: UploadFile = File(...),
    category: str = Form(...),
    top_k: int = Form(3),
):
    # TODO: 실제 ML 모델에 카테고리 힌트 전달 예정
    candidates = [(k, v) for k, v in NUTRITION_DB.items() if v["category"] == category]
    if not candidates:
        raise HTTPException(status_code=400, detail=f"Category '{category}' not found.")

    sampled = random.sample(candidates, min(top_k, len(candidates)))
    results = [
        {"food_class": k, "confidence": round(random.uniform(0.5, 0.99), 3), "nutrition": {"food_class": k, **v}}
        for k, v in sampled
    ]
    results.sort(key=lambda x: x["confidence"], reverse=True)
    return {"hint_category": category, "top_predictions": results}


# ──────────────────────────────────────────
# Stripe 결제 엔드포인트
# ──────────────────────────────────────────

@app.post("/api/payment/create-intent")
async def create_payment_intent():
    """
    추가 프로필 슬롯 구매를 위한 Stripe PaymentIntent 생성.
    STRIPE_SECRET_KEY 환경변수가 없으면 503 반환 → 프론트엔드가 Mock으로 폴백.
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "stripe_not_configured",
                "message": "STRIPE_SECRET_KEY가 설정되지 않았습니다. backend/.env를 확인해주세요.",
            },
        )

    try:
        intent = stripe.PaymentIntent.create(
            amount=2900,          # ₩2,900 (KRW는 zero-decimal currency)
            currency="krw",
            automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
            metadata={
                "product": "extra_profile_slot",
                "app": "meal-calorie-tracker",
            },
        )
        return {"client_secret": intent.client_secret}
    except stripe.error.AuthenticationError:
        raise HTTPException(
            status_code=401,
            detail={"code": "stripe_auth_error", "message": "Stripe API 키가 유효하지 않습니다."},
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=400,
            detail={"code": "stripe_error", "message": str(e.user_message or e)},
        )

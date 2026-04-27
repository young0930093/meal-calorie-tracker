import io
import json
import os
import random
from pathlib import Path
from typing import Optional

import stripe
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# .env 파일 로드
load_dotenv(Path(__file__).parent.parent / ".env")

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

app = FastAPI(title="Meal Calorie Tracker API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 영양 DB 로드 ──────────────────────────────────────────────────────
DB_PATH = Path(__file__).parent / "nutrition_db.json"
with open(DB_PATH, encoding="utf-8") as f:
    NUTRITION_DB: dict = json.load(f)

# ── ML 모델 로드 (선택적) ─────────────────────────────────────────────
# food_classifier.h5 와 class_indices.json 을 backend/app/ 에 넣으면 자동 연동
MODEL_PATH        = Path(__file__).parent / "food_classifier.h5"
CLASS_INDICES_PATH = Path(__file__).parent / "class_indices.json"

ML_MODEL      = None   # tf.keras.Model
CLASS_INDICES = None   # {str(idx): db_key}
DB_KEY_TO_IDX = None   # {db_key: idx}

TF_AVAILABLE = False
try:
    import numpy as np
    import tensorflow as tf
    from PIL import Image
    TF_AVAILABLE = True
except ImportError:
    print("⚠️  TensorFlow/Pillow 미설치 — ML 예측 비활성화 (Mock 사용)")

if TF_AVAILABLE and MODEL_PATH.exists():
    try:
        ML_MODEL = tf.keras.models.load_model(str(MODEL_PATH))
        if CLASS_INDICES_PATH.exists():
            with open(CLASS_INDICES_PATH, encoding="utf-8") as f:
                CLASS_INDICES = json.load(f)  # {"0": "bibimbap", ...}
            DB_KEY_TO_IDX = {v: int(k) for k, v in CLASS_INDICES.items()}
        print(f"✅ ML 모델 로드 완료 ({MODEL_PATH.name}), 클래스 수: {len(CLASS_INDICES or {})}")
    except Exception as e:
        ML_MODEL = None
        print(f"⚠️  ML 모델 로드 실패 (Mock 사용): {e}")


def _preprocess_image(contents: bytes):
    """업로드된 이미지 바이트를 MobileNetV2 입력 텐서로 변환"""
    img = Image.open(io.BytesIO(contents)).convert("RGB").resize((224, 224))
    arr = np.array(img, dtype=np.float32)
    arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)  # [0,255] → [-1,1]
    return np.expand_dims(arr, axis=0)  # (1, 224, 224, 3)


# ── 기본 엔드포인트 ───────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Meal Calorie Tracker API is running",
        "ml_model_loaded": ML_MODEL is not None,
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


# ── ML 예측 엔드포인트 ────────────────────────────────────────────────

@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()

    if ML_MODEL is not None and CLASS_INDICES is not None:
        try:
            img_tensor = _preprocess_image(contents)
            preds      = ML_MODEL.predict(img_tensor, verbose=0)[0]
            top_idx    = int(np.argmax(preds))
            confidence = float(preds[top_idx])
            food_class = CLASS_INDICES.get(str(top_idx))

            if food_class and food_class in NUTRITION_DB:
                item = NUTRITION_DB[food_class]
                return {
                    "predicted_class": food_class,
                    "confidence":      round(confidence, 3),
                    "nutrition":       {"food_class": food_class, **item},
                }
        except Exception as e:
            print(f"⚠️  ML 예측 오류 (Mock으로 폴백): {e}")

    # Mock 폴백
    food_class = random.choice(list(NUTRITION_DB.keys()))
    item = NUTRITION_DB[food_class]
    return {
        "predicted_class": food_class,
        "confidence":      round(random.uniform(0.6, 0.99), 3),
        "nutrition":       {"food_class": food_class, **item},
        "note":            "모델 미연결 상태 - 랜덤 결과 반환",
    }


@app.post("/api/predict-with-hint")
async def predict_with_hint(
    file: UploadFile = File(...),
    category: str = Form(...),
    top_k: int = Form(3),
):
    contents   = await file.read()
    candidates = {k: v for k, v in NUTRITION_DB.items() if v["category"] == category}

    if not candidates:
        raise HTTPException(status_code=400, detail=f"Category '{category}' not found.")

    if ML_MODEL is not None and CLASS_INDICES is not None:
        try:
            img_tensor = _preprocess_image(contents)
            preds      = ML_MODEL.predict(img_tensor, verbose=0)[0]

            # 해당 카테고리 클래스만 필터링 후 상위 top_k 추출
            scored = []
            for idx_str, db_key in CLASS_INDICES.items():
                if db_key in candidates:
                    scored.append((db_key, float(preds[int(idx_str)])))
            scored.sort(key=lambda x: x[1], reverse=True)

            results = [
                {
                    "food_class":  food_class,
                    "confidence":  round(conf, 3),
                    "nutrition":   {"food_class": food_class, **NUTRITION_DB[food_class]},
                }
                for food_class, conf in scored[:top_k]
            ]
            return {"hint_category": category, "top_predictions": results}
        except Exception as e:
            print(f"⚠️  ML 힌트 예측 오류 (Mock으로 폴백): {e}")

    # Mock 폴백
    sampled = random.sample(list(candidates.items()), min(top_k, len(candidates)))
    results = [
        {"food_class": k, "confidence": round(random.uniform(0.5, 0.99), 3),
         "nutrition": {"food_class": k, **v}}
        for k, v in sampled
    ]
    results.sort(key=lambda x: x["confidence"], reverse=True)
    return {"hint_category": category, "top_predictions": results}


# ── Stripe 결제 엔드포인트 ────────────────────────────────────────────

@app.post("/api/payment/create-intent")
async def create_payment_intent():
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
            amount=2900,
            currency="krw",
            automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
            metadata={"product": "extra_profile_slot", "app": "meal-calorie-tracker"},
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

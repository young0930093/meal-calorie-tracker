# meal-calorie-tracker

한끼 칼로리 트래커 — 음식 이미지를 업로드하면 칼로리와 영양 정보를 알려주는 웹앱

## 기술 스택

- **Frontend**: React + Vite + Tailwind CSS v4
- **Backend**: FastAPI (Python, uv)
- **ML**: 이미지 분류 모델 (학습 예정)

## 프로젝트 구조

```
meal-calorie-tracker/
├── frontend/          # React + Vite + Tailwind
├── backend/
│   └── app/
│       ├── main.py           # FastAPI 서버
│       └── nutrition_db.json # 음식 30종 영양 DB
├── ml/
│   └── train.ipynb   # 모델 학습 노트북
└── README.md
```

## 실행 방법

### 백엔드

```bash
cd backend
uv run uvicorn app.main:app --reload
# http://localhost:8000/docs 에서 API 문서 확인
```

### 프론트엔드

```bash
cd frontend
npm run dev
# http://localhost:5173
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/categories` | 음식 카테고리 목록 |
| GET | `/api/nutrition/{food_class}` | 음식별 영양 정보 |
| POST | `/api/predict` | 이미지 → 음식 예측 |
| POST | `/api/predict-with-hint` | 카테고리 힌트 포함 재분류 |

## 음식 카테고리 (6종)

- 밥/면류
- 국/찌개
- 나물/채소
- 육류
- 해산물
- 계란류

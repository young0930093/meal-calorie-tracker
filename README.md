유튜브 업로드 하실때 유튜브 썸네일 용 .png 파일을 썸네일로 사용 해주시면 감사하겠습니다!!!

# 🍱 한끼 칼로리 트래커 (Meal Calorie Tracker)

> 음식 사진 한 장으로 칼로리와 영양 정보를 바로 확인하는 AI 기반 식단 관리 웹앱

**배포 주소**
- 🌐 프론트엔드 (Vercel): https://frontend-two-chi-98.vercel.app
- 🔧 백엔드 API (Railway): https://meal-calorie-tracker-backend-production.up.railway.app/docs
- 📦 GitHub: https://github.com/young0930093/meal-calorie-tracker

---

## 📌 목차

1. [앱 소개](#앱-소개)
2. [제작 동기](#제작-동기)
3. [개발 과정](#개발-과정)
4. [기술 스택](#기술-스택)
5. [AI 모델 설명](#ai-모델-설명)
6. [주요 기능](#주요-기능)
7. [앱 사용 방법](#앱-사용-방법)
8. [인식 가능한 음식 101가지](#인식-가능한-음식-101가지)
9. [수업 내용 활용 (Week 1~5)](#수업-내용-활용-week-15)
10. [부족했던 점](#부족했던-점)
11. [향후 발전 방향](#향후-발전-방향)
12. [프로젝트 구조](#프로젝트-구조)
13. [로컬 실행 방법](#로컬-실행-방법)

---

## 앱 소개

**한끼 칼로리 트래커**는 스마트폰으로 음식 사진을 찍기만 하면 AI가 음식을 자동으로 인식하고, 칼로리·탄수화물·단백질·지방 정보를 즉시 알려주는 식단 관리 웹앱입니다.

단순한 칼로리 계산을 넘어, 사용자의 신체 정보(나이·키·몸무게·활동량)를 기반으로 기초대사량(BMR)과 하루 권장 칼로리(TDEE)를 계산하고, 먹은 음식을 소모하려면 어떤 운동을 얼마나 해야 하는지까지 한눈에 보여줍니다.

**핵심 플로우:**
```
사진 촬영 → AI 음식 인식 → 영양 정보 확인 → 식사 기록 → 칼로리 달성률 & 영양 분석
```

---

## 제작 동기

평소 식단 관리에 관심이 있었지만 기존 칼로리 앱들은 음식 이름을 일일이 검색해서 입력해야 하는 번거로움이 있었습니다. "사진만 찍으면 바로 알 수 있으면 얼마나 편할까?"라는 단순한 아이디어에서 시작했습니다.

AI와 머신러닝 수업에서 배운 Transfer Learning과 CNN을 실제 프로젝트에 적용해보고 싶었고, 단순한 실습 코드에서 벗어나 **실제로 배포하고 누군가가 사용할 수 있는 완성도 있는 서비스**를 만들어보는 것을 목표로 삼았습니다.

또한 프론트엔드(React)부터 백엔드(FastAPI), ML 모델 학습(TensorFlow), 클라우드 배포(Vercel, Railway)까지 **전체 스택을 혼자 경험해보며 AI 서비스가 어떻게 만들어지는지** 직접 이해하고 싶었습니다.

---

## 개발 과정

### 1단계: 기획 및 설계
- 어떤 사용자가 어떤 문제를 겪는지 정의: 바쁜 현대인이 식단을 쉽게 기록하고 싶다
- 핵심 기능 범위 결정: 사진 → 인식 → 기록 → 분석
- API 설계, 컴포넌트 구조 설계, 데이터 모델 정의

### 2단계: 데이터 준비 및 모델 선택
- Food-101 데이터셋 선택: 101개 음식 클래스, 총 101,000장 이미지
- 사전 학습된 MobileNetV2 선택: 경량 모델로 모바일/웹 서빙에 적합
- Transfer Learning 전략 수립: ImageNet 사전 학습 → Custom Head 추가 → Fine-tuning

### 3단계: ML 모델 학습 (Kaggle)
- Google Colab에서 시작했지만 세션 종료 문제로 Kaggle로 이전
- Kaggle GPU (P100 16GB) 환경에서 학습 노트북 작성
- 초기 ResourceExhaustedError 해결: `IMG_SIZE 224→128`, `BATCH_SIZE 32→16`, `mixed_float16` 적용
- 데이터셋 경로 자동 탐지 함수 구현 (`find_food101_root`)
- Phase 1 (MobileNetV2 완전 동결, 10 epochs)만으로도 유의미한 정확도 달성
- `food_classifier.h5` + `class_indices.json` 출력 파일 생성

### 4단계: 백엔드 개발 (FastAPI)
- Python FastAPI로 REST API 서버 구현
- uv 패키지 매니저로 의존성 관리
- TensorFlow 선택적 임포트: 모델 없어도 Mock으로 동작하는 Graceful Fallback 구조
- 영양 DB 설계: Food-101 101개 클래스 × 칼로리/탄단지 정보
- Stripe 결제 API 연동 (추가 프로필 슬롯 구매)
- CORS 설정, 환경변수 관리 (.env)

### 5단계: 프론트엔드 개발 (React)
- React + Vite + Tailwind CSS v4 스택 선택
- 페이지 구성: 로그인 → 프로필 선택 → 홈 → 업로드 → 결과 → 히스토리 → 설정
- Google OAuth 2.0 연동 (`@react-oauth/google`)
- 업로드 플로우 설계: ready → predicting → confirm → hint → manual (5단계 상태 머신)
- Context API로 전역 상태 관리 (프로필, 식사 기록)
- LocalStorage 기반 데이터 영속성
- BMR (Mifflin-St Jeor 공식), TDEE, 운동 소모량 계산 유틸리티

### 6단계: 배포
- GitHub 레포 생성 및 코드 푸시 (`.env` 파일 gitignore 처리)
- Vercel로 프론트엔드 배포 (SPA 라우팅 `vercel.json` 설정)
- Railway로 백엔드 배포 (`railway.toml` + Nixpacks 빌드)
- 학습된 ML 모델 파일(`food_classifier.h5`, 13MB)을 Railway 서버에 포함하여 배포
- 환경변수 설정: `VITE_API_URL`, `STRIPE_SECRET_KEY`, `VITE_GOOGLE_CLIENT_ID`

### 7단계: 버그 수정 및 개선
- `UploadPage.jsx`에 하드코딩된 `localhost:8000` → `VITE_API_URL` 환경변수로 수정
- 힌트 모드 카테고리 불일치 수정: 구 한국어 카테고리 → Food-101 기반 카테고리로 정렬
- 프로필 전환 버튼 UX 개선: 항상 표시되도록 수정

---

## 기술 스택

### Frontend
| 기술 | 용도 |
|------|------|
| React 19 | UI 컴포넌트 프레임워크 |
| Vite 8 | 빌드 도구 및 개발 서버 |
| Tailwind CSS v4 | 유틸리티 기반 스타일링 |
| React Router v7 | 클라이언트 사이드 라우팅 |
| @react-oauth/google | Google OAuth 2.0 로그인 |
| @stripe/stripe-js | Stripe 결제 UI |
| Context API | 전역 상태 관리 |
| LocalStorage | 로컬 데이터 영속성 |

### Backend
| 기술 | 용도 |
|------|------|
| Python 3.12 | 서버 언어 |
| FastAPI | 고성능 REST API 프레임워크 |
| uv | 초고속 Python 패키지 매니저 |
| uvicorn | ASGI 서버 |
| python-multipart | 파일 업로드 처리 |
| python-dotenv | 환경변수 관리 |
| Stripe SDK | 결제 처리 |

### AI / ML
| 기술 | 용도 |
|------|------|
| TensorFlow 2.16 | 딥러닝 프레임워크 |
| Keras | 모델 구성 및 학습 API |
| MobileNetV2 | 사전 학습된 이미지 분류 백본 |
| Transfer Learning | ImageNet → Food-101 지식 전이 |
| Mixed Precision (float16) | GPU 메모리 절약 및 학습 속도 향상 |
| Data Augmentation | 과적합 방지 (flip, brightness, contrast, saturation, hue) |
| Pillow | 이미지 전처리 |
| NumPy | 텐서 연산 |
| Food-101 Dataset | 101종 음식, 101,000장 학습 데이터 |

### 배포 / 인프라
| 기술 | 용도 |
|------|------|
| Vercel | 프론트엔드 CDN 배포 |
| Railway | 백엔드 클라우드 배포 |
| GitHub | 소스 코드 관리 및 CI 트리거 |
| Nixpacks | Railway 자동 빌드 |
| Kaggle | GPU 기반 모델 학습 환경 |

---

## AI 모델 설명

### 데이터셋: Food-101

Food-101은 Stanford 대학에서 공개한 음식 이미지 데이터셋입니다.

| 항목 | 내용 |
|------|------|
| 클래스 수 | 101종 |
| 총 이미지 수 | 101,000장 |
| 학습 데이터 | 75,750장 (클래스당 750장) |
| 테스트 데이터 | 25,250장 (클래스당 250장) |
| 이미지 크기 | 다양 (학습 시 128×128으로 리사이즈) |

### 모델 아키텍처: MobileNetV2 + Custom Head

```
입력 (128×128×3)
    ↓
MobileNetV2 Backbone (ImageNet 사전 학습, 완전 동결)
    ↓
GlobalAveragePooling2D
    ↓
Dense(256, activation='relu')
    ↓
Dropout(0.5)  ← 과적합 방지
    ↓
Dense(101, dtype='float32')
    ↓
Softmax(101개 클래스 확률, dtype='float32')
```

**MobileNetV2를 선택한 이유:**
- 경량 모델로 서버 메모리 사용량이 적음 (모델 파일 ~13MB)
- Depthwise Separable Convolution으로 연산량 대폭 감소
- ImageNet 사전 학습으로 에지, 텍스처, 형태 특징을 이미 학습한 상태
- 웹 서빙 환경(CPU only)에서도 빠른 추론 가능

### 학습 전략: Transfer Learning

Transfer Learning(전이 학습)은 이미 대규모 데이터로 학습된 모델의 지식을 새로운 과제에 재활용하는 기법입니다.

1. **MobileNetV2 동결**: ImageNet으로 학습된 1,280개 레이어의 가중치를 그대로 유지
2. **Custom Head만 학습**: 새로 추가한 Dense + Dropout + Softmax 레이어만 가중치 업데이트
3. **빠른 수렴**: 처음부터 학습하는 것보다 훨씬 적은 epoch으로 높은 성능 달성 가능

### 학습 설정

| 하이퍼파라미터 | 값 | 이유 |
|--------------|-----|------|
| IMG_SIZE | 128×128 | P100 GPU 16GB 메모리 한계 대응 |
| BATCH_SIZE | 16 | ResourceExhaustedError 방지 |
| Optimizer | Adam (lr=1e-3) | 빠른 수렴 |
| Loss | Sparse Categorical Crossentropy | 정수 레이블 다중 분류 |
| Epochs | 최대 10 (EarlyStopping patience=3) | 과적합 방지 자동 조기 종료 |
| Mixed Precision | float16 계산 + float32 출력 | GPU 속도 향상 + 수치 안정성 |
| Data Augmentation | flip, brightness, contrast, saturation, hue | 일반화 성능 향상 |

### 추론 파이프라인

```python
# 서버에서 이미지 수신
image_bytes → Pillow 열기 → RGB 변환 → 128×128 리사이즈
→ numpy array → MobileNetV2 전처리 ([0,255] → [-1,1])
→ 배치 차원 추가 (1, 128, 128, 3)
→ model.predict() → 101개 softmax 확률
→ argmax → class_indices.json → 음식 이름
→ nutrition_db.json → 칼로리/탄단지 반환
```

---

## 주요 기능

### 1. 구글 소셜 로그인
- Google OAuth 2.0으로 계정 생성 없이 즉시 로그인
- Mock 로그인도 지원 (개발/테스트용)

### 2. 다중 프로필 관리
- 가족 구성원별 프로필 생성 (이름, 나이, 성별, 키, 몸무게, 활동량)
- BMR 계산: Mifflin-St Jeor 공식
  - 남성: `(10×체중) + (6.25×키) - (5×나이) + 5`
  - 여성: `(10×체중) + (6.25×키) - (5×나이) - 161`
- TDEE 계산: BMR × 활동량 계수 (1.2 ~ 1.9)
- 프로필 간 언제든 전환 가능

### 3. AI 음식 인식 (5단계 플로우)
```
① ready     → 사진 촬영/갤러리 선택
② predicting → MobileNetV2 추론 (서버 전송)
③ confirm   → 결과 확인 (맞으면 ✓, 틀리면 ✗)
④ hint      → 카테고리 힌트 선택 → 재분류 (틀렸을 때)
⑤ manual    → 직접 검색/선택 (AI가 계속 틀릴 때)
```

### 4. 영양 정보 DB (101종)
- 칼로리 (kcal)
- 탄수화물 (g)
- 단백질 (g)
- 지방 (g)
- 9개 카테고리 분류

### 5. 식단 분석
- 일일 칼로리 달성률 링 차트
- 탄단지 비율 시각화
- 목표 칼로리 대비 섭취량 표시

### 6. 운동 소모량 환산
- 조깅, 걷기, 수영, 자전거, 줄넘기 등 운동별 소모 시간 계산
- 먹은 음식을 "소모하려면 몇 분 뛰어야 하는가" 직관적 표시

### 7. 히스토리 관리
- 날짜별 식사 기록 보관
- 아침/점심/저녁/간식 구분
- 일별 총 칼로리/영양 통계

### 8. 인앱 결제 (Stripe)
- 추가 프로필 슬롯 구매 (2,900원)
- Stripe Test Mode 연동
- 결제 실패/성공 처리

---

## 앱 사용 방법

### Step 1: 로그인
1. 앱 접속 후 **Google 계정으로 로그인** 버튼 클릭
2. Google 계정 선택 및 인증 완료

### Step 2: 프로필 설정
1. 처음 접속 시 프로필 생성 화면 표시
2. **이름, 성별, 나이, 키(cm), 몸무게(kg), 활동량** 입력
3. 저장하면 BMR/TDEE 자동 계산

### Step 3: 홈 화면
1. 오늘의 칼로리 달성률 링 차트 확인
2. 탄단지 섭취 현황 확인
3. 우측 상단 프로필 버튼으로 프로필 전환 가능

### Step 4: 음식 사진 업로드
1. **식사 추가** 버튼 클릭
2. **날짜** 및 **식사 종류** (아침/점심/저녁/간식) 선택
3. **사진 보관함** 또는 **카메라 촬영** 선택
4. 사진 업로드 → AI 분석 (잠시 대기)

### Step 5: AI 인식 결과 확인
- **맞아 ✓**: 해당 음식 그대로 기록
- **다른 음식이야 ✗**: 카테고리 힌트 선택 화면으로 이동
  - 카테고리 선택 → AI 재분류
  - 계속 틀리면 **직접 선택** 으로 이동

### Step 6: 결과 확인
1. 추가된 음식 목록 및 총 칼로리 확인
2. **기록하기** 버튼으로 오늘 식사 저장
3. 홈으로 돌아가면 달성률 업데이트

### Step 7: 히스토리 확인
1. 하단 **히스토리** 탭 클릭
2. 날짜별 식사 기록 조회
3. 일별 총 칼로리 및 영양 통계 확인

---

## 인식 가능한 음식 101가지

| # | 영어 (클래스명) | 한국어 | 카테고리 | 칼로리 |
|---|---------------|--------|---------|--------|
| 1 | apple_pie | 애플 파이 | 디저트 | 296 kcal |
| 2 | baby_back_ribs | 베이비 백 립 | 고기류 | 490 kcal |
| 3 | baklava | 바클라바 | 디저트 | 330 kcal |
| 4 | beef_carpaccio | 비프 카르파초 | 고기류 | 150 kcal |
| 5 | beef_tartare | 비프 타르타르 | 고기류 | 220 kcal |
| 6 | beet_salad | 비트 샐러드 | 채소/샐러드 | 120 kcal |
| 7 | beignets | 베녜 | 디저트 | 320 kcal |
| 8 | bibimbap | 비빔밥 | 밥/면류 | 560 kcal |
| 9 | bread_pudding | 브레드 푸딩 | 디저트 | 350 kcal |
| 10 | breakfast_burrito | 브렉퍼스트 부리토 | 빵/샌드위치 | 410 kcal |
| 11 | bruschetta | 브루스케타 | 빵/샌드위치 | 190 kcal |
| 12 | caesar_salad | 시저 샐러드 | 채소/샐러드 | 360 kcal |
| 13 | cannoli | 카놀리 | 디저트 | 380 kcal |
| 14 | caprese_salad | 카프레제 샐러드 | 채소/샐러드 | 210 kcal |
| 15 | carrot_cake | 당근 케이크 | 디저트 | 415 kcal |
| 16 | ceviche | 세비체 | 해산물류 | 130 kcal |
| 17 | cheese_plate | 치즈 플레이트 | 간식/안주 | 400 kcal |
| 18 | cheesecake | 치즈케이크 | 디저트 | 400 kcal |
| 19 | chicken_curry | 치킨 카레 | 고기류 | 350 kcal |
| 20 | chicken_quesadilla | 치킨 케사디아 | 빵/샌드위치 | 430 kcal |
| 21 | chicken_wings | 치킨 윙 | 고기류 | 430 kcal |
| 22 | chocolate_cake | 초콜릿 케이크 | 디저트 | 380 kcal |
| 23 | chocolate_mousse | 초콜릿 무스 | 디저트 | 290 kcal |
| 24 | churros | 추로스 | 간식/안주 | 340 kcal |
| 25 | clam_chowder | 클램 차우더 | 수프류 | 230 kcal |
| 26 | club_sandwich | 클럽 샌드위치 | 빵/샌드위치 | 450 kcal |
| 27 | crab_cakes | 크랩 케이크 | 해산물류 | 250 kcal |
| 28 | creme_brulee | 크렘 브륄레 | 디저트 | 320 kcal |
| 29 | croque_madame | 크로크 마담 | 빵/샌드위치 | 480 kcal |
| 30 | cup_cakes | 컵케이크 | 디저트 | 310 kcal |
| 31 | deviled_eggs | 데빌드 에그 | 달걀류 | 200 kcal |
| 32 | donuts | 도넛 | 디저트 | 300 kcal |
| 33 | dumplings | 만두 | 간식/안주 | 280 kcal |
| 34 | edamame | 에다마메 | 채소/샐러드 | 120 kcal |
| 35 | eggs_benedict | 에그 베네딕트 | 달걀류 | 450 kcal |
| 36 | escargots | 에스카르고 | 간식/안주 | 180 kcal |
| 37 | falafel | 팔라펠 | 채소/샐러드 | 330 kcal |
| 38 | filet_mignon | 필레 미뇽 | 고기류 | 320 kcal |
| 39 | fish_and_chips | 피시 앤 칩스 | 해산물류 | 550 kcal |
| 40 | foie_gras | 푸아그라 | 고기류 | 380 kcal |
| 41 | french_fries | 프렌치 프라이 | 간식/안주 | 370 kcal |
| 42 | french_onion_soup | 프렌치 어니언 수프 | 수프류 | 260 kcal |
| 43 | french_toast | 프렌치 토스트 | 달걀류 | 380 kcal |
| 44 | fried_calamari | 튀긴 오징어 | 해산물류 | 280 kcal |
| 45 | fried_rice | 볶음밥 | 밥/면류 | 490 kcal |
| 46 | frozen_yogurt | 프로즌 요거트 | 디저트 | 230 kcal |
| 47 | garlic_bread | 갈릭 브레드 | 빵/샌드위치 | 290 kcal |
| 48 | gnocchi | 뇨키 | 밥/면류 | 350 kcal |
| 49 | greek_salad | 그릭 샐러드 | 채소/샐러드 | 190 kcal |
| 50 | grilled_cheese_sandwich | 그릴드 치즈 샌드위치 | 빵/샌드위치 | 400 kcal |
| 51 | grilled_salmon | 연어 구이 | 해산물류 | 280 kcal |
| 52 | guacamole | 과카몰리 | 채소/샐러드 | 150 kcal |
| 53 | gyoza | 교자 | 간식/안주 | 280 kcal |
| 54 | hamburger | 햄버거 | 고기류 | 540 kcal |
| 55 | hot_and_sour_soup | 쏸라탕 | 수프류 | 130 kcal |
| 56 | hot_dog | 핫도그 | 빵/샌드위치 | 290 kcal |
| 57 | huevos_rancheros | 우에보스 란체로스 | 달걀류 | 380 kcal |
| 58 | hummus | 후무스 | 채소/샐러드 | 170 kcal |
| 59 | ice_cream | 아이스크림 | 디저트 | 270 kcal |
| 60 | lasagna | 라자냐 | 밥/면류 | 380 kcal |
| 61 | lobster_bisque | 랍스터 비스크 | 수프류 | 280 kcal |
| 62 | lobster_roll_sandwich | 랍스터 롤 | 해산물류 | 360 kcal |
| 63 | macaroni_and_cheese | 맥 앤 치즈 | 밥/면류 | 380 kcal |
| 64 | macarons | 마카롱 | 디저트 | 230 kcal |
| 65 | miso_soup | 미소 수프 | 수프류 | 40 kcal |
| 66 | mussels | 홍합 | 해산물류 | 190 kcal |
| 67 | nachos | 나초 | 간식/안주 | 480 kcal |
| 68 | omelette | 오믈렛 | 달걀류 | 210 kcal |
| 69 | onion_rings | 어니언 링 | 간식/안주 | 380 kcal |
| 70 | oysters | 굴 | 해산물류 | 80 kcal |
| 71 | pad_thai | 팟타이 | 밥/면류 | 430 kcal |
| 72 | paella | 파에야 | 밥/면류 | 450 kcal |
| 73 | pancakes | 팬케이크 | 디저트 | 350 kcal |
| 74 | panna_cotta | 판나 코타 | 디저트 | 280 kcal |
| 75 | peking_duck | 베이징 덕 | 고기류 | 380 kcal |
| 76 | pho | 쌀국수 (포) | 밥/면류 | 350 kcal |
| 77 | pizza | 피자 | 빵/샌드위치 | 480 kcal |
| 78 | pork_chop | 포크 찹 | 고기류 | 360 kcal |
| 79 | poutine | 푸틴 | 간식/안주 | 740 kcal |
| 80 | prime_rib | 프라임 립 | 고기류 | 540 kcal |
| 81 | pulled_pork_sandwich | 풀드 포크 샌드위치 | 빵/샌드위치 | 490 kcal |
| 82 | ramen | 라멘 | 밥/면류 | 500 kcal |
| 83 | red_velvet_cake | 레드 벨벳 케이크 | 디저트 | 420 kcal |
| 84 | risotto | 리소토 | 밥/면류 | 360 kcal |
| 85 | samosa | 사모사 | 간식/안주 | 300 kcal |
| 86 | sashimi | 사시미 | 해산물류 | 130 kcal |
| 87 | scallops | 가리비 | 해산물류 | 120 kcal |
| 88 | seaweed_salad | 해초 샐러드 | 채소/샐러드 | 70 kcal |
| 89 | shrimp_and_grits | 새우 그리츠 | 해산물류 | 380 kcal |
| 90 | spaghetti_bolognese | 스파게티 볼로네제 | 밥/면류 | 520 kcal |
| 91 | spaghetti_carbonara | 스파게티 카르보나라 | 밥/면류 | 560 kcal |
| 92 | spring_rolls | 스프링 롤 | 간식/안주 | 220 kcal |
| 93 | steak | 스테이크 | 고기류 | 460 kcal |
| 94 | strawberry_shortcake | 딸기 쇼트케이크 | 디저트 | 310 kcal |
| 95 | sushi | 초밥 | 해산물류 | 350 kcal |
| 96 | tacos | 타코 | 빵/샌드위치 | 400 kcal |
| 97 | takoyaki | 타코야키 | 간식/안주 | 290 kcal |
| 98 | tiramisu | 티라미수 | 디저트 | 360 kcal |
| 99 | tuna_tartare | 참치 타르타르 | 해산물류 | 180 kcal |
| 100 | waffles | 와플 | 디저트 | 330 kcal |
| 101 | clam_chowder | 클램 차우더 | 수프류 | 230 kcal |

---

## 수업 내용 활용 (Week 1~5)

### Week 1: Python 환경 구성 및 기초
수업에서 배운 Python 기초 문법, 가상환경, 패키지 관리 개념을 실제 프로젝트에 적용했습니다.
- `uv`를 활용한 Python 가상환경 및 의존성 관리 (`requirements.txt`)
- `pathlib.Path`, `json`, `os` 등 표준 라이브러리 활용
- 함수 설계 원칙을 따른 모듈화된 코드 구조 (`main.py`)
- `.env` 파일과 환경변수로 민감 정보 분리

### Week 2: NumPy와 데이터 처리
수업에서 배운 NumPy 배열 연산이 이미지 전처리 파이프라인의 핵심으로 활용됐습니다.
- 이미지를 `np.array(img, dtype=np.float32)`로 텐서 변환
- `np.argmax(preds)`, `np.max(preds)` 로 예측 결과 추출
- `np.expand_dims(arr, axis=0)` 로 배치 차원 추가 (추론 시 필요)
- `np.clip` 으로 시각화 시 픽셀값 범위 조정
- tf.data 파이프라인에서 NumPy 기반 배열 변환 활용

### Week 3: 머신러닝 개념 및 모델 평가
수업에서 배운 모델 평가 지표, 오버피팅/언더피팅 개념이 학습 전략에 직접 반영됐습니다.
- **Train/Validation Split**: Food-101 공식 split (75,750 / 25,250) 활용
- **Overfitting 방지**: Dropout(0.5), Data Augmentation 적용
- **학습률 스케줄링**: `ReduceLROnPlateau` (val_accuracy 개선 없으면 lr × 0.5)
- **조기 종료**: `EarlyStopping(patience=3)` 으로 최적 시점에 학습 자동 종료
- **모델 저장**: `ModelCheckpoint`로 val_accuracy 기준 최적 모델만 저장

### Week 4: 딥러닝 및 CNN
수업에서 배운 Convolutional Neural Network 구조, 역전파, 활성화 함수 개념이 모델 설계에 활용됐습니다.
- **CNN 특징 추출**: MobileNetV2의 Depthwise Separable Convolution 이해 및 활용
- **GlobalAveragePooling2D**: Flatten 대비 파라미터 수 감소 및 위치 불변성 확보
- **Dense + ReLU**: Hidden layer로 비선형 변환 학습
- **Softmax 출력**: 101개 클래스에 대한 확률 분포 출력
- **Mixed Precision**: float16/float32 혼합으로 GPU 효율 극대화

### Week 5: Transfer Learning 및 모델 배포
수업의 핵심 주제인 Transfer Learning을 프로젝트의 중심 기술로 활용했습니다.
- **사전 학습 모델 활용**: ImageNet 1,000 클래스 학습 지식 → Food-101로 전이
- **Frozen Backbone**: `base.trainable = False`로 MobileNetV2 가중치 동결
- **Custom Head 추가**: 새 분류 레이어만 학습 → 빠른 수렴, 적은 GPU 자원
- **모델 직렬화**: `.h5` 포맷으로 저장 후 FastAPI 서버에서 로드
- **REST API 서빙**: `model.predict()`를 HTTP 엔드포인트로 래핑하여 웹 서비스화
- **실제 배포**: Railway 클라우드에 모델 파일 포함하여 프로덕션 배포

---

## 부족했던 점

### 모델 정확도
- IMG_SIZE를 128로 줄이면서 원래 224 대비 정확도가 낮아졌습니다. 충분한 GPU 자원이 있다면 224×224로 재학습하면 성능이 크게 향상될 것입니다.
- Fine-tuning (Phase 2: backbone 일부 해동 후 낮은 lr로 추가 학습)을 GPU 메모리 부족으로 제거했는데, 이를 포함하면 5~10% 정확도 향상이 기대됩니다.
- 한국 음식(김치찌개, 된장찌개, 삼겹살 등)이 Food-101에 없어 한국인 실사용에 한계가 있습니다.

### 데이터
- 칼로리 수치가 일반적인 평균값으로, 음식의 양(그램수)이나 조리 방법에 따른 변동을 반영하지 못합니다.
- 1인분 기준이 음식마다 달라 비교가 어렵습니다.

### 서비스
- 데이터가 LocalStorage에만 저장되어 기기가 바뀌면 기록이 사라집니다. 서버 DB(PostgreSQL 등) 연동이 필요합니다.
- 소셜 로그인은 구현했지만 실제 사용자별 데이터 분리(서버 사이드 인증)가 없습니다.
- 모델 추론이 CPU에서 이루어져 Railway 무료 플랜에서 응답이 느릴 수 있습니다.

### 기술적 부채
- 초기에 하드코딩된 `localhost:8000`이 여러 파일에 남아 있다가 배포 후 발견됨 → 환경변수 규칙을 프로젝트 초기부터 강제해야 한다는 교훈
- 카테고리명이 DB 변경 시 프론트엔드와 동기화가 깨짐 → 카테고리를 `/api/categories`에서 동적으로 불러와야 함

---

## 향후 발전 방향

### 단기 (바로 구현 가능)
- [ ] **한국 음식 추가**: 김치찌개, 된장찌개, 삼겹살, 불고기, 잡채 등 한국 음식 데이터셋 수집 및 모델 재학습
- [ ] **음식 양 입력**: "반 그릇", "1.5인분" 등 섭취량 조절 기능
- [ ] **카테고리 동적 로딩**: 프론트에서 `/api/categories` API로 카테고리 목록 불러오기
- [ ] **PWA**: 오프라인 지원, 홈 화면 추가, 푸시 알림

### 중기 (서버 DB 연동 필요)
- [ ] **서버 사이드 데이터 저장**: PostgreSQL + 사용자 인증으로 기기 간 동기화
- [ ] **주간/월간 리포트**: 기간별 영양 섭취 트렌드 그래프
- [ ] **목표 설정**: 다이어트/벌크업/유지 목표에 따른 맞춤 칼로리 제안
- [ ] **음식 즐겨찾기**: 자주 먹는 음식 빠르게 등록

### 장기 (AI 고도화)
- [ ] **모델 정확도 향상**: IMG_SIZE 224, Fine-tuning (Phase 2) 포함 재학습
- [ ] **한국 음식 전용 모델**: AI-Hub 한국 음식 데이터셋으로 별도 모델 학습
- [ ] **음식 양 추정**: 이미지에서 음식의 무게(g)를 추정하는 회귀 모델 추가
- [ ] **식단 추천**: 오늘 섭취 영양소를 바탕으로 저녁 메뉴 추천
- [ ] **모바일 앱**: React Native로 iOS/Android 앱 출시

### 발전 가능성
이 프로젝트는 단순한 수업 과제를 넘어 실제 헬스케어 서비스로 발전할 수 있는 잠재력이 있습니다.
- **개인화 AI**: 사용자의 식습관 패턴을 학습해 개인 맞춤 영양 조언 제공
- **의료 연계**: 당뇨, 고혈압 등 만성질환자를 위한 특화 식단 관리
- **기업 B2B**: 병원 급식, 학교 급식 영양 관리 시스템으로 확장
- **웨어러블 연동**: Apple Watch, Galaxy Watch 등과 연동해 운동 + 식단 통합 관리

---

## 프로젝트 구조

```
meal-calorie-tracker/
├── frontend/                    # React + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # Google OAuth 로그인
│   │   │   ├── ProfilePage.jsx      # 프로필 생성/선택
│   │   │   ├── HomePage.jsx         # 칼로리 달성률 대시보드
│   │   │   ├── UploadPage.jsx       # AI 음식 인식 (5단계 플로우)
│   │   │   ├── ResultPage.jsx       # 식사 결과 확인 및 저장
│   │   │   ├── HistoryPage.jsx      # 날짜별 식사 히스토리
│   │   │   └── SettingsPage.jsx     # 프로필 설정, 결제
│   │   ├── contexts/
│   │   │   └── AppContext.jsx       # 전역 상태 (프로필, 식사 기록)
│   │   ├── components/
│   │   │   └── PaymentModal.jsx     # Stripe 결제 모달
│   │   └── utils/
│   │       └── calculations.js     # BMR, TDEE, 운동 소모량 계산
│   ├── vercel.json                  # SPA 라우팅 설정
│   └── package.json
│
├── backend/                     # FastAPI + Python
│   ├── app/
│   │   ├── main.py                  # FastAPI 서버 + ML 추론 엔드포인트
│   │   ├── nutrition_db.json        # Food-101 101종 영양 DB
│   │   ├── food_classifier.h5       # 학습된 MobileNetV2 모델 (13MB)
│   │   └── class_indices.json       # 모델 클래스 인덱스 매핑
│   ├── railway.toml                 # Railway 배포 설정
│   └── requirements.txt
│
└── ml/
    └── train.ipynb                  # Kaggle 학습 노트북 (Food-101 + MobileNetV2)
```

---

## 로컬 실행 방법

### 사전 준비
```bash
git clone https://github.com/young0930093/meal-calorie-tracker.git
cd meal-calorie-tracker
```

### 백엔드 실행
```bash
cd backend

# 환경변수 설정
cp .env.example .env
# .env 파일에서 STRIPE_SECRET_KEY 등 설정

# uv로 의존성 설치 및 실행
uv sync
uv run uvicorn app.main:app --reload

# API 문서: http://localhost:8000/docs
```

### 프론트엔드 실행
```bash
cd frontend

# 환경변수 설정
cp .env.example .env
# .env 파일에서 VITE_API_URL=http://localhost:8000 설정

npm install
npm run dev

# http://localhost:5173
```

### ML 모델 학습 (선택)
1. Kaggle에서 `CryBread/food101` 데이터셋 추가
2. `ml/train.ipynb` 노트북 순서대로 실행
3. `/kaggle/working/food_classifier.h5` + `class_indices.json` 다운로드
4. `backend/app/` 폴더에 복사 후 서버 재시작

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버 상태 및 ML 모델 로드 여부 확인 |
| GET | `/api/categories` | 음식 카테고리 목록 |
| GET | `/api/foods` | 전체 음식 목록 (카테고리 필터 가능) |
| GET | `/api/nutrition/{food_class}` | 특정 음식 영양 정보 |
| POST | `/api/predict` | 이미지 → AI 음식 예측 |
| POST | `/api/predict-with-hint` | 카테고리 힌트 포함 AI 재분류 |
| POST | `/api/payment/create-intent` | Stripe 결제 Intent 생성 |

---

*AI와 머신러닝 수업 프로젝트 — 2025*

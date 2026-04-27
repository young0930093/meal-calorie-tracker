import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { todayStr } from '../utils/calculations';

const ACCENT = '#FF85A1';
const BORDER = '#FCE4EC';
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MEAL_TYPES = ['아침', '점심', '저녁', '간식'];
const CATEGORIES = ['밥/면류', '국/찌개', '나물/채소', '육류', '해산물', '계란류'];
const CAT_ICONS = { '밥/면류': '🍚', '국/찌개': '🍲', '나물/채소': '🥬', '육류': '🥩', '해산물': '🐟', '계란류': '🥚' };

/**
 * 업로드 → AI 인식 흐름:
 *   ready → predicting → confirm
 *     ✓ → 목록에 추가, ready로 복귀
 *     ✗ → hint (카테고리 선택)
 *          → predicting(hint) → confirm (AI 재분류 결과 단일 표시)
 *               ✓ → 목록에 추가
 *               ✗ → hint 재진입 (다른 카테고리 시도 가능)
 *                    [끝내 모르면] → manual (직접 선택)
 */
export default function UploadPage() {
  const { setPendingItems, setPendingMeta, pendingItems } = useApp();
  const navigate = useNavigate();

  const [date, setDate] = useState(todayStr());
  const [mealType, setMealType] = useState('점심');

  // 플로우 상태
  const [phase, setPhase] = useState('ready'); // ready | predicting | confirm | hint | manual
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null); // { predicted_class, confidence, nutrition }
  const [hintCategory, setHintCategory] = useState(null); // 현재/마지막 힌트 카테고리
  const [hintAttempts, setHintAttempts] = useState(0);   // 재시도 횟수 표시용
  const [manualCategory, setManualCategory] = useState(null);
  const [error, setError] = useState('');

  const galleryRef = useRef();
  const cameraRef = useRef();

  function handleImageSelect(file) {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    runPredict(file);
  }

  async function runPredict(file) {
    setPhase('predicting');
    setHintCategory(null);
    setHintAttempts(0);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/api/predict`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      setPrediction(data);
      setPhase('confirm');
    } catch (e) {
      setError(e.message.includes('fetch') ? '백엔드 서버에 연결할 수 없어요' : e.message);
      setPhase('ready');
    }
  }

  // 카테고리 힌트로 AI 재분류 — top_k=1, 결과 단일 표시
  async function runPredictWithHint(category) {
    setHintCategory(category);
    setHintAttempts((n) => n + 1);
    setPhase('predicting');
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      fd.append('category', category);
      fd.append('top_k', '1');
      const res = await fetch(`${API}/api/predict-with-hint`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      const top = data.top_predictions[0];
      // 단일 결과를 prediction 형식으로 변환 → confirm 화면 재사용
      setPrediction({
        predicted_class: top.food_class,
        confidence: top.confidence,
        nutrition: top.nutrition,
      });
      setPhase('confirm');
    } catch (e) {
      setError(e.message.includes('fetch') ? '백엔드 서버에 연결할 수 없어요' : e.message);
      setPhase('hint');
    }
  }

  function confirmFood(food) {
    const item = {
      id: Date.now().toString(),
      food_class: food.food_class,
      name_ko: food.name_ko || food.nutrition?.name_ko,
      category: food.category || food.nutrition?.category,
      calorie: food.calorie ?? food.nutrition?.calorie,
      carbs_g: food.carbs_g ?? food.nutrition?.carbs_g,
      protein_g: food.protein_g ?? food.nutrition?.protein_g,
      fat_g: food.fat_g ?? food.nutrition?.fat_g,
    };
    setPendingItems((prev) => [...prev, item]);
    setPendingMeta({ date, mealType });
    resetUpload();
  }

  function deleteItem(id) {
    setPendingItems((prev) => prev.filter((i) => i.id !== id));
  }

  function resetUpload() {
    setPhase('ready');
    setImageFile(null);
    setImagePreview(null);
    setPrediction(null);
    setHintCategory(null);
    setHintAttempts(0);
    setError('');
  }

  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#FFF5F7' }}>
      {/* 헤더 */}
      <header className="sticky top-0 z-40 flex items-center h-14 px-4 gap-2"
        style={{ backgroundColor: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <button onClick={() => navigate('/')} className="p-2 text-gray-500 text-lg">←</button>
        <h1 className="text-base font-bold" style={{ color: '#374151' }}>식사 추가</h1>
        {pendingItems.length > 0 && (
          <button onClick={() => navigate('/result')}
            className="ml-auto px-4 py-1.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: ACCENT }}>
            결과 보기 ({pendingItems.length})
          </button>
        )}
      </header>

      <div className="flex-1 px-5 py-4 pb-24 space-y-4 overflow-y-auto">

        {/* ── ready: 날짜/종류 선택 + 업로드 ── */}
        {phase === 'ready' && (
          <>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#374151' }}>날짜</label>
                <input type="date" value={date} max={todayStr()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }} />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#374151' }}>식사 종류</label>
                <select value={mealType} onChange={(e) => setMealType(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }}>
                  {MEAL_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* 누적 반찬 목록 + 삭제 버튼 */}
            {pendingItems.length > 0 && (
              <div className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-semibold px-4 pt-4 pb-2" style={{ color: '#374151' }}>
                  추가된 반찬 ({pendingItems.length}개)
                </p>
                {pendingItems.map((item, idx) => (
                  <div key={item.id}
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{ borderTop: idx === 0 ? 'none' : '1px solid #F9FAFB' }}>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium" style={{ color: '#374151' }}>{item.name_ko}</span>
                      <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>{item.calorie} kcal</span>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center ml-2 flex-shrink-0 transition-colors"
                      style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}
                      aria-label={`${item.name_ko} 삭제`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 사진 업로드 */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#374151' }}>사진 추가</p>
              <div className="flex gap-3">
                <button onClick={() => galleryRef.current?.click()}
                  className="flex-1 rounded-2xl py-5 flex flex-col items-center gap-2"
                  style={{ backgroundColor: '#fff', border: `2px dashed ${BORDER}` }}>
                  <span className="text-3xl">🖼️</span>
                  <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>사진 보관함</span>
                </button>
                <button onClick={() => cameraRef.current?.click()}
                  className="flex-1 rounded-2xl py-5 flex flex-col items-center gap-2"
                  style={{ backgroundColor: '#fff', border: `2px dashed ${BORDER}` }}>
                  <span className="text-3xl">📸</span>
                  <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>카메라 촬영</span>
                </button>
              </div>
              <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0])} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0])} />
            </div>

            <button
              onClick={() => { setPhase('manual'); setManualCategory(null); }}
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{ border: `1px solid ${BORDER}`, color: '#9CA3AF', backgroundColor: '#fff' }}>
              ✏️ 직접 음식 검색
            </button>

            {error && (
              <div className="rounded-xl p-3" style={{ backgroundColor: '#FEE2E2' }}>
                <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
              </div>
            )}
          </>
        )}

        {/* ── predicting: 분석 중 ── */}
        {phase === 'predicting' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            {imagePreview && (
              <img src={imagePreview} alt="업로드 이미지"
                className="w-40 h-40 object-cover rounded-2xl"
                style={{ border: `2px solid ${BORDER}` }} />
            )}
            <div className="w-10 h-10 rounded-full border-4 animate-spin"
              style={{ borderColor: '#FCE4EC', borderTopColor: ACCENT }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: '#374151' }}>
                {hintAttempts > 0
                  ? `${CAT_ICONS[hintCategory]} "${hintCategory}" 기준으로 재분류 중...`
                  : 'AI가 음식을 분석하고 있어요...'}
              </p>
              {hintAttempts > 0 && (
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  {hintAttempts}번째 재시도
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── confirm: 결과 확인 (최초 & 힌트 재시도 공용) ── */}
        {phase === 'confirm' && prediction && (
          <div className="space-y-4">
            {imagePreview && (
              <img src={imagePreview} alt="업로드 이미지"
                className="w-full h-48 object-cover rounded-2xl"
                style={{ border: `1px solid ${BORDER}` }} />
            )}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                  {hintCategory
                    ? `${CAT_ICONS[hintCategory]} "${hintCategory}" 기준 재분류 결과`
                    : 'AI 인식 결과'}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,133,161,0.12)', color: ACCENT }}>
                  확신도 {Math.round((prediction.confidence || 0) * 100)}%
                </span>
              </div>
              <p className="text-2xl font-bold mt-1" style={{ color: '#1F2937' }}>
                {prediction.nutrition?.name_ko}
              </p>
              <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
                {prediction.nutrition?.category}
              </p>
              {hintAttempts > 0 && (
                <p className="text-xs mt-1" style={{ color: '#FF85A1' }}>
                  {hintAttempts}번째 재시도 결과예요
                </p>
              )}
              <div className="flex gap-4 mt-4">
                {[
                  { label: '칼로리', value: prediction.nutrition?.calorie, unit: 'kcal' },
                  { label: '탄수화물', value: prediction.nutrition?.carbs_g, unit: 'g' },
                  { label: '단백질', value: prediction.nutrition?.protein_g, unit: 'g' },
                  { label: '지방', value: prediction.nutrition?.fat_g, unit: 'g' },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="flex-1 text-center">
                    <p className="text-base font-bold" style={{ color: '#1F2937' }}>{value}{unit}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => confirmFood(prediction.nutrition)}
                className="flex-1 py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: '#34D399' }}>
                ✓ 맞아
              </button>
              <button onClick={() => setPhase('hint')}
                className="flex-1 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
                style={{ border: `1.5px solid #EF4444`, color: '#EF4444', backgroundColor: '#fff' }}>
                ✗ 다른 음식이야
              </button>
            </div>
            <button onClick={resetUpload} className="w-full py-2 text-sm" style={{ color: '#9CA3AF' }}>
              다시 촬영
            </button>
          </div>
        )}

        {/* ── hint: 카테고리 선택 → AI 재시도 ── */}
        {phase === 'hint' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>
                어떤 카테고리 음식인가요?
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                카테고리를 선택하면 AI가 그 범위 안에서 다시 분류해요
              </p>
              {hintAttempts > 0 && hintCategory && (
                <p className="text-xs mt-2 font-medium" style={{ color: ACCENT }}>
                  마지막 시도: {CAT_ICONS[hintCategory]} {hintCategory} ({hintAttempts}회)
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button key={cat}
                  onClick={() => runPredictWithHint(cat)}
                  className="rounded-2xl py-4 flex flex-col items-center gap-1.5 transition-colors"
                  style={{
                    backgroundColor: cat === hintCategory ? 'rgba(255,133,161,0.1)' : '#fff',
                    border: `1.5px solid ${cat === hintCategory ? ACCENT : BORDER}`,
                  }}>
                  <span className="text-2xl">{CAT_ICONS[cat]}</span>
                  <span className="text-xs font-medium" style={{ color: cat === hintCategory ? ACCENT : '#374151' }}>
                    {cat}
                  </span>
                  {cat === hintCategory && (
                    <span className="text-xs" style={{ color: ACCENT }}>마지막 시도</span>
                  )}
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-xl p-3" style={{ backgroundColor: '#FEE2E2' }}>
                <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
              </div>
            )}

            {/* 직접 선택은 AI 재시도가 계속 실패할 때 최후 수단 */}
            <button
              onClick={() => { setPhase('manual'); setManualCategory(hintCategory); }}
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{ border: `1px solid ${BORDER}`, color: '#9CA3AF', backgroundColor: '#fff' }}>
              AI가 계속 틀려요 — 직접 선택할게요
            </button>

            {prediction && (
              <button onClick={() => setPhase('confirm')} className="w-full py-2 text-sm" style={{ color: '#9CA3AF' }}>
                ← 이전 결과로 돌아가기
              </button>
            )}
          </div>
        )}

        {/* ── manual: 직접 선택 (최후 수단) ── */}
        {phase === 'manual' && (
          <ManualSelectPanel
            initialCategory={manualCategory}
            onSelect={confirmFood}
            onBack={() => setPhase(prediction ? 'hint' : 'ready')}
          />
        )}
      </div>
    </div>
  );
}

function ManualSelectPanel({ initialCategory, onSelect, onBack }) {
  const [category, setCategory] = useState(initialCategory);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCategory) loadFoods(initialCategory);
  }, [initialCategory]);

  async function loadFoods(cat) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/foods?category=${encodeURIComponent(cat)}`);
      const data = await res.json();
      setFoods(Object.entries(data.foods).map(([k, v]) => ({ food_class: k, ...v })));
    } catch { setFoods([]); }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
        <p className="text-sm font-semibold" style={{ color: '#374151' }}>직접 선택</p>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>카테고리를 먼저 고른 뒤 음식을 선택해주세요</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => { setCategory(cat); loadFoods(cat); }}
            className="rounded-xl py-2.5 text-xs font-medium flex items-center justify-center gap-1"
            style={{
              backgroundColor: category === cat ? 'rgba(255,133,161,0.12)' : '#fff',
              border: `1.5px solid ${category === cat ? ACCENT : BORDER}`,
              color: category === cat ? ACCENT : '#374151',
            }}>
            {CAT_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 rounded-full border-4 animate-spin"
            style={{ borderColor: '#FCE4EC', borderTopColor: ACCENT }} />
        </div>
      )}

      {!loading && category && foods.map((food) => (
        <button key={food.food_class} onClick={() => onSelect(food)}
          className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
          style={{ backgroundColor: '#fff', border: `1.5px solid ${BORDER}` }}>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#374151' }}>{food.name_ko}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {food.calorie} kcal · 탄 {food.carbs_g}g · 단 {food.protein_g}g · 지 {food.fat_g}g
            </p>
          </div>
          <span style={{ color: ACCENT }}>+</span>
        </button>
      ))}

      <button onClick={onBack} className="w-full py-2 text-sm" style={{ color: '#9CA3AF' }}>
        ← 돌아가기
      </button>
    </div>
  );
}

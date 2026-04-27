import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import BottomNav from '../components/BottomNav';
import NutritionBar from '../components/NutritionBar';
import { sumNutrition, calcExercise } from '../utils/calculations';
import { todayStr } from '../utils/calculations';

const ACCENT = '#FF85A1';
const BORDER = '#FCE4EC';

export default function ResultPage() {
  const { activeProfile, pendingItems, pendingMeta, clearPending, saveMealEntry, getMealsForDate } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (pendingItems.length === 0) navigate('/upload', { replace: true });
  }, []);

  if (pendingItems.length === 0) return null;

  const mealTotal = sumNutrition(pendingItems);
  const exercise = calcExercise(activeProfile?.weight_kg || 60, mealTotal.calorie);

  // 오늘 누적 (기존 저장분 + 현재 pending)
  const savedToday = getMealsForDate(pendingMeta?.date || todayStr());
  const savedNutrition = sumNutrition(savedToday.flatMap((m) => m.foods || []));
  const totalNutrition = {
    calorie: savedNutrition.calorie + mealTotal.calorie,
    carbs_g: savedNutrition.carbs_g + mealTotal.carbs_g,
    protein_g: savedNutrition.protein_g + mealTotal.protein_g,
    fat_g: savedNutrition.fat_g + mealTotal.fat_g,
  };

  function handleSave() {
    const meal = {
      id: Date.now().toString(),
      date: pendingMeta?.date || todayStr(),
      mealType: pendingMeta?.mealType || '기타',
      foods: pendingItems,
      total: mealTotal,
      savedAt: new Date().toISOString(),
    };
    saveMealEntry(meal);
    clearPending();
    navigate('/');
  }

  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#FFF5F7' }}>
      {/* 헤더 */}
      <header
        className="sticky top-0 z-40 flex items-center h-14 px-4 gap-2"
        style={{ backgroundColor: '#fff', borderBottom: `1px solid ${BORDER}` }}
      >
        <button onClick={() => navigate('/upload')} className="p-2 text-gray-500 text-lg">←</button>
        <h1 className="text-base font-bold" style={{ color: '#374151' }}>식사 결과</h1>
        <span className="ml-1 text-sm" style={{ color: '#9CA3AF' }}>
          {pendingMeta?.date} · {pendingMeta?.mealType}
        </span>
      </header>

      <div className="flex-1 px-5 py-4 pb-28 space-y-4 overflow-y-auto">
        {/* 음식 목록 */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold" style={{ color: '#374151' }}>
              이번 식사 ({pendingItems.length}가지)
            </p>
          </div>
          {pendingItems.map((food, i) => (
            <div
              key={food.id}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < pendingItems.length - 1 ? `1px solid #F9FAFB` : 'none' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>{food.name_ko}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                  탄 {food.carbs_g}g · 단 {food.protein_g}g · 지 {food.fat_g}g
                </p>
              </div>
              <p className="text-sm font-bold" style={{ color: ACCENT }}>{food.calorie} kcal</p>
            </div>
          ))}
        </div>

        {/* 한끼 총합 */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #FF85A1 0%, #FFB6C1 100%)' }}
        >
          <p className="text-white/80 text-xs font-medium mb-1">한끼 총 칼로리</p>
          <p className="text-white text-3xl font-bold">
            {Math.round(mealTotal.calorie)}
            <span className="text-base font-normal ml-1">kcal</span>
          </p>
          <div className="flex gap-6 mt-3">
            {[
              { label: '탄수화물', value: mealTotal.carbs_g },
              { label: '단백질', value: mealTotal.protein_g },
              { label: '지방', value: mealTotal.fat_g },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-white text-base font-bold">{Math.round(value)}g</p>
                <p className="text-white/70 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘 누적 영양 성분 */}
        {activeProfile && (
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>
              오늘 누적 영양 성분
            </p>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium" style={{ color: '#6B7280' }}>칼로리</span>
              <span className="text-xs font-semibold" style={{ color: totalNutrition.calorie > activeProfile.target_calories ? '#EF4444' : '#374151' }}>
                {Math.round(totalNutrition.calorie)} / {activeProfile.target_calories} kcal
              </span>
            </div>
            <div className="w-full rounded-full h-2.5 mb-4" style={{ backgroundColor: '#F3F4F6' }}>
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((totalNutrition.calorie / activeProfile.target_calories) * 100, 100)}%`,
                  backgroundColor: totalNutrition.calorie > activeProfile.target_calories ? '#EF4444' : ACCENT,
                }}
              />
            </div>
            <NutritionBar label="탄수화물" current={totalNutrition.carbs_g} target={activeProfile.target_carbs_g} color="#60A5FA" />
            <NutritionBar label="단백질" current={totalNutrition.protein_g} target={activeProfile.target_protein_g} color="#34D399" />
            <NutritionBar label="지방" current={totalNutrition.fat_g} target={activeProfile.target_fat_g} color="#FBBF24" />
          </div>
        )}

        {/* 운동량 환산 */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>
            운동량 환산
            <span className="ml-1 text-xs font-normal" style={{ color: '#9CA3AF' }}>
              ({activeProfile?.weight_kg}kg 기준)
            </span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🏃', label: '달리기', value: `${exercise.running_km} km`, sub: `1.036 kcal/kg·km` },
              { icon: '🚶', label: '걷기', value: `${exercise.walking_min} 분`, sub: `0.067 kcal/kg·min` },
              { icon: '🚴', label: '자전거', value: `${exercise.cycling_min} 분`, sub: `0.133 kcal/kg·min` },
            ].map(({ icon, label, value, sub }) => (
              <div
                key={label}
                className="rounded-2xl p-3 text-center"
                style={{ backgroundColor: '#FFF5F7', border: `1px solid ${BORDER}` }}
              >
                <p className="text-2xl mb-1">{icon}</p>
                <p className="text-base font-bold" style={{ color: ACCENT }}>{value}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#374151' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#C9C9C9' }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 저장 버튼 */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full px-5 pb-6 pt-3"
        style={{ maxWidth: 480, backgroundColor: '#FFF5F7' }}
      >
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl font-bold text-white text-base"
          style={{ background: 'linear-gradient(90deg, #FF85A1, #FFB6C1)' }}
        >
          💾 저장하기
        </button>
      </div>
    </div>
  );
}

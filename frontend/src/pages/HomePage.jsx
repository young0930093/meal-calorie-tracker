import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import BottomNav from '../components/BottomNav';
import NutritionBar from '../components/NutritionBar';
import { todayStr, sumNutrition, formatDate } from '../utils/calculations';

const ACCENT = '#FF85A1';
const BORDER = '#FCE4EC';
const MEAL_TYPES = ['아침', '점심', '저녁', '간식'];
const MEAL_ICONS = { 아침: '🌅', 점심: '☀️', 저녁: '🌙', 간식: '🍪' };

export default function HomePage() {
  const { activeProfile, profiles, setActiveProfile, getMealsForDate, deleteMealEntry } = useApp();
  const navigate = useNavigate();
  const today = todayStr();
  const todayMeals = getMealsForDate(today);

  const todayNutrition = sumNutrition(
    todayMeals.flatMap((m) => m.foods || [])
  );
  const caloriePct = activeProfile
    ? Math.min((todayNutrition.calorie / activeProfile.target_calories) * 100, 100)
    : 0;

  const groupedMeals = MEAL_TYPES.reduce((acc, type) => {
    acc[type] = todayMeals.filter((m) => m.mealType === type);
    return acc;
  }, {});

  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#FFF5F7' }}>
      {/* 헤더 */}
      <header
        className="sticky top-0 z-40 px-5 pt-5 pb-4"
        style={{ backgroundColor: '#FFF5F7' }}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </p>
            <h1 className="text-xl font-bold mt-0.5" style={{ color: '#1F2937' }}>
              안녕하세요, {activeProfile?.name}님 🌸
            </h1>
          </div>
          {/* 프로필 전환 버튼 */}
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium"
            style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, color: '#6B7280' }}
            onClick={() => navigate('/profile')}
          >
            <span className="text-base">{activeProfile?.gender === '여' ? '👩' : '👨'}</span>
            <span style={{ color: '#374151', fontWeight: 600 }}>{activeProfile?.name}</span>
            <span style={{ color: '#D1D5DB' }}>⇄</span>
          </button>
        </div>
      </header>

      <div className="flex-1 px-5 pb-28 space-y-4 overflow-y-auto">
        {/* 오늘 칼로리 요약 카드 */}
        <div
          className="rounded-3xl p-5"
          style={{ background: 'linear-gradient(135deg, #FF85A1 0%, #FFB6C1 100%)' }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/80 text-xs font-medium">오늘 섭취 칼로리</p>
              <p className="text-white text-3xl font-bold mt-0.5">
                {Math.round(todayNutrition.calorie)}
                <span className="text-base font-normal ml-1">kcal</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-xs">목표</p>
              <p className="text-white text-sm font-semibold mt-0.5">
                {activeProfile?.target_calories} kcal
              </p>
            </div>
          </div>

          {/* 칼로리 진행 바 */}
          <div className="w-full rounded-full h-2 bg-white/30">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${caloriePct}%`, backgroundColor: '#fff' }}
            />
          </div>
          <p className="text-white/70 text-xs mt-2 text-right">
            {Math.round(caloriePct)}% 달성
          </p>
        </div>

        {/* 탄단지 진행 바 */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}
        >
          <p className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>
            오늘 영양 성분
          </p>
          <NutritionBar
            label="탄수화물"
            current={todayNutrition.carbs_g}
            target={activeProfile?.target_carbs_g || 0}
            color="#60A5FA"
          />
          <NutritionBar
            label="단백질"
            current={todayNutrition.protein_g}
            target={activeProfile?.target_protein_g || 0}
            color="#34D399"
          />
          <NutritionBar
            label="지방"
            current={todayNutrition.fat_g}
            target={activeProfile?.target_fat_g || 0}
            color="#FBBF24"
          />
        </div>

        {/* 식사 추가 버튼 */}
        <button
          onClick={() => navigate('/upload')}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white text-base transition-opacity active:opacity-80"
          style={{ background: 'linear-gradient(90deg, #FF85A1, #FFB6C1)' }}
        >
          <span className="text-xl">+</span> 식사 추가
        </button>

        {/* 오늘 식사 기록 */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>
            오늘 식사 기록
          </p>
          {MEAL_TYPES.every((t) => groupedMeals[t].length === 0) ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}
            >
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                아직 기록된 식사가 없어요<br />+ 식사 추가 버튼으로 시작해보세요
              </p>
            </div>
          ) : (
            MEAL_TYPES.map((type) => {
              const meals = groupedMeals[type];
              if (meals.length === 0) return null;
              const mealNutrition = sumNutrition(meals.flatMap((m) => m.foods || []));
              return (
                <div
                  key={type}
                  className="rounded-2xl mb-3"
                  style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}
                >
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{MEAL_ICONS[type]}</span>
                      <span className="text-sm font-semibold" style={{ color: '#374151' }}>{type}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: ACCENT }}>
                      {Math.round(mealNutrition.calorie)} kcal
                    </span>
                  </div>
                  <div className="px-4 pb-4 space-y-1">
                    {meals.flatMap((m) => m.foods || []).map((food, i) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <span className="text-sm" style={{ color: '#6B7280' }}>{food.name_ko}</span>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>
                          {food.calorie} kcal · 탄 {food.carbs_g}g · 단 {food.protein_g}g · 지 {food.fat_g}g
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import BottomNav from '../components/BottomNav';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine, Legend,
} from 'recharts';
import { sumNutrition, getPast7Days, formatDate, linearRegressionSlope } from '../utils/calculations';

const ACCENT = '#FF85A1';
const BORDER = '#FCE4EC';
const MACRO_COLORS = ['#60A5FA', '#34D399', '#FBBF24'];

export default function HistoryPage() {
  const { getAllMeals, activeProfile } = useApp();
  const allMeals = getAllMeals();

  const past7Days = getPast7Days();

  // 날짜별 칼로리 집계
  const dailyData = useMemo(() => {
    return past7Days.map((date) => {
      const meals = allMeals.filter((m) => m.date === date);
      const nutrition = sumNutrition(meals.flatMap((m) => m.foods || []));
      return {
        date,
        label: formatDate(date),
        calorie: Math.round(nutrition.calorie),
        carbs_g: Math.round(nutrition.carbs_g),
        protein_g: Math.round(nutrition.protein_g),
        fat_g: Math.round(nutrition.fat_g),
      };
    });
  }, [allMeals]);

  // 오늘 탄단지 비율 (도넛 차트)
  const todayData = dailyData[dailyData.length - 1];
  const macroData = useMemo(() => {
    const total = todayData.carbs_g + todayData.protein_g + todayData.fat_g;
    if (total === 0) return [];
    return [
      { name: '탄수화물', value: todayData.carbs_g, pct: Math.round((todayData.carbs_g / total) * 100) },
      { name: '단백질', value: todayData.protein_g, pct: Math.round((todayData.protein_g / total) * 100) },
      { name: '지방', value: todayData.fat_g, pct: Math.round((todayData.fat_g / total) * 100) },
    ];
  }, [todayData]);

  // 주간 추세선 (선형 회귀)
  const calorieValues = dailyData.map((d) => d.calorie);
  const slope = linearRegressionSlope(calorieValues);
  const meanCalorie = calorieValues.reduce((a, v) => a + v, 0) / calorieValues.length;
  const regressionLine = dailyData.map((d, i) => ({
    ...d,
    trend: Math.round(meanCalorie + slope * (i - (dailyData.length - 1) / 2)),
  }));

  const slopeTrend = slope > 10 ? '📈 증가 추세' : slope < -10 ? '📉 감소 추세' : '➡️ 안정적';
  const slopeColor = slope > 10 ? '#EF4444' : slope < -10 ? '#34D399' : '#9CA3AF';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl p-3 shadow-md" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#374151' }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-xs" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#FFF5F7' }}>
      <header
        className="sticky top-0 z-40 flex items-center h-14 px-5"
        style={{ backgroundColor: '#FFF5F7' }}
      >
        <h1 className="text-xl font-bold" style={{ color: '#1F2937' }}>히스토리 📊</h1>
      </header>

      <div className="flex-1 px-5 pb-28 space-y-4 overflow-y-auto">
        {/* 주간 칼로리 바 차트 */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>7일 칼로리</p>
          {activeProfile && (
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              목표: {activeProfile.target_calories} kcal/일
            </p>
          )}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,182,193,0.15)' }} />
              {activeProfile && (
                <ReferenceLine y={activeProfile.target_calories} stroke={ACCENT} strokeDasharray="4 4" />
              )}
              <Bar dataKey="calorie" name="칼로리" radius={[6, 6, 0, 0]}>
                {dailyData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      activeProfile && entry.calorie > activeProfile.target_calories
                        ? '#FCA5A5'
                        : index === dailyData.length - 1
                        ? ACCENT
                        : '#FFB6C1'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 오늘 탄단지 도넛 차트 */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>오늘 탄단지 비율</p>
          {macroData.length === 0 ? (
            <p className="text-center text-sm py-6" style={{ color: '#9CA3AF' }}>오늘 기록된 식사가 없어요</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%" cy="50%"
                    innerRadius={40} outerRadius={60}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {macroData.map((_, index) => (
                      <Cell key={index} fill={MACRO_COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {macroData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: MACRO_COLORS[i] }} />
                    <span className="text-xs flex-1" style={{ color: '#374151' }}>{item.name}</span>
                    <span className="text-xs font-semibold" style={{ color: '#374151' }}>
                      {item.value}g <span style={{ color: '#9CA3AF' }}>({item.pct}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 주간 추세선 */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-semibold" style={{ color: '#374151' }}>주간 칼로리 추세</p>
            <span className="text-xs font-semibold" style={{ color: slopeColor }}>{slopeTrend}</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={regressionLine}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="calorie" name="칼로리"
                stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone" dataKey="trend" name="추세"
                stroke="#9CA3AF" strokeWidth={1.5} dot={false}
                strokeDasharray="4 4"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
            기울기: {slope > 0 ? '+' : ''}{slope.toFixed(1)} kcal/일
            {' '}(선형 회귀)
          </p>
        </div>

        {/* 주간 요약 테이블 */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold" style={{ color: '#374151' }}>7일 상세 기록</p>
          </div>
          {dailyData.map((d, i) => (
            <div
              key={d.date}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < dailyData.length - 1 ? '1px solid #F9FAFB' : 'none' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>{d.label}</p>
                {i === dailyData.length - 1 && (
                  <span className="text-xs" style={{ color: ACCENT }}>오늘</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: d.calorie > 0 ? '#1F2937' : '#D1D5DB' }}>
                  {d.calorie > 0 ? `${d.calorie} kcal` : '기록 없음'}
                </p>
                {d.calorie > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    탄{d.carbs_g}g · 단{d.protein_g}g · 지{d.fat_g}g
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

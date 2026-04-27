import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import BottomNav from '../components/BottomNav';
import { exportAllData } from '../utils/storage';

const ACCENT = '#FF85A1';
const BORDER = '#FCE4EC';
const ACTIVITY_OPTIONS = [
  { value: '적음', desc: '주로 앉아서 생활' },
  { value: '보통', desc: '주 3~5회 가벼운 운동' },
  { value: '많음', desc: '매일 격렬한 운동' },
];

export default function SettingsPage() {
  const { activeProfile, updateProfile, logout, user, activeId } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(
    activeProfile
      ? {
          name: activeProfile.name,
          gender: activeProfile.gender,
          age: String(activeProfile.age),
          height_cm: String(activeProfile.height_cm),
          weight_kg: String(activeProfile.weight_kg),
          activity: activeProfile.activity,
        }
      : {}
  );
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState('');

  function handleSave(e) {
    e.preventDefault();
    if (!activeProfile) return;
    updateProfile(activeProfile.id, {
      ...form,
      age: Number(form.age),
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    const data = exportAllData(activeId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.meals || !Array.isArray(data.meals)) throw new Error('올바른 형식이 아닙니다');
        // 기존 데이터에 병합 (날짜 기준 중복 제거)
        const existing = activeId ? JSON.parse(localStorage.getItem(`meal_tracker:meals:${activeId}`) || '[]') : [];
        const existingIds = new Set(existing.map((m) => m.id));
        const newMeals = data.meals.filter((m) => !existingIds.has(m.id));
        const merged = [...existing, ...newMeals];
        if (activeId) localStorage.setItem(`meal_tracker:meals:${activeId}`, JSON.stringify(merged));
        setImportError(`✅ ${newMeals.length}개 식사 기록을 불러왔어요`);
      } catch (err) {
        setImportError(`❌ 불러오기 실패: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleLogout() {
    if (window.confirm('로그아웃 하시겠어요?')) {
      logout();
      navigate('/login');
    }
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  if (!activeProfile) return null;

  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#FFF5F7' }}>
      <header
        className="sticky top-0 z-40 flex items-center h-14 px-5"
        style={{ backgroundColor: '#FFF5F7' }}
      >
        <h1 className="text-xl font-bold" style={{ color: '#1F2937' }}>설정 ⚙️</h1>
      </header>

      <div className="flex-1 px-5 pb-28 space-y-4 overflow-y-auto">
        {/* 프로필 요약 카드 */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: '#FFF5F7' }}
            >
              {activeProfile.gender === '여' ? '👩' : '👨'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: '#1F2937' }}>{activeProfile.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                {activeProfile.age}세 · {activeProfile.height_cm}cm · {activeProfile.weight_kg}kg
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl text-xs font-semibold"
              style={{ backgroundColor: 'rgba(255,133,161,0.1)', border: `1.5px solid ${ACCENT}`, color: ACCENT, minWidth: 56 }}
            >
              <span className="text-base">⇄</span>
              <span>전환</span>
            </button>
          </div>

          {/* BMR / TDEE 요약 */}
          <div className="flex gap-3 mt-4">
            {[
              { label: 'BMR', value: `${activeProfile.bmr} kcal` },
              { label: 'TDEE', value: `${activeProfile.tdee} kcal` },
              { label: '목표', value: `${activeProfile.target_calories} kcal` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex-1 rounded-xl p-2.5 text-center"
                style={{ backgroundColor: '#FFF5F7', border: `1px solid ${BORDER}` }}
              >
                <p className="text-sm font-bold" style={{ color: ACCENT }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 프로필 수정 */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
          <button
            onClick={() => setEditing((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="text-sm font-semibold" style={{ color: '#374151' }}>프로필 수정</span>
            <span className="text-sm" style={{ color: ACCENT }}>{editing ? '닫기' : '수정'}</span>
          </button>

          {editing && (
            <form onSubmit={handleSave} className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <div className="pt-4">
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#374151' }}>이름</label>
                <input
                  type="text" value={form.name}
                  onChange={(e) => set('name', e.target.value)} required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: `1px solid ${BORDER}`, backgroundColor: '#FAFAFA' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: '#374151' }}>성별</label>
                <div className="flex gap-2">
                  {[{ v: '여', l: '👩 여성' }, { v: '남', l: '👨 남성' }].map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => set('gender', v)}
                      className="flex-1 py-3 rounded-xl text-sm font-medium"
                      style={{
                        backgroundColor: form.gender === v ? 'rgba(255,133,161,0.12)' : '#F9FAFB',
                        border: `1.5px solid ${form.gender === v ? ACCENT : BORDER}`,
                        color: form.gender === v ? ACCENT : '#374151',
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '나이', field: 'age', unit: '세' },
                  { label: '키', field: 'height_cm', unit: 'cm' },
                  { label: '체중', field: 'weight_kg', unit: 'kg' },
                ].map(({ label, field, unit }) => (
                  <div key={field}>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: '#374151' }}>{label}</label>
                    <div className="relative">
                      <input
                        type="number" value={form[field]} required
                        onChange={(e) => set(field, e.target.value)}
                        className="w-full rounded-xl px-3 py-3 text-sm outline-none pr-8"
                        style={{ border: `1px solid ${BORDER}`, backgroundColor: '#FAFAFA' }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: '#374151' }}>활동량</label>
                <div className="flex gap-2">
                  {ACTIVITY_OPTIONS.map(({ value }) => (
                    <button key={value} type="button" onClick={() => set('activity', value)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-medium"
                      style={{
                        backgroundColor: form.activity === value ? 'rgba(255,133,161,0.12)' : '#F9FAFB',
                        border: `1.5px solid ${form.activity === value ? ACCENT : BORDER}`,
                        color: form.activity === value ? ACCENT : '#374151',
                      }}>
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl font-semibold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                저장하기
              </button>
            </form>
          )}
        </div>

        {saved && (
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(52,211,153,0.15)', border: '1px solid #6EE7B7' }}>
            <p className="text-sm font-medium" style={{ color: '#059669' }}>✅ 프로필이 저장되었어요!</p>
          </div>
        )}

        {/* 데이터 관리 */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold" style={{ color: '#374151' }}>데이터 관리</p>
          </div>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid #F9FAFB` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📤</span>
              <div>
                <p className="text-sm font-medium text-left" style={{ color: '#374151' }}>JSON으로 내보내기</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>식사 기록을 파일로 저장</p>
              </div>
            </div>
            <span style={{ color: '#D1D5DB' }}>›</span>
          </button>

          <label className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">📥</span>
              <div>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>JSON 불러오기</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>내보낸 파일을 가져와 병합</p>
              </div>
            </div>
            <span style={{ color: '#D1D5DB' }}>›</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>

          {importError && (
            <div className="px-5 pb-4">
              <p className="text-xs" style={{ color: importError.startsWith('✅') ? '#059669' : '#EF4444' }}>
                {importError}
              </p>
            </div>
          )}
        </div>

        {/* 목표 영양 정보 */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>일일 영양 목표</p>
          <div className="space-y-2">
            {[
              { label: '칼로리', value: `${activeProfile.target_calories} kcal` },
              { label: '탄수화물', value: `${activeProfile.target_carbs_g} g` },
              { label: '단백질', value: `${activeProfile.target_protein_g} g` },
              { label: '지방', value: `${activeProfile.target_fat_g} g` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1.5"
                style={{ borderBottom: '1px solid #F9FAFB' }}>
                <span className="text-sm" style={{ color: '#6B7280' }}>{label}</span>
                <span className="text-sm font-semibold" style={{ color: '#374151' }}>{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: '#C9C9C9' }}>
            Harris-Benedict 공식 기반 · 활동량: {activeProfile.activity}
          </p>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl font-semibold text-sm"
          style={{ border: `1.5px solid #FCA5A5`, color: '#EF4444', backgroundColor: '#FFF5F5' }}
        >
          로그아웃
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

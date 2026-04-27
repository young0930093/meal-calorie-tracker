import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import PaymentModal from '../components/PaymentModal';

const ACCENT = '#FF85A1';
const BORDER = '#FCE4EC';
const MAX_PROFILES = 5;

const ACTIVITY_OPTIONS = [
  { value: '적음', label: '적음', desc: '주로 앉아서 생활 (사무직 등)' },
  { value: '보통', label: '보통', desc: '주 3~5회 가벼운 운동' },
  { value: '많음', label: '많음', desc: '매일 격렬한 운동 또는 육체노동' },
];

function ProfileForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState(
    initial || { name: '', gender: '여', age: '', height_cm: '', weight_kg: '', activity: '보통' }
  );

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.age || !form.height_cm || !form.weight_kg) return;
    onSubmit({
      ...form,
      age: Number(form.age),
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 이름 */}
      <div>
        <label className="text-sm font-semibold block mb-1.5" style={{ color: '#374151' }}>이름</label>
        <input
          type="text" value={form.name} placeholder="프로필 이름 입력"
          onChange={(e) => set('name', e.target.value)} required
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{ border: `1px solid ${BORDER}`, backgroundColor: '#FAFAFA' }}
        />
      </div>

      {/* 성별 */}
      <div>
        <label className="text-sm font-semibold block mb-2" style={{ color: '#374151' }}>성별</label>
        <div className="flex gap-2">
          {[{ v: '여', e: '👩', l: '여성' }, { v: '남', e: '👨', l: '남성' }].map(({ v, e, l }) => (
            <button key={v} type="button" onClick={() => set('gender', v)}
              className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              style={{
                backgroundColor: form.gender === v ? 'rgba(255,133,161,0.12)' : '#F9FAFB',
                border: `1.5px solid ${form.gender === v ? ACCENT : BORDER}`,
                color: form.gender === v ? ACCENT : '#374151',
              }}>
              {e} {l}
            </button>
          ))}
        </div>
      </div>

      {/* 나이 / 키 / 체중 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '나이', field: 'age', unit: '세', placeholder: '25' },
          { label: '키', field: 'height_cm', unit: 'cm', placeholder: '165' },
          { label: '체중', field: 'weight_kg', unit: 'kg', placeholder: '60' },
        ].map(({ label, field, unit, placeholder }) => (
          <div key={field}>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: '#374151' }}>{label}</label>
            <div className="relative">
              <input
                type="number" value={form[field]} placeholder={placeholder} required
                onChange={(e) => set(field, e.target.value)}
                className="w-full rounded-xl px-3 py-3 text-sm outline-none pr-8"
                style={{ border: `1px solid ${BORDER}`, backgroundColor: '#FAFAFA' }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 활동량 */}
      <div>
        <label className="text-sm font-semibold block mb-2" style={{ color: '#374151' }}>활동량</label>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map(({ value, label, desc }) => (
            <button key={value} type="button" onClick={() => set('activity', value)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
              style={{
                backgroundColor: form.activity === value ? 'rgba(255,133,161,0.08)' : '#F9FAFB',
                border: `1.5px solid ${form.activity === value ? ACCENT : BORDER}`,
              }}>
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: form.activity === value ? ACCENT : '#D1D5DB' }}
              >
                {form.activity === value && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: form.activity === value ? ACCENT : '#374151' }}>
                  {label}
                </p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-1 py-4 rounded-2xl text-sm font-medium"
            style={{ border: `1px solid ${BORDER}`, color: '#9CA3AF', backgroundColor: '#fff' }}>
            취소
          </button>
        )}
        <button type="submit"
          className="flex-1 py-4 rounded-2xl font-semibold text-white text-base"
          style={{ backgroundColor: ACCENT }}>
          {initial ? '저장하기' : '프로필 만들기'}
        </button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const { profiles, createProfile, setActiveProfile, user } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState(profiles.length === 0 ? 'create' : 'select');
  const [showPayment, setShowPayment] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  function handleFormSubmit(data) {
    if (profiles.length >= 1) {
      // 2번째 이상 프로필 — 결제 필요
      setPendingData(data);
      setShowPayment(true);
    } else {
      doCreate(data);
    }
  }

  function doCreate(data) {
    const p = createProfile(data);
    setActiveProfile(p.id);
    navigate('/');
  }

  function handlePaymentSuccess() {
    setShowPayment(false);
    if (pendingData) doCreate(pendingData);
  }

  function handleSelectProfile(id) {
    setActiveProfile(id);
    navigate('/');
  }

  if (view === 'create') {
    return (
      <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#FFF5F7' }}>
        <header
          className="sticky top-0 z-40 flex items-center h-14 px-4 gap-2"
          style={{ backgroundColor: '#fff', borderBottom: `1px solid ${BORDER}` }}
        >
          {profiles.length > 0 && (
            <button onClick={() => setView('select')} className="p-2 text-gray-500">←</button>
          )}
          <h1 className="text-base font-bold" style={{ color: '#374151' }}>
            {profiles.length === 0 ? '프로필 만들기' : '새 프로필 추가'}
          </h1>
        </header>

        <div className="flex-1 px-5 py-6">
          <div className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255,182,193,0.15)', border: `1px solid ${BORDER}` }}>
            <p className="text-sm" style={{ color: '#374151' }}>
              입력한 정보로 <strong>BMR/TDEE</strong>를 계산해 맞춤 영양 목표를 설정해요 🌸
            </p>
          </div>
          <ProfileForm onSubmit={handleFormSubmit} onCancel={profiles.length > 0 ? () => setView('select') : null} />
        </div>

        {showPayment && (
          <PaymentModal
            onSuccess={handlePaymentSuccess}
            onCancel={() => { setShowPayment(false); setPendingData(null); }}
          />
        )}
      </div>
    );
  }

  // 프로필 선택 화면
  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#FFF5F7' }}>
      <header
        className="sticky top-0 z-40 flex items-center justify-between h-14 px-4"
        style={{ backgroundColor: '#fff', borderBottom: `1px solid ${BORDER}` }}
      >
        <h1 className="text-base font-bold" style={{ color: '#374151' }}>프로필 선택</h1>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>
            {user?.email}
          </span>
        </div>
      </header>

      <div className="flex-1 px-5 py-6 space-y-3">
        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
          사용할 프로필을 선택해주세요
        </p>

        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelectProfile(p.id)}
            className="w-full rounded-2xl p-4 flex items-center gap-4 text-left transition-shadow hover:shadow-md"
            style={{ backgroundColor: '#fff', border: `1.5px solid ${BORDER}` }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: '#FFF5F7' }}
            >
              {p.gender === '여' ? '👩' : '👨'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: '#374151' }}>{p.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                {p.age}세 · {p.height_cm}cm · {p.weight_kg}kg · {p.activity}
              </p>
              <p className="text-xs mt-0.5" style={{ color: ACCENT }}>
                목표 {p.target_calories} kcal/일
              </p>
            </div>
            <span style={{ color: ACCENT }}>›</span>
          </button>
        ))}

        {profiles.length < MAX_PROFILES && (
          <button
            onClick={() => setView('create')}
            className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 border-dashed"
            style={{ border: `2px dashed ${BORDER}`, color: '#9CA3AF', backgroundColor: 'transparent' }}
          >
            <span className="text-xl">+</span>
            <span className="text-sm font-medium">
              새 프로필 추가 {profiles.length >= 1 && '(유료)'}
            </span>
          </button>
        )}

        {profiles.length >= MAX_PROFILES && (
          <p className="text-center text-xs" style={{ color: '#9CA3AF' }}>
            최대 5개 프로필까지 등록 가능합니다
          </p>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          onSuccess={handlePaymentSuccess}
          onCancel={() => { setShowPayment(false); setPendingData(null); }}
        />
      )}
    </div>
  );
}

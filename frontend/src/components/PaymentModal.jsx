/**
 * PaymentModal — Stripe 실제 결제 연동
 *
 * 환경변수 VITE_STRIPE_PUBLISHABLE_KEY 설정 여부에 따라 자동 분기:
 *   - 설정됨 → Stripe Elements (실제 카드 결제)
 *   - 미설정 또는 백엔드 오류 → Mock 결제로 자동 폴백
 *
 * 테스트 카드 번호 (Stripe 제공):
 *   성공: 4242 4242 4242 4242 / 유효기간 미래 / CVC 아무 3자리
 *   실패: 4000 0000 0000 0002
 */

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const ACCENT = '#FF85A1';
const BORDER = '#FCE4EC';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// loadStripe는 모듈 레벨에서 한 번만 호출 (컴포넌트 외부)
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

// ── 공통 UI: 상품 요약 / 완료 / 로딩 ──────────────
function ProductSummary() {
  return (
    <div className="rounded-2xl p-4 mb-5 flex justify-between items-center"
      style={{ backgroundColor: '#FFF5F7', border: `1px solid ${BORDER}` }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#374151' }}>추가 프로필 슬롯 1개</p>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>최대 5개 프로필까지 등록 가능</p>
      </div>
      <p className="text-lg font-bold" style={{ color: ACCENT }}>₩2,900</p>
    </div>
  );
}

function DoneScreen() {
  return (
    <div className="flex flex-col items-center py-10 gap-3">
      <div className="text-6xl">✅</div>
      <p className="text-xl font-bold" style={{ color: '#374151' }}>결제 완료!</p>
      <p className="text-sm" style={{ color: '#9CA3AF' }}>추가 프로필을 생성할 수 있어요</p>
    </div>
  );
}

function LoadingScreen({ label = '결제 처리 중...' }) {
  return (
    <div className="flex flex-col items-center py-10 gap-4">
      <div className="w-12 h-12 rounded-full border-4 animate-spin"
        style={{ borderColor: '#FCE4EC', borderTopColor: ACCENT }} />
      <p className="text-sm" style={{ color: '#9CA3AF' }}>{label}</p>
    </div>
  );
}

// ── Stripe Elements 결제 폼 ────────────────────────
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#374151',
      '::placeholder': { color: '#9CA3AF' },
    },
    invalid: { color: '#EF4444', iconColor: '#EF4444' },
  },
  hidePostalCode: true,
};

function StripePaymentForm({ onSuccess, onFallback, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [cardReady, setCardReady] = useState(false); // onReady 전까지 버튼 비활성화

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    // setLoading(true) 이전에 먼저 가져와야 함:
    // setLoading → 리렌더 → CardElement 언마운트 → getElement(CardElement) === null
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('카드 입력 폼을 불러올 수 없어요. 페이지를 새로고침해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. 백엔드에서 PaymentIntent 생성
      const res = await fetch(`${API_URL}/api/payment/create-intent`, { method: 'POST' });

      if (res.status === 503) {
        // Stripe 미설정 → Mock으로 폴백
        onFallback('백엔드 Stripe 미설정 → Mock 결제로 전환합니다');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail?.message || '결제 초기화에 실패했어요');
      }

      const { client_secret } = await res.json();

      // 2. 카드 결제 확인 (위에서 미리 가져온 cardElement 사용)
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        // 카드 거절, 잘못된 번호 등
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        setDone(true);
        setTimeout(onSuccess, 1200);
      }
    } catch (err) {
      setError(err.message || '알 수 없는 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  }

  if (done) return <DoneScreen />;

  // ⚠️ loading 상태에서 early return 금지.
  // <LoadingScreen/>으로 교체되면 <CardElement/>가 언마운트되어
  // confirmCardPayment 호출 시 "not mounted" 에러 발생.
  // 결제 완료(done)까지 CardElement는 항상 DOM에 유지해야 함.
  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold" style={{ color: '#374151' }}>추가 프로필 결제</h2>
        <button onClick={onCancel} disabled={loading} className="text-gray-400 text-2xl leading-none">×</button>
      </div>

      <ProductSummary />

      {/* Stripe의 CardElement — 결제 완료 전까지 언마운트 금지 */}
      <form onSubmit={handlePay} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: '#374151' }}>
            카드 정보
          </label>
          <div className="rounded-xl px-4 py-3.5" style={{ border: `1px solid ${BORDER}`, backgroundColor: '#FAFAFA' }}>
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onReady={() => setCardReady(true)}
            />
          </div>
          {!cardReady && (
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>카드 입력 폼 로딩 중...</p>
          )}
          <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>
            테스트 카드: 4242 4242 4242 4242 / 미래 날짜 / 아무 CVC
          </p>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
            <p className="text-sm" style={{ color: '#DC2626' }}>❌ {error}</p>
          </div>
        )}

        {/* loading 중에도 버튼만 교체 — 폼/CardElement는 유지 */}
        <button
          type="submit"
          disabled={!stripe || !cardReady || loading}
          className="w-full py-4 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-2"
          style={{ backgroundColor: ACCENT, opacity: (!stripe || !cardReady || loading) ? 0.7 : 1 }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
              결제 처리 중...
            </>
          ) : '₩2,900 결제하기'}
        </button>
        <p className="text-center text-xs" style={{ color: '#C9C9C9' }}>
          Stripe 테스트 모드 · 실제 금액이 청구되지 않습니다
        </p>
      </form>
    </>
  );
}

// ── Mock 결제 폼 (Stripe 미설정 시 폴백) ───────────
function MockPaymentForm({ onSuccess, onCancel, fallbackReason }) {
  const [form, setForm] = useState({ card: '', expiry: '', cvc: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

  function validate() {
    const e = {};
    if (form.card.replace(/\s/g,'').length < 16) e.card = '카드 번호 16자리를 입력해주세요';
    if (form.expiry.length < 5) e.expiry = 'MM/YY 형식으로 입력해주세요';
    if (form.cvc.length < 3) e.cvc = 'CVC 3자리를 입력해주세요';
    return e;
  }

  async function handlePay() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    // Mock 결제 처리 — STRIPE_SECRET_KEY 설정 시 Stripe로 자동 전환됨
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setDone(true);
    setTimeout(onSuccess, 1000);
  }

  if (done) return <DoneScreen />;
  if (loading) return <LoadingScreen />;

  const inputStyle = (field) => ({
    border: `1px solid ${errors[field] ? '#EF4444' : BORDER}`,
    backgroundColor: '#FAFAFA',
  });

  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold" style={{ color: '#374151' }}>추가 프로필 결제</h2>
        <button onClick={onCancel} className="text-gray-400 text-2xl leading-none">×</button>
      </div>

      {/* Mock 모드 안내 배너 */}
      <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: '#FFF9E6', border: '1px solid #FDE68A' }}>
        <p className="text-xs font-medium" style={{ color: '#92400E' }}>⚠️ Mock 결제 모드</p>
        <p className="text-xs mt-0.5" style={{ color: '#92400E' }}>
          {fallbackReason || '아무 숫자나 입력해도 결제 완료 처리됩니다'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#92400E' }}>
          실제 Stripe 연동: backend/.env에 <code className="px-1 rounded" style={{ backgroundColor: '#FEF3C7' }}>STRIPE_SECRET_KEY</code> 설정
        </p>
      </div>

      <ProductSummary />

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5" style={{ color: '#374151' }}>카드 번호</label>
          <input type="text" inputMode="numeric" placeholder="0000 0000 0000 0000"
            value={form.card}
            onChange={(e) => { setForm(f => ({ ...f, card: fmtCard(e.target.value) })); setErrors(er => ({ ...er, card: null })); }}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle('card')} />
          {errors.card && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.card}</p>}
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#374151' }}>유효기간</label>
            <input type="text" inputMode="numeric" placeholder="MM/YY"
              value={form.expiry}
              onChange={(e) => { setForm(f => ({ ...f, expiry: fmtExpiry(e.target.value) })); setErrors(er => ({ ...er, expiry: null })); }}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle('expiry')} />
            {errors.expiry && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.expiry}</p>}
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#374151' }}>CVC</label>
            <input type="text" inputMode="numeric" placeholder="000"
              value={form.cvc}
              onChange={(e) => { setForm(f => ({ ...f, cvc: e.target.value.replace(/\D/g,'').slice(0,3) })); setErrors(er => ({ ...er, cvc: null })); }}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle('cvc')} />
            {errors.cvc && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.cvc}</p>}
          </div>
        </div>
      </div>

      <button onClick={handlePay}
        className="w-full mt-6 py-4 rounded-2xl font-semibold text-white text-base"
        style={{ backgroundColor: ACCENT }}>
        ₩2,900 결제하기 (Mock)
      </button>
    </>
  );
}

// ── 메인 PaymentModal ──────────────────────────────
export default function PaymentModal({ onSuccess, onCancel }) {
  const [fallbackReason, setFallbackReason] = useState('');
  const [useMock, setUseMock] = useState(!stripePromise);

  function handleFallback(reason) {
    setFallbackReason(reason);
    setUseMock(true);
  }

  const inner = useMock ? (
    <MockPaymentForm
      onSuccess={onSuccess}
      onCancel={onCancel}
      fallbackReason={fallbackReason}
    />
  ) : (
    <Elements stripe={stripePromise}>
      <StripePaymentForm
        onSuccess={onSuccess}
        onCancel={onCancel}
        onFallback={handleFallback}
      />
    </Elements>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full rounded-t-3xl p-6 pb-10"
        style={{ backgroundColor: '#fff', maxWidth: 480 }}>
        {inner}
      </div>
    </div>
  );
}

/*
 * ══════════════════════════════════════════════════════
 * Stripe 테스트 모드 설정 방법
 * ══════════════════════════════════════════════════════
 *
 * 1. https://stripe.com 접속 → 계정 생성 (무료)
 *
 * 2. 대시보드 → 우측 상단 [테스트 모드] 토글 ON 확인
 *
 * 3. 개발자 → API 키
 *    - 공개 키 (pk_test_...): frontend/.env의 VITE_STRIPE_PUBLISHABLE_KEY
 *    - 비밀 키 (sk_test_...): backend/.env의 STRIPE_SECRET_KEY
 *
 * 4. 테스트 카드 번호:
 *    ✅ 성공: 4242 4242 4242 4242
 *    ❌ 거절: 4000 0000 0000 0002
 *    유효기간: 미래 날짜 (예: 12/26)
 *    CVC: 임의 3자리
 *
 * 5. 설정 후 Vite + uvicorn 재시작 필요
 */

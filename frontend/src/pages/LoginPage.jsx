/**
 * LoginPage — Google OAuth 2.0 실제 연동
 *
 * 환경변수 VITE_GOOGLE_CLIENT_ID 설정 여부에 따라 자동 분기:
 *   - 설정됨 → @react-oauth/google의 useGoogleLogin 사용 (실제 OAuth 팝업)
 *   - 미설정 → Mock 로그인 (개발 편의용)
 *
 * Google Cloud Console 설정 방법은 이 파일 하단 주석 참고.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useApp } from '../contexts/AppContext';

const ACCENT = '#FF85A1';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── 실제 Google 로그인 버튼 ─────────────────────
// GoogleOAuthProvider가 context에 있을 때만 렌더링
function RealGoogleLoginButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // access_token으로 Google UserInfo API 호출
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) throw new Error('사용자 정보를 가져올 수 없어요');
        const info = await res.json();
        onSuccess({
          id: info.sub,
          name: info.name,
          email: info.email,
          picture: info.picture,
        });
      } catch (e) {
        onError(e.message);
        setLoading(false);
      }
    },
    onError: (err) => {
      // 팝업 차단이나 사용자가 취소한 경우도 여기로 들어옴
      const msg = err?.error === 'popup_closed_by_user'
        ? '로그인 팝업이 닫혔습니다. 다시 시도해주세요.'
        : 'Google 로그인에 실패했어요. 다시 시도해주세요.';
      onError(msg);
    },
  });

  return (
    <button
      onClick={() => { setLoading(true); googleLogin(); }}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-medium text-base transition-opacity"
      style={{
        backgroundColor: '#fff',
        border: '1.5px solid #E5E7EB',
        color: '#374151',
        opacity: loading ? 0.7 : 1,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {loading ? (
        <div className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: '#E5E7EB', borderTopColor: '#374151' }} />
      ) : (
        <GoogleSVG />
      )}
      {loading ? '로그인 중...' : 'Google로 로그인'}
    </button>
  );
}

// ── Mock 로그인 버튼 (CLIENT_ID 미설정 시) ───────
function MockLoginButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    onSuccess({
      id: 'mock_user_001',
      name: '테스트 사용자',
      email: 'test@example.com',
      picture: null,
    });
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-medium text-base"
        style={{
          backgroundColor: '#fff',
          border: '1.5px solid #E5E7EB',
          color: '#374151',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        {loading ? (
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: '#E5E7EB', borderTopColor: '#374151' }} />
        ) : (
          <GoogleSVG />
        )}
        {loading ? '로그인 중...' : 'Google로 로그인 (Mock)'}
      </button>
      {/* 개발 안내 배너 */}
      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#FFF9E6', border: '1px solid #FDE68A' }}>
        <p className="text-xs font-medium" style={{ color: '#92400E' }}>
          ⚠️ Mock 모드 — 실제 Google 로그인을 사용하려면
        </p>
        <p className="text-xs mt-1" style={{ color: '#92400E' }}>
          frontend/.env에 <code className="px-1 rounded" style={{ backgroundColor: '#FEF3C7' }}>VITE_GOOGLE_CLIENT_ID</code>를 설정해주세요
        </p>
      </div>
    </div>
  );
}

// ── 메인 LoginPage ──────────────────────────────
export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  function handleSuccess(userInfo) {
    login(userInfo);
    navigate('/profile');
  }

  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#FFF5F7' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-6">
        <div className="text-8xl mb-5 select-none">🌸</div>
        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#1F2937' }}>
          한끼 칼로리 트래커
        </h1>
        <p className="text-base text-center leading-relaxed" style={{ color: '#9CA3AF' }}>
          음식 사진 한 장으로<br />칼로리를 바로 확인해요
        </p>

        <div className="mt-10 w-full space-y-3">
          {[
            { icon: '📷', title: '음식 사진 촬영', desc: 'AI가 음식을 자동 인식해요' },
            { icon: '🥗', title: '영양 정보 분석', desc: '칼로리, 탄단지를 한눈에 확인' },
            { icon: '📊', title: '식단 히스토리', desc: '주간 추세와 목표 달성률 확인' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ backgroundColor: 'rgba(255,182,193,0.12)', border: '1px solid #FCE4EC' }}>
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#374151' }}>{title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-12 space-y-3">
        {/* CLIENT_ID가 있으면 실제 Google 로그인, 없으면 Mock */}
        {CLIENT_ID ? (
          <RealGoogleLoginButton
            onSuccess={handleSuccess}
            onError={(msg) => setError(msg)}
          />
        ) : (
          <MockLoginButton onSuccess={handleSuccess} />
        )}

        {error && (
          <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
            <p className="text-sm text-center" style={{ color: '#DC2626' }}>{error}</p>
          </div>
        )}

        <p className="text-center text-xs" style={{ color: '#C9C9C9' }}>
          로그인 시 서비스 이용약관에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}

function GoogleSVG() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.34-.68z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
    </svg>
  );
}

/*
 * ══════════════════════════════════════════════════════
 * Google Cloud Console OAuth 2.0 클라이언트 ID 발급 방법
 * ══════════════════════════════════════════════════════
 *
 * 1. https://console.cloud.google.com 접속 → 프로젝트 생성
 *
 * 2. 좌측 메뉴 → [API 및 서비스] → [OAuth 동의 화면]
 *    - User Type: 외부 선택
 *    - 앱 이름, 사용자 지원 이메일 입력
 *    - 스코프: .../auth/userinfo.email, .../auth/userinfo.profile 추가
 *    - 테스트 사용자: 본인 이메일 추가 (게시 전까지 필수)
 *
 * 3. 좌측 메뉴 → [사용자 인증 정보] → [+ 사용자 인증 정보 만들기]
 *    → [OAuth 2.0 클라이언트 ID]
 *    - 애플리케이션 유형: 웹 애플리케이션
 *    - 승인된 JavaScript 원본 추가:
 *        http://localhost:5173
 *        http://localhost:5174
 *    - 승인된 리디렉션 URI는 비워도 됨 (popup 방식 사용)
 *
 * 4. 생성된 클라이언트 ID를 복사하여 frontend/.env에 입력:
 *    VITE_GOOGLE_CLIENT_ID=123456789-abc...apps.googleusercontent.com
 *
 * 5. Vite 개발서버 재시작: npm run dev
 */

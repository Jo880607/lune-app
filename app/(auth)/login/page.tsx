import dynamic from "next/dynamic";

// 픽셀 달 아이콘 (로딩용)
const PixelMoon = () => (
  <svg width={80} height={80} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
    <rect x="10" y="4" width="12" height="2" fill="#FFE566" />
    <rect x="8" y="6" width="2" height="2" fill="#FFE566" />
    <rect x="22" y="6" width="2" height="2" fill="#FFE566" />
    <rect x="6" y="8" width="2" height="2" fill="#FFE566" />
    <rect x="24" y="8" width="2" height="2" fill="#FFE566" />
    <rect x="4" y="10" width="2" height="12" fill="#FFE566" />
    <rect x="26" y="10" width="2" height="12" fill="#FFE566" />
    <rect x="6" y="22" width="2" height="2" fill="#FFE566" />
    <rect x="24" y="22" width="2" height="2" fill="#FFE566" />
    <rect x="8" y="24" width="2" height="2" fill="#FFE566" />
    <rect x="22" y="24" width="2" height="2" fill="#FFE566" />
    <rect x="10" y="26" width="12" height="2" fill="#FFE566" />
    <rect x="10" y="6" width="12" height="2" fill="#FFF8DC" />
    <rect x="8" y="8" width="16" height="2" fill="#FFF8DC" />
    <rect x="6" y="10" width="20" height="12" fill="#FFF8DC" />
    <rect x="8" y="22" width="16" height="2" fill="#FFF8DC" />
    <rect x="10" y="24" width="12" height="2" fill="#FFF8DC" />
    <rect x="10" y="12" width="2" height="2" fill="#C8A8E9" opacity="0.4" />
    <rect x="18" y="10" width="4" height="2" fill="#C8A8E9" opacity="0.3" />
    <rect x="12" y="18" width="3" height="2" fill="#C8A8E9" opacity="0.35" />
  </svg>
);

// SSR 완전 비활성화 - 클라이언트에서만 로드
const LoginForm = dynamic(() => import("@/components/auth/LoginForm"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#0D0D1A' }}
    >
      <PixelMoon />
    </div>
  ),
});

export default function LoginPage() {
  return <LoginForm />;
}

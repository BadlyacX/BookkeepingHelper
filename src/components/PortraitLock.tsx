/**
 * Full-screen "please rotate back" overlay for landscape on phones/
 * tablets — see the `.portrait-lock` rule in globals.css for when
 * this is actually shown (CSS-only; this component just provides the
 * markup, since there's no real cross-browser orientation-lock API
 * available to us on iOS Safari).
 */
export function PortraitLock() {
  return (
    <div className="portrait-lock fixed inset-0 z-[100] flex-col items-center justify-center gap-3 bg-slate-900 text-slate-100 p-8 text-center">
      <span className="text-4xl">📱↻</span>
      <p className="text-base font-medium">請將手機轉回直式使用</p>
      <p className="text-sm text-slate-400">這個 App 目前只支援直式畫面</p>
    </div>
  );
}

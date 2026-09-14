import { login, signup } from "./actions";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const notice = typeof searchParams.notice === "string" ? searchParams.notice : null;

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <header>
          <h1 className="text-xl font-semibold">記帳工具</h1>
          <p className="text-sm text-gray-500">登入以繼續</p>
        </header>

        <form className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            autoComplete="email"
            className="border rounded px-3 py-2"
          />
          <input
            type="password"
            name="password"
            placeholder="密碼"
            required
            autoComplete="current-password"
            minLength={6}
            className="border rounded px-3 py-2"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-green-700">{notice}</p>}

          <div className="flex gap-2">
            <button
              formAction={login}
              className="flex-1 bg-slate-900 text-white rounded px-3 py-2"
            >
              登入
            </button>
            <button
              formAction={signup}
              className="flex-1 border rounded px-3 py-2"
            >
              註冊
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-400">
          個人記帳工具,僅供自己使用。註冊後需至信箱完成驗證。
        </p>
      </div>
    </main>
  );
}

import { login, signup } from "./actions";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const notice = typeof searchParams.notice === "string" ? searchParams.notice : null;
  const email = typeof searchParams.email === "string" ? searchParams.email : "";

  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-sm flex flex-col gap-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
        <header>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">記帳工具</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">登入以繼續</p>
        </header>

        <form className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            autoComplete="email"
            defaultValue={email}
            className="border border-gray-200 dark:border-slate-600 bg-transparent dark:text-slate-100 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="password"
            name="password"
            placeholder="密碼"
            required
            autoComplete="current-password"
            minLength={6}
            className="border border-gray-200 dark:border-slate-600 bg-transparent dark:text-slate-100 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {notice && <p className="text-sm text-green-700 dark:text-green-400">{notice}</p>}

          <div className="flex gap-2">
            <button
              formAction={login}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 font-medium transition"
            >
              登入
            </button>
            <button
              formAction={signup}
              className="flex-1 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg px-3 py-2 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
            >
              註冊
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-400 dark:text-slate-500">
          個人記帳工具,僅供自己使用。註冊後需至信箱完成驗證。
        </p>
      </div>
    </main>
  );
}

export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-[360px] max-w-full rounded-3xl bg-white p-8 text-center shadow-dialog">
        <div className="text-sm font-semibold text-slate-900">{message}</div>
        <div className="mt-3 text-xs text-slate-500">This should only take a moment.</div>
      </div>
    </div>
  );
}

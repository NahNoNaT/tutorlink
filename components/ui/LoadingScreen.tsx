'use client'

export default function LoadingScreen({ label = 'Loading…', full = true }: { label?: string; full?: boolean }) {
  return (
    <div className={full ? 'min-h-[60vh] grid place-items-center' : 'py-10 grid place-items-center'}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-teal-400 border-l-transparent animate-spin" aria-hidden />
        {label ? <div className="text-sm text-slate-400">{label}</div> : null}
      </div>
    </div>
  )
}

import type { PropsWithChildren } from 'react';

type SectionCardProps = PropsWithChildren<{
  title: string;
  eyebrow: string;
}>;

export function SectionCard({ title, eyebrow, children }: SectionCardProps) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-coral">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">{children}</div>
    </section>
  );
}


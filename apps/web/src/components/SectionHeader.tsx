export const SectionHeader = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <div className="space-y-3">
    <p className="text-xs uppercase tracking-[0.45em] text-arena-300">{eyebrow}</p>
    <h1 className="font-display text-5xl uppercase text-white sm:text-6xl">{title}</h1>
    <p className="max-w-2xl text-sm text-arena-100/80 sm:text-base">{description}</p>
  </div>
);


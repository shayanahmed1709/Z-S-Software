export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-3xl font-semibold text-[#0A1628]">{title}</h1>
    </div>
  );
}

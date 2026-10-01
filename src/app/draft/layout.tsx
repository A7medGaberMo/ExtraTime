export default function DraftLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-game="draft" className="contents">
      {children}
    </div>
  );
}

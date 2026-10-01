export default function BankLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-game="bank" className="contents">
      {children}
    </div>
  );
}

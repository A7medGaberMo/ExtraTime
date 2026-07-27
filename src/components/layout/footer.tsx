"use client";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background py-6 pb-20 md:pb-6">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} ExtraTime. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

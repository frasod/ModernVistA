import { ReactNode } from 'react';

interface Props { children: ReactNode }

export function MinimalShell({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-3 border-b border-brand-700 bg-brand-800 flex items-center gap-4">
        <span className="text-brand-200 tracking-wider font-medium">ModernVista</span>
        <span className="text-xs text-brand-500">POC</span>
      </header>
      <main className="flex-1 p-6 bg-brand-900">{children}</main>
      <footer className="px-6 py-2 text-xs text-brand-600 border-t border-brand-800 bg-brand-900">© {new Date().getFullYear()} ModernVista (POC)</footer>
    </div>
  );
}
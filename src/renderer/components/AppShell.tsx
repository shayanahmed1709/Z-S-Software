import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="h-full min-w-0 flex-1 overflow-auto bg-[#F4F6FA]">
        <Outlet />
      </main>
    </div>
  );
}

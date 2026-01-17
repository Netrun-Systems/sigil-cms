import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

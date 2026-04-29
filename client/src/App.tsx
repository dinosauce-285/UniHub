import { NavLink, Route, Routes } from 'react-router-dom';
import { StudentPage } from './pages/student/StudentPage';
import { AdminPage } from './pages/admin/AdminPage';
import { CheckinPage } from './pages/checkin/CheckinPage';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm transition ${
    isActive ? 'bg-ink text-white' : 'bg-white/70 text-ink hover:bg-white'
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed,transparent_45%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-coral">
            UniHub Workshop
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Event platform scaffold
          </h1>
        </div>
        <nav className="flex gap-2 rounded-full border border-slate-200/80 bg-white/60 p-2 shadow-sm backdrop-blur">
          <NavLink className={linkClass} to="/">
            Student
          </NavLink>
          <NavLink className={linkClass} to="/admin">
            Admin
          </NavLink>
          <NavLink className={linkClass} to="/checkin">
            Check-in
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-12">
        <Routes>
          <Route path="/" element={<StudentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
        </Routes>
      </main>
    </div>
  );
}


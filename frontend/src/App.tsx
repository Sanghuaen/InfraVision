import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import { MainLayout } from './components/layout/MainLayout';
import Docker from './pages/Docker';

function PlaceholderPage({
  title,
}: {
  title: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-cyan-400">
        Infrastructure
      </p>

      <h1 className="text-3xl font-bold text-white">
        {title}
      </h1>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-slate-400">
          This section is under development.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/servers"
            element={<Servers />}
          />

          <Route
            path="/docker"
            element={<Docker />}
          />

          <Route
            path="/processes"
            element={<PlaceholderPage title="Processes" />}
          />

          <Route
            path="/network"
            element={<PlaceholderPage title="Network" />}
          />

          <Route
            path="/storage"
            element={<PlaceholderPage title="Storage" />}
          />

          <Route
            path="/logs"
            element={<PlaceholderPage title="Logs" />}
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
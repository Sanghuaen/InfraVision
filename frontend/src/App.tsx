
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { MainLayout } from './components/layout/MainLayout';

import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import Docker from './pages/Docker';
import Processes from './pages/Processes';
import Network from './pages/Network';
import Storage from './pages/Storage';
import Logs from './pages/Logs';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/docker" element={<Docker />} />
          <Route path="/processes" element={<Processes />} />
          <Route path="/network" element={<Network />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;

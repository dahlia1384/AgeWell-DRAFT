import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ResidentList from './pages/ResidentList';
import ResidentDetail from './pages/ResidentDetail';
import AlertsFeed from './pages/AlertsFeed';
import AIAssistant from './pages/AIAssistant';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/residents" element={<ResidentList />} />
            <Route path="/residents/:id" element={<ResidentDetail />} />
            <Route path="/alerts" element={<AlertsFeed />} />
            <Route path="/ai" element={<AIAssistant />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

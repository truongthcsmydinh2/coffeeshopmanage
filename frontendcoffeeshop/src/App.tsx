import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        {/* Các route khác sẽ được thêm vào đây */}
      </Routes>
    </Router>
  );
}

export default App; 
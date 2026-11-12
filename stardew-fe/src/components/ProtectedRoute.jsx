import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// ครอบหน้าที่ต้อง login (👤 Member): ยังไม่ login → ส่งไป /login และจำไว้ว่ามาจากไหน
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export default ProtectedRoute;

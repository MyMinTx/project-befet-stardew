import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';
import Placeholder from './components/Placeholder';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import Npcs from './pages/Npcs';
import NpcDetail from './pages/NpcDetail';
import Guides from './pages/Guides';
import GuideDetail from './pages/GuideDetail';

// แผนที่เส้นทางทั้งเว็บ — Placeholder คือหน้าที่ยังไม่ได้ทำ ทำเสร็จแล้วค่อยเปลี่ยนเป็นหน้าจริง
function App() {
  return (
    // AuthProvider ครอบทั้งแอป ทุกหน้าข้างในจึงเรียก useAuth() ได้
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* 🌐 Guest */}
            <Route path="/" element={<Home />} />
            <Route path="/items" element={<Items />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/npcs" element={<Npcs />} />
            <Route path="/npcs/:id" element={<NpcDetail />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:id" element={<GuideDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 👤 Member: ต้อง login */}
            <Route path="/me" element={<ProtectedRoute><Placeholder title="โปรไฟล์ของฉัน" /></ProtectedRoute>} />
            <Route path="/me/bookmarks" element={<ProtectedRoute><Placeholder title="ไกด์ที่บุ๊กมาร์ก" /></ProtectedRoute>} />
            <Route path="/me/friendships" element={<ProtectedRoute><Placeholder title="หัวใจชาวเมือง" /></ProtectedRoute>} />

            {/* 🛡️ Admin: ครอบทั้งกิ่งด้วย RequireRole ครั้งเดียว หน้าลูกทุกหน้าได้รับการป้องกัน */}
            <Route path="/admin" element={<RequireRole role="admin"><Placeholder title="หลังบ้าน" /></RequireRole>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;

import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';
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
import Profile from './pages/Profile';
import Bookmarks from './pages/Bookmarks';
import Friendships from './pages/Friendships';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMembers from './pages/admin/AdminMembers';
import { AdminItems, AdminNpcs, AdminGuides } from './pages/admin/AdminLists';
import AdminItemForm from './pages/admin/AdminItemForm';
import AdminNpcForm from './pages/admin/AdminNpcForm';
import AdminGuideForm from './pages/admin/AdminGuideForm';

// รูปพื้นหลัง: วางไฟล์ไว้ที่ public/bg.jpg (เปลี่ยนชื่อไฟล์ได้ที่นี่) — ถ้าไม่มีไฟล์ จะเห็นสีไล่ระดับด้านหลังแทน
const BACKGROUND_IMAGE = `${process.env.PUBLIC_URL}/bg.jpg`;
const siteBackground = {
  backgroundImage: `url(${BACKGROUND_IMAGE}), linear-gradient(180deg, #bfe0f2 0%, #d9ecc2 55%, #b8d58f 100%)`,
};

// แผนที่เส้นทางทั้งเว็บ — Placeholder คือหน้าที่ยังไม่ได้ทำ ทำเสร็จแล้วค่อยเปลี่ยนเป็นหน้าจริง
function App() {
  return (
    // AuthProvider ครอบทั้งแอป ทุกหน้าข้างในจึงเรียก useAuth() ได้
    <AuthProvider>
      <div className="site-bg flex min-h-screen flex-col" style={siteBackground}>
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
            <Route path="/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/me/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
            <Route path="/me/friendships" element={<ProtectedRoute><Friendships /></ProtectedRoute>} />

            {/* 🛡️ Admin: ครอบทั้งกิ่งด้วย RequireRole ครั้งเดียว หน้าลูกทุกหน้าได้รับการป้องกัน */}
                        <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
              <Route index element={<AdminDashboard />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="items" element={<AdminItems />} />
              <Route path="items/new" element={<AdminItemForm />} />
              <Route path="items/:id" element={<AdminItemForm />} />
              <Route path="npcs" element={<AdminNpcs />} />
              <Route path="npcs/new" element={<AdminNpcForm />} />
              <Route path="npcs/:id" element={<AdminNpcForm />} />
              <Route path="guides" element={<AdminGuides />} />
              <Route path="guides/new" element={<AdminGuideForm />} />
              <Route path="guides/:id" element={<AdminGuideForm />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;

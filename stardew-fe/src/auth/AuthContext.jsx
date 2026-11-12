import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../api/backend';

// "กล่องกลาง" เก็บสถานะ login ให้ทุกหน้าหยิบใช้ผ่าน useAuth() ไม่ต้องส่ง props ต่อกันเป็นทอด ๆ
const AuthContext = createContext(null);

const TOKEN_KEY = 'stardew.token';
const MEMBER_KEY = 'stardew.member';

export function AuthProvider({ children }) {
  // อ่านค่าเดิมจาก localStorage จะได้ไม่หลุด login ตอน refresh
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [member, setMember] = useState(() => JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null'));

  function remember({ token, member }) {
    setToken(token);
    setMember(member);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  }

  async function login(email, password) {
    const data = await api.login(email, password);   // ผิด → backend.js throw (401 BAD_CREDENTIALS)
    remember(data);
  }

  async function register(email, password, displayName) {
    await api.register(email, password, displayName);
    await login(email, password);                    // สมัครเสร็จ login ให้เลย
  }

  // Logout ไม่มี endpoint (JWT เป็น stateless) แค่ลบ token ทิ้ง
  function logout() {
    setToken(null);
    setMember(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MEMBER_KEY);
  }

  // หลังแก้โปรไฟล์ (PUT /api/me) เรียกตัวนี้ ชื่อบน Navbar จะเปลี่ยนตามทันที
  function updateMember(newMember) {
    setMember(newMember);
    localStorage.setItem(MEMBER_KEY, JSON.stringify(newMember));
  }

  // token อายุ 1 ชั่วโมง: ถ้า API ตอบ 401 ตอนแนบ token ไป แปลว่าหมดอายุ → logout อัตโนมัติ
  // (ProtectedRoute จะพาไปหน้า Login เองเพราะ isLoggedIn เป็น false)
  useEffect(() => {
    api.setOnUnauthorized(logout);
    return () => api.setOnUnauthorized(null);
  }, []);

  // isAdmin ใช้แค่ "โชว์/ซ่อน" เมนูและหน้า — การป้องกันจริงอยู่ที่ Go (RequireRole("admin"))
  const isAdmin = member?.role === 'admin';
  const value = { token, member, isLoggedIn: Boolean(token), isAdmin, login, register, logout, updateMember };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

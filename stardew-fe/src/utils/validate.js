// กติกา validate ตามสัญญาหัวข้อ 4.1 — หน้าเว็บตรวจก่อนเพื่อบอกผู้ใช้เร็ว ๆ แต่ด่านจริงคือ Go
// แต่ละฟังก์ชันคืน "ข้อความ error" ถ้าผิด หรือ null ถ้าผ่าน

export function checkEmail(email) {
  if (!email.includes('@') || email.length > 255) return 'รูปแบบอีเมลไม่ถูกต้อง';
  return null;
}

export function checkPassword(password) {
  if (password.length < 8 || password.length > 72) return 'รหัสผ่านต้องยาว 8–72 ตัวอักษร';
  return null;
}

export function checkDisplayName(name) {
  const n = name.trim().length;
  if (n < 1 || n > 50) return 'ชื่อที่แสดงต้องยาว 1–50 ตัวอักษร';
  return null;
}

export function checkComment(text) {
  if (text.trim().length < 10) return 'ความคิดเห็นต้องยาวอย่างน้อย 10 ตัวอักษร';
  return null;
}

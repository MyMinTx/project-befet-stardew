package security

import "testing"

func TestHashAndCheckPassword(t *testing.T) {
	hash, err := HashPassword("farmer-pass-123")
	if err != nil {
		t.Fatal(err)
	}
	if hash == "farmer-pass-123" {
		t.Fatal("ห้ามเก็บรหัสผ่านตรง ๆ")
	}
	if !CheckPassword(hash, "farmer-pass-123") {
		t.Error("รหัสถูกต้องต้องผ่าน")
	}
	if CheckPassword(hash, "wrong-pass-123") {
		t.Error("รหัสผิดต้องไม่ผ่าน")
	}
}

// รหัสเดียวกันต้องได้ hash ไม่ซ้ำกัน เพราะ bcrypt ใส่ salt ให้ทุกครั้ง
func TestSamePasswordDifferentHash(t *testing.T) {
	a, _ := HashPassword("same-password")
	b, _ := HashPassword("same-password")
	if a == b {
		t.Error("hash ของรหัสเดียวกันไม่ควรซ้ำกัน")
	}
}

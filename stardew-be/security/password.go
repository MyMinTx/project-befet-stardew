package security

import "golang.org/x/crypto/bcrypt"

// HashPassword แปลงรหัสผ่านเป็น hash แบบ bcrypt (ย้อนกลับเป็นรหัสเดิมไม่ได้)
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPassword เทียบรหัสที่ผู้ใช้พิมพ์กับ hash ที่เก็บไว้ ตรงกันคืน true
func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

package security

import (
	"encoding/base64"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "secret-for-unit-test-only-32-chars-long!!"

func newMaker(t *testing.T) *TokenMaker {
	t.Helper()
	m, err := NewTokenMaker(testSecret, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	return m
}

// token ที่ระบบออกให้เอง ต้องตรวจผ่าน และได้ id กับ role ถูกต้อง
func TestCreateAndVerify(t *testing.T) {
	m := newMaker(t)
	token, err := m.Create(42, "member")
	if err != nil {
		t.Fatal(err)
	}
	id, role, err := m.Verify(token)
	if err != nil {
		t.Fatalf("token จริงต้องผ่าน แต่ได้ error: %v", err)
	}
	if id != 42 || role != "member" {
		t.Errorf("ได้ id=%d role=%s ต้องการ id=42 role=member", id, role)
	}
}

// secret สั้นกว่า 32 ตัว ต้องไม่ยอมสร้าง
func TestRejectShortSecret(t *testing.T) {
	if _, err := NewTokenMaker("too-short", time.Hour); err == nil {
		t.Error("secret สั้นเกินต้องได้ error")
	}
}

// token ปลอมทุกแบบต้องถูกปฏิเสธ
func TestRejectForgedTokens(t *testing.T) {
	m := newMaker(t)
	now := time.Now()
	adminClaims := jwt.MapClaims{"sub": "42", "role": "admin", "exp": now.Add(time.Hour).Unix()}

	sign := func(method jwt.SigningMethod, key any, c jwt.MapClaims) string {
		s, err := jwt.NewWithClaims(method, c).SignedString(key)
		if err != nil {
			t.Fatal(err)
		}
		return s
	}

	// แอบแก้ role ในเนื้อความจาก member เป็น admin โดยใช้ลายเซ็นเดิม
	real, _ := m.Create(42, "member")
	parts := strings.Split(real, ".")
	payload, _ := base64.RawURLEncoding.DecodeString(parts[1])
	payload = []byte(strings.Replace(string(payload), `"member"`, `"admin"`, 1))
	tampered := parts[0] + "." + base64.RawURLEncoding.EncodeToString(payload) + "." + parts[2]

	cases := map[string]string{
		"แก้ role ในเนื้อความ":    tampered,
		"เซ็นด้วยกุญแจคนอื่น":     sign(jwt.SigningMethodHS256, []byte("another-secret-that-is-also-long-enough"), adminClaims),
		"ไม่มีลายเซ็น (alg none)": sign(jwt.SigningMethodNone, jwt.UnsafeAllowNoneSignatureType, adminClaims),
		"กุญแจถูกแต่ใช้ HS512":    sign(jwt.SigningMethodHS512, []byte(testSecret), adminClaims),
		"ไม่มีวันหมดอายุ":         sign(jwt.SigningMethodHS256, []byte(testSecret), jwt.MapClaims{"sub": "42", "role": "admin"}),
		"หมดอายุแล้ว":             sign(jwt.SigningMethodHS256, []byte(testSecret), jwt.MapClaims{"sub": "42", "role": "admin", "exp": now.Add(-time.Minute).Unix()}),
		"ข้อความมั่ว":             "abc.def.ghi",
	}
	for name, token := range cases {
		t.Run(name, func(t *testing.T) {
			if _, _, err := m.Verify(token); err == nil {
				t.Errorf("%s: ต้องถูกปฏิเสธ แต่ผ่าน", name)
			}
		})
	}
}

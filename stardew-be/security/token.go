package security

import (
	"errors"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TokenMaker สร้างและตรวจ JWT ด้วยกุญแจลับตัวเดียว
type TokenMaker struct {
	secret []byte
	ttl    time.Duration
}

// claims คือข้อมูลที่ฝังอยู่ใน token: sub (memberId), role, iat, exp
type claims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

func NewTokenMaker(secret string, ttl time.Duration) (*TokenMaker, error) {
	if len(secret) < 32 {
		return nil, errors.New("JWT_SECRET must be at least 32 characters")
	}
	return &TokenMaker{secret: []byte(secret), ttl: ttl}, nil
}

// Create ออก token ให้สมาชิกหนึ่งคน
func (m *TokenMaker) Create(memberID int64, role string) (string, error) {
	now := time.Now()
	c := claims{
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(memberID, 10),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	return token.SignedString(m.secret)
}

// Verify ตรวจ token ถ้าถูกต้องคืน memberId และ role (ใช้ในบทที่ 5)
func (m *TokenMaker) Verify(tokenString string) (int64, string, error) {
	var c claims
	_, err := jwt.ParseWithClaims(tokenString, &c,
		func(t *jwt.Token) (any, error) { return m.secret, nil },
		jwt.WithValidMethods([]string{"HS256"}), // รับเฉพาะ HS256 กันการปลอมด้วยวิธีเซ็นอื่น
		jwt.WithExpirationRequired(),            // token ที่ไม่มีวันหมดอายุ ไม่รับ
	)
	if err != nil {
		return 0, "", err
	}
	id, err := strconv.ParseInt(c.Subject, 10, 64)
	if err != nil {
		return 0, "", errors.New("invalid subject")
	}
	return id, c.Role, nil
}
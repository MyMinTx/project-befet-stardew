package middleware

import (
	"context"
	"net/http"
	"strings"

	"stardew-be/security"
	"stardew-be/utils"
)

// CurrentUser คือข้อมูลของคนที่ login อยู่ ได้มาจาก token เท่านั้น
type CurrentUser struct {
	ID   int64
	Role string
}

// contextKey เป็นชนิดของเราเอง กันชื่อ key ชนกับแพ็กเกจอื่น
type contextKey struct{}

// CurrentUserFrom ดึงข้อมูลคนที่ login อยู่ออกจาก context (ใช้ใน handler)
func CurrentUserFrom(ctx context.Context) CurrentUser {
	user, _ := ctx.Value(contextKey{}).(CurrentUser)
	return user
}

type Auth struct {
	Tokens *security.TokenMaker
}

// RequireLogin ตรวจ header Authorization: Bearer <token>
// ไม่มี token → 401 LOGIN_REQUIRED, token ปลอม/หมดอายุ → 401 TOKEN_INVALID
func (a *Auth) RequireLogin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		token, ok := strings.CutPrefix(header, "Bearer ")
		if !ok || token == "" {
			utils.WriteError(w, http.StatusUnauthorized, "LOGIN_REQUIRED", "กรุณาเข้าสู่ระบบก่อน")
			return
		}

		id, role, err := a.Tokens.Verify(token)
		if err != nil {
			utils.WriteError(w, http.StatusUnauthorized, "TOKEN_INVALID", "เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่")
			return
		}

		// แนบข้อมูลคนที่ login ไปกับ request แล้วส่งต่อให้ handler ตัวจริง
		ctx := context.WithValue(r.Context(), contextKey{}, CurrentUser{ID: id, Role: role})
		next(w, r.WithContext(ctx))
	}
}

// RequireRole ต้องใช้ต่อจาก RequireLogin เสมอ role ไม่ตรง → 403 FORBIDDEN
func RequireRole(role string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if CurrentUserFrom(r.Context()).Role != role {
			utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "คุณไม่มีสิทธิ์ใช้งานส่วนนี้")
			return
		}
		next(w, r)
	}
}
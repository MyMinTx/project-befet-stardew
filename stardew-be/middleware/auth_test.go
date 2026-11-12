package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"stardew-be/security"
)

// เรียก handler ผ่าน middleware แล้วคืน status กับ error code
func call(h http.HandlerFunc, authHeader string) (int, string) {
	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	rec := httptest.NewRecorder()
	h(rec, req)

	var body struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	json.NewDecoder(rec.Body).Decode(&body)
	return rec.Code, body.Error.Code
}

func TestRequireLoginAndRole(t *testing.T) {
	tokens, _ := security.NewTokenMaker("secret-for-unit-test-only-32-chars-long!!", time.Hour)
	auth := &Auth{Tokens: tokens}
	memberToken, _ := tokens.Create(5, "member")
	adminToken, _ := tokens.Create(6, "admin")

	// handler ปลายทาง: ตอบ 200 พร้อม id ของคนที่ login (มาจาก token)
	final := func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(strconv.FormatInt(CurrentUserFrom(r.Context()).ID, 10)))
	}
	memberRoute := auth.RequireLogin(final)
	adminRoute := auth.RequireLogin(RequireRole("admin", final))

	cases := []struct {
		name       string
		route      http.HandlerFunc
		header     string
		wantStatus int
		wantCode   string
	}{
		{"ไม่ส่ง token", memberRoute, "", 401, "LOGIN_REQUIRED"},
		{"ไม่มีคำว่า Bearer", memberRoute, memberToken, 401, "LOGIN_REQUIRED"},
		{"token มั่ว", memberRoute, "Bearer abc.def.ghi", 401, "TOKEN_INVALID"},
		{"member เข้า route member", memberRoute, "Bearer " + memberToken, 200, ""},
		{"member เข้า route admin", adminRoute, "Bearer " + memberToken, 403, "FORBIDDEN"},
		{"admin เข้า route admin", adminRoute, "Bearer " + adminToken, 200, ""},
		{"ไม่ login เข้า route admin", adminRoute, "", 401, "LOGIN_REQUIRED"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			status, code := call(c.route, c.header)
			if status != c.wantStatus || code != c.wantCode {
				t.Errorf("ได้ %d %q ต้องการ %d %q", status, code, c.wantStatus, c.wantCode)
			}
		})
	}
}

// handler ต้องได้ id จาก token จริง ๆ
func TestCurrentUserComesFromToken(t *testing.T) {
	tokens, _ := security.NewTokenMaker("secret-for-unit-test-only-32-chars-long!!", time.Hour)
	auth := &Auth{Tokens: tokens}
	token, _ := tokens.Create(77, "member")

	var got CurrentUser
	h := auth.RequireLogin(func(w http.ResponseWriter, r *http.Request) {
		got = CurrentUserFrom(r.Context())
	})
	req := httptest.NewRequest(http.MethodGet, "/api/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	h(httptest.NewRecorder(), req)

	if got.ID != 77 || got.Role != "member" {
		t.Errorf("ได้ %+v ต้องการ ID=77 Role=member", got)
	}
}

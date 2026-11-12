package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := CORS([]string{"http://localhost:3000", " https://stardew-guide-psi.vercel.app "}, next)

	cases := []struct {
		name        string
		method      string
		origin      string
		wantStatus  int
		wantAllowed string
	}{
		{"preflight จากเว็บเรา", http.MethodOptions, "https://stardew-guide-psi.vercel.app", 204, "https://stardew-guide-psi.vercel.app"},
		{"GET จาก localhost", http.MethodGet, "http://localhost:3000", 200, "http://localhost:3000"},
		{"เว็บแปลกหน้า", http.MethodOptions, "https://evil.example.com", 204, ""},
		{"ไม่มี Origin (curl)", http.MethodGet, "", 200, ""},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(c.method, "/api/items", nil)
			if c.origin != "" {
				req.Header.Set("Origin", c.origin)
			}
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			if rec.Code != c.wantStatus {
				t.Errorf("status ได้ %d ต้องการ %d", rec.Code, c.wantStatus)
			}
			if got := rec.Header().Get("Access-Control-Allow-Origin"); got != c.wantAllowed {
				t.Errorf("Allow-Origin ได้ %q ต้องการ %q", got, c.wantAllowed)
			}
		})
	}
}

package middleware

import (
	"net/http"
	"strings"
)

// CORS อนุญาตให้เว็บจาก origin ที่อยู่ในรายชื่อเรียก API ของเราได้
func CORS(allowedOrigins []string, next http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, o := range allowedOrigins {
		o = strings.TrimSpace(o)
		if o != "" {
			allowed[o] = true
		}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowed[origin] {
			h := w.Header()
			h.Set("Access-Control-Allow-Origin", origin)
			h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			h.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			h.Add("Vary", "Origin")
		}

		// preflight: เบราว์เซอร์ถามก่อนว่า "ส่งได้ไหม" ตอบ 204 แล้วจบเลย
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
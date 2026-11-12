package middleware

import (
	"log"
	"net/http"
	"time"
)

// statusRecorder จำ status code ที่ handler ตอบไว้ เพื่อเอามาเขียน log
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

// Logger เขียน log ทุก request: method path status เวลาที่ใช้
// ตั้งใจไม่ log header เพราะมี token อยู่
// และไม่ log /api/health เพราะ Render ยิงมาเช็กทุก 5 วินาที จะทำให้ log รก
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/health" {
			next.ServeHTTP(w, r)
			return
		}
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, rec.status, time.Since(start).Round(time.Millisecond))
	})
}

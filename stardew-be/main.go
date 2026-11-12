package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"stardew-be/database"
	"stardew-be/handlers"
	"stardew-be/middleware"
	"stardew-be/repository"
	"stardew-be/security"
	"stardew-be/utils"
)

func main() {
	// 1) ต่อฐานข้อมูล
	pool, err := database.Connect()
	if err != nil {
		log.Fatal("cannot connect database: ", err)
	}
	defer pool.Close()
	log.Println("database connected")

	// 2) เตรียมเครื่องออก token (อายุ 1 ชั่วโมงตามสัญญา)
	tokens, err := security.NewTokenMaker(os.Getenv("JWT_SECRET"), time.Hour)
	if err != nil {
		log.Fatal(err)
	}

	// 3) ประกอบชิ้นส่วน: repository (คุย DB) -> handler (คุย HTTP)
	itemRepo := &repository.ItemRepo{DB: pool}
	itemHandler := &handlers.ItemHandler{Repo: itemRepo}
	npcRepo := &repository.NpcRepo{DB: pool}
	npcHandler := &handlers.NpcHandler{Repo: npcRepo}
	memberRepo := &repository.MemberRepo{DB: pool}
	authHandler := &handlers.AuthHandler{Members: memberRepo, Tokens: tokens}
	meHandler := &handlers.MeHandler{Members: memberRepo}
	adminHandler := &handlers.AdminHandler{Members: memberRepo}

	// ตัวช่วยครอบสิทธิ์: login = ต้องเข้าสู่ระบบ, admin = ต้องเข้าสู่ระบบ + role admin
	auth := &middleware.Auth{Tokens: tokens}
	login := auth.RequireLogin
	admin := func(next http.HandlerFunc) http.HandlerFunc {
		return auth.RequireLogin(middleware.RequireRole("admin", next))
	}

	// 4) ผูก URL เข้ากับฟังก์ชัน
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		utils.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /api/items", itemHandler.List)
	mux.HandleFunc("GET /api/items/{id}", itemHandler.Get)
	mux.HandleFunc("GET /api/npcs", npcHandler.List)
	mux.HandleFunc("GET /api/npcs/{id}", npcHandler.Get)
	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)

	// 👤 Member
	mux.HandleFunc("GET /api/me", login(meHandler.Get))
	mux.HandleFunc("PUT /api/me", login(meHandler.Update))
	mux.HandleFunc("PUT /api/me/password", login(meHandler.ChangePassword))

	// 🛡️ Admin
	mux.HandleFunc("GET /api/admin/members", admin(adminHandler.ListMembers))

	// 5) ครอบ mux ด้วย middleware ที่ใช้กับทุก request: Logger นอกสุด → CORS → mux
	origins := strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")
	handler := middleware.Logger(middleware.CORS(origins, mux))

	// 6) เปิด server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("server running on port", port, "| allowed origins:", origins)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
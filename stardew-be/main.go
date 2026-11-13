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
	guideRepo := &repository.GuideRepo{DB: pool}
	commentRepo := &repository.CommentRepo{DB: pool}
	guideHandler := &handlers.GuideHandler{Guides: guideRepo, Comments: commentRepo}
	bookmarkHandler := &handlers.BookmarkHandler{Bookmarks: &repository.BookmarkRepo{DB: pool}, Guides: guideRepo}
	friendshipHandler := &handlers.FriendshipHandler{Friendships: &repository.FriendshipRepo{DB: pool}}
	adminHandler := &handlers.AdminHandler{
		Members: memberRepo,
		Stats:   &repository.StatsRepo{DB: pool},
		Items:   itemRepo,
		Npcs:    npcRepo,
		Guides:  guideRepo,
	}

	// ตัวช่วยครอบสิทธิ์: login = ต้องเข้าสู่ระบบ, admin = ต้องเข้าสู่ระบบ + role admin
	auth := &middleware.Auth{Tokens: tokens}
	login := auth.RequireLogin
	admin := func(next http.HandlerFunc) http.HandlerFunc {
		return auth.RequireLogin(middleware.RequireRole("admin", next))
	}

	// 4) ผูก URL เข้ากับฟังก์ชัน
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		utils.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok", "version": "1.0.0"})
	})
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		utils.WriteJSON(w, http.StatusOK, map[string]string{
			"name":   "Stardew Guide API",
			"health": "/api/health",
		})
	})

	mux.HandleFunc("GET /api/items", itemHandler.List)
	mux.HandleFunc("GET /api/items/{id}", itemHandler.Get)
	mux.HandleFunc("GET /api/npcs", npcHandler.List)
	mux.HandleFunc("GET /api/npcs/{id}", npcHandler.Get)
	mux.HandleFunc("GET /api/guides", guideHandler.List)
	mux.HandleFunc("GET /api/guides/{id}", guideHandler.Get)
	mux.HandleFunc("GET /api/guides/{id}/comments", guideHandler.ListComments)
	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)

	// 👤 Member
	mux.HandleFunc("GET /api/me", login(meHandler.Get))
	mux.HandleFunc("PUT /api/me", login(meHandler.Update))
	mux.HandleFunc("PUT /api/me/password", login(meHandler.ChangePassword))
	mux.HandleFunc("POST /api/guides/{id}/comments", login(guideHandler.AddComment))
	mux.HandleFunc("DELETE /api/comments/{commentId}", login(guideHandler.DeleteComment))
	mux.HandleFunc("GET /api/me/bookmarks", login(bookmarkHandler.List))
	mux.HandleFunc("PUT /api/me/bookmarks/{guideId}", login(bookmarkHandler.Add))
	mux.HandleFunc("DELETE /api/me/bookmarks/{guideId}", login(bookmarkHandler.Remove))
	mux.HandleFunc("GET /api/me/friendships", login(friendshipHandler.List))
	mux.HandleFunc("PUT /api/me/friendships/{npcId}", login(friendshipHandler.Put))
	mux.HandleFunc("DELETE /api/me/friendships/{npcId}", login(friendshipHandler.Delete))

	// 🛡️ Admin
	mux.HandleFunc("GET /api/admin/stats", admin(adminHandler.GetStats))
	mux.HandleFunc("GET /api/admin/members", admin(adminHandler.ListMembers))
	mux.HandleFunc("PUT /api/admin/members/{id}/role", admin(adminHandler.UpdateRole))
	mux.HandleFunc("POST /api/admin/items", admin(adminHandler.CreateItem))
	mux.HandleFunc("PUT /api/admin/items/{id}", admin(adminHandler.UpdateItem))
	mux.HandleFunc("DELETE /api/admin/items/{id}", admin(adminHandler.DeleteItem))
	mux.HandleFunc("POST /api/admin/npcs", admin(adminHandler.CreateNpc))
	mux.HandleFunc("PUT /api/admin/npcs/{id}", admin(adminHandler.UpdateNpc))
	mux.HandleFunc("DELETE /api/admin/npcs/{id}", admin(adminHandler.DeleteNpc))
	mux.HandleFunc("PUT /api/admin/npcs/{id}/gifts", admin(adminHandler.ReplaceGifts))
	mux.HandleFunc("GET /api/admin/guides", admin(adminHandler.ListGuides))
	mux.HandleFunc("GET /api/admin/guides/{id}", admin(adminHandler.GetGuide))
	mux.HandleFunc("POST /api/admin/guides", admin(adminHandler.CreateGuide))
	mux.HandleFunc("PUT /api/admin/guides/{id}", admin(adminHandler.UpdateGuide))
	mux.HandleFunc("DELETE /api/admin/guides/{id}", admin(adminHandler.DeleteGuide))

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

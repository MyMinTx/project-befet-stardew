package main

import (
	"log"
	"net/http"
	"os"

	"stardew-be/database"
	"stardew-be/handlers"
	"stardew-be/repository"
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

	// 2) ประกอบชิ้นส่วน: repository (คุย DB) -> handler (คุย HTTP)
	itemRepo := &repository.ItemRepo{DB: pool}
	itemHandler := &handlers.ItemHandler{Repo: itemRepo}
	npcRepo := &repository.NpcRepo{DB: pool}
	npcHandler := &handlers.NpcHandler{Repo: npcRepo}

	// 3) ผูก URL เข้ากับฟังก์ชัน
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		utils.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /api/items", itemHandler.List)
	mux.HandleFunc("GET /api/items/{id}", itemHandler.Get)
	mux.HandleFunc("GET /api/npcs", npcHandler.List)
	mux.HandleFunc("GET /api/npcs/{id}", npcHandler.Get)

	// 4) เปิด server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("server running on port", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
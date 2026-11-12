package main

import (
	"log"
	"net/http"
	"os"

	"stardew-be/database"
)

func main() {
	// 1) ต่อฐานข้อมูล ถ้าไม่ติดให้หยุดโปรแกรมเลย
	pool, err := database.Connect()
	if err != nil {
		log.Fatal("cannot connect database: ", err)
	}
	defer pool.Close()
	log.Println("database connected")

	// 2) ผูก URL
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// 3) เปิด server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("server running on port", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
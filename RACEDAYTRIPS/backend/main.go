package main

import (
	"net/http"
	"github.com/gin-contrib/cors" // Memanggil alat CORS
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// SURAT IZIN SATPAM: Mengizinkan Next.js (Port 3000) masuk ke Golang
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // Hanya izinkan web kita
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	// Rute utama
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "sukses",
			"message": "Mesin Backend RACEDAYTRIPS Menyala dan Tersambung! 🏁",
		})
	})

	r.Run(":8080")
}
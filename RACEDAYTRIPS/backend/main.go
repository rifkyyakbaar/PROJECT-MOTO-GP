package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

// 🚨 UPDATE: Tambah Email
type AuthRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"` 
	Password string `json:"password"`
}

type CheckoutRequest struct {
	EventID       int    `json:"event_id"`
	UserName      string `json:"user_name"`
	Quantity      int    `json:"quantity"`
	Email         string `json:"email"`
	Phone         string `json:"phone"`
	Country       string `json:"country"`
	PaymentMethod string `json:"payment_method"`
}

func main() {
	connStr := "postgresql://postgres:%40RaceDayTrips@db.txcphmqixwjfpdkvnecd.supabase.co:5432/postgres"

	db, err := sql.Open("postgres", connStr)
	if err != nil { log.Fatal(err) }
	defer db.Close()

	os.MkdirAll("./uploads", os.ModePerm)
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	r.Static("/uploads", "./uploads")

	// --- RUTE EVENTS --- (SAMA SEPERTI SEBELUMNYA)
	r.GET("/events", func(c *gin.Context) {
		rows, err := db.Query("SELECT id, name, circuit, date, time, price, category, stock, image, description FROM events ORDER BY date ASC")
		if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
		defer rows.Close()
		var events []map[string]interface{}
		for rows.Next() {
			var id, price, stock int; var name, circuit, date, time, category, image, description string
			rows.Scan(&id, &name, &circuit, &date, &time, &price, &category, &stock, &image, &description)
			events = append(events, map[string]interface{}{"id": id, "name": name, "circuit": circuit, "date": date, "time": time, "price": price, "category": category, "stock": stock, "image": image, "description": description})
		}
		c.JSON(200, events)
	})
	r.POST("/events", func(c *gin.Context) {
		name := c.PostForm("name"); circuit := c.PostForm("circuit"); date := c.PostForm("date"); timeStr := c.PostForm("time")
		price, _ := strconv.Atoi(c.PostForm("price")); category := c.PostForm("category"); stock, _ := strconv.Atoi(c.PostForm("stock")); description := c.PostForm("description")
		file, err := c.FormFile("image"); imageURL := ""
		if err == nil {
			ext := strings.ToLower(filepath.Ext(file.Filename))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" {
				filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(file.Filename))
				if c.SaveUploadedFile(file, "./uploads/"+filename) == nil { imageURL = "http://localhost:8080/uploads/" + filename }
			}
		}
		db.Exec("INSERT INTO events (name, circuit, date, time, price, category, stock, image, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", name, circuit, date, timeStr, price, category, stock, imageURL, description)
		c.JSON(200, gin.H{"status": "success"})
	})
	r.PUT("/events/:id", func(c *gin.Context) {
		id := c.Param("id"); name := c.PostForm("name"); circuit := c.PostForm("circuit"); date := c.PostForm("date"); timeStr := c.PostForm("time")
		price, _ := strconv.Atoi(c.PostForm("price")); category := c.PostForm("category"); stock, _ := strconv.Atoi(c.PostForm("stock")); description := c.PostForm("description"); imageURL := c.PostForm("existing_image") 
		file, err := c.FormFile("image")
		if err == nil {
			ext := strings.ToLower(filepath.Ext(file.Filename))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" {
				filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(file.Filename))
				if c.SaveUploadedFile(file, "./uploads/"+filename) == nil { imageURL = "http://localhost:8080/uploads/" + filename }
			}
		}
		db.Exec("UPDATE events SET name=$1, circuit=$2, date=$3, time=$4, price=$5, category=$6, stock=$7, image=$8, description=$9 WHERE id=$10", name, circuit, date, timeStr, price, category, stock, imageURL, description, id)
		c.JSON(200, gin.H{"status": "success"})
	})
	r.DELETE("/events/:id", func(c *gin.Context) { id := c.Param("id"); db.Exec("DELETE FROM events WHERE id = $1", id); c.JSON(200, gin.H{"status": "success"}) })

	// --- RUTE CHECKOUT & TRANSACTIONS --- (SAMA SEPERTI SEBELUMNYA)
	r.POST("/checkout", func(c *gin.Context) {
		var req CheckoutRequest
		if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"status": "error", "message": "Data tidak valid"}); return }
		var currentStock, price int
		if err := db.QueryRow("SELECT stock, price FROM events WHERE id = $1", req.EventID).Scan(&currentStock, &price); err != nil { c.JSON(404, gin.H{"status": "error", "message": "Event tidak ditemukan"}); return }
		if currentStock < req.Quantity { c.JSON(400, gin.H{"status": "error", "message": "Stok tidak cukup!"}); return }
		totalPrice := price * req.Quantity
		tx, _ := db.Begin()
		if _, err := tx.Exec("UPDATE events SET stock = stock - $1 WHERE id = $2", req.Quantity, req.EventID); err != nil { tx.Rollback(); return }
		_, errInsert := tx.Exec(`INSERT INTO transactions (event_id, user_name, quantity, total_price, email, phone, country, payment_method, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`, req.EventID, req.UserName, req.Quantity, totalPrice, req.Email, req.Phone, req.Country, req.PaymentMethod)
		if errInsert != nil { tx.Rollback(); c.JSON(500, gin.H{"status": "error", "message": "Gagal mencetak invoice"}); return }
		tx.Commit()
		c.JSON(200, gin.H{"status": "success", "message": "Pesanan Diterima! Silakan tunggu Invoice dari Admin."})
	})
	r.PUT("/transactions/:id/lunas", func(c *gin.Context) { id := c.Param("id"); db.Exec("UPDATE transactions SET status = 'paid' WHERE id = $1", id); c.JSON(200, gin.H{"status": "success"}) })
	r.GET("/transactions", func(c *gin.Context) {
		rows, err := db.Query(`SELECT t.id, e.name as event_name, t.user_name, t.email, t.phone, t.country, t.payment_method, t.status, t.quantity, t.total_price, t.booking_date FROM transactions t JOIN events e ON t.event_id = e.id ORDER BY t.booking_date DESC`)
		if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
		defer rows.Close()
		var transactions []map[string]interface{}; var totalRevenue int64 = 0; var totalTicketsSold int = 0
		for rows.Next() {
			var id, quantity int; var totalPrice int64; var eventName, userName, email, phone, country, paymentMethod, status, bookingDate string
			rows.Scan(&id, &eventName, &userName, &email, &phone, &country, &paymentMethod, &status, &quantity, &totalPrice, &bookingDate)
			transactions = append(transactions, map[string]interface{}{"id": id, "event_name": eventName, "user_name": userName, "email": email, "phone": phone, "country": country, "payment_method": paymentMethod, "status": status, "quantity": quantity, "total_price": totalPrice, "booking_date": bookingDate})
			if status == "paid" { totalRevenue += totalPrice; totalTicketsSold += quantity }
		}
		c.JSON(200, gin.H{"status": "success", "total_revenue": totalRevenue, "total_tickets_sold": totalTicketsSold, "history": transactions})
	})
	r.GET("/my-transactions", func(c *gin.Context) {
		username := c.Query("username")
		rows, err := db.Query(`SELECT t.id, e.name as event_name, e.image, t.status, t.quantity, t.total_price, t.booking_date FROM transactions t JOIN events e ON t.event_id = e.id WHERE t.user_name = $1 ORDER BY t.booking_date DESC`, username)
		if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
		defer rows.Close()
		var myTx []map[string]interface{}
		for rows.Next() {
			var id, quantity int; var totalPrice int64; var eventName, image, status, bookingDate string
			rows.Scan(&id, &eventName, &image, &status, &quantity, &totalPrice, &bookingDate)
			myTx = append(myTx, map[string]interface{}{"id": id, "event_name": eventName, "image": image, "status": status, "quantity": quantity, "total_price": totalPrice, "booking_date": bookingDate})
		}
		c.JSON(200, myTx)
	})
	r.GET("/users", func(c *gin.Context) {
		rows, err := db.Query("SELECT id, username FROM users WHERE role = 'user' ORDER BY id DESC")
		if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
		defer rows.Close()
		var users []map[string]interface{}
		for rows.Next() { var id int; var username string; rows.Scan(&id, &username); users = append(users, map[string]interface{}{"id": id, "username": username}) }
		c.JSON(200, users)
	})

	// 🚨 UPDATE: LOGIN & REGISTER BISA PAKAI EMAIL
	r.POST("/register", func(c *gin.Context) {
		var req AuthRequest
		if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": "Format salah"}); return }
		
		// Insert beserta Email ke Database
		_, err := db.Exec("INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, 'user')", req.Username, req.Email, req.Password)
		if err != nil { c.JSON(409, gin.H{"error": "Username atau Email sudah terdaftar!"}); return }
		
		c.JSON(200, gin.H{"status": "success"})
	})

	r.POST("/login", func(c *gin.Context) {
		var req AuthRequest; c.ShouldBindJSON(&req)
		var id int; var role, username, email string
		
		// Bisa login pakai Username ATAU Email
		err := db.QueryRow("SELECT id, role, username, email FROM users WHERE (username = $1 OR email = $1) AND password = $2", req.Username, req.Password).Scan(&id, &role, &username, &email)
		if err != nil { c.JSON(401, gin.H{"error": "Username/Email atau Password salah"}); return }
		
		// Kembalikan data email agar bisa disimpan di frontend
		c.JSON(200, gin.H{"status": "success", "role": role, "username": username, "email": email})
	})

	fmt.Println("Mesin Backend RACEDAYTRIPS siap...")
	r.Run(":8080")
}
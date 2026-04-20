package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

// =====================================================================
// STRUCT (POLA DATA)
// =====================================================================

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
	PaymentMethod string `json:"payment_method"`
}

type PackageRequest struct {
	EventID     int    `json:"event_id"`
	Name        string `json:"name"`
	Price       int    `json:"price"`
	Stock       int    `json:"stock"`
	Description string `json:"description"`
}

// =====================================================================
// FUNGSI UTAMA (MAIN)
// =====================================================================

func main() {
	connStr := "postgresql://postgres:%40RaceDayTrips@db.txcphmqixwjfpdkvnecd.supabase.co:5432/postgres"

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
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

	// -----------------------------------------------------------------
	// 1. RUTE EVENTS
	// -----------------------------------------------------------------
	r.GET("/events", func(c *gin.Context) {
		rows, err := db.Query("SELECT id, name, circuit, date, time, price, category, stock, COALESCE(country, 'id'), COALESCE(image, ''), COALESCE(description, ''), COALESCE(end_date::TEXT, '') FROM events ORDER BY date ASC")
		if err != nil {
			fmt.Println("❌ ERROR TARIK EVENTS:", err.Error())
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var events []map[string]interface{}
		for rows.Next() {
			var id, price, stock int
			var name, circuit, date, time, category, country, image, description, endDate string

			errScan := rows.Scan(&id, &name, &circuit, &date, &time, &price, &category, &stock, &country, &image, &description, &endDate)
			if errScan != nil {
				fmt.Println("❌ ERROR SCAN EVENT:", errScan.Error())
				continue
			}

			events = append(events, map[string]interface{}{
				"id": id, "name": name, "circuit": circuit, "date": date, "time": time,
				"price": price, "category": category, "stock": stock,
				"country": country, "image": image, "description": description, "end_date": endDate,
			})
		}
		c.JSON(200, events)
	})

	r.POST("/events", func(c *gin.Context) {
		name := c.PostForm("name")
		circuit := c.PostForm("circuit")
		date := c.PostForm("date")
		endDate := c.PostForm("end_date")
		timeStr := c.PostForm("time")
		price, _ := strconv.Atoi(c.PostForm("price"))
		category := c.PostForm("category")
		stock, _ := strconv.Atoi(c.PostForm("stock"))
		country := c.PostForm("country")
		description := c.PostForm("description")
		file, err := c.FormFile("image")
		imageURL := ""
		if err == nil {
			ext := strings.ToLower(filepath.Ext(file.Filename))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" {
				filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(file.Filename))
				if c.SaveUploadedFile(file, "./uploads/"+filename) == nil {
					imageURL = "http://localhost:8080/uploads/" + filename
				}
			}
		}

		var endDateDb interface{}
		if endDate == "" {
			endDateDb = nil
		} else {
			endDateDb = endDate
		}

		db.Exec("INSERT INTO events (name, circuit, date, end_date, time, price, category, stock, country, image, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)", name, circuit, date, endDateDb, timeStr, price, category, stock, country, imageURL, description)
		c.JSON(200, gin.H{"status": "success"})
	})

	r.PUT("/events/:id", func(c *gin.Context) {
		id := c.Param("id")
		name := c.PostForm("name")
		circuit := c.PostForm("circuit")
		date := c.PostForm("date")
		endDate := c.PostForm("end_date")
		timeStr := c.PostForm("time")
		price, _ := strconv.Atoi(c.PostForm("price"))
		category := c.PostForm("category")
		stock, _ := strconv.Atoi(c.PostForm("stock"))
		country := c.PostForm("country")
		description := c.PostForm("description")
		imageURL := c.PostForm("existing_image")
		file, err := c.FormFile("image")
		if err == nil {
			ext := strings.ToLower(filepath.Ext(file.Filename))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" {
				filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(file.Filename))
				if c.SaveUploadedFile(file, "./uploads/"+filename) == nil {
					imageURL = "http://localhost:8080/uploads/" + filename
				}
			}
		}

		var endDateDb interface{}
		if endDate == "" {
			endDateDb = nil
		} else {
			endDateDb = endDate
		}

		db.Exec("UPDATE events SET name=$1, circuit=$2, date=$3, end_date=$4, time=$5, price=$6, category=$7, stock=$8, country=$9, image=$10, description=$11 WHERE id=$12", name, circuit, date, endDateDb, timeStr, price, category, stock, country, imageURL, description, id)
		c.JSON(200, gin.H{"status": "success"})
	})

	r.DELETE("/events/:id", func(c *gin.Context) {
		id := c.Param("id")
		db.Exec("DELETE FROM events WHERE id = $1", id)
		c.JSON(200, gin.H{"status": "success"})
	})

	// -----------------------------------------------------------------
	// 2. RUTE PACKAGES
	// -----------------------------------------------------------------
	r.GET("/packages", func(c *gin.Context) {
		rows, err := db.Query("SELECT id, event_id, name, price, COALESCE(stock, 0), COALESCE(description, '') FROM packages ORDER BY id DESC")
		if err != nil {
			fmt.Println("❌ ERROR TARIK PACKAGES:", err.Error())
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var pkgs []map[string]interface{}
		for rows.Next() {
			var id, eventID, price, stock int
			var name, description string

			rows.Scan(&id, &eventID, &name, &price, &stock, &description)

			pkgs = append(pkgs, map[string]interface{}{
				"id": id, "event_id": eventID, "name": name,
				"price": price, "stock": stock, "description": description,
			})
		}
		c.JSON(200, pkgs)
	})

	r.POST("/packages", func(c *gin.Context) {
		var req PackageRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			fmt.Println("❌ ERROR FORMAT JSON DARI WEB:", err)
			c.JSON(400, gin.H{"error": "Format salah"})
			return
		}

		_, err := db.Exec("INSERT INTO packages (event_id, name, price, stock, description) VALUES ($1, $2, $3, $4, $5)", req.EventID, req.Name, req.Price, req.Stock, req.Description)
		if err != nil {
			fmt.Println("❌ ERROR DATABASE SUPABASE (POST):", err)
			c.JSON(500, gin.H{"error": "Gagal menyimpan package"})
			return
		}
		c.JSON(200, gin.H{"status": "success"})
	})

	r.PUT("/packages/:id", func(c *gin.Context) {
		id := c.Param("id")
		var req PackageRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Format salah"})
			return
		}

		_, err := db.Exec("UPDATE packages SET event_id=$1, name=$2, price=$3, stock=$4, description=$5 WHERE id=$6", req.EventID, req.Name, req.Price, req.Stock, req.Description, id)
		if err != nil {
			fmt.Println("❌ ERROR DATABASE SUPABASE (PUT):", err)
			c.JSON(500, gin.H{"error": "Gagal update package"})
			return
		}
		c.JSON(200, gin.H{"status": "success"})
	})

	r.DELETE("/packages/:id", func(c *gin.Context) {
		id := c.Param("id")
		_, err := db.Exec("DELETE FROM packages WHERE id = $1", id)
		if err != nil {
			c.JSON(500, gin.H{"error": "Gagal menghapus package"})
			return
		}
		c.JSON(200, gin.H{"status": "success"})
	})

	// -----------------------------------------------------------------
	// 3. RUTE CHECKOUT & TRANSACTIONS
	// -----------------------------------------------------------------
	r.POST("/checkout", func(c *gin.Context) {
		var req CheckoutRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Data tidak valid"})
			return
		}

		pkgName := ""
		if strings.Contains(req.PaymentMethod, "[PK: ") {
			parts := strings.Split(req.PaymentMethod, "[PK: ")
			pkgName = strings.TrimSuffix(parts[1], "]")
		}

		var price float64
		err := db.QueryRow("SELECT price FROM packages WHERE event_id = $1 AND name = $2", req.EventID, pkgName).Scan(&price)

		if err != nil {
			db.QueryRow("SELECT price FROM events WHERE id = $1", req.EventID).Scan(&price)
		}

		totalPrice := price * float64(req.Quantity)

		_, err = db.Exec(`
			INSERT INTO transactions 
			(event_id, user_name, quantity, total_price, email, phone, payment_method, status) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')`,
			req.EventID, req.UserName, req.Quantity, totalPrice, req.Email, req.Phone, req.PaymentMethod,
		)

		if err != nil {
			log.Println("Error insert DB:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan pesanan ke database"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Sukses"})
	})

	r.PUT("/transactions/:id/lunas", func(c *gin.Context) {
		id := c.Param("id")

		var eventID, quantity int
		var paymentMethod string
		err := db.QueryRow("SELECT event_id, quantity, payment_method FROM transactions WHERE id = $1", id).Scan(&eventID, &quantity, &paymentMethod)

		if err == nil {
			if strings.Contains(paymentMethod, "[PK: ") {
				parts := strings.Split(paymentMethod, "[PK: ")
				pkgName := strings.TrimSuffix(parts[1], "]")
				db.Exec("UPDATE packages SET stock = stock - $1 WHERE event_id = $2 AND name = $3", quantity, eventID, pkgName)
			}
		}

		db.Exec("UPDATE transactions SET status = 'PAID' WHERE id = $1", id)
		c.JSON(200, gin.H{"status": "success"})
	})

	r.PUT("/transactions/:id/upload-proof", func(c *gin.Context) {
		id := c.Param("id")
		file, err := c.FormFile("proof")
		if err != nil {
			c.JSON(400, gin.H{"error": "File tidak ditemukan"})
			return
		}

		ext := strings.ToLower(filepath.Ext(file.Filename))
		if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".pdf" {
			filename := fmt.Sprintf("proof_%d_%s", time.Now().Unix(), filepath.Base(file.Filename))
			if c.SaveUploadedFile(file, "./uploads/"+filename) == nil {
				proofURL := "http://localhost:8080/uploads/" + filename
				db.Exec("UPDATE transactions SET proof_image = $1 WHERE id = $2", proofURL, id)
				c.JSON(200, gin.H{"status": "success", "proof_url": proofURL})
				return
			}
		}
		c.JSON(500, gin.H{"error": "Gagal menyimpan bukti"})
	})

	r.GET("/transactions", func(c *gin.Context) {
		rows, err := db.Query(`SELECT t.id, e.name as event_name, t.user_name, COALESCE(t.email, ''), COALESCE(t.phone, ''), COALESCE(t.payment_method, ''), t.status, t.quantity, t.total_price, t.created_at, COALESCE(t.proof_image, '') FROM transactions t JOIN events e ON t.event_id = e.id ORDER BY t.created_at DESC`)

		if err != nil {
			fmt.Println("❌ ERROR TARIK DATA ADMIN:", err.Error())
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var transactions []map[string]interface{}
		var totalRevenue int64 = 0
		var totalTicketsSold int = 0

		for rows.Next() {
			var id, quantity int
			var totalPrice int64
			var eventName, userName, email, phone, paymentMethod, status, createdAt, proofImage string

			rows.Scan(&id, &eventName, &userName, &email, &phone, &paymentMethod, &status, &quantity, &totalPrice, &createdAt, &proofImage)

			transactions = append(transactions, map[string]interface{}{
				"id": id, "event_name": eventName, "user_name": userName,
				"email": email, "phone": phone, "payment_method": paymentMethod,
				"status": status, "quantity": quantity, "total_price": totalPrice,
				"booking_date": createdAt, "proof_image": proofImage,
			})

			if status == "PAID" || status == "paid" {
				totalRevenue += totalPrice
				totalTicketsSold += quantity
			}
		}
		c.JSON(200, gin.H{"status": "success", "total_revenue": totalRevenue, "total_tickets_sold": totalTicketsSold, "history": transactions})
	})

	// -----------------------------------------------------------------
	// ✅ FIX: RUTE PROFIL USER (Tambahkan t.payment_method)
	// -----------------------------------------------------------------
	r.GET("/my-transactions", func(c *gin.Context) {
		username := c.Query("username")

		// ✅ FIX: Tambahkan COALESCE(t.payment_method, '') di dalam query SELECT
		rows, err := db.Query(`SELECT t.id, e.name as event_name, COALESCE(e.image, ''), t.status, t.quantity, t.total_price, t.created_at, COALESCE(t.payment_method, '') FROM transactions t JOIN events e ON t.event_id = e.id WHERE t.user_name = $1 ORDER BY t.created_at DESC`, username)

		if err != nil {
			fmt.Println("❌ ERROR TARIK DATA PROFIL:", err.Error())
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var myTx []map[string]interface{}
		for rows.Next() {
			var id, quantity int
			var totalPrice int64
			var eventName, image, status, createdAt, paymentMethod string // ✅ FIX: Siapkan wadah paymentMethod

			// ✅ FIX: Scan paymentMethod di akhir
			rows.Scan(&id, &eventName, &image, &status, &quantity, &totalPrice, &createdAt, &paymentMethod)

			myTx = append(myTx, map[string]interface{}{
				"id": id, "event_name": eventName, "image": image,
				"status": status, "quantity": quantity, "total_price": totalPrice,
				"booking_date":   createdAt,
				"payment_method": paymentMethod, // ✅ FIX: Kirim ke Frontend
			})
		}
		c.JSON(200, myTx)
	})

	// -----------------------------------------------------------------
	// 4. RUTE USERS & AUTH
	// -----------------------------------------------------------------
	r.GET("/users", func(c *gin.Context) {
		rows, err := db.Query("SELECT id, username FROM users WHERE role = 'user' ORDER BY id DESC")
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()
		var users []map[string]interface{}
		for rows.Next() {
			var id int
			var username string
			rows.Scan(&id, &username)
			users = append(users, map[string]interface{}{"id": id, "username": username})
		}
		c.JSON(200, users)
	})

	r.POST("/register", func(c *gin.Context) {
		var req AuthRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Format salah"})
			return
		}

		// ✅ FIX: Email harus disimpan saat mendaftar agar histori masuk email
		_, err := db.Exec("INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, 'user')", req.Username, req.Email, req.Password)
		if err != nil {
			c.JSON(409, gin.H{"error": "Username/Email sudah terdaftar!"})
			return
		}
		c.JSON(200, gin.H{"status": "success"})
	})

	r.POST("/login", func(c *gin.Context) {
		var req AuthRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Format data salah"})
			return
		}

		var id int
		var role, username, email string

		err := db.QueryRow("SELECT id, role, username, COALESCE(email, '') FROM users WHERE (username = $1 OR email = $1) AND password = $2", req.Username, req.Password).Scan(&id, &role, &username, &email)

		if err != nil {
			fmt.Println("❌ ERROR LOGIN DARI DATABASE:", err)
			c.JSON(401, gin.H{"error": "Username/Email atau Password salah!"})
			return
		}

		c.JSON(200, gin.H{"status": "success", "role": role, "username": username, "email": email})
	})

	fmt.Println("✅ Mesin Backend RACEDAYTRIPS siap gas pol...")
	r.Run(":8080")
}

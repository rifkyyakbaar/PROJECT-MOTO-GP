package main

import (
	"bytes"
	"database/sql"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
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
	IsActive    *bool  `json:"is_active"`
}

// =====================================================================
// HELPER: UPLOAD KE SUPABASE STORAGE
// =====================================================================

func uploadToSupabase(file *multipart.FileHeader) (string, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")

	if supabaseURL == "" || supabaseKey == "" {
		return "", fmt.Errorf("SUPABASE_URL atau SUPABASE_KEY belum diatur di .env")
	}

	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(file.Filename))

	// Endpoint API Supabase Storage (pastikan bucket bernama 'uploads')
	uploadURL := fmt.Sprintf("%s/storage/v1/object/uploads/%s", supabaseURL, filename)

	req, err := http.NewRequest("POST", uploadURL, src)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("apikey", supabaseKey)
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	req.Header.Set("Content-Type", contentType)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("gagal upload ke supabase: %s", string(bodyBytes))
	}

	// Buat Public URL
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/uploads/%s", supabaseURL, filename)
	return publicURL, nil
}

// =====================================================================
// FUNGSI UTAMA (MAIN)
// =====================================================================

func main() {
	// Muat file .env jika ada
	godotenv.Load()

	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("❌ DATABASE_URL belum diatur di file .env")
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	os.MkdirAll("./uploads", os.ModePerm)
	r := gin.Default()

	// Migrasi otomatis kolom is_active jika belum ada
	db.Exec("ALTER TABLE events ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE")
	db.Exec("ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE")

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	r.Static("/uploads", "./uploads")

	r.GET("/test-supabase", func(c *gin.Context) {
		supabaseURL := os.Getenv("SUPABASE_URL")
		supabaseKey := os.Getenv("SUPABASE_KEY")

		maskedKey := ""
		if len(supabaseKey) > 15 {
			maskedKey = supabaseKey[:15] + "..."
		} else {
			maskedKey = "too short (" + strconv.Itoa(len(supabaseKey)) + " chars)"
		}

		dummyData := []byte("diagnostic test file upload from hugging face server")
		uploadURL := fmt.Sprintf("%s/storage/v1/object/uploads/diagnostic_test_%d.txt", supabaseURL, time.Now().Unix())

		req, err := http.NewRequest("POST", uploadURL, bytes.NewReader(dummyData))
		if err != nil {
			c.JSON(500, gin.H{"error": "failed to create request: " + err.Error()})
			return
		}

		req.Header.Set("Authorization", "Bearer "+supabaseKey)
		req.Header.Set("apikey", supabaseKey)
		req.Header.Set("Content-Type", "text/plain")

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			c.JSON(500, gin.H{
				"error":      "failed to execute request: " + err.Error(),
				"url":        supabaseURL,
				"masked_key": maskedKey,
			})
			return
		}
		defer resp.Body.Close()

		bodyBytes, _ := io.ReadAll(resp.Body)
		c.JSON(200, gin.H{
			"status":      resp.Status,
			"status_code": resp.StatusCode,
			"body":        string(bodyBytes),
			"url":        supabaseURL,
			"masked_key": maskedKey,
		})
	})

	// -----------------------------------------------------------------
	// 1. RUTE EVENTS
	// -----------------------------------------------------------------
	r.GET("/events", func(c *gin.Context) {
		rows, err := db.Query("SELECT id, name, circuit, date, time, price, category, stock, COALESCE(country, 'id'), COALESCE(image, ''), COALESCE(description, ''), COALESCE(end_date::TEXT, ''), COALESCE(is_active, TRUE) FROM events ORDER BY date ASC")
		if err != nil {
			fmt.Println("❌ ERROR RETRIEVING EVENTS:", err.Error())
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var events []map[string]interface{}
		for rows.Next() {
			var id, price, stock int
			var name, circuit, date, time, category, country, image, description, endDate string
			var isActive bool

			errScan := rows.Scan(&id, &name, &circuit, &date, &time, &price, &category, &stock, &country, &image, &description, &endDate, &isActive)
			if errScan != nil {
				fmt.Println("❌ ERROR SCANNING EVENT:", errScan.Error())
				continue
			}

			events = append(events, map[string]interface{}{
				"id": id, "name": name, "circuit": circuit, "date": date, "time": time,
				"price": price, "category": category, "stock": stock,
				"country": country, "image": image, "description": description, "end_date": endDate,
				"is_active": isActive,
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
				url, errUpload := uploadToSupabase(file)
				if errUpload == nil {
					imageURL = url
				} else {
					fmt.Println("❌ ERROR UPLOAD SUPABASE:", errUpload)
				}
			}
		}

		var endDateDb interface{}
		if endDate == "" {
			endDateDb = nil
		} else {
			endDateDb = endDate
		}

		isActiveStr := c.PostForm("is_active")
		isActive := true
		if isActiveStr == "false" {
			isActive = false
		}

		db.Exec("INSERT INTO events (name, circuit, date, end_date, time, price, category, stock, country, image, description, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)", name, circuit, date, endDateDb, timeStr, price, category, stock, country, imageURL, description, isActive)
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
				url, errUpload := uploadToSupabase(file)
				if errUpload == nil {
					imageURL = url
				} else {
					fmt.Println("❌ ERROR UPLOAD SUPABASE:", errUpload)
				}
			}
		}

		var endDateDb interface{}
		if endDate == "" {
			endDateDb = nil
		} else {
			endDateDb = endDate
		}

		isActiveStr := c.PostForm("is_active")
		isActive := true
		if isActiveStr == "false" {
			isActive = false
		}

		db.Exec("UPDATE events SET name=$1, circuit=$2, date=$3, end_date=$4, time=$5, price=$6, category=$7, stock=$8, country=$9, image=$10, description=$11, is_active=$13 WHERE id=$12", name, circuit, date, endDateDb, timeStr, price, category, stock, country, imageURL, description, id, isActive)
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
		rows, err := db.Query("SELECT id, event_id, name, price, COALESCE(stock, 0), COALESCE(description, ''), COALESCE(is_active, TRUE) FROM packages ORDER BY id DESC")
		if err != nil {
			fmt.Println("❌ ERROR RETRIEVING PACKAGES:", err.Error())
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var pkgs []map[string]interface{}
		for rows.Next() {
			var id, eventID, price, stock int
			var name, description string
			var isActive bool

			rows.Scan(&id, &eventID, &name, &price, &stock, &description, &isActive)

			pkgs = append(pkgs, map[string]interface{}{
				"id": id, "event_id": eventID, "name": name,
				"price": price, "stock": stock, "description": description, "is_active": isActive,
			})
		}
		c.JSON(200, pkgs)
	})

	r.POST("/packages", func(c *gin.Context) {
		var req PackageRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			fmt.Println("❌ ERROR FORMAT JSON DARI WEB:", err)
			c.JSON(400, gin.H{"error": "Invalid format"})
			return
		}

		var isActive bool = true
		if req.IsActive != nil {
			isActive = *req.IsActive
		}
		_, err := db.Exec("INSERT INTO packages (event_id, name, price, stock, description, is_active) VALUES ($1, $2, $3, $4, $5, $6)", req.EventID, req.Name, req.Price, req.Stock, req.Description, isActive)
		if err != nil {
			fmt.Println("❌ ERROR DATABASE SUPABASE (POST):", err)
			c.JSON(500, gin.H{"error": "Failed to save the package"})
			return
		}
		c.JSON(200, gin.H{"status": "success"})
	})

	r.PUT("/packages/:id", func(c *gin.Context) {
		id := c.Param("id")
		var req PackageRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Invalid format"})
			return
		}

		var isActive bool = true
		if req.IsActive != nil {
			isActive = *req.IsActive
		}
		_, err := db.Exec("UPDATE packages SET event_id=$1, name=$2, price=$3, stock=$4, description=$5, is_active=$7 WHERE id=$6", req.EventID, req.Name, req.Price, req.Stock, req.Description, id, isActive)
		if err != nil {
			fmt.Println("❌ ERROR DATABASE SUPABASE (PUT):", err)
			c.JSON(500, gin.H{"error": "Failed to update the package"})
			return
		}
		c.JSON(200, gin.H{"status": "success"})
	})

	r.DELETE("/packages/:id", func(c *gin.Context) {
		id := c.Param("id")
		_, err := db.Exec("DELETE FROM packages WHERE id = $1", id)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to delete the package"})
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
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid data"})
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
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to save the order to the database"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Success"})
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
			c.JSON(400, gin.H{"error": "File not found"})
			return
		}

		ext := strings.ToLower(filepath.Ext(file.Filename))
		if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".pdf" {
			proofURL, errUpload := uploadToSupabase(file)
			if errUpload == nil {
				db.Exec("UPDATE transactions SET proof_image = $1 WHERE id = $2", proofURL, id)
				c.JSON(200, gin.H{"status": "success", "proof_url": proofURL})
				return
			} else {
				fmt.Println("❌ ERROR UPLOAD PROOF SUPABASE:", errUpload)
			}
		}
		c.JSON(500, gin.H{"error": "Failed to save the proof"})
	})
	
	r.GET("/transactions", func(c *gin.Context) {
		rows, err := db.Query(`SELECT t.id, e.name as event_name, t.user_name, COALESCE(t.email, ''), COALESCE(t.phone, ''), COALESCE(t.payment_method, ''), t.status, t.quantity, t.total_price, t.created_at, COALESCE(t.proof_image, '') FROM transactions t JOIN events e ON t.event_id = e.id ORDER BY t.created_at DESC`)

		if err != nil {
			fmt.Println("❌ ERROR RETRIEVING ADMIN DATA:", err.Error())
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
			fmt.Println("❌ ERROR RETRIEVING PROFILE DATA:", err.Error())
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
			c.JSON(400, gin.H{"error": "Invalid format"})
			return
		}

		// ✅ SECURE: Hash password sebelum disimpan
		hashedPassword, errHash := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
		if errHash != nil {
			c.JSON(500, gin.H{"error": "Failed to hash password"})
			return
		}

		// ✅ FIX: Email harus disimpan saat mendaftar agar histori masuk email
		_, err := db.Exec("INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, 'user')", req.Username, req.Email, string(hashedPassword))
		if err != nil {
			c.JSON(409, gin.H{"error": "Username/Email is already registered!"})
			return
		}
		c.JSON(200, gin.H{"status": "success"})
	})

	r.POST("/login", func(c *gin.Context) {
		var req AuthRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Invalid data format"})
			return
		}

		var id int
		var role, username, email, dbPassword string

		// ✅ SECURE: Ambil password hash dari DB
		err := db.QueryRow("SELECT id, role, username, COALESCE(email, ''), password FROM users WHERE (username = $1 OR email = $1)", req.Username).Scan(&id, &role, &username, &email, &dbPassword)

		if err != nil {
			fmt.Println("❌ LOGIN ERROR: User not found", err)
			c.JSON(401, gin.H{"error": "Incorrect username/email or password!"})
			return
		}

		// ✅ SECURE: Cocokkan password teks dengan hash
		err = bcrypt.CompareHashAndPassword([]byte(dbPassword), []byte(req.Password))
		if err != nil {
			fmt.Println("❌ LOGIN ERROR: Wrong password", err)
			c.JSON(401, gin.H{"error": "Incorrect username/email or password!"})
			return
		}

		c.JSON(200, gin.H{"status": "success", "role": role, "username": username, "email": email})
	})

	fmt.Println("✅ Our RacedayTrips backend is fully fired up and ready to roll")
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}

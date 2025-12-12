package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Listing struct {
	ID     string   `json:"id"`
	Title  string   `json:"title"`
	Price  int      `json:"price"`
	Beds   int      `json:"beds"`
	Baths  int      `json:"baths"`
	Status string   `json:"status"`
	Lat    float64  `json:"lat"`
	Lng    float64  `json:"lng"`
	Image  string   `json:"image,omitempty"`
	Photos []string `json:"photos,omitempty"`
}

var db *pgxpool.Pool

func main() {
	ctx := context.Background()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://srikar:devpassword@localhost:5555/realestatepro?sslmode=disable"
	}
	log.Println("Using DSN:", dsn)

	var err error
	db, err = pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatal("failed to connect to db:", err)
	}
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/listings", handleListings)
	mux.HandleFunc("/api/listings/", handleListingByID)

	handler := corsMiddleware(mux)

	log.Println("Go API with Postgres on :8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}

func handleListings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	status := r.URL.Query().Get("status")

	query := `
SELECT
  l.id,
  l.title,
  l.price,
  l.beds,
  l.baths,
  l.status,
  l.latitude AS lat,
  l.longitude AS lng,
  COALESCE(
    (
      SELECT url
      FROM listing_photos p
      WHERE p.listing_id = l.id
      ORDER BY p.sort_order
      LIMIT 1
    ),
    ''
  ) AS image
FROM listings l
`
	var args []any

	if status != "" {
		query += ` WHERE l.status = $1`
		args = append(args, status)
	}

	// You can order however you like; this is just one example
	query += ` ORDER BY l.status, l.id`

	rows, err := db.Query(ctx, query, args...)
	if err != nil {
		log.Printf("handleListings: db query error: %v\n", err)
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var out []Listing
	for rows.Next() {
		var l Listing
		if err := rows.Scan(
			&l.ID,
			&l.Title,
			&l.Price,
			&l.Beds,
			&l.Baths,
			&l.Status,
			&l.Lat,
			&l.Lng,
			&l.Image,
		); err != nil {
			http.Error(w, "scan error", http.StatusInternalServerError)
			return
		}
		out = append(out, l)
	}
	writeJSON(w, out)
}

func handleListingByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := strings.TrimPrefix(r.URL.Path, "/api/listings/")
	if id == "" {
		http.NotFound(w, r)
		return
	}

	var l Listing
    row := db.QueryRow(ctx,
        `SELECT id, title, price, beds, baths, status,
                latitude AS lat, longitude AS lng
         FROM listings WHERE id = $1`,
        id,
    )
	if err := row.Scan(&l.ID, &l.Title, &l.Price, &l.Beds, &l.Baths, &l.Status, &l.Lat, &l.Lng); err != nil {
		log.Printf("handleListingByID: scan error for id %s: %v\n", id, err)
		http.NotFound(w, r)
		return
	}

	// Load photos for gallery
	rows, err := db.Query(ctx,
		`SELECT url FROM listing_photos WHERE listing_id = $1 ORDER BY sort_order`,
		id,
	)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var url string
			if err := rows.Scan(&url); err == nil {
				l.Photos = append(l.Photos, url)
			}
		}
	}

    if len(l.Photos) > 0 && l.Image == "" {
        l.Image = l.Photos[0]
    }

	writeJSON(w, l)
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	if err := enc.Encode(v); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
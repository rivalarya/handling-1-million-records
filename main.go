package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	MONGODB_URL     = "mongodb://localhost:27017"
	DATABASE_NAME   = "handling-1-million-data"
	COLLECTION_NAME = "yelp_database"
	BATCH_SIZE      = 10000
)

func main() {
	startTime := time.Now()
	fmt.Printf("Started at: %s\n", startTime.Format("01/02/2006 03:04:05 PM"))

	cwd, err := os.Getwd()
	if err != nil {
		log.Fatalf("Error getting current directory: %v", err)
	}
	dataFilePath := fmt.Sprintf("%s/yelp_database.csv", cwd)

	ctx := context.Background()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(MONGODB_URL))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer func() {
		if err := client.Disconnect(ctx); err != nil {
			log.Printf("Error disconnecting from MongoDB: %v", err)
		}
	}()

	fmt.Println("Connected to MongoDB")

	collection := client.Database(DATABASE_NAME).Collection(COLLECTION_NAME)

	if _, err := os.Stat(dataFilePath); os.IsNotExist(err) {
		log.Fatalf("Error: File not found at %s", dataFilePath)
	}

	batchChannel := make(chan []interface{}, 10)

	done := make(chan bool)
	go func() {
		for batch := range batchChannel {
			_, err := collection.InsertMany(ctx, batch)
			if err != nil {
				log.Printf("Error inserting batch: %v", err)
			}
		}
		done <- true
	}()

	file, err := os.Open(dataFilePath)
	if err != nil {
		log.Fatalf("Error opening file: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)

	headers, err := reader.Read()
	if err != nil {
		log.Fatalf("Error reading CSV headers: %v", err)
	}

	var buffer []interface{}

	for {
		record, err := reader.Read()
		if err != nil {
			break // End of file or error
		}

		data := make(map[string]string)
		for i, header := range headers {
			if i < len(record) {
				data[header] = record[i]
			}
		}

		buffer = append(buffer, data)

		// Send batch to channel when buffer is full
		if len(buffer) >= BATCH_SIZE {
			batchChannel <- buffer
			buffer = nil // Clear buffer
		}
	}

	// Send remaining records
	if len(buffer) > 0 {
		batchChannel <- buffer
	}

	// Close channel and wait for worker to finish
	close(batchChannel)
	<-done

	endTime := time.Now()
	timeTaken := endTime.Sub(startTime)
	minutes := int(timeTaken.Minutes())
	seconds := int(timeTaken.Seconds()) % 60

	totalDocuments, err := collection.CountDocuments(ctx, map[string]interface{}{})
	if err != nil {
		log.Printf("Error counting documents: %v", err)
	}

	fmt.Println("---")
	fmt.Printf("Finished! Total documents in database: %d\n", totalDocuments)
	fmt.Printf("Time taken: %d minutes %d seconds\n", minutes, seconds)
}
# Step 1: Build stage using Golang image
FROM golang:1.23-alpine AS builder

# Set directory inside the container
WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the Go application into a binary named 'main'
RUN go build -o main .

# Step 2: Runtime stage using a small Alpine image
FROM alpine:latest

# Set working directory
WORKDIR /app

# Copy the built binary from the build stage
COPY --from=builder /app/main .

# Create uploads directory (just in case local static uploads are needed)
RUN mkdir -p uploads

# Expose port (can be overridden by PORT environment variable)
EXPOSE 8080

# Run the binary
CMD ["./main"]

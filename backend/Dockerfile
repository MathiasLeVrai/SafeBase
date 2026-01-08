# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install build dependencies (gcc and musl-dev needed for CGO/SQLite)
RUN apk add --no-cache git gcc musl-dev

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -o server ./cmd/server/main.go

# Production stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    mysql-client \
    postgresql-client \
    ca-certificates \
    tzdata \
    wget

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/server .

# Create directories
RUN mkdir -p /app/backups /app/data

# Expose port
EXPOSE 8081

# Set environment variables
ENV PORT=8081
ENV DB_PATH=/app/data/safebase.db
ENV BACKUP_DIR=/app/backups

# Run the server
CMD ["./server"]

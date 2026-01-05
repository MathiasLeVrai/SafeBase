#!/bin/bash

echo "Initialisation des bases de données de test..."

echo "Attente du démarrage de MySQL..."
sleep 10

mysql -h localhost -P 3306 -u testuser -ptestpass testdb <<EOF
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO users (name, email) VALUES 
    ('Alice Dupont', 'alice@example.com'),
    ('Bob Martin', 'bob@example.com'),
    ('Charlie Wilson', 'charlie@example.com');
EOF

echo "Attente du démarrage de PostgreSQL..."
sleep 5

PGPASSWORD=testpass psql -h localhost -p 5432 -U testuser -d testdb <<EOF
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, price, stock) 
SELECT 'Laptop', 999.99, 10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Laptop');

INSERT INTO products (name, price, stock) 
SELECT 'Mouse', 29.99, 50
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Mouse');

INSERT INTO products (name, price, stock) 
SELECT 'Keyboard', 79.99, 30
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Keyboard');
EOF

echo "Bases de données initialisées avec succès!"


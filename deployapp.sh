#!/bin/bash

set -e

APP_DIR="/home/station/station-dashboard"
WEB_DIR="/var/www/monitoring-app"
NGINX_SERVICE="nginx"

echo "=========================================="
echo " React Frontend Deployment"
echo "=========================================="

echo "[1/8] Go to frontend directory..."
cd "$APP_DIR"

echo "[2/8] Check .env"
if [ ! -f ".env" ]; then
    echo "ERROR: .env not found!"
    echo "Create .env with:"
    echo "VITE_API_BASE_URL=/api"
    exit 1
fi

echo "Current .env:"
cat .env

echo "[3/8] Install dependencies..."
npm install

echo "[4/8] Build React app..."
npm run build

echo "[5/8] Check dist folder..."
if [ ! -f "dist/index.html" ]; then
    echo "ERROR: dist/index.html not found. Build failed."
    exit 1
fi

echo "[6/8] Deploy files to Nginx web directory..."
sudo mkdir -p "$WEB_DIR"
sudo rm -rf "$WEB_DIR"/*
sudo cp -r dist/* "$WEB_DIR"/

echo "[7/8] Fix permissions..."
sudo chown -R www-data:www-data "$WEB_DIR"
sudo chmod -R 755 "$WEB_DIR"

echo "[8/8] Test and reload Nginx..."
sudo nginx -t
sudo systemctl reload "$NGINX_SERVICE"

echo "=========================================="
echo " Deployment finished successfully."
echo "=========================================="
echo "Frontend URL:"
echo "http://YOUR_SERVER_IP"
echo ""
echo "API example:"
echo "http://YOUR_SERVER_IP/api/summary"
echo ""
echo "Do hard refresh in browser:"
echo "Ctrl + Shift + R"

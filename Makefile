.PHONY: help setup dev prod logs down build test lint format clean reset

help:
	@echo "🚀 JN Automation - Available Commands"
	@echo ""
	@echo "Setup & Development:"
	@echo "  make setup           - Initial setup"
	@echo "  make dev             - Start development"
	@echo "  make logs            - View all logs"
	@echo ""
	@echo "Production:"
	@echo "  make prod            - Start production"
	@echo "  make down            - Stop all services"
	@echo ""
	@echo "Database:"
	@echo "  make seed            - Seed database"
	@echo "  make db-cli          - MongoDB shell"
	@echo "  make redis-cli       - Redis shell"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint            - Lint code"
	@echo "  make format          - Format code"
	@echo "  make test            - Run tests"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean           - Remove containers"
	@echo "  make reset           - Full reset"

setup:
	@echo "📦 Installing dependencies..."
	cd backend && npm install
	cd frontend && npm install
	@echo "✅ Setup complete!"

dev:
	@echo "🚀 Starting development stack..."
	docker-compose up -d
	@echo "✅ Services running!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:5000"

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f mongodb

seed:
	docker-compose exec backend npm run seed

db-cli:
	docker-compose exec mongodb mongosh -u admin -p admin123 admin

redis-cli:
	docker-compose exec redis redis-cli

prod:
	@echo "🚀 Starting production stack..."
	docker-compose -f docker-compose.prod.yml up -d

down:
	docker-compose down

lint:
	cd backend && npm run lint
	cd frontend && npm run lint

format:
	cd backend && npm run format
	cd frontend && npm run format

test:
	cd backend && npm test
	cd frontend && npm test

build:
	docker-compose build

build-prod:
	docker-compose -f docker-compose.prod.yml build

clean:
	docker-compose down -v

reset:
	docker-compose down -v
	docker system prune -a --volumes -f
	docker-compose build --no-cache
	docker-compose up -d

shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

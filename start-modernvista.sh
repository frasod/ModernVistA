#!/bin/bash

# ModernVista Startup Script with Timeout Handling
# This script starts all components safely with proper error handling

set -e  # Exit on any error

# Configuration
TIMEOUT_SECONDS=30
FRONTEND_TIMEOUT_SECONDS=60
BACKEND_PORT=3001
FRONTEND_PORT=3000
VISTA_RPC_PORT=9430

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if port is in use
check_port() {
    local port=$1
    if ss -tlnp | grep -q ":$port "; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Wait for service to be ready
wait_for_service() {
    local url=$1
    local timeout=$2
    local service_name=$3
    
    log_info "Waiting for $service_name to be ready..."
    
    for i in $(seq 1 $timeout); do
        if curl -s --max-time 2 "$url" >/dev/null 2>&1; then
            log_success "$service_name is ready!"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    
    log_error "$service_name failed to start within ${timeout}s"
    return 1
}

# Kill processes on specific ports
kill_port_processes() {
    local port=$1
    local service_name=$2
    
    if check_port $port; then
        log_warning "$service_name port $port is busy, killing existing processes..."
        local pids=$(ss -tlnp | grep ":$port " | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs -r kill -TERM 2>/dev/null || true
            sleep 2
            echo "$pids" | xargs -r kill -KILL 2>/dev/null || true
            log_success "Killed processes on port $port"
        fi
    fi
}

# Graceful shutdown handler
cleanup() {
    log_info "Shutting down services gracefully..."
    
    # Kill backend
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" 2>/dev/null || true
        log_info "Backend stopped"
    fi
    
    # Kill frontend  
    if [ -n "$FRONTEND_PID" ]; then
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
        wait "$FRONTEND_PID" 2>/dev/null || true
        log_info "Frontend stopped"
    fi
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main startup sequence
main() {
    log_info "Starting ModernVista with timeout handling..."
    
    # Check if we're in the right directory
    if [ ! -f "QUICK_REFERENCE.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        log_error "Please run this script from the ModernVista root directory"
        exit 1
    fi
    
    # Step 1: Check VistA connectivity
    log_info "Checking VistA connectivity..."
    if ! nc -z localhost $VISTA_RPC_PORT 2>/dev/null; then
        log_warning "VistA RPC port $VISTA_RPC_PORT is not accessible"
        log_info "Make sure VistA Docker is running: docker start vehu"
    else
        log_success "VistA RPC is accessible"
    fi
    
    # Step 2: Prepare backend
    log_info "Preparing backend..."
    kill_port_processes $BACKEND_PORT "Backend"
    
    if [ ! -f "backend/.env" ]; then
        log_info "Creating backend .env file..."
        cp backend/.env.example backend/.env
    fi
    
    # Step 3: Start backend
    log_info "Starting backend server..."
    cd backend
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend
    if ! wait_for_service "http://localhost:$BACKEND_PORT/health" $TIMEOUT_SECONDS "Backend"; then
        log_error "Backend failed to start. Check logs/backend.log"
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
        exit 1
    fi
    
    # Step 4: Prepare frontend
    log_info "Preparing frontend..."
    kill_port_processes $FRONTEND_PORT "Frontend"
    
        # Step 5: Start frontend (dev or preview depending on env)
        FRONTEND_MODE=${FRONTEND_MODE:-dev}
        if [ "$FRONTEND_MODE" = "preview" ]; then
                log_info "FRONTEND_MODE=preview -> building production bundle..."
                cd frontend
                npm run build > ../logs/frontend.build.log 2>&1 || { log_error "Frontend build failed (see logs/frontend.build.log)"; cleanup; exit 1; }
                log_success "Frontend build complete"
                npm run preview > ../logs/frontend.log 2>&1 &
                FRONTEND_PID=$!
                cd ..
                PREVIEW_PORT=4173
                if ! wait_for_service "http://localhost:$PREVIEW_PORT/health" 5 "Preview health"; then
                    # preview lacks /health; fall back to root
                    wait_for_service "http://localhost:$PREVIEW_PORT" 10 "Preview root" || { log_error "Frontend preview failed to start"; cleanup; exit 1; }
                fi
                FRONTEND_PORT=$PREVIEW_PORT
        else
                log_info "Starting frontend dev server (Vite)..."
                cd frontend
                # Ensure deps
                if [ ! -d node_modules ]; then
                    log_warning "frontend/node_modules missing. Installing dependencies..."
                    npm install > ../logs/frontend.install.log 2>&1 || { log_error "Frontend npm install failed (see logs/frontend.install.log)"; cleanup; exit 1; }
                    log_success "Frontend dependencies installed"
                fi
                npm run dev > ../logs/frontend.log 2>&1 &
                FRONTEND_PID=$!
                cd ..
                if ! wait_for_service "http://localhost:$FRONTEND_PORT/health" 8 "Frontend /health"; then
                    # Health may not be up yet; fall back to base URL
                    if ! wait_for_service "http://localhost:$FRONTEND_PORT" $FRONTEND_TIMEOUT_SECONDS "Frontend"; then
                        log_warning "Dev server not ready in time, attempting production fallback..."
                        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
                        sleep 2
                        cd frontend
                        npm run build > ../logs/frontend.build.log 2>&1 || { log_error "Frontend build failed (see logs/frontend.build.log)"; cleanup; exit 1; }
                        log_success "Frontend build complete (fallback)"
                        npm run preview > ../logs/frontend.log 2>&1 &
                        FRONTEND_PID=$!
                        cd ..
                        PREVIEW_PORT=4173
                        if ! wait_for_service "http://localhost:$PREVIEW_PORT" 20 "Preview"; then
                            log_error "Preview fallback failed to start. Check logs/frontend.log and frontend.build.log"
                            cleanup
                            exit 1
                        fi
                        FRONTEND_PORT=$PREVIEW_PORT
                        FRONTEND_MODE=preview
                    fi
                fi
        fi
    
    # Success!
    log_success "ModernVista is running!"
    echo ""
    log_info "Access URLs:"
    echo "  • Frontend (${FRONTEND_MODE}): http://localhost:$FRONTEND_PORT"
    echo "  • Backend:  http://localhost:$BACKEND_PORT/health"
    echo "  • VistA:    http://localhost:8080"
    echo ""
    log_info "Press Ctrl+C to stop all services"
    
    # Keep script running
    wait
}

# Create logs directory
mkdir -p logs

# Run main function
main "$@"
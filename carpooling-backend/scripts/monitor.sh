#!/bin/bash

# Production monitoring script for ShareRides API

echo "ShareRides API Monitoring Dashboard"
echo "=================================="

# Check if logs directory exists
if [ ! -d "logs" ]; then
    echo "Creating logs directory..."
    mkdir -p logs
fi

# Function to check API health
check_health() {
    echo "Checking API health..."
    response=$(curl -s -w "%{http_code}" http://localhost:10000/api/health)
    http_code="${response: -3}"
    
    if [ "$http_code" -eq 200 ]; then
        echo "✅ API is healthy"
    else
        echo "❌ API health check failed (HTTP $http_code)"
    fi
}

# Function to show metrics
show_metrics() {
    echo "Fetching metrics..."
    curl -s -H "X-Internal-Request: true" http://localhost:10000/api/metrics | jq '.' 2>/dev/null || echo "Metrics not available"
}

# Function to show recent logs
show_logs() {
    echo "Recent application logs:"
    echo "======================="
    if [ -f "logs/combined.log" ]; then
        tail -20 logs/combined.log
    else
        echo "No logs found"
    fi
}

# Function to show error logs
show_errors() {
    echo "Recent error logs:"
    echo "=================="
    if [ -f "logs/error.log" ]; then
        tail -10 logs/error.log
    else
        echo "No error logs found"
    fi
}

# Function to monitor in real-time
monitor_realtime() {
    echo "Starting real-time monitoring... (Press Ctrl+C to exit)"
    echo "======================================================="
    
    while true; do
        clear
        echo "ShareRides API Real-time Monitor - $(date)"
        echo "=========================================="
        check_health
        echo ""
        show_metrics
        echo ""
        echo "Recent logs:"
        if [ -f "logs/combined.log" ]; then
            tail -5 logs/combined.log
        fi
        sleep 30
    done
}

# Parse command line arguments
case "$1" in
    "health")
        check_health
        ;;
    "metrics")
        show_metrics
        ;;
    "logs")
        show_logs
        ;;
    "errors")
        show_errors
        ;;
    "watch")
        monitor_realtime
        ;;
    *)
        echo "Usage: $0 {health|metrics|logs|errors|watch}"
        echo ""
        echo "Commands:"
        echo "  health   - Check API health status"
        echo "  metrics  - Show application metrics"
        echo "  logs     - Show recent application logs"
        echo "  errors   - Show recent error logs"
        echo "  watch    - Real-time monitoring dashboard"
        exit 1
        ;;
esac

# SYMBI Symphony Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Configuration](#configuration)
5. [Monitoring Setup](#monitoring-setup)
6. [Security Hardening](#security-hardening)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **CPU**: Minimum 4 cores (8 cores recommended for production)
- **Memory**: Minimum 8GB RAM (16GB recommended for production)
- **Storage**: Minimum 50GB SSD
- **Network**: Stable internet connection with low latency

### Software Requirements
- Docker 24.0+ and Docker Compose 2.0+
- Kubernetes 1.27+ (for Kubernetes deployment)
- Helm 3.12+ (for Kubernetes deployment)
- kubectl configured with cluster access

## Docker Deployment

### Quick Start with Docker Compose

1. **Clone the repository**:
```bash
git clone https://github.com/s8ken/SYMBI-Symphony.git
cd SYMBI-Symphony
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the services**:
```bash
docker-compose up -d
```

4. **Verify deployment**:
```bash
docker-compose ps
curl http://localhost:3000/health
```

### Production Docker Deployment

1. **Build production image**:
```bash
docker build -f Dockerfile.production -t symbi-symphony:1.0.0 .
```

2. **Run with production settings**:
```bash
docker run -d \
  --name symbi-symphony \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://host:6379 \
  -v /var/log/symphony:/app/logs \
  -v /var/data/symphony:/app/data \
  --restart unless-stopped \
  symbi-symphony:1.0.0
```

## Kubernetes Deployment

### Using Helm Charts

1. **Add Helm repository** (if published):
```bash
helm repo add symbi-symphony https://charts.symbi-symphony.io
helm repo update
```

2. **Install with default values**:
```bash
helm install symphony symbi-symphony/symbi-symphony \
  --namespace symphony \
  --create-namespace
```

3. **Install with custom values**:
```bash
helm install symphony symbi-symphony/symbi-symphony \
  --namespace symphony \
  --create-namespace \
  --values custom-values.yaml
```

### Manual Kubernetes Deployment

1. **Create namespace**:
```bash
kubectl create namespace symphony
```

2. **Create secrets**:
```bash
kubectl create secret generic symphony-secrets \
  --namespace symphony \
  --from-literal=DATABASE_URL=postgresql://... \
  --from-literal=REDIS_URL=redis://... \
  --from-literal=JWT_SECRET=your-secret-key
```

3. **Apply Kubernetes manifests**:
```bash
kubectl apply -f k8s/
```

4. **Verify deployment**:
```bash
kubectl get pods -n symphony
kubectl get services -n symphony
```

## Configuration

### Environment Variables

#### Core Configuration
```bash
NODE_ENV=production              # Environment (development/production)
PORT=3000                        # Application port
LOG_LEVEL=info                   # Logging level (debug/info/warn/error)
```

#### Database Configuration
```bash
DATABASE_URL=postgresql://user:pass@host:5432/symphony
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

#### Redis Configuration
```bash
REDIS_URL=redis://host:6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

#### Security Configuration
```bash
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRY=24h
API_KEY_SALT=your-api-key-salt
CORS_ORIGIN=https://your-domain.com
```

#### Observability Configuration
```bash
METRICS_ENABLED=true
METRICS_PORT=3000
TRACING_ENABLED=true
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
```

### Custom Configuration Files

Create a `config/production.yaml` file:
```yaml
server:
  port: 3000
  host: 0.0.0.0

database:
  url: ${DATABASE_URL}
  pool:
    min: 2
    max: 10

redis:
  url: ${REDIS_URL}
  
security:
  jwt:
    secret: ${JWT_SECRET}
    expiry: 24h
  rateLimit:
    windowMs: 900000
    maxRequests: 100

observability:
  logging:
    level: info
    format: json
  metrics:
    enabled: true
  tracing:
    enabled: true
    serviceName: symbi-symphony
```

## Monitoring Setup

### Prometheus Configuration

1. **Configure Prometheus scraping**:
```yaml
scrape_configs:
  - job_name: 'symphony'
    static_configs:
      - targets: ['symphony:3000']
    metrics_path: '/metrics'
```

2. **Access Prometheus UI**:
```
http://localhost:9090
```

### Grafana Dashboards

1. **Access Grafana**:
```
http://localhost:3001
Username: admin
Password: admin
```

2. **Import Symphony dashboard**:
- Navigate to Dashboards → Import
- Upload `config/grafana/dashboards/symphony-dashboard.json`

### Jaeger Tracing

1. **Access Jaeger UI**:
```
http://localhost:16686
```

2. **View traces**:
- Select "symbi-symphony" service
- Choose time range
- Search for specific traces

## Security Hardening

### SSL/TLS Configuration

1. **Generate SSL certificates**:
```bash
# Using Let's Encrypt
certbot certonly --standalone -d symphony.example.com
```

2. **Configure NGINX with SSL**:
```nginx
server {
    listen 443 ssl http2;
    server_name symphony.example.com;
    
    ssl_certificate /etc/letsencrypt/live/symphony.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/symphony.example.com/privkey.pem;
    
    # ... rest of configuration
}
```

### Network Security

1. **Configure firewall rules**:
```bash
# Allow only necessary ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

2. **Enable network policies** (Kubernetes):
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: symphony-network-policy
spec:
  podSelector:
    matchLabels:
      app: symbi-symphony
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
```

### Secrets Management

1. **Use Kubernetes secrets**:
```bash
kubectl create secret generic symphony-secrets \
  --from-file=.env \
  --namespace symphony
```

2. **Use HashiCorp Vault** (recommended for production):
```bash
# Install Vault
helm install vault hashicorp/vault

# Configure Vault integration
vault kv put secret/symphony \
  database_url="postgresql://..." \
  jwt_secret="..."
```

## Troubleshooting

### Common Issues

#### Application Won't Start

**Symptom**: Container exits immediately
**Solution**:
```bash
# Check logs
docker logs symbi-symphony

# Common causes:
# 1. Database connection failed
# 2. Missing environment variables
# 3. Port already in use
```

#### High Memory Usage

**Symptom**: Application consuming excessive memory
**Solution**:
```bash
# Check memory usage
docker stats symbi-symphony

# Adjust Node.js memory limits
docker run -e NODE_OPTIONS="--max-old-space-size=2048" ...
```

#### Database Connection Issues

**Symptom**: "Connection refused" or timeout errors
**Solution**:
```bash
# Verify database is running
docker-compose ps postgres

# Test connection
psql -h localhost -U symphony -d symphony

# Check network connectivity
docker network inspect symphony-network
```

#### Rate Limiting Issues

**Symptom**: 429 Too Many Requests errors
**Solution**:
```bash
# Adjust rate limits in configuration
# Or use Redis for distributed rate limiting
```

### Health Check Endpoints

- **Application Health**: `GET /health`
- **Readiness Check**: `GET /health/ready`
- **Liveness Check**: `GET /health/live`
- **Metrics**: `GET /metrics`

### Log Analysis

```bash
# View application logs
docker-compose logs -f symphony

# Filter by level
docker-compose logs symphony | grep ERROR

# Kubernetes logs
kubectl logs -f deployment/symphony -n symphony
```

### Performance Tuning

1. **Database Connection Pool**:
```javascript
pool: {
  min: 2,
  max: 10,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000
}
```

2. **Redis Configuration**:
```bash
# Increase max connections
redis-cli CONFIG SET maxclients 10000
```

3. **Node.js Optimization**:
```bash
NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"
```

## Backup and Recovery

### Database Backup

```bash
# Automated backup script
docker exec symbi-postgres pg_dump -U symphony symphony > backup.sql

# Restore from backup
docker exec -i symbi-postgres psql -U symphony symphony < backup.sql
```

### Data Volume Backup

```bash
# Backup data volume
docker run --rm \
  -v symphony_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/data-backup.tar.gz /data
```

## Scaling

### Horizontal Scaling (Kubernetes)

```bash
# Scale deployment
kubectl scale deployment symphony --replicas=5 -n symphony

# Enable autoscaling
kubectl autoscale deployment symphony \
  --min=3 --max=10 \
  --cpu-percent=70 \
  -n symphony
```

### Vertical Scaling

```yaml
resources:
  limits:
    cpu: 4000m
    memory: 8Gi
  requests:
    cpu: 1000m
    memory: 2Gi
```

## Support

For additional support:
- Documentation: https://docs.symbi-symphony.io
- GitHub Issues: https://github.com/s8ken/SYMBI-Symphony/issues
- Community Forum: https://community.symbi-symphony.io
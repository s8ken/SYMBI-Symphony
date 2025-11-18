# 🚀 SYMBI Trust Protocol - Deployment Guide

## Overview

This guide covers deploying SYMBI Trust Protocol in production environments using Docker, Kubernetes, or cloud platforms.

---

## 📋 Prerequisites

### System Requirements
- **CPU:** 2+ cores recommended
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 10GB minimum for logs and data
- **OS:** Linux (Ubuntu 20.04+, Debian 11+, RHEL 8+)

### Software Requirements
- **Docker:** 20.10+ or Docker Desktop
- **Docker Compose:** 2.0+ (for local/development)
- **Kubernetes:** 1.24+ (for production clusters)
- **Node.js:** 18+ (for local development)

---

## 🐳 Docker Deployment

### Quick Start

```bash
# Clone repository
git clone https://github.com/s8ken/SYMBI-Symphony.git
cd SYMBI-Symphony

# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f trust-protocol
```

### Production Configuration

1. **Create environment file:**

```bash
cat > .env.production << EOF
NODE_ENV=production
AUDIT_STORAGE_BACKEND=file
AUDIT_STORAGE_PATH=/data/audit-logs
KMS_PROVIDER=local
REDIS_URL=redis://redis:6379
LOG_LEVEL=info
EOF
```

2. **Start services:**

```bash
docker-compose --env-file .env.production up -d
```

3. **Verify deployment:**

```bash
# Check health
curl http://localhost:3000/health

# Check audit integrity
docker-compose exec trust-protocol npm run audit:integrity
```

### Docker Commands

```bash
# Build image
docker build -t symbi-trust-protocol:latest .

# Run container
docker run -d \
  --name trust-protocol \
  -p 3000:3000 \
  -v audit-logs:/data/audit-logs \
  -e NODE_ENV=production \
  symbi-trust-protocol:latest

# View logs
docker logs -f trust-protocol

# Execute commands
docker exec -it trust-protocol npm run audit:integrity

# Stop and remove
docker stop trust-protocol
docker rm trust-protocol
```

---

## ☸️ Kubernetes Deployment

### Namespace Setup

```bash
kubectl create namespace symbi-trust
kubectl config set-context --current --namespace=symbi-trust
```

### Deploy with Helm (Recommended)

```bash
# Add Helm repository (future)
helm repo add symbi https://charts.symbi.world
helm repo update

# Install
helm install trust-protocol symbi/trust-protocol \
  --namespace symbi-trust \
  --set image.tag=latest \
  --set persistence.enabled=true \
  --set redis.enabled=true
```

### Manual Kubernetes Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trust-protocol
  namespace: symbi-trust
spec:
  replicas: 3
  selector:
    matchLabels:
      app: trust-protocol
  template:
    metadata:
      labels:
        app: trust-protocol
    spec:
      containers:
      - name: trust-protocol
        image: ghcr.io/s8ken/symbi-symphony:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: AUDIT_STORAGE_BACKEND
          value: "file"
        - name: AUDIT_STORAGE_PATH
          value: "/data/audit-logs"
        volumeMounts:
        - name: audit-logs
          mountPath: /data/audit-logs
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          exec:
            command:
            - node
            - -e
            - console.log('healthy')
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - node
            - -e
            - console.log('healthy')
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: audit-logs
        persistentVolumeClaim:
          claimName: audit-logs-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: trust-protocol
  namespace: symbi-trust
spec:
  selector:
    app: trust-protocol
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: audit-logs-pvc
  namespace: symbi-trust
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

Deploy:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl get pods -n symbi-trust
kubectl logs -f deployment/trust-protocol -n symbi-trust
```

---

## ☁️ Cloud Platform Deployment

### AWS ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name symbi-trust-protocol

# Build and push image
docker build -t symbi-trust-protocol .
docker tag symbi-trust-protocol:latest \
  <account-id>.dkr.ecr.<region>.amazonaws.com/symbi-trust-protocol:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/symbi-trust-protocol:latest

# Create ECS task definition and service (use AWS Console or CLI)
```

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/<project-id>/symbi-trust-protocol

# Deploy to Cloud Run
gcloud run deploy trust-protocol \
  --image gcr.io/<project-id>/symbi-trust-protocol \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

### Azure Container Instances

```bash
# Create resource group
az group create --name symbi-trust --location eastus

# Create container registry
az acr create --resource-group symbi-trust \
  --name symbitrustregistry --sku Basic

# Build and push image
az acr build --registry symbitrustregistry \
  --image symbi-trust-protocol:latest .

# Deploy container
az container create \
  --resource-group symbi-trust \
  --name trust-protocol \
  --image symbitrustregistry.azurecr.io/symbi-trust-protocol:latest \
  --cpu 2 --memory 4 \
  --ports 3000
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | `development` | No |
| `AUDIT_STORAGE_BACKEND` | Storage backend (memory/file/database) | `memory` | No |
| `AUDIT_STORAGE_PATH` | Path for file-based storage | `.audit-log` | No |
| `KMS_PROVIDER` | KMS provider (local/aws/gcp) | `local` | No |
| `AWS_KMS_KEY_ID` | AWS KMS key ID | - | If using AWS KMS |
| `GCP_KMS_KEY_NAME` | GCP KMS key name | - | If using GCP KMS |
| `REDIS_URL` | Redis connection URL | - | If using Redis cache |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` | No |

### Volume Mounts

- `/data/audit-logs` - Audit log storage (persistent)
- `/data/kms-keys` - Local KMS key storage (persistent)

---

## 📊 Monitoring

### Prometheus Metrics

Access Prometheus at `http://localhost:9090`

Key metrics:
- `trust_protocol_requests_total` - Total requests
- `trust_protocol_request_duration_seconds` - Request duration
- `trust_protocol_audit_entries_total` - Total audit entries
- `trust_protocol_did_resolutions_total` - DID resolutions

### Grafana Dashboards

Access Grafana at `http://localhost:3001` (default credentials: admin/admin)

Pre-configured dashboards:
- Trust Protocol Overview
- Audit Trail Monitoring
- DID Resolution Performance
- System Health

### Logs

```bash
# Docker Compose
docker-compose logs -f trust-protocol

# Kubernetes
kubectl logs -f deployment/trust-protocol -n symbi-trust

# View specific container
docker logs -f <container-id>
```

---

## 🔒 Security

### TLS/SSL Configuration

For production, always use TLS:

```bash
# Generate self-signed certificate (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt

# Use Let's Encrypt (production)
certbot certonly --standalone -d trust.symbi.world
```

### Secrets Management

**AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name symbi/trust-protocol/kms-key \
  --secret-string file://kms-key.json
```

**Kubernetes Secrets:**
```bash
kubectl create secret generic trust-protocol-secrets \
  --from-literal=kms-key=<key-value> \
  --namespace symbi-trust
```

---

## 🔄 Updates & Rollbacks

### Rolling Update (Kubernetes)

```bash
# Update image
kubectl set image deployment/trust-protocol \
  trust-protocol=ghcr.io/s8ken/symbi-symphony:v1.1.0 \
  -n symbi-trust

# Check rollout status
kubectl rollout status deployment/trust-protocol -n symbi-trust

# Rollback if needed
kubectl rollout undo deployment/trust-protocol -n symbi-trust
```

### Docker Compose Update

```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d

# Verify
docker-compose ps
```

---

## 🧪 Health Checks

### Endpoints

- `GET /health` - Basic health check
- `GET /ready` - Readiness check
- `GET /metrics` - Prometheus metrics

### Manual Verification

```bash
# Health check
curl http://localhost:3000/health

# Audit integrity
docker-compose exec trust-protocol npm run audit:integrity

# DID resolution test
curl http://localhost:3000/resolve/did:web:example.com
```

---

## 📈 Scaling

### Horizontal Scaling (Kubernetes)

```bash
# Scale replicas
kubectl scale deployment/trust-protocol --replicas=5 -n symbi-trust

# Auto-scaling
kubectl autoscale deployment/trust-protocol \
  --cpu-percent=70 \
  --min=3 \
  --max=10 \
  -n symbi-trust
```

### Vertical Scaling

Update resource limits in deployment configuration:

```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

---

## 🐛 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker logs trust-protocol

# Verify environment variables
docker inspect trust-protocol | grep -A 20 Env
```

**Audit integrity failures:**
```bash
# Check audit log permissions
docker exec trust-protocol ls -la /data/audit-logs

# Verify storage backend
docker exec trust-protocol env | grep AUDIT
```

**Performance issues:**
```bash
# Check resource usage
docker stats trust-protocol

# View metrics
curl http://localhost:3000/metrics
```

---

## 📚 Additional Resources

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Security Guide](./SECURITY.md)
- [API Documentation](./docs/API.md)
- [Monitoring Guide](./docs/MONITORING.md)

---

## 🆘 Support

- **Issues:** https://github.com/s8ken/SYMBI-Symphony/issues
- **Discussions:** https://github.com/s8ken/SYMBI-Symphony/discussions
- **Email:** support@symbi.world
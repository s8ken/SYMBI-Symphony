# SYMBI Symphony Operations Guide

## Table of Contents
1. [Daily Operations](#daily-operations)
2. [Monitoring and Alerting](#monitoring-and-alerting)
3. [Incident Response](#incident-response)
4. [Maintenance Procedures](#maintenance-procedures)
5. [Performance Optimization](#performance-optimization)
6. [Security Operations](#security-operations)

## Daily Operations

### Health Checks

#### Automated Health Monitoring
```bash
# Check application health
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400000,
  "version": "1.0.0",
  "components": [
    {
      "name": "database",
      "status": "healthy",
      "lastCheck": "2024-01-15T10:30:00Z"
    },
    {
      "name": "redis",
      "status": "healthy",
      "lastCheck": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Component-Specific Health Checks
```bash
# Database health
curl http://localhost:3000/health/database

# Redis health
curl http://localhost:3000/health/redis

# Agent orchestra health
curl http://localhost:3000/health/orchestra
```

### Log Management

#### Viewing Logs
```bash
# Docker Compose
docker-compose logs -f symphony

# Kubernetes
kubectl logs -f deployment/symphony -n symphony

# Filter by severity
kubectl logs deployment/symphony -n symphony | grep ERROR
```

#### Log Rotation
```bash
# Configure logrotate
cat > /etc/logrotate.d/symphony << EOF
/var/log/symphony/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 symphony symphony
    sharedscripts
    postrotate
        docker-compose restart symphony
    endscript
}
EOF
```

### Metrics Collection

#### Key Metrics to Monitor

1. **Application Metrics**:
   - Request rate (requests/second)
   - Response time (p50, p95, p99)
   - Error rate (%)
   - Active connections

2. **System Metrics**:
   - CPU usage (%)
   - Memory usage (MB)
   - Disk I/O (MB/s)
   - Network I/O (MB/s)

3. **Business Metrics**:
   - Active agents
   - Orchestra executions
   - Trust verifications
   - API key usage

#### Accessing Metrics
```bash
# Prometheus format
curl http://localhost:3000/metrics

# JSON format
curl http://localhost:3000/metrics/json
```

## Monitoring and Alerting

### Prometheus Alerts

Create `config/prometheus/alerts.yml`:
```yaml
groups:
  - name: symphony_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "P95 response time is {{ $value }}s"

      # High memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 2048
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}MB"

      # Database connection issues
      - alert: DatabaseConnectionFailure
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"
          description: "Cannot connect to PostgreSQL"

      # Redis connection issues
      - alert: RedisConnectionFailure
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis connection failed"
          description: "Cannot connect to Redis"
```

### Grafana Dashboards

#### Symphony Overview Dashboard
Key panels to include:
1. Request Rate (time series)
2. Response Time Distribution (heatmap)
3. Error Rate (gauge)
4. Active Agents (stat)
5. System Resources (time series)
6. Top Endpoints (table)

#### Creating Custom Dashboards
```bash
# Export existing dashboard
curl -H "Authorization: Bearer $GRAFANA_TOKEN" \
  http://localhost:3001/api/dashboards/uid/symphony-overview \
  > dashboard.json

# Import dashboard
curl -X POST \
  -H "Authorization: Bearer $GRAFANA_TOKEN" \
  -H "Content-Type: application/json" \
  -d @dashboard.json \
  http://localhost:3001/api/dashboards/db
```

### Alert Notification Channels

#### Slack Integration
```yaml
# alertmanager.yml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#symphony-alerts'
        title: 'Symphony Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

#### Email Notifications
```yaml
receivers:
  - name: 'email'
    email_configs:
      - to: 'ops-team@example.com'
        from: 'symphony-alerts@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@example.com'
        auth_password: 'password'
```

#### PagerDuty Integration
```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
        description: '{{ .CommonAnnotations.summary }}'
```

## Incident Response

### Incident Response Playbook

#### 1. Service Degradation

**Symptoms**:
- Increased response times
- Elevated error rates
- User complaints

**Response Steps**:
```bash
# 1. Check service health
curl http://localhost:3000/health

# 2. Review recent logs
docker-compose logs --tail=100 symphony | grep ERROR

# 3. Check resource usage
docker stats symbi-symphony

# 4. Review metrics
# Access Grafana dashboard

# 5. Scale if needed (Kubernetes)
kubectl scale deployment symphony --replicas=5 -n symphony
```

#### 2. Database Connection Issues

**Symptoms**:
- "Connection refused" errors
- Timeout errors
- Failed health checks

**Response Steps**:
```bash
# 1. Check database status
docker-compose ps postgres

# 2. Test connection
psql -h localhost -U symphony -d symphony

# 3. Check connection pool
# Review application logs for pool exhaustion

# 4. Restart database if needed
docker-compose restart postgres

# 5. Verify recovery
curl http://localhost:3000/health/database
```

#### 3. Memory Leak

**Symptoms**:
- Steadily increasing memory usage
- OOM (Out of Memory) errors
- Container restarts

**Response Steps**:
```bash
# 1. Capture heap snapshot
curl http://localhost:3000/debug/heap-snapshot > heap.heapsnapshot

# 2. Analyze with Chrome DevTools
# Open Chrome DevTools → Memory → Load snapshot

# 3. Restart service
docker-compose restart symphony

# 4. Monitor memory usage
watch -n 5 'docker stats symbi-symphony --no-stream'

# 5. Adjust memory limits if needed
docker update --memory=4g symbi-symphony
```

#### 4. High CPU Usage

**Symptoms**:
- CPU usage consistently above 80%
- Slow response times
- Request timeouts

**Response Steps**:
```bash
# 1. Identify CPU-intensive processes
docker exec symbi-symphony top

# 2. Check for infinite loops or heavy operations
# Review application logs

# 3. Enable CPU profiling
curl http://localhost:3000/debug/cpu-profile > cpu.prof

# 4. Scale horizontally (Kubernetes)
kubectl scale deployment symphony --replicas=5 -n symphony

# 5. Optimize code if needed
# Analyze CPU profile and optimize hot paths
```

### Rollback Procedures

#### Docker Rollback
```bash
# 1. Stop current version
docker-compose down

# 2. Switch to previous version
docker tag symbi-symphony:1.0.0 symbi-symphony:current
docker tag symbi-symphony:0.9.0 symbi-symphony:1.0.0

# 3. Start previous version
docker-compose up -d

# 4. Verify rollback
curl http://localhost:3000/health
```

#### Kubernetes Rollback
```bash
# 1. View deployment history
kubectl rollout history deployment/symphony -n symphony

# 2. Rollback to previous version
kubectl rollout undo deployment/symphony -n symphony

# 3. Rollback to specific revision
kubectl rollout undo deployment/symphony --to-revision=2 -n symphony

# 4. Monitor rollback
kubectl rollout status deployment/symphony -n symphony
```

## Maintenance Procedures

### Database Maintenance

#### Vacuum and Analyze
```bash
# Run vacuum
docker exec symbi-postgres psql -U symphony -d symphony -c "VACUUM ANALYZE;"

# Schedule regular vacuum
cat > /etc/cron.daily/postgres-vacuum << EOF
#!/bin/bash
docker exec symbi-postgres psql -U symphony -d symphony -c "VACUUM ANALYZE;"
EOF
chmod +x /etc/cron.daily/postgres-vacuum
```

#### Index Maintenance
```bash
# Identify missing indexes
docker exec symbi-postgres psql -U symphony -d symphony << EOF
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY abs(correlation) DESC;
EOF

# Rebuild indexes
docker exec symbi-postgres psql -U symphony -d symphony -c "REINDEX DATABASE symphony;"
```

### Redis Maintenance

#### Memory Optimization
```bash
# Check memory usage
docker exec symbi-redis redis-cli INFO memory

# Set max memory policy
docker exec symbi-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Flush expired keys
docker exec symbi-redis redis-cli --scan --pattern "expired:*" | xargs redis-cli DEL
```

### Certificate Renewal

#### Let's Encrypt Renewal
```bash
# Renew certificates
certbot renew --dry-run

# Automated renewal (cron)
cat > /etc/cron.weekly/certbot-renew << EOF
#!/bin/bash
certbot renew --quiet --post-hook "docker-compose restart nginx"
EOF
chmod +x /etc/cron.weekly/certbot-renew
```

### Backup Procedures

#### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/symphony"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec symbi-postgres pg_dump -U symphony symphony | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup Redis
docker exec symbi-redis redis-cli BGSAVE
docker cp symbi-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup application data
tar czf $BACKUP_DIR/data_$DATE.tar.gz /var/data/symphony

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete

# Upload to S3 (optional)
aws s3 sync $BACKUP_DIR s3://symphony-backups/
```

## Performance Optimization

### Database Query Optimization

#### Identify Slow Queries
```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### Connection Pool Tuning
```javascript
// config/database.js
{
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000
  }
}
```

### Caching Strategy

#### Redis Caching
```javascript
// Implement caching layer
async function getCachedData(key) {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetchFromDatabase();
  await redis.setex(key, 3600, JSON.stringify(data));
  return data;
}
```

### Load Balancing

#### NGINX Load Balancing
```nginx
upstream symphony_backend {
    least_conn;
    server symphony-1:3000 weight=3;
    server symphony-2:3000 weight=2;
    server symphony-3:3000 weight=1;
    
    keepalive 32;
}
```

## Security Operations

### Security Audit

#### Regular Security Checks
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm audit fix

# Scan Docker image
docker scan symbi-symphony:1.0.0
```

#### Access Log Analysis
```bash
# Analyze access patterns
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# Detect suspicious activity
grep "POST /auth" /var/log/nginx/access.log | grep "401\|403" | wc -l
```

### API Key Rotation

```bash
# Rotate API keys
curl -X POST http://localhost:3000/api/keys/rotate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyId": "key_123"}'
```

### Audit Log Review

```bash
# Export audit logs
curl http://localhost:3000/api/audit/export?format=csv \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  > audit_logs.csv

# Review security events
curl http://localhost:3000/api/audit?eventType=security.* \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Disaster Recovery

### Recovery Time Objective (RTO)
- Target: 1 hour
- Maximum acceptable downtime

### Recovery Point Objective (RPO)
- Target: 15 minutes
- Maximum acceptable data loss

### Disaster Recovery Procedure

1. **Assess the situation**
2. **Activate DR plan**
3. **Restore from backups**
4. **Verify data integrity**
5. **Switch traffic to DR site**
6. **Monitor and validate**
7. **Document incident**

## Contact Information

### On-Call Rotation
- Primary: ops-primary@example.com
- Secondary: ops-secondary@example.com
- Escalation: ops-manager@example.com

### Emergency Contacts
- Infrastructure Team: +1-555-0100
- Security Team: +1-555-0200
- Database Team: +1-555-0300
# SYMBI Railway Integration 4

This project integrates Blackbox AI with 5 models for Railway deployment.

## Features

- Blackbox AI integration with 5 models
- Docker containerization
- Railway deployment
- Comprehensive testing suite
- Monitoring and observability

## Usage

### Model 1
```typescript
const adapter = new BlackboxAdapter();
const response = await adapter.query('model1', 'query');
```

### Model 2
```typescript
const response = await adapter.query('model2', 'query');
```

### Model 3
```typescript
const response = await adapter.query('model3', 'query');
```

### Model 4
```typescript
const response = await adapter.query('model4', 'query');
```

### Model 5
```typescript
const response = await adapter.query('model5', 'query');
```

## API Documentation

### BlackboxAdapter
- `query(model: string, input: string): Promise<Response>` - Query a model

### YabiClient
- `send(message: string): Promise<void>` - Send a message

## Railway Deployment Guide

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`
4. Set environment variables in Railway dashboard

## Troubleshooting

- If deployment fails, check logs in Railway dashboard
- For rate limiting, implement exponential backoff
- For errors, check the error handling in the code

## Testing

Run tests: `npm test`

## Monitoring

- Health check endpoint: `/health`
- Metrics: Integrated with observability services
- Alerts: Set up in Railway for failed requests

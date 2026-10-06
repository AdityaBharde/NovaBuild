Write-Host "=== 1. Creating Namespaces ===" -ForegroundColor Cyan
kubectl apply -f k8s/infra/namespaces.yaml

Write-Host "=== 2. Creating RBAC & Runner Permissions ===" -ForegroundColor Cyan
kubectl apply -f k8s/infra/runner-pool.yaml

Write-Host "=== 3. Applying Network Isolation Policies ===" -ForegroundColor Cyan
kubectl apply -f k8s/infra/core-network-policies.yaml
kubectl apply -f k8s/infra/preview-network-policies.yaml

Write-Host "=== 4. Launching Stateful Backing Services ===" -ForegroundColor Cyan
kubectl apply -f k8s/stateful/pgvector.yaml
kubectl apply -f k8s/stateful/redis.yaml
kubectl apply -f k8s/stateful/kafka.yaml
kubectl apply -f k8s/stateful/minio.yaml

Write-Host "Waiting for PostgreSQL and Kafka to initialize..." -ForegroundColor Yellow
kubectl rollout status statefulset/pgvector -n novabuild-core --timeout=120s
kubectl rollout status deployment/kafka -n novabuild-core --timeout=120s

Write-Host "=== 5. Deploying Preview Proxy ===" -ForegroundColor Cyan
kubectl apply -f k8s/proxy/proxy-deployment.yaml

Write-Host "=== 6. Deploying Core Infrastructure Services ===" -ForegroundColor Cyan
kubectl apply -f k8s/services/discovery-service.yaml
kubectl apply -f k8s/services/config-service.yaml

Write-Host "Waiting for Discovery Service..." -ForegroundColor Yellow
kubectl rollout status deployment/discovery-service -n novabuild-core --timeout=90s

Write-Host "=== 7. Deploying Microservices & Ingress ===" -ForegroundColor Cyan
kubectl apply -f k8s/services/api-gateway.yaml
kubectl apply -f k8s/services/account-service.yaml
kubectl apply -f k8s/services/workspace-service.yaml
kubectl apply -f k8s/services/intelligence-service.yaml
kubectl apply -f k8s/services/frontend.yaml
kubectl apply -f k8s/infra/ingress.yaml

Write-Host "=== Deployment Manifests Applied Successfully ===" -ForegroundColor Green
kubectl get pods -n novabuild-core
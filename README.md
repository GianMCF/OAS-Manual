# OAS Manual 

## (VINUM AW)

USER DATA (T3.large / 20Gib)
```
#!/bin/bash

# Logs
exec > /var/log/user-data.log 2>&1

echo "==== INICIO USER DATA ===="

# Actualizar paquetes
apt update -y

# Instalar Docker
apt install docker.io -y

# Habilitar Docker
systemctl enable docker
systemctl start docker

# Agregar ubuntu al grupo docker
usermod -aG docker ubuntu

# Instalar kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

chmod +x kubectl
mv kubectl /usr/local/bin/

# Instalar Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64

install minikube-linux-amd64 /usr/local/bin/minikube

# Esperar Docker
sleep 20

# Iniciar Minikube como ubuntu
sudo -u ubuntu HOME=/home/ubuntu minikube start --driver=docker

echo "==== FIN USER DATA ===="
```

CREAR NAMESPACE (ORDEN)
```
kubectl create namespace vinum-aw
```

---
## DATABASE

CREAR DEPLOYMENT PARA DATABASE

```
nano db-deploy.yml
```

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: db-deployment
  namespace: vinum-aw
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
        - name: mongo
          image: gianmarcocastillof/mongdb:6
          ports:
            - containerPort: 27017
```

CREAR SERVICE PARA DATABASE

```
nano db-svc.yml
```

```
apiVersion: v1
kind: Service
metadata:
  name: db-service
  namespace: vinum-aw
spec:
  type: ClusterIP
  selector:
    app: mongo
  ports:
    - port: 27017
      targetPort: 27017
```

CREAR PORT-FORWARD.SERVICE
```
sudo nano /etc/systemd/system/db-portforward.service
```

```
[Unit]
Description=Kubernetes MongoDB Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward --address 0.0.0.0 service/db-service 27017:27017 -n vinum-aw
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload && \
sudo systemctl enable db-portforward && \
sudo systemctl start db-portforward && \
sudo systemctl status db-portforward
```
---

CREAR NAMESPACE (ORDEN)
```
kubectl create namespace monitoring || true
```

NODE-EXPORTER-DEPLOYMENT-DB

```
nano mongodb-exporter.yaml
```

```
apiVersion: apps/v1
kind: Deployment

metadata:
  name: mongodb-exporter
  namespace: monitoring

spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb-exporter

  template:
    metadata:
      labels:
        app: mongodb-exporter

    spec:
      containers:
      - name: mongodb-exporter
        image: percona/mongodb_exporter:0.40

        env:
        - name: MONGODB_URI
          value: "mongodb://db-service.vinum-aw.svc.cluster.local:27017"
```

NODE-EXPORTER-SERVICE-DB

```
nano mongodb-exporter-service.yaml
```

```
apiVersion: v1
kind: Service

metadata:
  name: mongodb-exporter
  namespace: monitoring

spec:
  type: NodePort
  selector:
    app: mongodb-exporter

  ports:
  - port: 9216
    targetPort: 9216
    nodePort: 30921
```

EJECUTAR MANIFIESTOS Y CREAR RECURSOS
```
kubectl apply -f .
```

CREAR 2DO PORT-FORWARD.SERVICE 
```
sudo nano /etc/systemd/system/db-node-portforward.service
```

```
[Unit]
Description=Kubernetes MongoDB Node Exporter Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward svc/mongodb-exporter -n monitoring 30921:9216 --address 0.0.0.0
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload && \
sudo systemctl enable db-node-portforward && \
sudo systemctl start db-node-portforward && \
sudo systemctl status db-node-portforward
```


---

## BACKEND

CREAR DEPLOYMENT PARA BACKEND

```
nano be-deploy.yml
```

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: be-deployment
  namespace: vinum-aw

spec:
  replicas: 1

  selector:
    matchLabels:
      app: backend

  template:
    metadata:
      labels:
        app: backend

    spec:
      containers:
        - name: backend
          image: gianmarcocastillof/vinum-aw-be:2.0

          ports:
            - containerPort: 8088

          env:
            - name: MONGO_URI
              valueFrom:
                configMapKeyRef:
                  name: vinum-config
                  key: MONGO_URI

            - name: DB
              valueFrom:
                configMapKeyRef:
                  name: vinum-config
                  key: DB_NAME

            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: vinum-secret
                  key: JWT_SECRET

            - name: AES_SECRET
              valueFrom:
                secretKeyRef:
                  name: vinum-secret
                  key: AES_SECRET

            - name: CORS_ALLOWED_ORIGIN
              valueFrom:
                configMapKeyRef:
                  name: vinum-config
                  key: CORS_ALLOWED_ORIGIN
```

CREAR SERVICE PARA BE

```
nano be-svc.yml
```

```
apiVersion: v1
kind: Service
metadata:
  name: be-service
  namespace: vinum-aw
spec:
  type: NodePort
  selector:
    app: backend
  ports:
    - port: 8088
      targetPort: 8088
      nodePort: 30001
```

CREAR CONFIG PARA BE

```
nano config.yml
```

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: vinum-config
  namespace: vinum-aw

data:
  MONGO_URI: mongodb://ip:27017
  DB_NAME: vinum-aw-db
  CORS_ALLOWED_ORIGIN: http://ip:5300,http://localhost:8081
```

CREAR SECRET PARA BE

```
nano secret.yml
```

```
apiVersion: v1
kind: Secret
metadata:
  name: vinum-secret
  namespace: vinum-aw

type: Opaque

data:
  JWT_SECRET: bXlTdXBlclNlY3JldEtleUZvckp3dEF1dGhlbnRpY2F0aW9uMjAyNlNlY3VyZQ==
  AES_SECRET: dmludW1hd3NlY3VyZWtleQ==
```

EJECUTAR MANIFIESTOS Y CREAR RECURSOS
```
kubectl apply -f .
```

CREAR PORT-FORWARD.SERVICE
```
sudo nano /etc/systemd/system/be-portforward.service
```

```
[Unit]
Description=Kubernetes MongoDB Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward --address 0.0.0.0 service/be-service 8088:8088 -n vinum-aw
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload && \
sudo systemctl enable be-portforward && \
sudo systemctl start be-portforward && \
sudo systemctl status be-portforward
```

---

CREAR NAMESPACE (ORDEN)
```
kubectl create namespace monitoring || true
```

NODE-EXPORTER-DEPLOYMENT-BE

```
nano node-exporter.yaml
```

```
apiVersion: apps/v1
kind: Deployment

metadata:
  name: node-exporter
  namespace: monitoring

spec:
  replicas: 1
  selector:
    matchLabels:
      app: node-exporter

  template:

    metadata:
      labels:
        app: node-exporter

    spec:
      hostNetwork: true
      hostPID: true

      containers:
      - name: node-exporter
        image: prom/node-exporter:v1.8.2

        args:
        - --path.rootfs=/host
        volumeMounts:
        - name: root
          mountPath: /host
          readOnly: true

      volumes:
      - name: root
        hostPath:
          path: /
```

NODE-EXPORTER-SERVICE-BE

```
nano node-exporter-service.yaml
```

```
apiVersion: v1
kind: Service

metadata:
  name: node-exporter
  namespace: monitoring

spec:
  type: NodePort
  selector:
    app: node-exporter

  ports:
  - port: 9100
    targetPort: 9100
    nodePort: 30911
```

EJECUTAR MANIFIESTOS Y CREAR RECURSOS
```
kubectl apply -f .
```

CREAR 2DO PORT-FORWARD.SERVICE 
```
sudo nano /etc/systemd/system/be-node-portforward.service
```

```
[Unit]
Description=Kubernetes Backend Node Exporter Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward svc/node-exporter -n monitoring 30911:9100 --address 0.0.0.0
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload && \
sudo systemctl enable be-node-portforward && \
sudo systemctl start be-node-portforward && \
sudo systemctl status be-node-portforward
```

---

## FRONTEND

CREAR DEPLOYMENT PARA FRONTEND

```
nano fe-deploy.yml
```

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fe-deployment
  namespace: vinum-aw
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: fe-container
          image: gianmarcocastillof/vinum-aw-fe:3.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5300

          env:
            - name: API_IP_URL
              valueFrom:
                configMapKeyRef:
                  name: vinum-config
                  key: API_IP_URL
```

CREAR SERVICE PARA FE

```
nano fe-svc.yml
```

```
apiVersion: v1
kind: Service
metadata:
  name: fe-service
  namespace: vinum-aw
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
    - port: 5300
      targetPort: 5300
      nodePort: 30002
```

CREAR CONFIG PARA FE

```
nano config.yml
```

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: vinum-config
  namespace: vinum-aw

data:
  API_IP_URL: http://ip:8088/v1/api
```

EJECUTAR MANIFIESTOS Y CREAR RECURSOS
```
kubectl apply -f .
```

CREAR PORT-FORWARD.SERVICE
```
sudo nano /etc/systemd/system/fe-portforward.service
```

```
[Unit]
Description=Kubernetes MongoDB Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward --address 0.0.0.0 service/fe-service 5300:5300 -n vinum-aw
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload && \
sudo systemctl enable fe-portforward && \
sudo systemctl start fe-portforward && \
sudo systemctl status fe-portforward
```

---

CREAR NAMESPACE (ORDEN)
```
kubectl create namespace monitoring || true
```

NODE-EXPORTER-DEPLOYMENT-FE

```
nano node-exporter.yaml
```

```
apiVersion: apps/v1
kind: Deployment

metadata:
  name: node-exporter
  namespace: monitoring

spec:
  replicas: 1
  selector:
    matchLabels:
      app: node-exporter

  template:

    metadata:
      labels:
        app: node-exporter

    spec:
      hostNetwork: true
      hostPID: true

      containers:
      - name: node-exporter
        image: prom/node-exporter:v1.8.2

        args:
        - --path.rootfs=/host
        volumeMounts:
        - name: root
          mountPath: /host
          readOnly: true

      volumes:
      - name: root
        hostPath:
          path: /
```

NODE-EXPORTER-SERVICE-FE

```
nano node-exporter-service.yaml
```

```
apiVersion: v1
kind: Service

metadata:
  name: node-exporter
  namespace: monitoring

spec:
  type: NodePort
  selector:
    app: node-exporter

  ports:
  - port: 9100
    targetPort: 9100
    nodePort: 30910
```

EJECUTAR MANIFIESTOS Y CREAR RECURSOS
```
kubectl apply -f .
```

CREAR 2DO PORT-FORWARD.SERVICE 
```
sudo nano /etc/systemd/system/fe-node-portforward.service
```

```
[Unit]
Description=Kubernetes Frontend Node Exporter Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward svc/node-exporter -n monitoring 30910:9100 --address 0.0.0.0
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload && \
sudo systemctl enable fe-node-portforward && \
sudo systemctl start fe-node-portforward && \
sudo systemctl status fe-node-portforward
```


---
# PROCESO DE MONITOREO

```
nano install-monitoring.sh
```


```
#!/bin/bash

set -e

echo "== Instalando Helm =="
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

echo "== Verificando Helm =="
helm version

echo "== Agregando repositorio Prometheus =="
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

echo "== Creando namespace monitoring =="
kubectl create namespace monitoring || true

echo "== Instalando Prometheus =="
helm install prometheus prometheus-community/prometheus -n monitoring || true

echo "== Instalando Grafana =="
helm install grafana prometheus-community/grafana -n monitoring || true

echo "== Verificación final =="
kubectl get pods -n monitoring
kubectl get svc -n monitoring
helm list -n monitoring
```

```
chmod +x install-monitoring.sh
```

```
./install-monitoring.sh
```
### CONFIGRAR GRAFANA

```
nano setup-grafana.sh
```

```
#!/bin/bash

set -e

NAMESPACE="monitoring"

echo "=== Obteniendo contraseña de Grafana (admin) ==="

GRAFANA_PASSWORD=$(kubectl get secret --namespace $NAMESPACE grafana -o jsonpath="{.data.admin-password}" | base64 --decode)

echo "Password Grafana: $GRAFANA_PASSWORD"

echo "=== Obteniendo servicio Grafana ==="

GRAFANA_SERVICE=$(kubectl get svc -n $NAMESPACE grafana -o jsonpath="{.spec.clusterIP}")

echo "Grafana ClusterIP: $GRAFANA_SERVICE"

echo "=== Port-forward para acceso local ==="
echo "Accede en: http://localhost:3000"

kubectl port-forward svc/grafana -n $NAMESPACE 3000:80 &
PF_PID=$!

sleep 5

echo "=== Configurando datasource Prometheus ==="

curl -X POST http://admin:$GRAFANA_PASSWORD@localhost:3000/api/datasources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://prometheus-server.monitoring.svc.cluster.local",
    "access": "proxy",
    "isDefault": true
}'

echo "=== Importando dashboards básicos ==="

# Node Exporter Full Dashboard (ID oficial 1860)
curl -X POST http://admin:$GRAFANA_PASSWORD@localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard": {
      "id": null,
      "uid": "node-exporter",
      "title": "Node Exporter Full",
      "timezone": "browser",
      "schemaVersion": 37,
      "version": 1,
      "panels": []
    },
    "overwrite": true
}'

echo "=== Finalizado ==="
echo "Usuario: admin"
echo "Password: $GRAFANA_PASSWORD"
echo "URL: http://localhost:3000"

wait $PF_PID
```

```
chmod +x setup-grafana.sh
```

```
./setup-grafana.sh
```

MODIFICAR VALORES DE PROMETHEUS
```
nano prometheus-values.yaml
```

```
serverFiles:
  prometheus.yml:
    scrape_configs:

      - job_name: "frontend-node"
        static_configs:
          - targets: ["IP:30910"]

      - job_name: "backend-node"
        static_configs:
          - targets: ["IP:30911"]

      - job_name: "backend-app"
        metrics_path: /actuator/prometheus
        static_configs:
          - targets: ["IP:8088"]

      - job_name: "mongodb"
        static_configs:
          - targets: ["IP:30921"]
```

OVERRIDE A HELM
```
helm upgrade prometheus prometheus-community/prometheus \
-n monitoring -f prometheus-values.yaml
```

```
kubectl rollout restart deployment prometheus-server -n monitoring
```

MODIFICAR CONFIGMAP

```
kubectl get configmap prometheus-server -n monitoring -o yaml > prom.yaml
```

```
  - job_name: "frontend"
    static_configs:
      - targets: ["IP:30002"]

  - job_name: "backend"
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: ["IP:8088"]

  - job_name: "mongodb"
    static_configs:
      - targets: ["IP:27017"]

  - job_name: "frontend-node"
    static_configs:
      - targets: ["IP:30910"]

  - job_name: "backend-node"
    static_configs:
      - targets: ["IP:30911"]

  - job_name: "mongo-node"
    static_configs:
      - targets: ["IP:30921"]
```

APLICAR CAMBIOS
```
kubectl apply -f prom.yaml
```

REINICIAR
```
kubectl rollout restart deployment prometheus-server -n monitoring
```
---
GRAFANA

CREAR PORT-FORWARD.SERVICE
```
sudo nano /etc/systemd/system/grafana-portforward.service
```

```
[Unit]
Description=Grafana Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward svc/grafana -n monitoring 3000:80 --address 0.0.0.0
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload && \
sudo systemctl enable grafana-portforward && \
sudo systemctl start grafana-portforward && \
sudo systemctl status grafana-portforward
```

---
PROMETHEUS

CREAR PORT-FORWARD.SERVICE
```
sudo nano /etc/systemd/system/prometheus-portforward.service
```

```
[Unit]
Description=Prometheus Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward svc/prometheus-server -n monitoring 9090:80 --address 0.0.0.0
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload && \
sudo systemctl enable prometheus-portforward && \
sudo systemctl start prometheus-portforward && \
sudo systemctl status prometheus-portforward
```

---
# EXTRAS

OBTENER VALOR DE VARIABLES EN POD
```
kubectl exec -it be-deployment-c -n vinum-aw -- printenv | grep MONGO
```

EJECUTAR POD Y ACCEDER A TERMINAL
```
kubectl exec -it db-deployment-c -n vinum-aw -- bash
```

EJECUTAR MONGOSH PARA REALIZAR CONSULTAS EN BD
```
mongosh
```

EJECUTAR MONGOSH PARA REALIZAR CONSULTAS EN BD
```
use vinum-aw-db
```

MOSTRAR BASES DE DATOS
```
show dbs
```

---
EVALUAR PROCESOS (EN CASO DE NO PODER EJECUTAR EN CIERTO PUERTO)

```
sudo lsof -i :8088
```
O también:
```
sudo ss -tulpn | grep 8088
```

ELIMINAR PROCESO
```
sudo kill -9 12345
```
O también directamente:
```
sudo pkill -f "kubectl port-forward"
```
VER LOGS DEL PORT-FORWARD
```
journalctl -u backend-portforward -f
```
DETENER PORT-FORWARD
```
sudo systemctl stop backend-portforward
```
REINICIAR PORT-FORWARD
```
sudo systemctl restart backend-portforward
```
VER LOGS EN TIEMPO REAL DEL BACKEND
```
kubectl logs -f deployment/be-deployment -n vinum-aw
```
VER LOGS EN TIEMPO REAL DE LA BD
```
kubectl logs -f deployment/db-deployment -n vinum-aw
```
REINICIAR EL DEPLOYMENT (USAR SI SE CAMBIAN ATRIBUTOS RELACIONADOS)
```
kubectl rollout restart deployment be-deployment -n vinum-aw
```

REINICIAR EL DEPLOYMENT (USAR SI SE CAMBIAN ATRIBUTOS RELACIONADOS)
```
kubectl rollout restart deployment fe-deployment -n vinum-aw
```

---
## (TOUR EX) - DESPLEGADO PREVIAMENTE A LA EVALUCIÓN 

PASOS PARA CONTINUAR CON LAS INSTANCIAS YA CREADAS PREVIAMENTE
```
docker ps
minikube status
minikube start --driver=docker
kubectl get pods -A
sudo systemctl restart db-portforward
```

```
docker ps
minikube status
minikube start --driver=docker
kubectl get pods -A
sudo systemctl restart be-portforward
```

```
docker ps
minikube status
minikube start --driver=docker
kubectl get pods -A
sudo systemctl restart fe-portforward
```

CREAR DEPLOYMENT PARA BE - TOUREX
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tourex-be-deployment
  namespace: vinum-aw
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tourex-be
  template:
    metadata:
      labels:
        app: tourex-be
    spec:
      containers:
        - name: tourex-be
          image: gianmarcocastillof/tour-ex-be:1.0
          ports:
            - containerPort: 5000
          env:
            - name: MONGO_URI
              value: "mongodb://ip:27017/"
            - name: DB_NAME
              value: "tour-ex_db"
```

EJECUTAR MANIFIESTOS Y CREAR RECURSOS
```
kubectl apply -f .
```


CREAR SERVICE PARA BE - TOUREX
```
apiVersion: v1
kind: Service
metadata:
  name: tourex-be-service
  namespace: vinum-aw
spec:
  selector:
    app: tourex-be
  ports:
    - port: 5000
      targetPort: 5000
      nodePort: 30081
  type: NodePort
```

EJECUTAR MANIFIESTOS Y CREAR RECURSOS
```
kubectl apply -f .
```

CREAR PORT-FORWARD.SERVICE - BE - TOUREX
```
sudo nano /etc/systemd/system/be-portforward.service
```

```
[Unit]
Description=Kubernetes MongoDB Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward --address 0.0.0.0 service/tourex-be-service 5000:5000  -n vinum-aw
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload && \
sudo systemctl enable be-portforward && \
sudo systemctl start be-portforward && \
sudo systemctl status be-portforward
```
---
CREAR DEPLOYMENT PARA FE - TOUREX
```
apiVersion: app/v1
kind: Deployment

metadata:
  name: tourex-fe-deployment
  namespace: vinum-aw

spec:
  replicas: 1

  selector:
    matchLabels:
      app: tourex-fe

  template:
    metadata:
      labels:
        app: tourex-fe

    spec:
      containers:

        - name: tourex-fe
          image: gianmarcocastillof/pii-fe:1.0
          ports:
            - containerPort: 5200

          env:

            # URL backend PII
            - name: API_URL
              value: "http://32.193.69.242:5000/api"
```

CREAR SERVICE PARA FE - TOUREX
```
apiVersion: v1
kind: Service
metadata:
  name: tourex-fe-service
  namespace: vinum-aw
spec:
  selector:
    app: tourex-fe
  ports:
    - port: 5200
      targetPort: 5200
      nodePort: 30080
  type: NodePort
```

EJECUTAR MANIFIESTOS Y CREAR RECURSOS
```
kubectl apply -f .
```

CREAR PORT-FORWARD.SERVICE
```
sudo nano /etc/systemd/system/fe-portforward.service
```

```
[Unit]
Description=Kubernetes MongoDB Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward --address 0.0.0.0 service/tourex-fe-service 5200:5200 -n vinum-aw
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload && \
sudo systemctl enable fe-portforward && \
sudo systemctl start fe-portforward && \
sudo systemctl status fe-portforward
```

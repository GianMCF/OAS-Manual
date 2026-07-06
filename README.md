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
---
## CREAR TODO CON SCRIPTS
```
mongodb://localhost:27017/?directConnection=true
```
### CREAR PARA DATABASE
```
nano setup-database.sh
```

```
#!/bin/bash

set -e

echo "=========================================="
echo " CONFIGURANDO BASE DE DATOS EN KUBERNETES "
echo "=========================================="

#############################
# Crear Namespaces
#############################

echo "Creando namespaces..."

kubectl create namespace vinum-aw --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

#############################
# Deployment MongoDB
#############################

echo "Generando db-deploy.yml..."

cat <<EOF > db-deploy.yml
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

        command:
        - mongod

        args:
        - --bind_ip_all
        - --replSet
        - rs0

        ports:
        - containerPort: 27017
EOF

#############################
# Service MongoDB
#############################

echo "Generando db-svc.yml..."

cat <<EOF > db-svc.yml
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
EOF

#############################
# MongoDB Exporter
#############################

echo "Generando mongodb-exporter.yaml..."

cat <<EOF > mongodb-exporter.yaml
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
EOF

#############################
# Service Exporter
#############################

echo "Generando mongodb-exporter-service.yaml..."

cat <<EOF > mongodb-exporter-service.yaml
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
EOF

#############################
# Aplicar manifiestos
#############################

echo "Aplicando manifiestos..."

kubectl apply -f db-deploy.yml
kubectl apply -f db-svc.yml
kubectl apply -f mongodb-exporter.yaml
kubectl apply -f mongodb-exporter-service.yaml

#############################
# Primer Service systemd
#############################

echo "Creando db-portforward.service..."

sudo tee /etc/systemd/system/db-portforward.service > /dev/null <<EOF
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
EOF

#############################
# Segundo Service systemd
#############################

echo "Creando db-node-portforward.service..."

sudo tee /etc/systemd/system/db-node-portforward.service > /dev/null <<EOF
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
EOF

#############################
# Recargar systemd
#############################

echo "Recargando systemd..."

sudo systemctl daemon-reload

#############################
# Habilitar servicios
#############################

sudo systemctl enable db-portforward
sudo systemctl enable db-node-portforward

#############################
# Iniciar servicios
#############################

sudo systemctl restart db-portforward
sudo systemctl restart db-node-portforward

#############################
# Mostrar estados
#############################

echo
echo "========== Estado db-portforward =========="
sudo systemctl status db-portforward --no-pager

echo
echo "======= Estado db-node-portforward ========"
sudo systemctl status db-node-portforward --no-pager

echo
echo "=========================================="
echo " CONFIGURACIÓN FINALIZADA CORRECTAMENTE "
echo "=========================================="
```

EJECUTAR
```
chmod +x setup-database.sh && ./setup-database.sh
```


### CREAR PARA BE
```
nano setup-backend.sh
```

```
#!/bin/bash

set -e

##############################################
# CONFIGURACIÓN (EDITAR SOLO ESTA SECCIÓN)
##############################################

# IP donde está publicada MongoDB
DB_IP=""

# IP donde está publicado el Frontend
FRONTEND_IP="*"

# Nombre de la base de datos
DB_NAME="vinum-aw-db"

##############################################
# NO MODIFICAR DE AQUÍ HACIA ABAJO
##############################################

echo "=========================================="
echo " CONFIGURANDO BACKEND VINUM "
echo "=========================================="

##############################################
# Namespaces
##############################################
kubectl create namespace vinum-aw --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

##############################################
# ConfigMap
##############################################

echo "Generando ConfigMap..."

cat <<EOF > config.yml
apiVersion: v1
kind: ConfigMap

metadata:
  name: vinum-config
  namespace: vinum-aw

data:
  MONGO_URI: "mongodb://${DB_IP}:27017"
  DB_NAME: "${DB_NAME}"
  CORS_ALLOWED_ORIGIN: "${FRONTEND_IP}"
EOF

##############################################
# Secret
##############################################

echo "Generando Secret..."

cat <<EOF > secret.yml
apiVersion: v1
kind: Secret

metadata:
  name: vinum-secret
  namespace: vinum-aw

type: Opaque

data:
  JWT_SECRET: bXlTdXBlclNlY3JldEtleUZvckp3dEF1dGhlbnRpY2F0aW9uMjAyNlNlY3VyZQ==
  AES_SECRET: dmludW1hd3NlY3VyZWtleQ==
EOF

##############################################
# Backend Deployment
##############################################

echo "Generando Deployment..."

cat <<EOF > be-deploy.yml
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
        image: gianmarcocastillof/vinum-aw-be:3.5

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
EOF

##############################################
# Backend Service
##############################################

echo "Generando Service..."

cat <<EOF > be-svc.yml
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
EOF

##############################################
# Node Exporter Deployment
##############################################

echo "Generando Node Exporter..."

cat <<EOF > node-exporter.yaml
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
EOF

##############################################
# Node Exporter Service
##############################################

echo "Generando Node Exporter Service..."

cat <<EOF > node-exporter-service.yaml
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
EOF

##############################################
# Aplicar Manifiestos
##############################################

echo "Aplicando manifiestos..."

kubectl apply -f config.yml
kubectl apply -f secret.yml
kubectl apply -f be-deploy.yml
kubectl apply -f be-svc.yml
kubectl apply -f node-exporter.yaml
kubectl apply -f node-exporter-service.yaml

##############################################
# Port Forward Backend
##############################################

echo "Creando servicio systemd Backend..."

sudo tee /etc/systemd/system/be-portforward.service > /dev/null <<EOF
[Unit]
Description=Kubernetes Backend Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward --address 0.0.0.0 service/be-service 8088:8088 -n vinum-aw
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
EOF

##############################################
# Port Forward Node Exporter
##############################################

echo "Creando servicio Node Exporter..."

sudo tee /etc/systemd/system/be-node-portforward.service > /dev/null <<EOF
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
EOF

##############################################
# Habilitar Servicios
##############################################

sudo systemctl daemon-reload

sudo systemctl enable be-portforward
sudo systemctl enable be-node-portforward

sudo systemctl restart be-portforward
sudo systemctl restart be-node-portforward

echo
echo "========== Backend =========="
sudo systemctl status be-portforward --no-pager

echo
echo "====== Node Exporter ========"
sudo systemctl status be-node-portforward --no-pager

echo
echo "======================================="
echo " BACKEND CONFIGURADO CORRECTAMENTE"
echo "======================================="
```

EJECUTAR
```
chmod +x setup-backend.sh && ./setup-backend.sh
```


### CREAR PARA FRONTEND
```
nano setup-frontend.sh
```

```
#!/bin/bash

set -e

##############################################
# CONFIGURACIÓN (EDITAR SOLO ESTA SECCIÓN)
##############################################

# IP donde está publicado el Backend
BACKEND_IP=""

##############################################
# NO MODIFICAR DE AQUÍ HACIA ABAJO
##############################################

echo "=========================================="
echo " CONFIGURANDO FRONTEND VINUM "
echo "=========================================="

##############################################
# Namespaces
##############################################
kubectl create namespace vinum-aw --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
##############################################
# ConfigMap
##############################################

echo "Generando ConfigMap..."

cat <<EOF > config.yml
apiVersion: v1
kind: ConfigMap

metadata:
  name: vinum-config
  namespace: vinum-aw

data:
  VITE_API_URL: http://${BACKEND_IP}:8088/v1/api
EOF

##############################################
# Frontend Deployment
##############################################

echo "Generando Deployment..."

cat <<EOF > fe-deploy.yml
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
        image: gianmarcocastillof/vinum-aw-fe:3.1
        imagePullPolicy: IfNotPresent

        ports:
        - containerPort: 5300

        env:
        - name: VITE_API_URL
          valueFrom:
            configMapKeyRef:
              name: vinum-config
              key: VITE_API_URL
EOF

##############################################
# Frontend Service
##############################################

echo "Generando Service..."

cat <<EOF > fe-svc.yml
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
EOF

##############################################
# Node Exporter Deployment
##############################################

echo "Generando Node Exporter..."

cat <<EOF > node-exporter.yaml
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
EOF

##############################################
# Node Exporter Service
##############################################

echo "Generando Node Exporter Service..."

cat <<EOF > node-exporter-service.yaml
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
EOF

##############################################
# Aplicar manifiestos
##############################################

echo "Aplicando manifiestos..."

kubectl apply -f config.yml
kubectl apply -f fe-deploy.yml
kubectl apply -f fe-svc.yml
kubectl apply -f node-exporter.yaml
kubectl apply -f node-exporter-service.yaml

##############################################
# Port Forward Frontend
##############################################

echo "Creando servicio systemd Frontend..."

sudo tee /etc/systemd/system/fe-portforward.service > /dev/null <<EOF
[Unit]
Description=Kubernetes Frontend Port Forward
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/kubectl port-forward --address 0.0.0.0 service/fe-service 5300:5300 -n vinum-aw
Restart=always
RestartSec=5
Environment=KUBECONFIG=/home/ubuntu/.kube/config

[Install]
WantedBy=multi-user.target
EOF

##############################################
# Port Forward Node Exporter
##############################################

echo "Creando servicio Node Exporter..."

sudo tee /etc/systemd/system/fe-node-portforward.service > /dev/null <<EOF
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
EOF

##############################################
# Habilitar servicios
##############################################

sudo systemctl daemon-reload

sudo systemctl enable fe-portforward
sudo systemctl enable fe-node-portforward

sudo systemctl restart fe-portforward
sudo systemctl restart fe-node-portforward

echo
echo "========== Frontend =========="
sudo systemctl status fe-portforward --no-pager

echo
echo "======= Node Exporter ========"
sudo systemctl status fe-node-portforward --no-pager

echo
echo "========================================"
echo " FRONTEND CONFIGURADO CORRECTAMENTE"
echo "========================================"
```

EJECUTAR
```
chmod +x setup-frontend.sh && ./setup-frontend.sh
```

---
# PROCESO DE MONITOREO

```
nano setup-monitoring.sh
```

```
#!/bin/bash
set -euo pipefail

# =========================================================
# VINUM AW - MONITORING AUTO SETUP (CLEAN VERSION)
# =========================================================

########################
# CONFIGURACIÓN
########################

FRONTEND_IP=":30910"
BACKEND_IP=":30911"
BACKEND_APP_IP=":8088"
MONGODB_IP=":30921"

NAMESPACE="monitoring"

########################
# LOG
########################

log() { echo -e "\n[MONITORING] $1"; }

########################
# HELM INSTALL
########################

install_helm() {
  if ! command -v helm &>/dev/null; then
    log "Instalando Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
  fi
}

install_dependencies() {

    if ! command -v jq &>/dev/null; then
        log "Instalando jq..."
        sudo apt-get update
        sudo apt-get install -y jq
    fi

}

########################
# PROMETHEUS + GRAFANA
########################

install_stack() {

    log "Instalando Prometheus y Grafana..."

    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
    helm repo add grafana https://grafana.github.io/helm-charts || true

    helm repo update

    kubectl create namespace "$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -

    helm upgrade --install prometheus \
        prometheus-community/prometheus \
        -n "$NAMESPACE"

    helm upgrade --install grafana \
        grafana/grafana \
        -n "$NAMESPACE"

    log "Esperando despliegues..."

    kubectl rollout status deployment/prometheus-server \
        -n "$NAMESPACE" --timeout=300s

    kubectl rollout status deployment/grafana \
        -n "$NAMESPACE" --timeout=300s
}

########################
# PROMETHEUS CONFIG
########################

create_prometheus_config() {

    log "Configurando Prometheus..."

    CONFIGMAP=$(kubectl get configmap -n "$NAMESPACE" \
        -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' \
        | grep prometheus-server | head -n1)

    if [ -z "$CONFIGMAP" ]; then
        echo "No se encontró la ConfigMap de Prometheus."
        exit 1
    fi

    kubectl get configmap "$CONFIGMAP" \
        -n "$NAMESPACE" \
        -o json \
    | jq '
        .data["prometheus.yml"] =
"global:
  scrape_interval: 15s

scrape_configs:

- job_name: frontend-node
  static_configs:
  - targets: [\"'"$FRONTEND_IP"'\"]

- job_name: backend-node
  static_configs:
  - targets: [\"'"$BACKEND_IP"'\"]

- job_name: backend-app
  metrics_path: /actuator/prometheus
  static_configs:
  - targets: [\"'"$BACKEND_APP_IP"'\"]

- job_name: database
  static_configs:
  - targets: [\"'"$MONGODB_IP"'\"]"
    ' \
    | kubectl apply -f -
}

########################
# ALERTAS
########################

create_alerts() {
log "Creando alertas..."

kubectl apply -n $NAMESPACE -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
data:
  alerts.yml: |
    groups:
      - name: system-alerts
        rules:
          - alert: BackendDown
            expr: up{job="backend-app"} == 0
            for: 1m
            labels:
              severity: critical

          - alert: MongoDown
            expr: up{job="database"} == 0
            for: 1m
            labels:
              severity: critical

          - alert: HighCPU
            expr: 100 - avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100 > 80
            for: 2m
            labels:
              severity: warning
EOF
}

########################
# RESTART PROMETHEUS
########################

restart_prometheus() {

    log "Reiniciando Prometheus..."

    kubectl rollout restart deployment/prometheus-server \
        -n "$NAMESPACE"

    kubectl rollout status deployment/prometheus-server \
        -n "$NAMESPACE" \
        --timeout=300s

    sleep 10
}

########################
# GRAFANA DATASOURCE
########################

configure_grafana() {

    log "Configurando datasource..."

    kubectl rollout status deployment/grafana \
        -n "$NAMESPACE" \
        --timeout=300s

    GRAFANA_POD=$(kubectl get pods \
        -n "$NAMESPACE" \
        -l app.kubernetes.io/name=grafana \
        -o jsonpath='{.items[0].metadata.name}')

    PASSWORD=$(kubectl get secret \
        -n "$NAMESPACE" grafana \
        -o jsonpath='{.data.admin-password}' | base64 --decode)

    HTTP_CODE=$(kubectl exec -n "$NAMESPACE" "$GRAFANA_POD" -- sh -c "
curl -s \
-o /dev/null \
-w '%{http_code}' \
-X POST \
http://admin:$PASSWORD@localhost:3000/api/datasources \
-H 'Content-Type: application/json' \
-d '{
\"name\":\"Prometheus\",
\"type\":\"prometheus\",
\"url\":\"http://prometheus-server.monitoring.svc.cluster.local\",
\"access\":\"proxy\",
\"isDefault\":true
}'
")

    case "$HTTP_CODE" in
        200|201)
            log "Datasource creado."
            ;;
        409)
            log "Datasource existente."
            ;;
        *)
            echo "Error creando datasource (HTTP $HTTP_CODE)"
            exit 1
            ;;
    esac
}

import_dashboard() {

    log "Importando Dashboard..."

    GRAFANA_POD=$(kubectl get pods \
        -n "$NAMESPACE" \
        -l app.kubernetes.io/name=grafana \
        -o jsonpath='{.items[0].metadata.name}')

    PASSWORD=$(kubectl get secret \
        -n "$NAMESPACE" grafana \
        -o jsonpath='{.data.admin-password}' | base64 --decode)

    TMP=$(mktemp)

    cp dashboard.json "$TMP"

    jq '
    walk(
      if type=="object"
         and has("datasource")
         and (.datasource|type)=="object"
         and .datasource.type=="prometheus"
      then
         .datasource.uid="${DS_PROMETHEUS}"
      else
         .
      end
    )
    |
    .__inputs=[
      {
        "name":"DS_PROMETHEUS",
        "label":"Prometheus",
        "type":"datasource",
        "pluginId":"prometheus",
        "pluginName":"Prometheus"
      }
    ]
    |
    del(.id)
    ' "$TMP" > "${TMP}.new"

    mv "${TMP}.new" "$TMP"

    kubectl cp "$TMP" \
        "$NAMESPACE/$GRAFANA_POD:/tmp/dashboard.json"

    rm "$TMP"

    RESULT=$(kubectl exec -n "$NAMESPACE" "$GRAFANA_POD" -- sh -c "
curl -s \
-X POST \
http://admin:$PASSWORD@localhost:3000/api/dashboards/import \
-H 'Content-Type: application/json' \
-d '{
\"dashboard\": '\"\$(cat /tmp/dashboard.json)\"',
\"overwrite\": true,
\"inputs\":[
{
\"name\":\"DS_PROMETHEUS\",
\"type\":\"datasource\",
\"pluginId\":\"prometheus\",
\"value\":\"Prometheus\"
}
]
}'
")

    if echo "$RESULT" | jq -e '.imported == true' >/dev/null; then
        log "Dashboard importado correctamente."
    else
        echo "No fue posible importar el dashboard."
        echo "$RESULT"
        exit 1
    fi

    log "Dashboard importado correctamente."
}

create_portforward_services() {

log "Creando servicios permanentes de Port-Forward..."

sudo tee /etc/systemd/system/prometheus-portforward.service >/dev/null <<EOF
[Unit]
Description=Prometheus Port Forward
After=network.target

[Service]
User=$USER
Environment=KUBECONFIG=/home/$USER/.kube/config
ExecStart=/usr/local/bin/kubectl port-forward svc/prometheus-server -n $NAMESPACE 9090:80 --address 0.0.0.0
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/grafana-portforward.service >/dev/null <<EOF
[Unit]
Description=Grafana Port Forward
After=network.target

[Service]
User=$USER
Environment=KUBECONFIG=/home/$USER/.kube/config
ExecStart=/usr/local/bin/kubectl port-forward svc/grafana -n $NAMESPACE 3000:80 --address 0.0.0.0
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

sudo systemctl enable prometheus-portforward
sudo systemctl enable grafana-portforward

sudo systemctl restart prometheus-portforward
sudo systemctl restart grafana-portforward

sleep 5

sudo systemctl --no-pager --full status prometheus-portforward || true
sudo systemctl --no-pager --full status grafana-portforward || true

}

########################
# EXEC
########################

install_helm
install_dependencies
install_stack
create_prometheus_config
create_alerts
restart_prometheus
configure_grafana
import_dashboard
create_portforward_services

log "LISTO: Monitoreo operativo"

PUBLIC_IP=$(curl -s ifconfig.me)

echo
echo "========================================"
echo " MONITOREO CONFIGURADO"
echo "========================================"
echo "Grafana:"
echo "http://$PUBLIC_IP:3000"
echo
echo "Prometheus:"
echo "http://$PUBLIC_IP:9090"
echo
echo "Usuario Grafana: admin"
echo "Password: $(kubectl get secret --namespace monitoring grafana -o jsonpath='{.data.admin-password}' | base64 --decode)"
echo "========================================"
```

```
chmod +x setup-monitoring.sh && ./setup-monitoring.sh
```

POR SI SE PAGA LA INSTANCIA
```
minikube start --driver=docker
```

---
# EXTRAS

ESTABLECER LA CONFIGURACIÓN PARA EL RESPLICASET DE MONGODB
```
rs.initiate({
    _id: "rs0",
    members: [
        {
            _id: 0,
            host: "db-service.vinum-aw.svc.cluster.local:27017"
        }
    ]
})
```

OBTENER VALOR DE VARIABLES EN POD
```
kubectl exec -it be-deployment-c -n vinum-aw -- printenv | grep MONGO
```

EJECUTAR POD Y ACCEDER A TERMINAL
```
kubectl exec -it db-deployment-c -n vinum-aw -- mongosh
```

CREAR y/o USAR LA BD
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

CREAR
´´´
nano setup-database.sh
´´´

´´´
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
        app:mongodb-exporter
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
´´´

EJECUTAR
´´´
sudo ./setup-database.sh
´´´


CREAR PARA BE
´´´
nano setup-backend.sh
´´´

´´´
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
# Namespace Monitoring
##############################################

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
  MONGO_URI: mongodb://${DB_IP}:27017
  DB_NAME: ${DB_NAME}
  CORS_ALLOWED_ORIGIN: ${FRONTEND_IP}
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
´´´

EJECUTAR
´´´
sudo ./setup-backend.sh
´´´


CREAR PARA FRONTEND
´´´
nano setup-frontend.sh
´´´

´´´
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
# Namespace Monitoring
##############################################

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
  API_IP_URL: http://${BACKEND_IP}:8088/v1/api
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
        - name: API_IP_URL
          valueFrom:
            configMapKeyRef:
              name: vinum-config
              key: API_IP_URL
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
´´´

EJECUTAR
´´´
sudo ./setup-frontend.sh
´´´

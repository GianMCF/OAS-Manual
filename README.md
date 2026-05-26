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

CREAR NAMESPACE(ORDEN)
```
kubectl create namespace vinum-aw
```

CREAR DEPLOYMENT PARA DB
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

CREAR SERVICE PARA DB
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

CREAR DEPLOYMENT PARA BE
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
          image: gianmarcocastillof/vinum-aw-be:1.0

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
apiVersion: v1
kind: ConfigMap
metadata:
  name: vinum-config
  namespace: vinum-aw

data:
  MONGO_URI: mongodb://cambiarporiprivada:27017
  DB_NAME: vinum-aw-db
  CORS_ALLOWED_ORIGIN: http://cambiarporip:5300,http://cambiarporiplocal:8081
```

CREAR SECRET PARA BE
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

CREAR DEPLOYMENT PARA FE
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
          image: gianmarcocastillof/vinum-aw-fe:1.0
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
apiVersion: v1
kind: ConfigMap
metadata:
  name: vinum-config
  namespace: vinum-aw

data:
  API_IP_URL: http://cambiarporip:8088/v1/api
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
## (TOUR EX)

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
              value: "mongodb://IPPRIVADAMONGO:27017/"
            - name: DB_NAME
              value: "tour-ex_db"
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

CREAR DEPLOYMENT PARA FE - TOUREX
```
apiVersion: apps/v1
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
          image: gianmarcocastillof/tour-ex-fe:1.0
          ports:
            - containerPort: 80
          volumeMounts:
            - name: frontend-config-volume
              mountPath: /usr/share/nginx/html/env.js
              subPath: env.js
      volumes:
        - name: fe-config-volume
          configMap:
            name: tourism-fe-config
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
    - port: 80
      targetPort: 80
      nodePort: 30080
  type: NodePort
```

CREAR CONFIG PARA FE - TOUREX
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: tourex-fe-config
data:
  env.js: |
    window._env_ = {
      API_URL: "http://IPPUBLICABACKEND:5000/api"
    };
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
ExecStart=/usr/local/bin/kubectl port-forward --address 0.0.0.0 service/tourex-fe-service 30080:80 -n vinum-aw
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
# EXTRAS

OBTENER PODS 
```
kubectl get pods -n vinum-aw
```

EJECUTAR POD Y ACCEDER A TERMINAL
```
kubectl exec -it db-deployment-cambiaporcodigoreal -n vinum-aw -- bash
```

EJECUTAR MONGOSH PARA REALIZAR CONSULTAS EN BD
```
mongosh
```

USAR BD PARA EJECUTAR SCRIPT O CONSULTAS ESPECÍFICAS
```
use vinum-aw-db
```

---
EVALUAR PROCESOS (EN CASO DE NO PODER EJECUTAR EN CIERTO PUERTO)

```
sudo lsof -i :8088
```
O también:
```
sudo lsof -i :8088
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






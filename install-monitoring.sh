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

all: otel-compose shrtnr-compose
.PHONY: all

opentelemetry-collector-dev-setup:
	git clone https://github.com/vercel/opentelemetry-collector-dev-setup || true

otel-compose: opentelemetry-collector-dev-setup
	cd opentelemetry-collector-dev-setup && docker compose up -d

shrtnr-compose:
	cd shrtnr && docker compose --profile prod up -d

# Some unnecessary stuff
#
# build: build-app
# build-app:
# 	docker compose -f ./shrtnr/docker-compose.yml build 
# test:
# 	docker compose -f ./shrtnr/docker-compose.yml --profile testing up
# up: build
# 	docker compose -f ./shrtnr/docker-compose.yml up -d
# down:
# 	docker compose -f ./shrtnr/docker-compose.yml down 

# From when I planned to try out Signoz instead of the usual observability stack
# 
# build-all:
# 	docker compose -f ./shrtnr/docker-compose.yml -f ./signoz/deploy/docker/clickhouse-setup/docker-compose.yaml build --parallel
# signoz-download:
# 	git clone -b main https://github.com/SigNoz/signoz.git || cd signoz && git pull origin main
# bonus: signoz-download signoz-build
# 	# Also deploys a instance of Signoz for visualizing metrics, logs, and traces
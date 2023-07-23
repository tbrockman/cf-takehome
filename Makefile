all: build build-app get-signoz up down
.PHONY : all

build: build-app
build-app:
	docker compose -f ./shrtnr/docker-compose.yml build 
build-all:
	docker compose -f ./shrtnr/docker-compose.yml -f ./signoz/deploy/docker/clickhouse-setup/docker-compose.yaml build --parallel
test:
	echo "No tests yet"
signoz-download:
	git clone -b main https://github.com/SigNoz/signoz.git || cd signoz && git pull origin main

up: build
	docker compose -f ./shrtnr/docker-compose.yml up -d
down:
	docker compose -f ./shrtnr/docker-compose.yml down 

bonus: signoz-download signoz-build
	# Also deploys a instance of Signoz for visualizing metrics, logs, and traces 
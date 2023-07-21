all: build build-app get-signoz up down
.PHONY : all

build: build-app

build-app:
	docker compose -f ./shrtnr/docker-compose.yml -f ./signoz/deploy/docker/clickhouse-setup/docker-compose.yaml build 

signoz-download:
	git clone -b main https://github.com/SigNoz/signoz.git || cd signoz && git pull origin main

up: signoz-download build
	docker compose -f ./shrtnr/docker-compose.yml -f ./signoz/deploy/docker/clickhouse-setup/docker-compose.yaml up -d

up-no-signoz: build
	docker compose -f ./shrtnr/docker-compose.yml up

down:
	docker compose -f ./shrtnr/docker-compose.yml -f ./signoz/deploy/docker/clickhouse-setup/docker-compose.yaml down 
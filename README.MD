### Installation prerequisites

Before starting, ensure you have the following installed:

- PostgreSQL (instructions below for local setup)
- Docker
- Kubernetes (Minikube)

---
### How to run the project locally (using Minikube)

#### 1. Run PostgreSQL locally (with pgAdmin for easy access to tables and data):
- Run `docker-compose -f local-db/compose.yaml up -d`

#### 2. Install dependencies:
- Run `npm install`

#### 3. Run the migration script to sync the schema and load initial data:
`DB_HOST=localhost npx ts-node src/scripts/sync-db.ts`

#### 4. (Optional) Enable Google Pub/Sub and Email Service functionality:
- Update the `.env` file with Google Pub/Sub configuration and include a key file named `orders-app-key.json`
- Enable the `ENABLE_PUBSUB` feature flag in the `.env`
- Update the `.env` file with email service configuration

#### 5. Start Minikube:

`minikube start`

#### 6. Build the image (using Minikube's internal docker daemon):

`eval $(minikube docker-env)`

`docker build -t orders-app-image:latest .`

#### 7. Create a secret from the .env File:

`kubectl create secret generic orders-app-secret --from-env-file=.env`

#### 8. Apply deployment:

`kubectl apply -f orders-app.yaml`

#### 9. Expose the API using Minikube:

`minikube service orders-service`

#### 10. Validate the API by calling one of the endpoints:
`GET http://127.0.0.1:{port}/api/user`

---

### Stop and clean up resources (all data will be lost):

#### 1. Delete deployment: `kubectl delete -f orders-app.yaml`

#### 2. Delete secret: `kubectl delete secret orders-app-secret`

#### 3. Stop Minikube: `minikube stop`

#### 4. Unset Minikube's internal docker daemon: `eval $(minikube docker-env --unset)`

#### 5. Stop and delete local PostgreSQL: `docker-compose -f local-db/compose.yaml down -v`


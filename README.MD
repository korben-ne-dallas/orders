### How to start local postgres with pgadmin

```docker compose --project-name orders-db-services up -d```

### How to create initial migration

```npx mikro-orm migration:create --initial```

### How to run migration

```npx mikro-orm migration:up```
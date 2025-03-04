# TaskPilot Deployment Guide

This guide walks you through deploying the TaskPilot application on your local Docker server from A to Z.

## Prerequisites

- Docker and Docker Compose installed on your server
- Git installed on your server
- Access to the server via SSH or direct terminal
- GitHub account with access to the TaskPilot repository

## Step 1: Clone the Repository

1. Connect to your server via SSH or open a terminal on your server
2. Navigate to the directory where you want to deploy TaskPilot
3. Clone the repository:

```bash
git clone https://github.com/JakobM999/TaskPilot.git
cd TaskPilot
```

## Step 2: Configure Environment Variables

1. Copy the Docker environment file:

```bash
cp .env.docker .env
```

2. Edit the `.env` file with your preferred database credentials:

```bash
nano .env
```

Make sure to update:
- `DB_PASSWORD`: Use a secure password
- `SUPABASE_ANON_KEY`: If you have your own Supabase project key

## Step 3: Build and Start the Application

1. Build and start the Docker containers:

```bash
docker-compose up -d
```

This command:
- Builds the TaskPilot React application
- Creates a Supabase PostgreSQL database
- Starts both services in detached mode

2. Verify the containers are running:

```bash
docker-compose ps
```

You should see both `taskpilot-app` and `taskpilot-supabase` containers running.

## Step 4: Initialize the Database

The database schema should be automatically loaded from the `supabase/schema.sql` file. To verify the database is properly set up:

```bash
docker-compose exec supabase-db psql -U postgres -d taskpilot -c "\dt"
```

This should display the tables in your TaskPilot database.

## Step 5: Access the Application

Once everything is running, you can access TaskPilot at:

```
http://your-server-ip
```

Replace `your-server-ip` with your server's IP address or domain name.

## Step 6: Update the Application (Manual Process)

To update the application when there are changes in the GitHub repository:

1. Navigate to your TaskPilot directory:

```bash
cd /path/to/TaskPilot
```

2. Pull the latest changes:

```bash
git pull origin master
```

3. Rebuild and restart the containers:

```bash
docker-compose down
docker-compose up -d --build
```

This will rebuild the TaskPilot application with the latest changes.

## Troubleshooting

### Database Connection Issues

If the application can't connect to the database:

1. Check if the database container is running:

```bash
docker-compose ps supabase-db
```

2. Check the database logs:

```bash
docker-compose logs supabase-db
```

### Application Startup Issues

If the application doesn't start properly:

1. Check the application logs:

```bash
docker-compose logs taskpilot
```

2. Verify environment variables are passed correctly:

```bash
docker-compose exec taskpilot env
```

## Backup and Restore

### Creating a Database Backup

```bash
docker-compose exec supabase-db pg_dump -U postgres -d taskpilot > taskpilot_backup.sql
```

### Restoring from Backup

```bash
cat taskpilot_backup.sql | docker-compose exec -T supabase-db psql -U postgres -d taskpilot
```

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Supabase Documentation: https://supabase.io/docs
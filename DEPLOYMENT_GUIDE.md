# TaskPilot Deployment Guide

This guide walks you through deploying the TaskPilot application on your local Docker server from A to Z.

## Prerequisites

- Docker and Docker Compose installed on your server
- Git installed on your server
- Access to the server via SSH or direct terminal
- GitHub account with access to the TaskPilot repository
- Access to existing Supabase instance at 192.168.0.195:8000

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

The environment file is pre-configured to use the existing Supabase instance at 192.168.0.195:8000.

## Step 3: Build and Start the Application

1. Build and start the Docker container:

```bash
docker-compose up -d
```

This command:
- Builds the TaskPilot React application
- Starts the service in detached mode

2. Verify the container is running:

```bash
docker-compose ps
```

You should see the `taskpilot-app` container running.

## Step 4: Access the Application

Once everything is running, you can access TaskPilot at:

```
http://your-server-ip:3030
```

Replace `your-server-ip` with your server's IP address or domain name.

## Step 5: Update the Application (Manual Process)

To update the application when there are changes in the GitHub repository:

1. Navigate to your TaskPilot directory:

```bash
cd /path/to/TaskPilot
```

2. Pull the latest changes:

```bash
git pull origin master
```

3. Rebuild and restart the container:

```bash
docker-compose down
docker-compose up -d --build
```

This will rebuild the TaskPilot application with the latest changes.

## Troubleshooting

### Port Conflicts

If you see errors about port 3030 being in use:

1. Check if other services are using port 3030:
```bash
sudo lsof -i :3030
```

2. If needed, you can modify the port in docker-compose.yml to use a different one.

### Connection Issues

If the application can't connect to Supabase:

1. Verify that the Supabase instance is running at 192.168.0.195:8000
2. Check the application logs:

```bash
docker-compose logs taskpilot
```

3. Verify environment variables are passed correctly:

```bash
docker-compose exec taskpilot env
```

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Supabase Documentation: https://supabase.io/docs
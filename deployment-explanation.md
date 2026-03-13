# How this app is deployed to Google Cloud — step by step

## Prerequisites (one-time setup)

1. **Install the `gcloud` CLI** on your machine.
2. **Authenticate:** `gcloud auth login`
3. **Create a GCP project:** `gcloud projects create <PROJECT_ID>`
4. **Link a billing account** (required even for the free tier — you won't be charged).
5. **Set the project:** `gcloud config set project <PROJECT_ID>`

---

## What `./deploy.sh` does (the single deploy command)

Running `./deploy.sh` performs every step automatically:

### Step 1 — Enable the Compute Engine API
```
gcloud services enable compute.googleapis.com
```
Makes sure the Compute Engine service is turned on in your GCP project.

### Step 2 — Create a firewall rule
If it doesn't already exist, the script creates a rule called `allow-http` that opens **port 80** (HTTP) to the internet:
```
gcloud compute firewall-rules create allow-http --allow=tcp:80 --target-tags=http-server
```

### Step 3 — Create the VM (or skip if it exists)
A single **e2-micro** VM is created — this is Google Cloud's **always-free tier** machine:
- **Name:** `kotonosiki`
- **Zone:** `us-central1-a`
- **OS:** Container-Optimized OS (COS) — a lightweight Linux with Docker pre-installed
- **Disk:** 30 GB standard persistent disk
- **Network tag:** `http-server` (matched by the firewall rule above)

### Step 4 — Wait for the VM to boot
The script sleeps 20 seconds to let the VM finish starting.

### Step 5 — Upload the project files
The script creates a **tarball** of the project (excluding `node_modules`, `.git`, `dist`) and copies it to the VM via `gcloud compute scp`.

### Step 6 — Build & run the Docker container on the VM
The script SSHes into the VM and:

1. **Extracts** the tarball into `~/kotonosiki`.
2. **Builds a Docker image** using the multi-stage `Dockerfile`:
   - **Build stage** (`node:20-alpine`): installs all deps, runs `npm run build` (Vite builds the React frontend into `dist/`).
   - **Production stage** (`node:20-alpine`): installs only production deps + `tsx`, copies the built frontend (`dist/`) and the `server/` source code.
3. **Stops & removes** any existing container named `kotonosiki`.
4. **Creates a Docker volume** called `kotonosiki-data` (persists the JSON data files in `/app/server/data` across container restarts).
5. **Runs the new container:**
   - Maps **port 80 → 3001** (external HTTP traffic goes to the Node server).
   - Mounts the `kotonosiki-data` volume for persistent data.
   - Sets `NODE_ENV=production`.
   - Starts the server with `npx tsx server/index.ts`.

### Step 7 — Print the external IP
The script queries the VM's external IP and prints the app URL:
```
✅ Deployed successfully!
🌐 App is available at: http://34.42.126.240
```

---

## Architecture summary

```
Internet
   │
   ▼  :80
┌────────────────────────────────────────┐
│  GCE VM  (e2-micro, COS, us-central1) │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  Docker container "kotonosiki"   │  │
│  │                                  │  │
│  │   Node.js server (tsx)  :3001    │  │
│  │   ├── serves /dist (React SPA)  │  │
│  │   └── serves /api (JSON API)    │  │
│  │                                  │  │
│  │   Volume: kotonosiki-data        │  │
│  │   └── /app/server/data/*.json   │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

- **No load balancer, no managed database, no CI/CD** — it's a single VM with a single container.
- **Data is persisted** in JSON files on a Docker volume (survives container rebuilds).
- **Redeployment** is just running `./deploy.sh` again — it re-uploads, rebuilds, and replaces the container.
- Everything fits within **Google Cloud's always-free tier** (1 e2-micro, 30 GB disk, us-central1).

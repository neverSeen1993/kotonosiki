#!/usr/bin/env bash
#
# Deploy kotonosiki to Google Cloud Compute Engine (free tier).
#
# Prerequisites:
#   1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
#   2. Run: gcloud auth login
#   3. Create a project: gcloud projects create <PROJECT_ID>
#   4. Link a billing account (required even for free tier, you won't be charged):
#        https://console.cloud.google.com/billing
#   5. Run: gcloud config set project <PROJECT_ID>
#
# Usage:
#   chmod +x deploy.sh && ./deploy.sh
#
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
VM_NAME="kotonosiki"
ZONE="us-central1-a"
MACHINE_TYPE="e2-micro"           # Always-free tier
DISK_SIZE="30GB"                  # 30 GB free
IMAGE_FAMILY="cos-stable"        # Container-Optimized OS (Docker pre-installed)
IMAGE_PROJECT="cos-cloud"

PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT" ]; then
  echo "❌ No active project. Run: gcloud config set project <PROJECT_ID>"
  exit 1
fi
echo "📦 Using project: $PROJECT"

# ── Enable Compute Engine API ────────────────────────────────────────────────
echo "🔧 Enabling Compute Engine API..."
gcloud services enable compute.googleapis.com --quiet

# ── Create firewall rule (allow HTTP on port 80) ────────────────────────────
if ! gcloud compute firewall-rules describe allow-http --quiet 2>/dev/null; then
  echo "🔥 Creating firewall rule for port 80..."
  gcloud compute firewall-rules create allow-http \
    --allow=tcp:80 \
    --target-tags=http-server \
    --description="Allow HTTP traffic on port 80" \
    --quiet
else
  echo "✅ Firewall rule 'allow-http' already exists"
fi

# ── Create VM ────────────────────────────────────────────────────────────────
if ! gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --quiet 2>/dev/null; then
  echo "🖥️  Creating e2-micro VM '$VM_NAME' in $ZONE..."
  gcloud compute instances create "$VM_NAME" \
    --zone="$ZONE" \
    --machine-type="$MACHINE_TYPE" \
    --image-family="$IMAGE_FAMILY" \
    --image-project="$IMAGE_PROJECT" \
    --boot-disk-size="$DISK_SIZE" \
    --tags=http-server \
    --quiet
else
  echo "✅ VM '$VM_NAME' already exists"
fi

# ── Wait for VM to be ready ─────────────────────────────────────────────────
echo "⏳ Waiting for VM to be ready..."
sleep 20

# ── Copy project files to VM ────────────────────────────────────────────────
echo "📤 Uploading project files..."
# Create a tarball excluding unnecessary files
tar czf /tmp/kotonosiki.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  -C "$(dirname "$0")" .

gcloud compute scp /tmp/kotonosiki.tar.gz "$VM_NAME":~ --zone="$ZONE" --quiet
rm /tmp/kotonosiki.tar.gz

# ── Deploy on the VM ────────────────────────────────────────────────────────
echo "🚀 Building and starting the app on the VM..."
gcloud compute ssh "$VM_NAME" --zone="$ZONE" --quiet --command="
  set -e
  mkdir -p ~/kotonosiki
  tar xzf ~/kotonosiki.tar.gz -C ~/kotonosiki
  rm ~/kotonosiki.tar.gz
  cd ~/kotonosiki

  # Build the Docker image
  docker build -t kotonosiki .

  # Stop and remove existing container if running
  docker rm -f kotonosiki 2>/dev/null || true

  # Create a named volume for persistent data (no-op if exists)
  docker volume create kotonosiki-data

  # Run the container
  docker run -d \
    --name kotonosiki \
    --restart unless-stopped \
    -p 80:3001 \
    -v kotonosiki-data:/app/server/data \
    -e NODE_ENV=production \
    -e PORT=3001 \
    kotonosiki
"

# ── Get external IP ─────────────────────────────────────────────────────────
EXTERNAL_IP=$(gcloud compute instances describe "$VM_NAME" \
  --zone="$ZONE" \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "✅ Deployed successfully!"
echo "🌐 App is available at: http://$EXTERNAL_IP"
echo ""
echo "Useful commands:"
echo "  SSH into VM:    gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "  View logs:      gcloud compute ssh $VM_NAME --zone=$ZONE --command='docker logs -f kotonosiki'"
echo "  Redeploy:       ./deploy.sh"
echo "  Stop VM:        gcloud compute instances stop $VM_NAME --zone=$ZONE"
echo "  Delete VM:      gcloud compute instances delete $VM_NAME --zone=$ZONE"

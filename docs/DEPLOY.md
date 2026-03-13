# Kotonosiki – Deployment Quick Reference

**App URL:** http://34.42.126.240

## Commands

| Action | Command |
|---|---|
| **Deploy / Redeploy** | `./deploy.sh` |
| **SSH into VM** | `gcloud compute ssh kotonosiki --zone=us-central1-a` |
| **View logs** | `gcloud compute ssh kotonosiki --zone=us-central1-a --command='docker logs -f kotonosiki'` |
| **Stop VM** | `gcloud compute instances stop kotonosiki --zone=us-central1-a` |
| **Start VM** | `gcloud compute instances start kotonosiki --zone=us-central1-a` |
| **Delete VM** | `gcloud compute instances delete kotonosiki --zone=us-central1-a` |

## Infrastructure

| Resource | Value |
|---|---|
| Cloud provider | Google Cloud (always-free tier) |
| VM name | `kotonosiki` |
| Machine type | `e2-micro` |
| Zone | `us-central1-a` |
| OS | Container-Optimized OS (COS) |
| Disk | 30 GB standard persistent disk |
| Firewall | Port 80 open (`allow-http` rule) |
| Docker volume | `kotonosiki-data` → `/app/server/data` |

## Free Tier Limits

| Resource | Limit |
|---|---|
| e2-micro instance | 1 per month (us-central1 only) |
| Standard disk | 30 GB |
| Network egress | 1 GB/month (to most destinations) |
| Static IP | 1 (free while attached to a running VM) |

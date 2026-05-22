#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="${DEPLOY_DIR:-/app/server}"
RELEASE_DIR="$DEPLOY_DIR/releases/$(date +%Y%m%d%H%M%S)"
TARBALL="/tmp/advrcm-server-release.tar.gz"

if [ $# -lt 2 ]; then
    echo "Usage: $0 <ssh-user@host> <ssh-key-file> [ssh-port]"
    echo ""
    echo "Builds the project and deploys only the compiled output."
    echo ""
    echo "Environment variables:"
    echo "  DEPLOY_DIR      Server target directory (default: /app/server)"
    echo "  APP_NAME        PM2 process name (default: advrcm-server)"
    echo "  SG_ID           EC2 security group ID (required)"
    exit 1
fi

SSH_TARGET="$1"
SSH_KEY="$2"
SSH_PORT="${3:-22}"
APP_NAME="${APP_NAME:-advrcm-server}"

# --- Resolve runner public IP and temporarily allow it through the EC2 security group ---

if [ -z "${SG_ID:-}" ]; then
    echo "Error: SG_ID environment variable is required (the EC2 security group ID)"
    exit 1
fi

RUNNER_IP=$(curl -sf4 https://api.ipify.org)

allow_runner_ip() {
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port "$SSH_PORT" \
        --cidr "$RUNNER_IP/32"
    echo "=== Allowed $RUNNER_IP/32 on port $SSH_PORT in security group $SG_ID ==="
}

deny_runner_ip() {
    aws ec2 revoke-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port "$SSH_PORT" \
        --cidr "$RUNNER_IP/32" || true
    echo "=== Removed $RUNNER_IP/32 from security group $SG_ID ==="
}

cleanup() {
    deny_runner_ip
    rm -f "$TARBALL"
}
trap cleanup EXIT

allow_runner_ip

# --- Build ---

echo "=== Building production artifacts ==="

cd "$PROJECT_DIR"

npm ci
npm run build
npm prune --production

tar -czf "$TARBALL" \
    dist \
    node_modules \
    package.json \
    package-lock.json

# --- Upload ---

echo "=== Uploading release ($(du -h "$TARBALL" | cut -f1)) ==="

scp -i "$SSH_KEY" -P "$SSH_PORT" "$TARBALL" "$SSH_TARGET:$TARBALL"

# --- Deploy ---

echo "=== Deploying on server ==="

ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_TARGET" << DEPLOY_SCRIPT
set -euo pipefail

mkdir -p "$RELEASE_DIR"
tar -xzf "$TARBALL" -C "$RELEASE_DIR"
rm "$TARBALL"

rm -f "$DEPLOY_DIR/current"
ln -s "$RELEASE_DIR" "$DEPLOY_DIR/current"

if pm2 show "$APP_NAME" &>/dev/null 2>&1; then
    pm2 delete "$APP_NAME" || true
fi

pm2 start "$DEPLOY_DIR/current/dist/server.js" \
    --name "$APP_NAME" \
    --env production \
    --log "$DEPLOY_DIR/logs/app.log" \
    --error "$DEPLOY_DIR/logs/error.log" \
    --merge-logs \
    --time

pm2 save
DEPLOY_SCRIPT

echo "=== Deploy complete: $(basename "$RELEASE_DIR") ==="

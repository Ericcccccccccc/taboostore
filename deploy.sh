#!/bin/bash

# Deployment script for Taboo Store
# This script builds, compresses, transfers, and deploys Docker containers to the VM

# Configuration
SSH_KEY="$HOME/Documents/tech/notatherapist/oracle-ssh.key"
VM_USER="ubuntu"
VM_IP="170.9.233.1"
SSH_CMD="ssh -i $SSH_KEY $VM_USER@$VM_IP"
SCP_CMD="scp -i $SSH_KEY"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➤ $1${NC}"
}

# Function to check if SSH key exists
check_ssh_key() {
    if [ ! -f "$SSH_KEY" ]; then
        print_error "SSH key not found at: $SSH_KEY"
        exit 1
    fi
    print_success "SSH key found"
}

# Function to test VM connection
test_vm_connection() {
    print_info "Testing connection to VM..."
    if $SSH_CMD "echo 'Connection successful'" > /dev/null 2>&1; then
        print_success "VM connection successful"
    else
        print_error "Cannot connect to VM. Please check:"
        echo "  - VM is running"
        echo "  - IP address is correct: $VM_IP"
        echo "  - SSH key is correct: $SSH_KEY"
        exit 1
    fi
}

# Function to build frontend
build_frontend() {
    print_info "Building frontend Docker image..."
    cd frontend
    if docker build -t taboo-frontend .; then
        print_success "Frontend image built successfully"
        cd ..
        return 0
    else
        print_error "Failed to build frontend image"
        cd ..
        return 1
    fi
}

# Function to build backend
build_backend() {
    print_info "Building backend Docker image..."
    cd backend
    if docker build -t taboo-backend .; then
        print_success "Backend image built successfully"
        cd ..
        return 0
    else
        print_error "Failed to build backend image"
        cd ..
        return 1
    fi
}

# Function to compress and transfer images
transfer_images() {
    local images=("$@")

    print_info "Compressing Docker images..."
    for image in "${images[@]}"; do
        print_info "Saving $image..."
        if docker save -o "${image}.tar" "$image"; then
            print_success "$image saved to ${image}.tar"

            # Compress with gzip for faster transfer
            print_info "Compressing ${image}.tar..."
            if gzip -f "${image}.tar"; then
                print_success "${image}.tar.gz created"
            else
                print_error "Failed to compress ${image}.tar"
                return 1
            fi
        else
            print_error "Failed to save $image"
            return 1
        fi
    done

    print_info "Transferring images to VM..."
    for image in "${images[@]}"; do
        if $SCP_CMD "${image}.tar.gz" "$VM_USER@$VM_IP:~/"; then
            print_success "${image}.tar.gz transferred"
            # Clean up local compressed file
            rm "${image}.tar.gz"
        else
            print_error "Failed to transfer ${image}.tar.gz"
            return 1
        fi
    done
}

# Function to deploy on VM
deploy_on_vm() {
    local deploy_frontend=$1
    local deploy_backend=$2

    print_info "Deploying on VM..."

    # Create deployment script to run on VM
    cat << 'DEPLOY_SCRIPT' > /tmp/deploy_on_vm.sh
#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting deployment on VM...${NC}"

# Function to ensure Docker networks exist
ensure_networks() {
    # Create web network if it doesn't exist
    if ! docker network ls | grep -q "web"; then
        echo "Creating 'web' network..."
        docker network create web
    else
        echo "Network 'web' already exists"
    fi

    # Create internal network if it doesn't exist
    if ! docker network ls | grep -q "internal"; then
        echo "Creating 'internal' network..."
        docker network create internal
    else
        echo "Network 'internal' already exists"
    fi
}

# Ensure networks exist
ensure_networks

DEPLOY_SCRIPT

    # Add frontend deployment if selected
    if [ "$deploy_frontend" = true ]; then
        cat << 'FRONTEND_SCRIPT' >> /tmp/deploy_on_vm.sh

# Deploy Frontend
if [ -f ~/taboo-frontend.tar.gz ]; then
    echo -e "${YELLOW}Deploying frontend...${NC}"

    # Decompress and load image
    echo "Decompressing frontend image..."
    gunzip -f ~/taboo-frontend.tar.gz

    echo "Loading frontend image..."
    docker load -i ~/taboo-frontend.tar

    # Stop and remove old container if exists
    echo "Removing old frontend container..."
    docker stop taboo-frontend 2>/dev/null || true
    docker rm taboo-frontend 2>/dev/null || true

    # Run new frontend container
    echo "Starting new frontend container..."
    docker run -d \
        --name taboo-frontend \
        --network web \
        --restart unless-stopped \
        taboo-frontend

    echo -e "${GREEN}✓ Frontend deployed successfully${NC}"

    # Clean up
    rm ~/taboo-frontend.tar
fi
FRONTEND_SCRIPT
    fi

    # Add backend deployment if selected
    if [ "$deploy_backend" = true ]; then
        cat << 'BACKEND_SCRIPT' >> /tmp/deploy_on_vm.sh

# Deploy Backend
if [ -f ~/taboo-backend.tar.gz ]; then
    echo -e "${YELLOW}Deploying backend...${NC}"

    # Decompress and load image
    echo "Decompressing backend image..."
    gunzip -f ~/taboo-backend.tar.gz

    echo "Loading backend image..."
    docker load -i ~/taboo-backend.tar

    # Stop and remove old container if exists
    echo "Removing old backend container..."
    docker stop taboo-backend 2>/dev/null || true
    docker rm taboo-backend 2>/dev/null || true

    # Run new backend container with both networks
    echo "Starting new backend container..."
    docker run -d \
        --name taboo-backend \
        --network web \
        --restart unless-stopped \
        taboo-backend

    # Connect backend to internal network as well
    docker network connect internal taboo-backend

    echo -e "${GREEN}✓ Backend deployed successfully${NC}"

    # Clean up
    rm ~/taboo-backend.tar
fi
BACKEND_SCRIPT
    fi

    # Add final status check
    cat << 'STATUS_SCRIPT' >> /tmp/deploy_on_vm.sh

# Show status
echo -e "${YELLOW}Current container status:${NC}"
docker ps --filter "name=taboo-"

echo -e "${GREEN}Deployment complete!${NC}"
STATUS_SCRIPT

    # Copy and execute deployment script on VM
    print_info "Copying deployment script to VM..."
    $SCP_CMD /tmp/deploy_on_vm.sh "$VM_USER@$VM_IP:~/"

    print_info "Executing deployment on VM..."
    $SSH_CMD "chmod +x ~/deploy_on_vm.sh && ~/deploy_on_vm.sh && rm ~/deploy_on_vm.sh"

    # Clean up local temp script
    rm /tmp/deploy_on_vm.sh
}

# Main script
main() {
    echo "======================================"
    echo "  Taboo Store Deployment Script"
    echo "======================================"
    echo

    # Check prerequisites
    check_ssh_key
    test_vm_connection

    # Ask what to deploy
    echo
    echo "What would you like to deploy?"
    echo "1) Frontend only"
    echo "2) Backend only"
    echo "3) Both frontend and backend"
    echo "4) Cancel"
    echo
    read -p "Enter your choice (1-4): " choice

    deploy_frontend=false
    deploy_backend=false
    images_to_transfer=()

    case $choice in
        1)
            deploy_frontend=true
            images_to_transfer+=("taboo-frontend")
            print_info "Will deploy: Frontend"
            ;;
        2)
            deploy_backend=true
            images_to_transfer+=("taboo-backend")
            print_info "Will deploy: Backend"
            ;;
        3)
            deploy_frontend=true
            deploy_backend=true
            images_to_transfer+=("taboo-frontend" "taboo-backend")
            print_info "Will deploy: Frontend and Backend"
            ;;
        4)
            print_info "Deployment cancelled"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac

    # Confirm deployment
    echo
    read -p "Continue with deployment? (y/n): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi

    echo
    print_info "Starting deployment process..."
    echo

    # Build images
    if [ "$deploy_frontend" = true ]; then
        build_frontend || exit 1
    fi

    if [ "$deploy_backend" = true ]; then
        build_backend || exit 1
    fi

    # Transfer images
    transfer_images "${images_to_transfer[@]}" || exit 1

    # Deploy on VM
    deploy_on_vm "$deploy_frontend" "$deploy_backend"

    echo
    echo "======================================"
    print_success "Deployment completed successfully!"
    echo "======================================"
    echo
    echo "Containers deployed internally on VM."
    echo "Access via Caddy reverse proxy at your configured domain."
    echo
    echo "Internal container access (from within VM):"
    echo "  Frontend: http://taboo-frontend:80"
    echo "  Backend API: http://taboo-backend:8000"
    echo
    echo "To check container status on VM:"
    echo "  $SSH_CMD 'docker ps'"
    echo
    echo "To view logs:"
    echo "  Frontend: $SSH_CMD 'docker logs taboo-frontend'"
    echo "  Backend: $SSH_CMD 'docker logs taboo-backend'"
    echo
}

# Run main function
main
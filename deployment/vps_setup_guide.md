# Oracle Cloud VPS Production Deployment Guide

This guide walks you through setting up the production environment for the `ordinary-tools` project on your **Ubuntu Oracle VPS** step-by-step. 

We will configure:
- **FastAPI backend** running under Gunicorn (with Uvicorn workers) managed by systemd.
- **Vite frontend** served directly by Nginx.
- **Nginx reverse proxy** to forward `/api/` traffic to the FastAPI backend.
- **Oracle Cloud & OS-level firewalls** to allow web traffic.

---

## Prerequisites & Directory Structure

Ensure your project is cloned to `~/ordinary-tools`. Your directory structure should look like this:
```text
/home/ubuntu/ordinary-tools/
├── backend/
│   ├── app/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    └── dist/ (Generated after building frontend)
```

---

## Step 1: Update System & Install System Dependencies

Before installing Python packages, we must update the VPS package list and install system dependencies.
For this project, `ffmpeg` is **strictly required** by `yt-dlp` to merge video and audio streams into high-quality files.

### 1. Update VPS Package Manager
Updates the list of available packages and their versions.
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Python Tools, Nginx, and ffmpeg
Installs the Python virtual environment package, Nginx web server, and the `ffmpeg` multimedia framework.
```bash
sudo apt install -y python3-pip python3-venv ffmpeg nginx
```

---

## Step 2: Virtual Environment & Python Packages

Activate your virtual environment and install the required Python dependencies.

### 1. Navigate to the Backend Directory
Changes your working directory to where the backend code resides.
```bash
cd ~/ordinary-tools/backend
```

### 2. Create and Activate the Virtual Environment
Create the virtual environment if you haven't already, and activate it.
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Automatically Generate requirements.txt (Optional Verification)
If you add any new python packages in the future, you can generate/update `requirements.txt` with:
```bash
pip freeze > requirements.txt
```
> [!NOTE]
> The repository already comes with an updated `backend/requirements.txt` that includes `fastapi`, `uvicorn[standard]`, `yt-dlp`, `instaloader`, and `gunicorn`.

### 4. Install All Python Packages
Installs all dependencies from `requirements.txt` into the activated virtual environment.
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Step 3: Run FastAPI with Gunicorn (systemd)

To make sure your API continues running in the background, starts on system boot, and restarts if it crashes, we will set up a systemd service.

### 1. Copy Gunicorn Service File
Copy the provided `gunicorn.service` configuration to the systemd directory:
```bash
sudo cp ~/ordinary-tools/deployment/gunicorn.service /etc/systemd/system/gunicorn.service
```

### 2. Reload systemd Daemon
Tells systemd to search for new or updated service files.
```bash
sudo systemctl daemon-reload
```

### 3. Start Gunicorn Service
Starts the Gunicorn process serving the FastAPI application.
```bash
sudo systemctl start gunicorn
```

### 4. Enable Gunicorn on Boot
Configures Gunicorn to start automatically whenever the VPS boots.
```bash
sudo systemctl enable gunicorn
```

### 5. Check Service Status
Verifies that the service is running and active without errors.
```bash
sudo systemctl status gunicorn
```

> [!TIP]
> To view real-time logs of the FastAPI application, run:
> `sudo journalctl -u gunicorn -f`

---

## Step 4: Build Frontend & Configure Permissions

Next, we build the React/Vite frontend and prepare file permissions so Nginx can read the static files.

### 1. Install Node.js (if not installed)
If Node.js is not on your VPS, install it via NodeSource or apt:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Build the Frontend
Navigate to the frontend directory, install dependencies, and build the static assets:
```bash
cd ~/ordinary-tools/frontend
npm install
npm run build
```
This compiles your frontend files and saves them to `/home/ubuntu/ordinary-tools/frontend/dist`.

### 3. Set Folder Permissions
Nginx runs under the `www-data` user, which needs execute (`x`) permission on all parent folders of the built assets to access them.
```bash
chmod o+x /home/ubuntu
chmod o+x /home/ubuntu/ordinary-tools
chmod o+x /home/ubuntu/ordinary-tools/frontend
chmod -R o+r /home/ubuntu/ordinary-tools/frontend/dist
```
> [!WARNING]
> Skipping folder permission adjustments is the most common reason Nginx returns a **403 Forbidden** error when trying to view a website.

---

## Step 5: Configure Nginx Reverse Proxy

We will set up Nginx to serve the frontend build and reverse proxy any `/api/...` calls to the Gunicorn socket.

### 1. Copy the Nginx Configuration File
Copies our custom configuration to Nginx's sites-available directory.
```bash
sudo cp ~/ordinary-tools/deployment/nginx.conf /etc/nginx/sites-available/ordinary-tools
```

### 2. Enable the Site Configuration
Creates a symbolic link in `sites-enabled` to enable the site.
```bash
sudo ln -sf /etc/nginx/sites-available/ordinary-tools /etc/nginx/sites-enabled/
```

### 3. Disable the Default Site Configuration
Removes the default Nginx placeholder website to avoid port 80 conflicts.
```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

### 4. Test Nginx Configuration
Checks the configuration files for syntax errors.
```bash
sudo nginx -t
```

### 5. Restart Nginx
Restarts Nginx to apply the new configuration.
```bash
sudo systemctl restart nginx
```

---

## Step 6: Configure Firewall (CRITICAL for Oracle Cloud)

Oracle Cloud VPS instances have two layers of firewalls: OS-level (`iptables`/`ufw`) and network-level (Oracle Security Lists). **You must configure both.**

### Layer A: OS-Level Firewall (Ubuntu)
Oracle Cloud's Ubuntu images come with pre-configured `iptables` rules that block all incoming traffic except SSH. Even if you use `ufw`, these `iptables` rules take precedence. 

Run the following commands to insert rules allowing HTTP (port 80) and HTTPS (port 443) traffic, and save them:

```bash
# Allow HTTP (Port 80) traffic
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT

# Allow HTTPS (Port 443) traffic
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT

# Save the rules so they persist after reboot
sudo netfilter-persistent save
```

### Layer B: Network-Level Firewall (Oracle Cloud Console)
You must permit traffic to reach your VPS via the Oracle Cloud web interface:
1. Open the **Oracle Cloud Console**.
2. Go to **Compute** -> **Instances** -> Click on your instance name.
3. Under **Instance details**, click on your **Primary VNIC**'s subnet link.
4. Click on the **Security List** for the subnet (usually "Default Security List for...").
5. Click **Add Ingress Rules** and add the following two rules:

#### Ingress Rule for HTTP:
- **Source Type**: `CIDR`
- **Source CIDR**: `0.0.0.0/0`
- **IP Protocol**: `TCP`
- **Source Port Range**: `All` (leave blank)
- **Destination Port Range**: `80`
- **Description**: `Allow HTTP traffic`

#### Ingress Rule for HTTPS:
- **Source Type**: `CIDR`
- **Source CIDR**: `0.0.0.0/0`
- **IP Protocol**: `TCP`
- **Source Port Range**: `All` (leave blank)
- **Destination Port Range**: `443`
- **Description**: `Allow HTTPS traffic`

---

## Step 7: Verification

To verify that your deployment is working perfectly:
1. Open your browser and navigate to your VPS public IP address: `http://<YOUR_VPS_IP>`
2. Test the API directly by visiting: `http://<YOUR_VPS_IP>/api/health`
   - It should return: `{"status":"ok","service":"ordinary-tools-api"}`

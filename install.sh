#!/bin/bash


# Specify the path to the zip file
ZIP_FILE="/tmp/Yuvaraj_dalavai_002789615_03.zip"

# Specify the destination directory for extraction
DEST_DIR="/opt/webapp/"

# Update the package list to get the latest package information
sudo apt-get update

sudo apt-get upgrade -y

# Install Node.js and npm
sudo apt-get install -y nodejs npm

sudo apt-get install mysql-client

# Install unzip
sudo apt-get install -y unzip

sudo groupadd csye6225
sudo useradd -s /bin/false -g csye6225 -d /opt/csye6225 -m csye6225


# Unzip the file to the destination directory
sudo unzip "$ZIP_FILE" -d "$DEST_DIR"

sudo chmod 655 "/opt/webapp"

cd /opt/webapp

sudo npm install

cat > /etc/systemd/system/webapp.service <<EOF
[Unit]
Description=Webapp Service
After=network.target

[Service]
Type=simple
User=csye6225
WorkingDirectory=/opt/webapp
ExecStart=/usr/bin/node /opt/webapp/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start webapp.service
sudo systemctl enable webapp.service

sudo apt-get clean



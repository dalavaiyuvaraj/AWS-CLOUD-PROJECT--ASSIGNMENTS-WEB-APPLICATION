#!/bin/bash


# Specify the path to the zip file
ZIP_FILE="/tmp/webapp.zip"

# Specify the destination directory for extraction
DEST_DIR="/opt/csye6225/webapp/"

# Update the package list to get the latest package information
sudo apt-get update

sudo apt-get upgrade -y

# Install Node.js and npm
sudo apt-get install -y nodejs npm

# Install unzip
sudo apt-get install -y unzip

sudo groupadd csye6225
sudo useradd -s /bin/false -g csye6225 -d /opt/csye6225 -m csye6225

sudo mkdir "/opt/csye6225/webapp"
# Unzip the file to the destination directory
sudo unzip "$ZIP_FILE" -d "$DEST_DIR"

cd "/opt/csye6225/webapp"

sudo npm install

sudo chown -R csye6225:csye6225 .
sudo chmod -R 755 .

sudo mv "/opt/csye6225/webapp/webapp.service" "/etc/systemd/system/"

sudo systemctl enable webapp.service
sudo systemctl start webapp.service

sudo apt-get clean



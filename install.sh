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
sudo apt-get install -y curl

# Install unzip
sudo apt-get install -y unzip

sudo curl -o amazon-cloudwatch-agent.deb https://amazoncloudwatch-agent.s3.amazonaws.com/debian/amd64/latest/amazon-cloudwatch-agent.deb

sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

sudo touch cloudwatch-config.json

sudo chmod 777 cloudwatch-config.json

sudo cat <<EOF > cloudwatch-config.json
{
    "agent": {
        "metrics_collection_interval": 10,
        "logfile": "/var/logs/amazon-cloudwatch-agent.log"
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/opt/csye6225/webapp/logs/csye6225.log",
                        "log_group_name": "csye6225",
                        "log_stream_name": "webapp"
                    }
                ]
            }
        },
        "log_stream_name": "cloudwatch_log_stream"
    },
    "metrics":{
      "metrics_collected":{
         "statsd":{
            "service_address":":8125",
            "metrics_collection_interval":10,
            "metrics_aggregation_interval":10
            }
        }
    }
}
EOF

sudo mv cloudwatch-config.json /opt/aws/amazon-cloudwatch-agent/bin/

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

sudo systemctl enable autosys
sudo systemctl start autosys

sudo apt-get clean



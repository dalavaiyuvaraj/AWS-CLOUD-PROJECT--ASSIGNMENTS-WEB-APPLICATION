Prerequisites for building and deploying your application locally.

Hello

Hi
hello

hello

# to enter into debian
ssh -i "C:\Users\Yuvaraj\.ssh\digitalocean" root@161.35.98.11

# create a path to insert the file 
create a directory - mkdir directory_name

# open in new terminal
#to add to debain 
scp -i "C:\Users\Yuvaraj\.ssh\digitalocean" "file_name.zip" root@161.35.98.11:/path

# to install unzip
sudo apt install unzip
unzip file_name.zip

# to install nodejs
sudo apt install nodejs npm

# to install mariadb
sudo apt install mariadb-server

# to enter into maria db
mysql -u root -p

# change it to mysql
use mysql;

# to install curl
sudo apt install curl

# to start running
pm2 start index.js

# Update package lists and upgrade installed packages
sudo apt update
sudo apt upgrade -y

# Check if Node.js is installed; if not, install it
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing..."
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js has been installed."
else
    echo "Node.js is already installed."
fi

# Check if npm is installed; if not, install it
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Installing..."
    sudo apt-get install -y npm
    echo "npm has been installed."
else
    echo "npm is already installed."
fi


# Install project dependencies (if package.json exists)
if [ -f "package.json" ]; then
    echo "Installing project dependencies..."
    npm install
    echo "Project dependencies have been installed."
fi

# Run your Node.js file
echo "Running your Node.js file..."
npm start

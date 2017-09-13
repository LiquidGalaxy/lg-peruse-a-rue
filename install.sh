#!/bin/bash

# API installation / upgrade script for Liquid Galaxy.

TARGET_DIR="$HOME/peruse"
SOURCE_CODE="https://github.com/AutoScout24/lg-peruse-a-rue"

if [ "$EUID" -eq 0 ]
  then echo "Do not run as root!"
  exit
fi

apache2=$(which apache2)
if [ "$apache2" = "" ]; then
  echo "Apache2 installation was not found. Make sure you are running this script on the Liquid Galaxy master."
  exit;
fi

# Apache port.
echo "NameVirtualHost *:99" | sudo tee -a /etc/apache2/ports.conf > /dev/null
echo "Listen 99" | sudo tee -a /etc/apache2/ports.conf > /dev/null

# peruse Apache configuration.
sudo a2enmod proxy proxy_http rewrite
sudo tee "/etc/apache2/sites-available/peruse.conf" > /dev/null << EOM
<VirtualHost *:99>
	
	ProxyRequests off

	<Proxy *>
		Order deny,allow
		Allow from all
	</Proxy>

	<Location />	
		ProxyPass http://localhost:8086/
		ProxyPassReverse http://localhost:8086/
	</Location>
</VirtualHost>
EOM
sudo a2ensite peruse.conf

sudo /etc/init.d/apache2 reload

sudo iptables -I INPUT 1 -p tcp --dport 99 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables.conf > /dev/null

curl -sL https://deb.nodesource.com/setup_8.x | sudo bash -
sudo apt-get install -qq nodejs
sudo npm install pm2 -g

if [ -d "$TARGET_DIR" ]; then
	pm2 delete peruse
else
	git clone $SOURCE_CODE $TARGET_DIR # New installation -> clone source code repository.
fi
(
  cd "$TARGET_DIR"
	git pull
  npm install
  pm2 --name peruse start npm -- start
	pm2 save
)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "$(whoami)" --hp "/home/$(whoami)"

echo "You're all set!"

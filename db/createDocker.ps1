docker rm HardwareBaySQL

docker run --rm --name HardwareBaySQL -v ./init.sql:/sql/init.sql -v ./setupdb.sh:/script/setupdb.sh -e MYSQL_ROOT_PASSWORD="HardwareBay" -d mariadb:latest .\init.sql .\setupdb.sh

docker exec -it HardwareBaySQL /bin/bash -c "./setupdb.sh"

sh kill_port3000.sh && kill %1
cd .. && sudo ts-node ./src/index.ts && cd .env && pkill -x sh start_debug.sh

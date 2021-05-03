# 실행
```
ts-node ./src/index.ts
```

# install
```
curl -sL https://deb.nodesource.com/setup_15.x | sudo -E bash - && \
git clone https://github.com/Mins97/Mins97-campustaxi-nodejs.git campustaxi-nodejs && \
cd campustaxi-nodejs &&  \
npm install --save react react-dom @types/react @types/react-dom && \
npm install && \
mkdir pages && \
sudo npm install -g ts-node
```

## !설정 파일 옮겨야함
```
firebase
ㄴ firebaseConfig.json
ㄴ serverKey.json

mysql
ㄴ secrets_nodejs.json
```
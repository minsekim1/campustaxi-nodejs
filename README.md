# 설치
	git clone "git주소" && npm install
# 기본 실행 명령어
	디버깅 : ts-node ./src/index.ts 또는 cd .env && sh start_debug.sh
	(반드시 서버 아이피를 확인후 localhost:3000 포트처럼 campustaxi react native / constants.tsx에서 socketURL를 바꾸세요. 그래도 안되면 포트포워딩 확인.)
	
	aws 배포 : 로컬에서 git push 후에 aws 우분투에서 git pull && cd .env && sudo sh kill_pm2.sh && sh start_release.sh 
	(aws 우분투는 반드시 sudo sh start_release.sh 후에 sudo sh monitor.sh로 해야지 올바르게 로그가 보인다)

	// *** 중요 *** nodejs 서버 및 불변 변수 설정하는 파일. 외부서버 연동 주소를 바꾸려면 socketURL의 ["AWSnodejsLoadBanlancer"] 이거를 바꾸면 된다.
	권한 문제 시: *sudo* sh start_release.sh 
# .env 설명
.env는 테스트 및 실행하기 위해서 있는 폴더입니다.
cd .env && sh start_debug.sh 처럼 사용하시면됩니다.
(permition 권한 문제가 있을 경우 sudo sh start_debug.sh를 사용하세요.)

# 각 파일별 설명(.env)
├── gitupload.sh //sh gitupload.sh "커밋내용" 커밋 빠르게 전송하기위한 단축 명령어
├── kill_pm2.sh //기본 start_release.sh 실행시 pm2로 배포됩니다. 배포된 서버를 종료시켜주기 위한 명령어.
├── kill_port3000.sh //기본 start_debug.sh 실행시 port 3000으로 할당됩니다. 테스트용 서버를 종료시켜주기 위한 명령어.
├── log.sh //현재 안씀
├── monitor.sh //start_release.sh 실행시 pm2의 로그를 확인하기 위한 모니터(감시) 명령어
├── ngrok //현재 안씀
├── redis_client //redis 설명문1
├── reids_server //redis 설명문2
├── start_debug.sh //실행명령어 로컬에서 돌려야하고 Reacte native constants.tsx socketURL 아이피를 적절하게 바꾸어줘야 로그를 확인할 수 있다.
├── start_release.sh //aws배포 명령어 aws우분투로 직접 접속후에 서버를 돌릴때 사용하는 명령어다. aws 우분투에 접속해야되므로 이동원(3chamchi)에게 문의.
├── start_test.sh //현재안씀

# 각 파일별 설명(메인 소스코드)

├── index.ts //실제 구동하는 파일, 가장 처음 실행되고 가장 중요하다.
├── module
│   ├── api
│   │   ├── api.ts //api 만든곳. REST API는 index.ts , premium.ts api.ts 세곳에 퍼져있다. 그외에는 aws-django(이동원-3chamchi) 쪽 api를 사용한다.
│   │   └── api_sql.ts //api sql문만 따로 보관
│   ├── chat
│   │   └── passhost.ts
│   ├── premium
│   │   └── premium.ts //프리미엄(결제 등) 관련
│   └── socket
│       └── socket.ts //소켓관련

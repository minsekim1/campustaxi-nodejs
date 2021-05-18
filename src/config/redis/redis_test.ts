import * as rc from "./redis";

const l = (...args: string[]) => {
	args.map((msg: string) => {
		console.log(msg)
	})
}
rc.setUser('campustaxiadmin','asds','tokid')
rc.getUserAll('campustaxiadmin').then(b=>console.log('boo',b))

//1초 뒤 종료
setTimeout((function() {
    return process.exit(22);
}), 100);
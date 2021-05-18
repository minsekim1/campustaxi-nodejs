// import * as rc from "./redis";

export const l = (...args: string[]) => {
	let msg = new Date().toLocaleString() +"\\";
	args.map(arg=>msg = msg.concat(arg)+"\\")
	console.log(msg)
}
// rc.setUser('campustaxiadmin', 'soc', 'toc')
// rc.getUserAll('campustaxiadmin').then(b=>console.log('boo',b))

// l('asd','asd','asd')
// //1초 뒤 종료
// setTimeout((function() {
//     return process.exit(22);
// }), 100);
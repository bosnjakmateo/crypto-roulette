const schedule = require("node-schedule")

var rule = new schedule.RecurrenceRule()
rule.second = [new schedule.Range(0, 59)]

var j = schedule.scheduleJob(rule, async function(){
	let balance = await promisify(res => contract.balanceOfPool(res))

	if(balance != 0){
		//console.log(parseInt(balance.c))
		io.emit("time", 1)
	}
	//console.log(balance)
  console.log('1 second');
})
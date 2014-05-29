var spawn = require('child_process').spawn

module.exports = function(file) {
	var args  = ['svn', 'blame', file]
	var child = platformSpawn(args)
	child.on('close', function(code){
		if (code !== 0) {
			console.log('command args: ', args)
		}
	})
}

function platformSpawn(args) {
	var opt = {cwd: process.cwd(), stdio: 'inherit'}
	if (process.platform == 'win32') {
		var cmdArgs = ['/C', args.join(' ')+'| FIND "" /V /N']
		console.log('CMD '+ cmdArgs.join(' '))
		return spawn('CMD', cmdArgs, opt) // Access Denied on windows pipes
	}
	return spawn('sh', ['-c', args.join(' ') + ' | cat -n'], opt)
}
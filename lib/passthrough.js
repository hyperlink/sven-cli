var spawn   = require('child_process').spawn

module.exports = passthrough

const LEGAL_COMMANDS = ['add', 'ann', 'annotate', 'blame', 'cat', 'changelist', 'checkout', 'ci', 'cl', 'cleanup', 'co', 'commit', 'copy', 'cp', 'del', 'delete', 'di', 'diff', 'export', 'import', 'info', 'list', 'lock', 'log', 'ls', 'mergeinfo', 'mkdir', 'move', 'mv', 'patch', 'pd', 'pdel', 'pe', 'pedit', 'pg', 'pget', 'pl', 'plist', 'praise', 'propdel', 'propedit', 'propget', 'proplist', 'propset', 'ps', 'pset', 'relocate', 'remove', 'ren', 'rename', 'resolve', 'resolved', 'revert', 'rm', 'st', 'stat', 'status', 'sw', 'unlock', 'up', 'update', 'upgrade']

function passthrough(command) {
	if (~LEGAL_COMMANDS.indexOf(command)) {
		var args = buildPassthroughArgs(arguments[arguments.length-1].parent.rawArgs, command)
		// console.log('Passthrough command: svn '+args.join(' '))
		var child = spawn('svn', args, {cwd: process.cwd(), stdio: 'inherit'})
		child.on('close', function(code){
			if (code !== 0) {
				console.log('command args: ', args)
			}
		})
	} else {
		console.error('Illegal SVN command '+command)
	}
}

function buildPassthroughArgs(rawArgs, command) {
	var args = []
	var append = false
	rawArgs.forEach(function(arg){
		if (arg == command) {
			append = true
		}
		if (append) {
			args.push(arg)
		}
	})
	return args
}
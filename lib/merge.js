var promptBranchesInCurrentProject = require('./branchPrompt').promptBranchInCurrentProject
var spawn                          = require('child_process').spawn

module.exports = start

function start(command) {
	promptBranchesInCurrentProject('Currently on %s merge with branch').then(function(branchUrl){
		if (branchUrl === false) return

		var args = ['merge', branchUrl]

		if (command.ignoreAncestry) {
			args.push('--ignore-ancestry')
		}
		spawn('svn', args, {cwd: process.cwd(), stdio: 'inherit'})
	})
	.catch(function(err){
		console.error('Not a working SVN directory.'.red.bold)
	})
}
var promptBranchesInCurrentProject = require('./branchPrompt').promptBranchInCurrentProject
var spawn                          = require('child_process').spawn

module.exports = start

function start() {
	promptBranchesInCurrentProject('Currently on %s merge with branch').then(function(branchUrl){
		if (branchUrl === false) return
		// detect for using --reintegrate option?
		spawn('svn', ['merge', branchUrl], {cwd: process.cwd(), stdio: 'inherit'})
	})
	.catch(function(err){
		console.error('Not a working SVN directory.'.red.bold)
	})
}
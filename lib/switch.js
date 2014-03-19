var promptBranchInCurrentProject = require('./branchPrompt').promptBranchInCurrentProject
var switchToBranch               = require('./utils').switchToBranch

module.exports = start

function start() {
	promptBranchInCurrentProject('Currently on %s switch to branch')
		.done(function(branchUrl) {
			if (branchUrl === false) {
				return
			}
			return switchToBranch(branchUrl, process.cwd())
		})
}
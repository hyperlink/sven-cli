var promptBranches = require('./branchPrompt').promptBranchesInCurrentProject
var utils          = require('./utils')
var confirmPrompt  = utils.confirmPrompt
var humanize       = require('humanize-plus')

module.exports = start

function start(message) {
	var selectedBranches
	promptBranches('Select branches to delete')
		.then(function(selected){
			if (selected.length) {
				selectedBranches = selected
				var selectedNames = selected.map(function(v){
					return v.name.bold
				})
				return confirmPrompt('Delete '+ humanize.oxford(selectedNames), false)
			} else {
				console.log('Nothing selected.')
			}
		})
		.then(function(confirmed){
			if (confirmed) {
				var toBedeletedBranches = selectedBranches.map(function(branch) {
					return branch.path
				})

				return utils.promiseSvn('delete', toBedeletedBranches, {message:message})
			}
		})
		.done(console.log, console.error)
}
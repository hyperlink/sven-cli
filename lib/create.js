var colors = require('colors')
var exec   = require('child_process').exec
var url    = require('url')

var nodefn         = require('when/node/function')

var utils          = require('./utils')
var switchToBranch = utils.switchToBranch

module.exports = createBranch

function createBranch(branchName, commitMessage) {
	var projectsConfig, destinationBranchUrl

	if (commitMessage == null) {
		commitMessage = 'Creating branch for task '+branchName
	}

	utils.getProjectInfo('Pick the project to create '+branchName.bold)
		.then(function(projectConfig) {
			if (projectConfig) {
				destinationBranchUrl = url.resolve(projectConfig.branch, branchName)
				return ['svn copy', wrap(projectConfig.trunk), wrap(destinationBranchUrl), '-m', wrap(commitMessage)].join(' ')
			} else {
				throw Error('no project config retreived')
			}
		})
		.then(function(command) {
			return nodefn.call(exec, command, {cwd: process.cwd()})
		})
		.then(function(out){
			console.log(out[0])
			if (utils.isCwdSVN()) {
				return utils.confirmPrompt('Switch to new branch?', true)
			}
		})
		.done(function(yes){
			if (yes) {
				switchToBranch(destinationBranchUrl, process.cwd())
			}
		}, console.error)
}

function wrap(str) {
	return '"'+str+'"'
}
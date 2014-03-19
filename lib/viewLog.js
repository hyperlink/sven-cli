var colors       = require('colors')
var Table        = require('cli-table')
var getBranchLog = require('./utils').getBranchLog

module.exports = function(branch){
	getBranchLog(branch ? branch : process.cwd()).done(outputLogEntry, console.error)
}

function outputLogEntry(logEntry) {
	var table = new Table({
		head  : ['Revision', 'Author', 'Message', 'When', 'Changes'].map(function(v){ return v.white }),
		style : {compact : true}
	})
	logEntry.forEach(function(log) {
		table.push([log.revision, log.author, log.message, log.when, log.changes])
	})
	console.log(table.toString())
}
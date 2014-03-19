var utils        = require('./utils')
var getBranchLog = utils.getBranchLog
var Table        = require('cli-table')
var path         = require('path')

module.exports = function(branch){

	var cwd = process.cwd()

	// TODO: check is trunk

	var revision

	if (utils.isCwdSVN()) {
		getBranchLog(cwd)
			.then(function onBranchLog(log) {
				revision = log[log.length-1].revision
				return utils.promiseSvn('diff', cwd, {'summarize': true, 'revision': revision+':HEAD'})
			})
			.done(function(output) {
				if (typeof output.diff.paths == 'string') {
					console.log('No modifications.')
				} else {
					console.log('\nModified files from revision '+revision.white+ ' to HEAD')
					var table = new Table({
						head  : ['Status', 'File'].map(function(v){ return v.white }),
						style : {compact : true}
					})

					var path = output.diff.paths.path
					var addRowToTable = addRow.bind({cwd:cwd, table: table})

					if (Array.isArray(path)) {
						path.forEach(addRowToTable)
					} else {
						addRowToTable(path)
					}
					console.log(table.toString())
				}
			}, console.error)
	} else {
		console.error('Current directoy is not a working copy')
	}
}

function addRow(file) {
	this.table.push([
		file._attribute.item,
		file._text.replace(this.cwd+path.sep, '')
	])
}
var Table  = require('cli-table')
var path   = require('path')
var colors = require('colors')
var utils  = require('./utils')
var spawn   = require('child_process').spawn

module.exports = viewModified

function viewModified(options) {
	// console.log(options)
	if (utils.isCwdSVN()) {
		var cwd = process.cwd()

		utils.promiseSvn('status', cwd, null)
			.then(massageStatusResult)
			.then(function displayPretty(entry) {
				// console.log(result.status)
				if (entry.length) {
					var table = new Table({
						head  : ['Status', 'File', 'Full Path'].map(function(v){return v.white}),
						style : {compact : true}
					})
					entry.forEach(addRow, {table: table, cwd: cwd})
					console.log(table.toString())
					!options.commit && displayTip()
					return entry
				}
				console.log('No changes.')
				return false
			})
			.then(function(entry) {
				if (entry.length && options.commit) {
					return utils.promisePrompt({
						message : 'Commit message',
						name    : 'commitMessage'
					}).then(function(ans){
						return {
							message : ans.commitMessage,
							files   : entry.map(fileMapper, {cwd: cwd})
						}
					})
				}
			})
			.done(function(commitPackage){
				if (commitPackage) {
					var args = ['commit', '--depth', 'empty' ,'-m', commitPackage.message].concat(commitPackage.files)
					var child = spawn('svn', args, {cwd: cwd, stdio: 'inherit'})
					child.on('close', function(code){
						if (code !== 0) {
							console.log('svn '+args.join(' '))
						}
					})
				}
			})
	} else {
		console.error('Current directory is not SVN working directory.'.red)
	}
}

var colorMap = {
	'modified'    : 'blue',
	'unversioned' : 'red',
	'deleted'     : 'red',
	'added'       : 'green'
}

function fileMapper(value) {
	var filePath = value._attribute.path.replace(this.cwd+path.sep, '')
	return filePath == this.cwd ? '.' : filePath
}

function displayTip() {
	console.log()
	console.log('  ProTip: Commit above changes: sven modified --commit')
	console.log()
}

function addRow(value) {
	var filePath = value._attribute.path
	this.table.push([
		render(value['wc-status']._attribute.item),
		path.basename(filePath),
		filePath.replace(this.cwd+path.sep, '')
	])
}

// Does not include entries in change-lists
function massageStatusResult(result) {
	var entry = result.status.target.entry
	if (!entry) {
		return []
	}
	return Array.isArray(entry) ? entry : [entry]
}

function render(status) {
	if (status in colorMap) {
		return status[colorMap[status]]
	}
	return status
}
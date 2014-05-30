var Table          = require('cli-table')
var path           = require('path')
var colors         = require('colors')
var utils          = require('./utils')
var spawn          = require('child_process').spawn
var getBugtraqProp = require('./bugtraq')
var when           = require('when')

module.exports = viewModified

var bugtraqNumberRegex = /^[0-9,]+$/

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

						var commitPackage = {
							message : ans.commitMessage,
							files   : entry.map(fileMapper, {cwd: cwd})
						}

						return when.join(
							getBugtraqProp('message'),
							getBugtraqProp('label'),
							getBugtraqProp('number'),
							getBugtraqProp('append'),
							getBugtraqProp('warnifnoissue'))
						.then(function(bugtraq){
							var template        = bugtraq[0]
							var label           = bugtraq[1] || 'Bug-ID / Issue-Nr:'
							var number          = bugtraq[2]
							var append          = bugtraq[3]
							var warn            = bugtraq[4]
							var containsBugtraq = ~commitPackage.message.indexOf(template.replace('%BUGID%', ''))

							if (template && !containsBugtraq && warn) {
								commitPackage.template = template
								commitPackage.append   = append

								return utils.promisePrompt({
									message  : label,
									name     : 'bugtraqID',
									validate : function(value){
										var valid = true
										if (number) {
											valid = bugtraqNumberRegex.test(value)
										}
										return value.trim() != '' && valid
									}
								})
								.then(function(ans) {
									commitPackage.bugtraqID = ans.bugtraqID
									return commitPackage
								})
							}
							return commitPackage
						})
					})
				}
			})
			.done(function(commitPackage){
				if (commitPackage) {
					var args = ['commit', '--depth', 'empty' ,'-m', buildMessage(commitPackage)].concat(commitPackage.files)
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

function buildMessage(commitPackage) {
	if (commitPackage.template) {
		var bugtraq = commitPackage.template.replace('%BUGID%', commitPackage.bugtraqID)
		if (commitPackage.append) {
			commitPackage.message += ' '+ bugtraq
		} else {
			commitPackage.message =  bugtraq +' '+ commitPackage.message
		}
	}
	return commitPackage.message
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
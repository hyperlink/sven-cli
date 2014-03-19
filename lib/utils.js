var when     = require('when')
var colors   = require('colors')
var fs       = require('fs')
var url      = require('url')
var path     = require('path')
var inquirer = require('inquirer')
var moment   = require('moment')
var spawn    = require('child_process').spawn
var svn      = require('svn-interface')
var nodefn   = require('when/node/function')

const NEWLINE_REGEX = /(\r\n|\n|\r)/gm

module.exports = {
	switchToBranch          : switchToBranch,
	isCwdSVN                : isCwdSVN,
	confirmPrompt           : confirmPrompt,
	promisePrompt           : promisePrompt,
	getBranchLog            : getBranchLog,
	promiseSvn              : promiseSvn,
	getConfig               : getConfig,
	cwdBranch               : cwdBranch,
	getProjectInfo          : getProjectInfo,
	getSvenFilePath         : getSvenFilePath,
	createInquirerSeparator : createInquirerSeparator
}

var cachedConfig
function getConfig(noCache, exitOnError) {
	exitOnError = exitOnError == null ? true : exitOnError
	if (noCache) {
		return readSvenJson(exitOnError)
	}

	if (cachedConfig) {
		return when(cachedConfig)
	}
	return readSvenJson(exitOnError)
		.then(function(config){
			cachedConfig = config
			return config
		})
}

/**
 * gets the project config from the current svn working dir otherwise prompts the user for it
 * @return {promise}
 */
function getProjectInfo(message) {
	if (isCwdSVN()) {
		return cwdBranch().then(function(result){
			return getProjectConfigFor(result.url)
		})
	}

	var projectsConfig

	return getConfig()
		.then(function(config) {
			if (config) {
				projectsConfig = config
				return createProjectChoices(config)
			}
		})
		.then(function(projects){
			return promisePrompt({
				type    : 'list',
				message : message || 'Select a project',
				name    : 'project',
				choices : projects
			})
		})
		.then(function onAnswer(ans) {
			if (ans.project == 'cancel') {
				return false
			}
			return projectsConfig[ans.project]
		})
		.catch(console.error)
}

function createProjectChoices(config) {
	var projects = []
	for(var i in config) {
		projects.push({
			name  : i.toUpperCase(),
			value : i
		})
	}
	return projects
}

//TODO: duped in branchPrompt.js
function getProjectConfigFor(url) {
	return getConfig().then(function(config) {
		for(var i in config) {
			if (~url.indexOf(i)) {
				return config[i]
			}
		}
		return null
	})
}

function cwdBranch() {
	return promiseSvn('info', process.cwd(), null).then(function(info){
		var currentBranchUrl = info.info.entry.url._text
		var parsed = url.parse(currentBranchUrl)
		return {
			name : path.basename(parsed.pathname),
			url  : currentBranchUrl,
			data : info.info.entry
		}
	})
}

function readSvenJson(exitOnError) {
	return nodefn.call(fs.readFile, getSvenFilePath())
		.then(function(jsonContent) {
			return JSON.parse(jsonContent)
	 	}, function(error) {
	 		if (error.code == 'ENOENT' && exitOnError) {
	 			console.error('Project configuration need for this command.'.red + ' Run: sven config')
	 			process.exit(1)
	 		}
	 		throw error
	 	})
}

function getSvenFilePath() {
	var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']
	return path.join(home, '.sven.json')
}

function switchToBranch(branchUrl, cwd) {
	var deferred = when.defer()
	console.log('Switching to', branchUrl.green)

	var child = spawn('svn', ['switch', branchUrl], {cwd: cwd, stdio: 'inherit'})
	child.on('close', function(code){
		if (code !== 0) {
			deferred.reject('Error code: '+ code)
		} else {
			deferred.resolve()
		}
	})
	return deferred.promise
}

function promiseSvn(method, location, options) {
	var deferred = when.defer()
	if (!svn[method]) {
		deferred.reject('unsupported svn-interface method')
	} else {
		svn[method](location, options, function(error, output){
			if (error) {
				return deferred.reject('svn-interface error '+ error)
			}
			deferred.resolve(output)
		})
	}
	return deferred.promise
}

function getBranchLog(branch) {
	return promiseSvn('log', branch, {'stop-on-copy': true, verbose: true}).then(function(output) {
		// console.log(output)
		var logEntry = output.log.logentry
		if (logEntry) {
			if (Array.isArray(logEntry)) {
				return logEntry.map(mapLogEvent)
			} else {
				return [ mapLogEvent(logEntry) ]
			}
		} else {
			console.error('log entry is empty', output.log)
		}
	})
}

function createInquirerSeparator() {
	return new inquirer.Separator
}

function mapLogEvent(logEntry) {
	var message = logEntry.msg._text
	var date    = moment(logEntry.date._text)
	var changes = 0
	if (logEntry.paths) {
		changes = Array.isArray(logEntry.paths.path) ? logEntry.paths.path.length : 1
	}

	return {
		revision : logEntry._attribute.revision,
		author   : logEntry.author._text,
		message  : (message != null) ? message.replace(NEWLINE_REGEX, '') : '',
		date     : date,
		changes  : changes,
		when     : date.fromNow()
	}
}

function isCwdSVN() {
	return fs.existsSync(path.join(process.cwd(), '.svn'))
}

function confirmPrompt(message, defaultConf) {
	return promisePrompt({
		message : message,
		type    : 'confirm',
		name    : 'confirmed',
		default : (defaultConf === undefined) ? true : defaultConf
	}).then(function(answer) {
		return answer.confirmed
	})
}

function promisePrompt(options) {
	var deferred = when.defer()
	inquirer.prompt(options, deferred.resolver.resolve)
	return deferred.promise
}

var utils  = require('./utils')
var nodefn = require('when/node/function')
var fs     = require('fs')

module.exports = function configure(options) {

	utils.getConfig(true, false)
		.done(function(config){
			if (options.add) {
				if (options.add in config) {
					console.log('Project with that key already exists.', config[options.add])
				} else {
					add(options.add)
				}
				return
			}

			if (options.remove) {
				if (options.remove in config) {
					remove(options.remove)
				} else {
					console.log('Unknown project', config)
				}
			}

			if (!options.add && !options.remove) {
				if (Object.keys(config).length) {
					console.log(config)
				} else {
					promptToAddNewKey()
				}
			}
		}, function(){
			if (options.add) {
				add(options.add)
			} else {
				promptToAddNewKey()
			}
		})
}

function promptToAddNewKey() {
	console.log('Setup Project Profile')
	promptProjectKey().done(function(key){
		add(key)
	})
}

function add(key) {
	return queryTrunkThenBranch(key)
		.then(function(result){
			return save(key, result)
		})
		.then(function(){
			console.log('Saved!')
		})
}

function promptProjectKey() {
	return utils.promisePrompt({
			message  : 'Project name',
			name     : 'name',
			validate : notBlank
		}).then(function(result){
			return result.name
		})
}

function remove(projectKey) {
	return utils.getConfig(true, false)
		.then(function(existingConfig){
			delete existingConfig[projectKey]
			return saveSvenFile(existingConfig)
		})
}

function save(projectKey, config) {
	return utils.getConfig(true, false)
		.then(function(existingConfig){
				existingConfig[projectKey] = config
				return existingConfig
			}, function() {
				var svenConfig = {}
				svenConfig[projectKey] = config
				return svenConfig
			})
		.then(function(config){
			// console.log('config save: ', config)
			return saveSvenFile(config)
		})
}

function saveSvenFile(config) {
	return nodefn.call(fs.writeFile, utils.getSvenFilePath(), JSON.stringify(config, null, '\t'))
}

function queryTrunkThenBranch(key) {
	var ret = {}
	console.log('Added new project '+key)
	return queryBranch('trunk').
		then(function(result){
			ret.trunk = result
			return queryBranch('branch')
		})
		.then(function(result){
			ret.branch = result
			return ret
		})
}

function queryBranch(name) {
	return utils.promisePrompt({
			message  : 'Full SVN path to '+name,
			name     : name,
			validate : notBlank
		}).then(function(result){
			return result[name]
		})
}

function notBlank(value) {
	return value.trim() !== ''
}
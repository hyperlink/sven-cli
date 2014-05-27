var when     = require('when')
var colors   = require('colors')
var path     = require('path')

var moment   = require('moment')
var util     = require('util')

var utils         = require('./utils')
var promisePrompt = utils.promisePrompt

const TRUNK_NAME = 'Community'
const TRUNK_VAL  = 'trunk'
const CANCEL_VAL = 'cancel'

module.exports = {
	promptBranchInCurrentProject   : promptBranchInCurrentProject,
	promptBranchesInCurrentProject : promptBranchesInCurrentProject,
	textInput                      : textInput
}

function branchPrompt(branches, message) {
	return promisePrompt({
		type    : 'list',
		message : message,
		name    : 'branch',
		choices : branches
	})
}

function branchesPrompt(branches, message) {
	return promisePrompt({
		type    : 'checkbox',
		message : message,
		name    : 'branches',
		choices : branches
	}).then(function onAnswer(ans) {
		return ans.branches
	})
}

function textInput(message) {
	return promisePrompt({
		type    : 'input',
		message : message,
		name    : 'text'
	}).then(function(ans){
		return ans.text
	})
}

function promptBranchesInCurrentProject(promptMessage) {
	var projectConfig
	return utils.getProjectInfo()
		.then(function(config){
			projectConfig = config
			return list(config.branch)
		})
		.then(function(rawBranches){
			return branchesPrompt(sortBranchesByDate(rawBranches), promptMessage)
		})
		.then(function(selectedBranches){
			return selectedBranches.map(function(branch) {
				return {
					name : branch,
					path : projectConfig.branch + branch
				}
			})
		})
}

function promptBranchInCurrentProject(promptFormat) {
	var isTrunk, cwdResult, projectConfig
	return utils.cwdBranch()
		.then(function(result) {
			cwdResult = result
			return utils.getProjectConfigFor(result.url)
		})
		.then(function(config) {
			if (config == undefined) {
				throw new Error('Unable to match a config based on URL '+ cwdResult.url)
			}
			isTrunk = cwdResult.url == config.trunk
			projectConfig = config
			return list(config.branch)
		})
		.catch(function(){
			return utils.getProjectInfo()
				.then(function(config){
					isTrunk = false
					projectConfig = config
					return list(config.branch)
				})
		})
		.then(function(rawBranches) {
			if (rawBranches != null) {
				if (!Array.isArray(rawBranches)) {
					rawBranches = [rawBranches]
				}
				var branches = sortBranchesByDate(rawBranches).filter(function(item){
					return encodeURIComponent(item.value) != cwdResult.name
				})

				!isTrunk && prependTrunkItem(branches)
				appendCancel(branches)
				var currentBranchName = isTrunk ? TRUNK_NAME : cwdResult.name
				return branchPrompt(branches, util.format(promptFormat, decodeURIComponent(currentBranchName).bold.white))
			} else {
				console.log('No branches found. To create one use: sven create <branch>')
			}
		})
		.then(function(ans){
			if (ans == null || ans.branch == CANCEL_VAL) {
				return false
			}
			if (ans.branch == TRUNK_VAL) {
				return projectConfig.trunk
			}
			return projectConfig.branch + ans.branch
		})
}

function sortBranchesByDate(data) {
	return data.sort(compare).map(function(item){
		return {
			value : item.name._text,
			name  : [item.name._text,' (', moment(item.commit.date._text).fromNow(), ')'].join('')
		}
	})
}

function appendCancel(arr) {
	var sep = utils.createInquirerSeparator()
	arr.push(sep, {value: CANCEL_VAL, name: 'Cancel'}, sep)
}

function prependTrunkItem(arr) {
	return arr.unshift({
		value : TRUNK_VAL,
		name  : TRUNK_NAME
	})
}

function list(branch) {
	return utils.promiseSvn('list', branch, {}).then(function(result){
		return result.lists.list.entry
	})
}

function compare(item1, item2) {
	var date1 = getDate(item1)
	var date2 = getDate(item2)
	if (date1 < date2) {
		return 1
	}
	if (date1 > date2) {
		return -1;
	}
	return 0
}

function getDate(item) {
	return +new Date(item.commit.date._text)
}
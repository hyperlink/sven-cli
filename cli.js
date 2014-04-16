#!/usr/bin/env node

var program      = require('commander')
var pjson        = require('./package.json')

var switchBranch   = require('./lib/switch')
var merge          = require('./lib/merge')
var createBranch   = require('./lib/create')
var viewModified   = require('./lib/viewModified')
var viewLog        = require('./lib/viewLog')
var viewHistory    = require('./lib/viewHistory')
var passthrough    = require('./lib/passthrough')
var deleteBranches = require('./lib/deleteBranches')
var config         = require('./lib/config')
var updateNotifier = require('update-notifier')

var utils = require('./lib/utils')

var notifier = updateNotifier()
if (notifier.update) {
    notifier.notify()
}

program
	.version(pjson.version)
	.command('create <branch> [msg]')
	.description('Create & switch to <branch> with optional commit [msg]')
	.action(createBranch)

program
	.command('delete <msg>')
	.description('Delete selected branches with commit <msg>')
	.action(deleteBranches)

program
	.command('switch')
	.description('Switch current working copy to another branch (Default)')
	.action(switchBranch)

program
	.command('modified')
	.option('-c, --commit [msg]', 'commit the changes to modified files with optional [msg]')
	.description('View modified files in working directory (pretty svn status)')
	.action(viewModified)

program
	.command('log [file]')
	.description('View log entires (up until copy) for current working copy')
	.action(viewLog)

program
	.command('history')
	.description('Shows history of all files changed in the current branch')
	.action(viewHistory)

program
	.command('merge')
	.description('Merge current working copy with another branch')
	.action(merge)

program
	.command('config')
	.option('-a, --add <project>', 'Add project <project>')
	.option('-r, --remove <project>', 'Remove project <project>')
	.description('Add or display project profile')
	.action(config)

program
	.command('*')
	.description('Unrecognized commands are passed through to SVN as a subcommand')
	.action(passthrough)

program.on('--help', function(){
	console.log('  Subcommand help examples:')
	console.log('')
	console.log('    $ sven modified --help')
	console.log('    $ sven config -h')
	console.log('')
})

program.parse(process.argv)

if (program.args.length == 0) {
	if (utils.isCwdSVN()) {
		switchBranch()
	} else {
		program.help()
	}
}
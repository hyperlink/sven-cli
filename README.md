# SVEN is Subversion Enhanced Now

**TLDR; SVN command line with delicious sugar on top.**

![](https://dl.dropboxusercontent.com/u/4721128/screenshots/sven_create_and_switch.gif)

[![NPM](https://nodei.co/npm/sven.png)](https://nodei.co/npm/sven/)

## Features

* Aware of your projects and allows you to quickly switch between your personal branches
* Show modified files in a pretty table format
* Shows log (in branch) in a pretty table format
* Create new branches with an option to switch to that branch automatically
* Easily delete your personal branches in bulk
* svn blame with line numbers
* Non-Sven commands are passed through to SVN so you can use SVEN like SVN
* Supports commit integration with [bug/issue trackers](http://tortoisesvn.net/docs/release/TortoiseSVN_en/tsvn-dug-bugtracker.html) when used in conjunction with `sven modified -c`

## Prerequisites

1. Node.Js is installed and in your path
2. SVN command line is installed and in your path

## Installation

	npm install sven -g
	
## Setup

Sven is vastly more useful when it's aware of your projects. To set this up you will need to provide sven with project name path to your trunk and branches. You can do this through `sven config` subcommand.

To add a new project XYZ:

* `sven config -a XYZ`
* Follow the prompts

	  Usage: config [options]

	  Options:

	    -h, --help              output usage information
	    -a, --add <project>     Add project <project>
	    -r, --remove <project>  Remove project <project>


### Manually

You can manually set this up by adding `.sven.json` file to your home directory with the following format

	{
		"XYZ": {
			"trunk": "https://myrepo/svn/XYZ/community/carma",
			"branch": "https://myrepo/svn/XYZ/developers/xiaoxin/"
		},
		"abc": {
			"trunk": "https://myrepo/svn/abc/community/web",
			"branch": "https://myrepo/svn/abc/developers/xiaoxin/"
		}
	}

## License MIT

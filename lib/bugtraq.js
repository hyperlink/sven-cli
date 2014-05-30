var exec   = require('child_process').exec
var nodefn = require('when/node/function')

var booleanPropDefaults = {
	warnifnoissue : false,
	number        : true,
	append        : true
}

module.exports = getBugtraqProp

function svnPropget(property) {
	return nodefn.call(exec, 'svn propget '+property, {cwd: process.cwd})
}

function getBugtraqProp(property) {
	return svnPropget('bugtraq:'+ property)
		.then(function(ret){
			var result = ret[0]
			if (property in booleanPropDefaults) {
				if (result == null || !result.trim()) {
					return booleanPropDefaults[property];
				}
				return result.trim() === 'true'
			}
			return typeof result == 'string' ? result.trim() : result
		})
}
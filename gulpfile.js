var gulp       = require('gulp')
var jsValidate = require('gulp-jsvalidate')

var scripts = 'lib/**/*.js'

gulp.task('default', function() {
	gulp.src(scripts).pipe(jsValidate()).on('error', console.error)
})

gulp.task('watch', function(){
	gulp.watch(scripts, ['default'])
})
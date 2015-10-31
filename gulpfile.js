var gulp = require('gulp'),
	concat = require('gulp-concat'),
	ngdocs = require('gulp-ngdocs'),

	vendorJS 	= [
				'bower_components/angular/angular.js',
				'bower_components/angular-route/angular-route.js',
				'bower_components/angular-bootstrap/ui-bootstrap.js'];

gulp.task('vendor_scripts', function() {
  gulp.src(vendorJS)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('assets'));
});


gulp.task('default', ['vendor_scripts']);

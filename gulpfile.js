var gulp = require('gulp'),
	concat = require('gulp-concat'),
	ngdocs = require('gulp-ngdocs'),

	config = {
    	sassPath: 'assets/sass',
    	bowerDir: 'bower_components/'
	},

	vendorJS 	= [
				config.bowerDir + 'angular/angular.js',
				config.bowerDir + 'angular-route/angular-route.js',
				config.bowerDir + 'angular-bootstrap/ui-bootstrap.js'];

	vendorCSS 	= [
				config.bowerDir + 'bootstrap/dist/css/bootstrap.min.css',
				config.bowerDir + 'font-awesome/css/font-awesome.min.css'];

gulp.task('vendor_scripts', function() {
  return gulp.src(vendorJS)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('assets'));
});

gulp.task('vendor_styles', function() {
  return gulp.src(vendorCSS)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('assets/css'));
});

gulp.task('vendor_fonts', function() {
    return gulp.src(config.bowerDir + '/font-awesome/fonts/**.*')
        .pipe(gulp.dest('assets/fonts'));
});

gulp.task('default', ['vendor_scripts', 'vendor_styles', 'vendor_fonts']);

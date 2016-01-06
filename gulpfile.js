var gulp = require('gulp'),
	concat = require('gulp-concat'),
	ngdocs = require('gulp-ngdocs'),

	config = {
    	sassPath: 'public/sass',
    	bowerDir: 'bower_components/'
	},

	vendorJS 	= [
		config.bowerDir + 'angular/angular.js',
		config.bowerDir + 'angular-route/angular-route.js',
		config.bowerDir + 'angular-media-player/dist/angular-media-player.js',
		config.bowerDir + 'angular-bootstrap/ui-bootstrap-tpls.js',
		config.bowerDir + 'angular-animate/angular-animate.js'],

	vendorCSS 	= [
		config.bowerDir + 'bootstrap/dist/css/bootstrap.min.css',
		config.bowerDir + 'font-awesome/css/font-awesome.min.css'],

	vendorFonts = [
		config.bowerDir + '/font-awesome/fonts/**.*',
		config.bowerDir + '/bootstrap/fonts/**.*'],

	clientJS = [
		'client.js',
		'client/**.js'];

gulp.task('vendor_scripts', function() {
	return gulp.src(vendorJS)
		.pipe(concat('vendor.js'))
		.pipe(gulp.dest('public/js'));
});

gulp.task('client_scripts', function() {
	return gulp.src(clientJS)
		.pipe(concat('calc.js'))
		.pipe(gulp.dest('public/js'));
});

gulp.task('vendor_styles', function() {
	return gulp.src(vendorCSS)
		.pipe(concat('vendor.css'))
		.pipe(gulp.dest('public/css'));
});

gulp.task('vendor_fonts', function() {
	return gulp.src(vendorFonts)
		.pipe(gulp.dest('public/fonts'));
});


gulp.task('watch', function() {
  gulp.watch('client.js', ['client_scripts']);
  gulp.watch('client/*.js', ['client_scripts']);
});

gulp.task('default', [
	'vendor_scripts', 
	'client_scripts', 
	'vendor_styles', 
	'vendor_fonts', 
	'watch']);


var gulp = require('gulp');
var markdown = require('gulp-markdown');
var through = require('through2');

markdown.marked.setOptions({
  renderer: new markdown.marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

function addHeaderAndFooter() {
    return through.obj(function (file, enc, cb) {
            // read and modify file contents
            file.contents = new Buffer('<!doctype html><html><head><meta charset="utf-8"/></head><body>' 
                                        + String(file.contents) 
                                        + '</body></html>');
            // if there was some error, just pass as the first parameter here
            cb(null, file);
        });
    }

gulp.task('markdown', function() {
    return gulp.src('*.md')
        .pipe(markdown())
        .pipe(addHeaderAndFooter())  
        .pipe(gulp.dest(function(f) {           
            return f.base;
        }));
});

gulp.task('default', function() {
    gulp.watch('*.md', ['markdown']);
});
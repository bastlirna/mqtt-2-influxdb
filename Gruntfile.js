module.exports = function (grunt) {

  //require('time-grunt')(grunt);
  require('jit-grunt')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    /*
        // get GIT hash 
        githash: {
            main: {
              options: {},
            }
          },
    */
    // copy static files
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: '*.ini',
            dest: 'dist/'
          }
        ]
      }
    },
    /*
        // add version info to index.html
        'string-replace': {
          inline: {
            files: {
              'dist/index.html': 'src/index.html',
            },
            options: {
              replacements: [ 
                {
                  pattern: '$VERSION$',
                  replacement: '<%= pkg.version %>'
                }
              ]
            }
          }
        },
    */
    // compile babel JS files
    babel: {
      options: {
        sourceMap: false,
        presets: ['es2015']
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: ['**/*.js'],
            dest: 'dist/'
          }
        ]
      }
    },
    /*
        // publish package
        compress: {
          main: {
            options: {
              archive: 'pub/wall-<%= pkg.version %>-<%= githash.main.short %>.zip'
            },
            files: [
              {
                cwd: 'dist/',
                src: ['**'], 
                dest: 'wall-<%= pkg.version %>/',
                expand: true
              }
            ]
          }
        },
    */


    update_json: {
      // set some task-level options
      options: {
        indent: '\t'
      },
      // update bower.json with data from package.json
      pkg: {
        src: 'package.json',
        dest: 'dist/package.json',
        // the fields to update, as a String Grouping
        fields: {
          'name': null,
          'version': null,
          "description": null,
          "author": null,
          "repository": null,
          "main": null,
          "scripts": null,
          "dependencies": null,
          "engines": null,
          "license": null
        }
      }
    }


  });

  //grunt.loadNpmTasks('grunt-githash');

  grunt.registerTask('build', ['copy', 'babel', 'update_json']);
  //grunt.registerTask('pub', ['build', 'githash', 'compress']);
  grunt.registerTask('default', ['build']);
};

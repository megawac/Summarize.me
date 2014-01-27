/* jshint es3:false */
'use strict';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({
    port: LIVERELOAD_PORT
});
var mountFolder = function(connect, dir) {
    return connect.static(require('path').resolve(dir));
};

module.exports = function(grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        meta: {
            banner: [
                '/** <%= pkg.name %> v<%= pkg.version %>',
                ' * Authors: <% _.each(pkg.authors, function(author) { %><%= author.name %> (<%= author.link %>) <% }); %>',
                ' * I recommend making changes to the LESS rather than this css',
                ' */'
            ].join('\n')
        },

        watch: {
            less: {
                files: 'less/{,*/}*.less',
                tasks: ['less']
            },
            livereload: {
                options: {
                    livereload: LIVERELOAD_PORT
                },
                files: [
                    'summary-dev.html',
                    'css/{,*/}*.css',
                    'js/{,*/}*.js'
                ]
            },
            lite: {
                options: {
                    livereload: LIVERELOAD_PORT
                },
                files: [
                    'dummy.xxx'
                ]
            }
        },

        connect: {
            options: {
                port: 9000,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    middleware: function(connect) {
                        return [
                            lrSnippet,
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, '')
                        ];
                    }
                }
            }
        },
        open: {
            server: {
                path: 'http://localhost:<%= connect.options.port %>/summary-dev.html'
            }
        },


        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'js/*.js',
                '!js/vendor/*'
            ]
        },

        csslint: {
            options: {
                csslintrc: 'less/.csslintrc'
            },
            src: ['css/**.css']
        },

        csscomb: {
            sort: {
                options: {
                    config: 'less/.csscomb.json'
                },
                files: {
                    'css/bootstrap.css': 'css/bootstrap.css'
                }
            }
        },

        cssmin: {
            options: {
                keepSpecialComments: 1
            },
            bs: {
                files: {
                    'css/bootstrap.css': ['css/bootstrap.css']
                }
            }
        },

        less: {
            options: {
                compile: true,
                strictMath: true,
                ieCompat: true
            },
            bootstrap: {
                files: {
                    'css/bootstrap.css': ['less/bootstrap/bootstrap.less']
                }
            },
            summarize: {
                files: {
                    'css/summarize.css': ['less/summarize.less']
                }
            }
        },

        autoprefixer: {
            options: {
                browsers: ['ie > 7', 'firefox > 3', 'chrome > 5', 'safari > 3', 'Opera > 10', 'bb > 10', 'iOS > 10'] //me mother still use some of these (ios 11)
            },
            summarize: {
                src: 'css/summarize.css',
                dest: 'css/summarize.css'
            }
        },

        htmlbuild: {
            build: {
                src: 'summary-dev.html',
                dest: 'index.html',
                options: {
                    beautify: false
                }
            }
        },

        autoshot: {
            'default_options': {
                options: {
                    // necessary config
                    path: 'screenshots/',
                    filename: '',
                    type: 'PNG',
                    // optional config, must set either remote or local
                    remote: 'http://localhost:<%= connect.options.port %>',
                    viewport: ['320x480', '480x320', '384x640', '640x384', '602x963', '963x602', '600x960', '960x600', '800x1280', '1280x800', '768x1024', '1024x768']
                }
            }
        }
    });

    grunt.registerTask('server', function(target) {
        var type = 'livereload:less';
        if (target === 'dist') {
            return grunt.task.run(['build', 'open', 'connect:dist:keepalive']);
        } else if(target === 'lite') {
            type = 'lite';//dont swarm the api
        }

        grunt.task.run([
            'default',
            'connect:livereload',
            'open:server',
            'watch:' + type
        ]);
    });

    // on watch events configure jshint:all to only run on changed file
    grunt.event.on('watch', function(action, filepath) {
        grunt.config('jshint.all.src', filepath);
    });

    grunt.registerTask('test', ['jshint']);

    grunt.registerTask('@build', ['test', 'less', 'csscomb', 'csslint', 'autoprefixer']);
    grunt.registerTask('build', ['@build', /*'cssmin',*/ 'htmlbuild']);

    grunt.registerTask('default', ['@build']);

    grunt.registerTask('screenshots', [
        'connect:livereload',
        'autoshot'
    ]);

};

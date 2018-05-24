module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            all: ['dist/**', 'dist/*.*'],
            image: 'dist/images',
            css: 'dist/css',
            html: 'dist/**/*'
        },
        concat: {
            js: {
                src: [
                    'libs/VitoGIS.js',

                    'js/core/VitoGIS.js',
                    'js/core/VitoGIS.ConfigManager.js',
                    'js/core/VitoGIS.Proto.js',
                    'js/core/VitoGIS.MapHandler.js',
                    'js/core/VitoGIS.MapManager.js',
                    'js/core/VitoGIS.Query.js',
                    'js/core/VitoGIS.LayerManager.js',
                    'js/core/VitoGIS.Draw.js',
                    'js/core/VitoGIS.Transaction.js',
                    'js/core/VitoGIS.WidgetsInit.js'
                ],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                mangle: false, //不混淆变量名
                preserveComments: false, //不删除注释，还可以为 false（删除全部注释），some（保留@preserve @license @cc_on等注释）
                footer:'\n/*! <%= pkg.name %> 最后修改于： <%= grunt.template.today("yyyy-mm-dd") %> */'//添加footer
            },
            dist: {
                src: 'dist/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'libs', src: ['**.css'], dest: 'dist'},
                    {expand: true, cwd: 'libs', src: ['images/**'], dest: 'dist'},
                    {expand: true, cwd: 'js', src: ['widgets/**'], dest: 'dist'}


                    //{expand: true, cwd: 'js', src: ['core/**'], dest: 'E:\\GFWorkSpace\\EclipseWS\\DDS_part\\web\\framework\\vitogis\\js\\base\\',flatten: true, filter: 'isFile'},
                    //{expand: true, cwd: 'js', src: ['core/**'], dest: 'E:\\GFWorkSpace\\EclipseWS\\DDS2.0\\web\\framework\\vitogis\\js\\base\\',flatten: true, filter: 'isFile'},
                    //
                    ////{expand: true, cwd: 'js', src: ['widgets/**'], dest: 'E:\\GFWorkSpace\\EclipseWS\\DDS_part\\web\\framework\\vitogis\\js\\'},
                    ////{expand: true, cwd: 'js', src: ['widgets/**'], dest: 'E:\\GFWorkSpace\\EclipseWS\\DDS2.0\\web\\framework\\vitogis\\js\\'},
                    //
                    //{expand: true, cwd: 'libs', src: ['**.js'], dest: 'E:\\GFWorkSpace\\EclipseWS\\DDS_part\\web\\framework\\vitogis\\libs\\',flatten: true, filter: 'isFile'},
                    //{expand: true, cwd: 'libs', src: ['**.js'], dest: 'E:\\GFWorkSpace\\EclipseWS\\DDS2.0\\web\\framework\\vitogis\\libs\\',flatten: true, filter: 'isFile'},
                    //
                    //{expand: true, cwd: 'build', src: ['**'], dest: 'E:\\GFTools\\apache-tomcat-7.0\\webapps\\BaiduPublish\\Framework\\build\\'},
                    //{expand: true, cwd: 'dist', src: ['**'], dest: 'E:\\GFTools\\apache-tomcat-7.0\\webapps\\BaiduPublish\\Framework\\dist\\'},
                    //{expand: true, cwd: 'image', src: ['**'], dest: 'E:\\GFTools\\apache-tomcat-7.0\\webapps\\BaiduPublish\\Framework\\image\\'},
                    //{expand: true, cwd: 'libs', src: ['**'], dest: 'E:\\GFTools\\apache-tomcat-7.0\\webapps\\BaiduPublish\\Framework\\libs\\'},
                    //{expand: true, cwd: 'js', src: ['widgets/**'], dest: 'E:\\GFTools\\apache-tomcat-7.0\\webapps\\BaiduPublish\\Framework\\dist\\'},

                    // {expand: true, cwd: 'libs', src: ['**'], dest: 'E:\\GFTools\\apache-tomcat-7.0\\webapps\\VitoGISFramework\\libs\\'}
                ]
            },
            vitoGISApi: {
                files: [
                    {expand: true, cwd: 'vitoGISApi', src: ['bkvito/**','download/**','src/**'], dest: 'dist/vitoGISApi'},
                    {expand: true, src: 'httpserver.js', dest: 'dist'},
                    {expand: true, cwd: 'vitoGISApi', src: ['start.bat','start.vbs'], dest: 'dist'},
                    {expand: true, cwd: 'libs', src: ['artTemplate-master/**','bootstrap/**','CodeMirror/**','jquery/**','showdown/**'], dest: 'dist/libs'}

                ]
            }
        },
        watch: {
            scripts: {
                files: ['src/js/**.js'],
                tasks: ['js']
            }
        },
        smartdoc: {
            build: {
                options: {
                    paths: ['js/'],
                    outdir: 'doc/',
                    demo: {
                        paths: ['dist/VitoGISFramework.js'],
                        link: ['http://code.jquery.com/jquery-1.11.0.min.js']
                    },
                    //项目信息配置
                    project: {
                        name: '<%= pkg.name %>',
                        // description: '<%= pkg.description %>',
                        "logo": "http://www.bjvito.com/templets/Content/images/logo.png",
                        version: '<%= pkg.version %>',
                        url: 'https://github.com/zhh77/smartjs',
                        navs: [{
                            name: "Home",
                            url: "https://github.com/zhh77/smartjs"
                        }, {
                            name: "Document",
                            url: "http://zhh77.github.io/smartjs/"
                        }, {
                            name: "Blog",
                            url: "http://www.cnblogs.com/zhh8077"
                        }, {
                            name: "SmartDoc",
                            url: "https://github.com/zhh77/smartDoc"
                        }]
                    }
                }
            }
        },
        yuidoc: {
            compile: {
                "description": "dddddddddddddddddddddddddddddddddddddd",
                "version": "0.1.0",
                "url": "www.baidu.com",
                "logo": "http://www.bjvito.com/templets/Content/images/logo.png",
                "name": "<%= pkg.name %>",
                "options": {
                    paths: "js/core",
                    outdir: "doc/",
                    markdown:"README.md"
                }
            }
        },
        usemin: {
            html: ['dist/vitoGISApi/bkvito/index.html']
        },
        replace: {
            another_example: {
                src: ['dist/vitoGISApi/src/createZip.js','dist/vitoGISApi/bkvito/vitoGISDemo/core/js/api.js','dist/vitoGISApi/bkvito/vitoGISDemo/demo/**/**.json'],
                overwrite: true,                 // overwrite matched source files
                replacements: [{
                    from: /dist\//g,
                    to: ""
                }]
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    //grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-contrib-smartdoc');

    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.registerTask('deleteAll', ['clean']);
    grunt.registerTask('copyCss', ['copy']);
    grunt.registerTask('outDoc', ['smartdoc']);
    grunt.registerTask('default', ['clean', 'concat', 'uglify', 'copy:main']);
    grunt.registerTask('copyToPro', ['copy']);
    grunt.registerTask('copygis', ['copy:vitoGISApi','usemin','replace']);
    grunt.registerTask('replaceText', ['replace']);

};
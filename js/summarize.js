//Attempt to load as much of this from cdns as possible as github doesn't cache scripts.
//Interesting note is api requests are cached for 1 hour
fallback.load({
    jQuery: ['//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js', 'js/vendor/jquery.js'],
    _: ['//cdn.jsdelivr.net/lodash/2.4.1/lodash.min.js', 'js/vendor/lodash.js'],
    Hogan: ['//cdn.jsdelivr.net/hogan.js/3.0.0/hogan.min.js', 'js/vendor/hogan.js'],
    'JSON.minify': ['js/vendor/minify-json.js']
});

if(!window.console) window.console = {};
if(!console.time) console.time = console.timeEnd = function(){};
fallback.ready(function() {
    'use strict';

    console.time('resume');
    console.time('repos');
    console.time('contribs');

    var $ = window.jQuery;
    var getTemplate = function(tmplname) {
        return $.ajax({
            url: 'templates/' + tmplname + '.tmpl',
            dataType: 'text'
        });
    };

    var GITHUB_API = 'https://api.github.com/';
    var API_TOKEN = '';//Application api token
    var $gitGet = function(url, data) {
        if(url.indexOf('https://') !== 0) {//doesnt start with https://
            url = GITHUB_API + (url.charAt(0) === '/' ? url.slice(1) : url);//so i dont fuck up-
        }

        if(typeof data === 'object') {//do a custom encode to allow special characters eg x:y
            data = $.map(data, function(val, prop) {
                return prop + '=' + val;
            }).join('&');
        }
        
        //append access token
        if(data) data += '&' + API_TOKEN;
        else data = API_TOKEN;


        return $.ajax({
            url: url,
            data: data,
            accept: {//to stabalize api
                json: 'application/vnd.github.v3+json',
                '*': 'application/vnd.github.v3.raw+json'
            },
            global: false
        });
    };

    var whenAll = function(promises) {
        return $.when.apply($, promises);
    };

    var resume;
    var github;
    var templates;

    var checked  = {};
    var today = Math.floor(_.now() / (24 * 60 * 60 * 1000));
    //collection of functions to assign a sorting value to a property
    var sortMap = {
        'stars': function(repo, weight) {
            return repo.stargazers_count * weight;
        },
        'watchers': function(repo, weight) {
            return repo.watchers * weight;
        },
        'commits': function(repo, weight) {
            return repo.contributions * weight;
        },
        'activity': function(repo, weight) {//days since last commit
            return (today - (Math.floor(Date.parse(repo.updated_at) / (24 * 60 * 60 * 1000)))) * weight;
        }
    };
    var sortRepos = function(repos, weights) {
        return _.sortBy(repos, function(repo) {
           return _.reduce(weights, function(weight, val, prop) {
                if(val !== 0) {
                    weight -= sortMap[prop](repo, val);//subtract for desc
                }
                return weight;
            }, 0);
       });
    };

    var $ready = $.Deferred().resolve(); //promise all scripts are loaded
    
    var $templates = $.Deferred();
    $.when(getTemplate('resume'), getTemplate('summary'), $ready)
    .then(function(resume, summary) {
        $templates.resolve({
            resume: Hogan.compile(resume[0]),
            summary: Hogan.compile(summary[0])
        });
    });

    $.when($templates, $.ajax({url:'resume.json', dataType: 'text'}))
    .then(function(t, response) {
        templates = t;
        resume = $.parseJSON(JSON.minify(response[0]));
        github = resume.github || {};

        //fill unset stuff
        if(!github.user) {
            //expects <username>.github.io
            var match = location.href.match(/([\w.-]+)\.github\.(io|com)/);
            if(match) github.user = match[1];
            else throw 'Could not parse the url for a Github username and none given in resume';
        }

        return $.when(
            $gitGet('users/' + github.user),
            $gitGet('users/' + github.user + '/repos'),
            $gitGet('users/' + github.user + '/orgs'),
            $gitGet('search/issues', {
                //get all closed pull requests from github user. We will have to check each PR to see if its merged and check commits
                q: 'type:pr+state:closed+author:' + github.user,
                per_page: 100,//100 most recent pulls (exemplar zenorocha)
                page: 1 //todo find way back pulls (when total_count > 100)
            })
        );
    })
    .then(function(userInfo, repoInfo, organizations, pullRequests) {
        console.timeEnd('resume');

        var repos = _.filter(repoInfo[0], function(repo) {
            return !repo.fork || repo.stargazers_count > 0 || repo.watchers > 0;
        });
        whenAll(_.map(repos, function(repo) {
            var promise = $gitGet(repo.contributors_url);//may 404 for repos with no commits
            promise.then(function(contribs) {
                repo.commits = repo.contributions = _.findWhere(contribs, {login: github.user}).contributions;
            });
            return promise;
        }))
        .then(function() {
            window.repos = sortRepos(repos, github['sort repo weights']);
            console.timeEnd('repos');
        });


        var pulls = _.filter(pullRequests[0].items, function(pr) {
            var match = pr.url.match(/repos\/([\w.-]+)\/([\w.-]+)\/issues/);
            var repo = match[2];

            if(match[1] !== github.user && !_.contains(github['exclude repos'], repo)) {//exclude users, checked and excluded repos
                pr.library = pr.url.slice(0, pr.url.indexOf('/issues'));//add library url
                pr.repo = repo;
                /* jshint boss:true */
                return pr;
            }
        });

        var promises = window.p =  [];
        _.each(pulls, function(pr) {
            var promise = $.Deferred();
            promises.push(promise);
            //determine if merged
            $gitGet(pr.events_url).then(function(events) {
                var old = checked[pr.repo];
                var merged = _.findWhere(events, {event: 'merged'});

                //only keep 1 pr per repo but keep lastest merged
                if(old && merged && Date.parse(pr.updated_at) > Date.parse(old.updated_at)) old.updated_at = old.closed_at = pr.updated_at;
                
                if(!old && merged) {
                    checked[pr.repo] = pr;
                    $.when(
                        $gitGet(pr.library),
                        $gitGet(pr.library + '/contributors')//I dont think these are paginated
                    ).then(function(libInfo, contribs) {
                        libInfo = libInfo[0];
                        pr.contributions = pr.commits = _.findWhere(contribs[0], {
                            login: github.user
                        });
                        pr.commitsUrl = libInfo.html_url + '/commits?author=' + github.user;//link to all of users commits
                        promise.resolve();
                    });
                } else {//not merged
                    _.pull(pulls, pr);//remove pr
                    promise.resolve();
                }
            }, function() {
                _.pull(pulls, pr);//deleted pull repo
                promise.resolve();
            });//note may get 410 responses for deleted repos
        });

        whenAll(promises)
        .then(function() {
            window.pulls = sortRepos(pulls, github['sort pull weights']);
            console.timeEnd('contribs');
        });

    });



});
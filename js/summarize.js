//Attempt to load as much of this from cdns as possible as github doesn't cache scripts.
//Interesting note is api requests are cached for 1 hour
fallback.load({
    jQuery: ['//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js', 'js/vendor/jquery.js'],
    _: ['//cdn.jsdelivr.net/lodash/2.4.1/lodash.min.js', 'js/vendor/lodash.js'],
    ko: ['//cdn.jsdelivr.net/knockout/3.0.0/knockout.js', 'js/vendor/knockout.js'],
    'JSON.minify': ['js/vendor/minify-json.js']
});

fallback.ready(function() {
    'use strict';

    var $ = window.jQuery;

    var resumeModel;
    var githubModel;

    var gitSettings;

    /*********************************
     * Resource fetching and API calls
     *********************************/
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

    var checked  = {};

    $.ajax({url:'resume.json', dataType: 'text'})
    .then(function(resume) {
        resume = $.parseJSON(JSON.minify(resume));
        gitSettings = resume.github || {};
        delete resume.github; //remove settings object
        resumeModel = new ResumeModel(resume);

        //fill unset stuff
        if(!gitSettings.user) {
            //expects <username>.github.io
            var match = location.href.match(/([\w.-]+)\.github\.(io|com)/);
            if(match) gitSettings.user = match[1];
            else throw 'Could not parse the url for a Github username and none given in resume';
        }

        return $.when(
            $gitGet('users/' + gitSettings.user),
            $gitGet('users/' + gitSettings.user + '/repos'),
            $gitGet('users/' + gitSettings.user + '/orgs'),
            $gitGet('search/issues', {
                //get all closed pull requests from github user. We will have to check each PR to see if its merged and check commits
                q: 'type:pr+state:closed+author:' + gitSettings.user,
                per_page: 100,//100 most recent pulls (exemplar zenorocha)
                page: 1 //todo find way back pulls (when total_count > 100)
            })
        );
    })
    .then(function(userInfo, repoInfo, organizations, pullRequests) {
        userInfo = userInfo[0];
        organizations = organizations[0];
        var repos = _.filter(repoInfo[0], function(repo) {
            return !repo.fork || repo.stargazers_count > 0 || repo.subscribers_count > 0;
        });
        _.each(repos, function(repo) {
            $.when($gitGet(repo.url), $gitGet(repo.contributors_url))
            .then(function(repoInfo, contribs) {
                githubModel.updateRepo(repo, {
                    subscribers_count: repoInfo[0].subscribers_count, //this is stupid. Can't get watchers from <user>/repos
                    commits: _.findWhere(contribs[0], {login: gitSettings.user}).contributions
                });
            });//may 404 for repos with no commits
        });


        var pulls = _.filter(pullRequests[0].items, function(pr) {
            var match = pr.url.match(/repos\/([\w.-]+)\/([\w.-]+)\/issues/);
            var repo = match[2];

            if(match[1] !== gitSettings.user && !_.contains(gitSettings['exclude repos'], repo)) { //exclude users, checked and excluded repos
                pr.library = pr.url.slice(0, pr.url.indexOf('/issues')); //add library url
                pr.repo = repo;
                return pr;
            }
        });

        _.each(pulls, function(pr) {
            //determine if merged
            $gitGet(pr.events_url).then(function(events) {
                var old = checked[pr.repo];
                var merged = _.findWhere(events, {event: 'merged'});

                //only keep 1 pr per repo but keep lastest merged
                if(old && merged && Date.parse(pr.updated_at) > Date.parse(old.updated_at)) old.updated_at = pr.updated_at;
                
                if(!old && merged) {
                    checked[pr.repo] = pr;
                    $.when(
                        $gitGet(pr.library),
                        $gitGet(pr.library + '/contributors') //I dont think these are paginated
                    ).then(function(libInfo, contribs) {
                        libInfo = libInfo[0];

                        libInfo.contributions = libInfo.commits = _.findWhere(contribs[0], {login: gitSettings.user}).contributions;
                        libInfo.commitsUrl = libInfo.html_url + '/commits?author=' + gitSettings.user; //link to all of users commits
                        libInfo.updated_at = pr.updated_at;

                        //append the library we submitted code to
                        githubModel.addPull(libInfo);
                    });
                } //else not merged
            }); //note may get 410 responses for deleted repos
        });

        //update resume with user info
        // resumeModel.updateInfo(userInfo);

        githubModel = new GithubModel({
            user: userInfo,
            repos: repos,
            organizations: organizations
        });
    });

    /*********************************
     * Sortign
     *********************************/
    var today = Math.floor(_.now() / (24 * 60 * 60 * 1000));
    //collection of functions to assign a sorting value to a property
    var sortMap = {
        'stars': function(repo, weight) {
            return repo.stargazers_count * weight;
        },
        'watchers': function(repo, weight) {
            return repo.subscribers_count * weight; //users/<user>/repos doesnt give watchers
        },
        'commits': function(repo, weight) {
            return repo.contributions * weight;
        },
        'activity': function(repo, weight) {//days since last commit (negative)
            return ((Math.floor(Date.parse(repo.updated_at) / (24 * 60 * 60 * 1000))) - today) * weight;
        }
    };

    var sortRepos = function(repos, weights) {
        var weight = function(repo) {
            var _repo = ko.isObservable(repo) ? repo() : repo; //unwrap
            return _.reduce(weights, function(weight, val, prop) {
                if(val) weight += sortMap[prop](_repo, val);
                return weight;
            }, 0);
        };

        return repos.sort(function(r1, r2) {
            return weight(r2) - weight(r1); //sort descending
        });
    };

    /*********************************
     * Set up the views
     *********************************/

    var DEFAULT_REPO = {
        subscribers_count: 1,
        stargazers_count: 0,
        commits: 1
    };

    function Model(name) {
        this.__node = document.getElementById(name);
    }
    Model.prototype = {
        update: function() {
            ko.applyBindings(this, this.__node);
            return this;
        },

        $appending: function(element) {
            $(element).fadeIn();
        },

        $removing: function(element) {
            $(element).fadeOut();
        }
    };

    function GithubModel(info) {
        var model = new Model('summary');

        var repos = model.repos = ko.observableArray(_.map(info.repos, function(repo) {
            return ko.observable(_.extend({}, DEFAULT_REPO, repo));
        }));
        var pulls = model.pulls = ko.observableArray();
        model.organizations = ko.observableArray(info.organizations);
        model.user = info.user;

        model.updateRepo = function(repo, updated) {
            var obs = _.find(repos(), function(r) {return r() === repo;});//find repo's obserable
            obs(_.extend(repo, updated));//and update
            sortRepos(repos, gitSettings['sort repo weights']);
        };

        model.addPull = function(pr) {
            pulls.push(_.extend({}, DEFAULT_REPO, pr));
            sortRepos(pulls, gitSettings['sort pull weights']);
        };

        sortRepos(repos, gitSettings['sort repo weights']);

        return model.update();
    }

    function ResumeModel(resume) {
        var model = new Model('resume');

        _.extend(model, resume);

        return model.update();
    }

});
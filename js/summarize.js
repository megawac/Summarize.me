(function($) {
    'use strict';

    var resumeModel;
    var githubModel;

    var gitSettings;

    var isURL = function(link) {
        var idx = link.indexOf('//');
        return idx !== -1 && idx <= 8;
    };
    var urlify = function(link, def) {//appends // or https to a link if not there
        return isURL(link, def) ? link : (def || '//') + link;
    };


    /*********************************
     * Resource fetching and API calls
     *********************************/
    var GITHUB_API = 'https://api.github.com/';
    var API_TOKEN = 'access_token=4fefed9402349992bdcfe93978f2647fec350ebc'; //Application api token
    var $gitGet = function(url, data) {
        url = urlify(url, GITHUB_API);

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
                per_page: 100, //100 most recent pulls (exemplar zenorocha)
                page: 1 //todo find way back pulls (when total_count > 100)
            })
        );
    })
    .then(function(userInfo, repoInfo, organizations, pullRequests) {
        userInfo = userInfo[0];
        organizations = organizations[0];
        var repos = _.filter(repoInfo[0], function(repo) {
            return !_.contains(gitSettings['exclude repos'], repo.name) && (!repo.fork || repo.stargazers_count > 0 || repo.subscribers_count > 0);
        });
        _.each(repos, function(repo) {
            $.when(
                $gitGet(repo.url),
                $gitGet(repo.contributors_url)
            ).then(function(repoInfo, contribs) {
                var contrib = _.findWhere(contribs[0], {login: gitSettings.user});
                githubModel.updateRepo(repo, {
                    subscribers_count: repoInfo[0].subscribers_count, //this is stupid. Can't get watchers from <user>/repos
                    commits: contrib && contrib.contributions || 0
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

    var processRepo = function(repo) {
        _.each({//default settings
            subscribers_count: 1,
            stargazers_count: 0,
            commits: 1
        }, function(def, key) {
            if(!(key in repo)) repo[key] = def;
        });
        repo.commitsURL = repo.html_url + '/commits?author=' + gitSettings.user;
        return repo;
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
            $(element).hide().fadeIn();
        },

        $removing: function(element) {
            $(element).fadeOut();
        }
    };

    function GithubModel(info) {
        var model = new Model('summary');

        var repos = ko.observableArray(_.map(info.repos, function(repo) {
            return ko.observable(processRepo(repo));
        }));
        var pulls = ko.observableArray();
        var orgs = ko.observableArray(info.organizations);

        model.user = info.user;

        model.repos = ko.computed(function() {
            return repos.slice(0, gitSettings['max repos']);
        }, repos);

        model.pulls = ko.computed(function() {
            return pulls.slice(0, gitSettings['max contributions']);
        }, pulls);

        window.orgs = model.organizations = ko.computed(function() {
            return orgs.slice(0, gitSettings['max organizations']);
        }, orgs);

        model.updateRepo = function(repo, updated) {
            var obs = _.find(repos(), function(r) {return r() === repo;});//find repo's obserable
            obs(_.extend(repo, updated));//and update
            sortRepos(repos, gitSettings['sort repo weights']);
        };

        model.addPull = function(pr) {
            pulls.push(processRepo(pr));
            sortRepos(pulls, gitSettings['sort pull weights']);
        };

        sortRepos(repos, gitSettings['sort repo weights']);

        return model.update();
    }

    function ResumeModel(resume) {
        var model = new Model('resume');

        _.extend(model, {
            portfolioLink: ko.computed(function() {
                return urlify(resume.portfolio);
            }),
            contactLink: ko.computed(function() {
                return 'mailto:' + resume.contact;
            })
        }, resume);

        document.title = 'Résumé of '  + resume.name;

        return model.update();
    }

})(jQuery);

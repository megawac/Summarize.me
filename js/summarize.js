"use strict";
(() => {
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const GITHUB_API = "https://api.github.com/";
    const API_TOKEN = "45f82a345b26235b0b3f01937f671387b1baca43";
    const DEFAULT_SORT_WEIGHTS = {
        stars: 1,
        watchers: 1,
        commits: 1,
        activity: 0
    };
    const todayInDays = Math.floor(Date.now() / DAY_IN_MS);
    const ensureUrl = (value, fallback = "https://") => {
        if (!value) {
            return undefined;
        }
        if (/^https?:\/\//i.test(value) || /^\/\//.test(value)) {
            return value;
        }
        return `${fallback}${value}`;
    };
    const normalizeGithubSettings = (raw) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const excludeRepos = new Set(((_a = raw === null || raw === void 0 ? void 0 : raw["exclude repos"]) !== null && _a !== void 0 ? _a : []).map((repo) => repo.toLowerCase()));
        const sortRepoWeights = {
            ...DEFAULT_SORT_WEIGHTS,
            ...((_b = raw === null || raw === void 0 ? void 0 : raw["sort repo weights"]) !== null && _b !== void 0 ? _b : {})
        };
        const sortPullWeights = {
            ...DEFAULT_SORT_WEIGHTS,
            ...((_c = raw === null || raw === void 0 ? void 0 : raw["sort pull weights"]) !== null && _c !== void 0 ? _c : {})
        };
        return {
            user: (_e = (_d = raw === null || raw === void 0 ? void 0 : raw.user) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : "",
            excludeRepos,
            includeRepos: (raw === null || raw === void 0 ? void 0 : raw["include repos"]) !== false,
            includePulls: (raw === null || raw === void 0 ? void 0 : raw["include pulls"]) !== false,
            includeUnmergedPulls: (_f = raw === null || raw === void 0 ? void 0 : raw["include unmerged pulls"]) !== null && _f !== void 0 ? _f : false,
            maxRepos: (_g = raw === null || raw === void 0 ? void 0 : raw["max repos"]) !== null && _g !== void 0 ? _g : 6,
            maxContributions: (_h = raw === null || raw === void 0 ? void 0 : raw["max contributions"]) !== null && _h !== void 0 ? _h : 6,
            maxOrganizations: (_j = raw === null || raw === void 0 ? void 0 : raw["max organizations"]) !== null && _j !== void 0 ? _j : 10,
            sortRepoWeights,
            sortPullWeights
        };
    };
    const resolveGithubUser = (settings) => {
        if (settings.user) {
            return;
        }
        const match = window.location.href.match(/([\w.-]+)\.github\.(?:io|com)/i);
        if (match) {
            settings.user = match[1];
            return;
        }
        throw new Error("Unable to determine GitHub username. Please set github.user in resume.json");
    };
    const fetchResume = async () => {
        var _a;
        const resumeUrl = (_a = resume === null || resume === void 0 ? void 0 : resume.json) !== null && _a !== void 0 ? _a : "resume.json";
        const response = await fetch(resumeUrl, { credentials: "same-origin" });
        if (!response.ok) {
            throw new Error(`Failed to load resume: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        const minified = typeof JSON.minify === "function" ? JSON.minify(text) : text;
        return JSON.parse(minified);
    };
    const createGithubUrl = (path) => {
        if (/^https?:/i.test(path)) {
            return new URL(path);
        }
        const normalized = path.startsWith("/") ? path.slice(1) : path;
        return new URL(normalized, GITHUB_API);
    };
    const gitGet = async (path, params = {}) => {
        const url = createGithubUrl(path);
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return;
            }
            url.searchParams.set(key, String(value));
        });
        url.searchParams.set("access_token", API_TOKEN);
        const response = await fetch(url.toString(), {
            headers: {
                Accept: "application/vnd.github.v3+json"
            }
        });
        if (!response.ok) {
            throw new Error(`GitHub request failed (${response.status} ${response.statusText}): ${url}`);
        }
        return response.json();
    };
    const toNormalizedPull = (item, settings) => {
        const repoMatch = item.repository_url.match(/repos\/([^/]+)\/([^/]+)$/i);
        if (!repoMatch) {
            return null;
        }
        const [, owner, repoName] = repoMatch;
        if (!owner || !repoName) {
            return null;
        }
        if (owner.toLowerCase() === settings.user.toLowerCase()) {
            return null;
        }
        if (settings.excludeRepos.has(repoName.toLowerCase())) {
            return null;
        }
        return {
            owner,
            repoName,
            repositoryUrl: item.repository_url,
            eventsUrl: item.events_url,
            htmlUrl: item.html_url,
            updatedAt: item.updated_at
        };
    };
    const createRepoSummary = (repo, userLogin) => {
        var _a, _b, _c, _d, _e;
        const commitsURL = `${repo.html_url}/commits?author=${encodeURIComponent(userLogin)}`;
        return {
            name: repo.name,
            full_name: repo.full_name,
            html_url: repo.html_url,
            description: (_a = repo.description) !== null && _a !== void 0 ? _a : "",
            stargazers_count: (_b = repo.stargazers_count) !== null && _b !== void 0 ? _b : 0,
            subscribers_count: (_c = repo.subscribers_count) !== null && _c !== void 0 ? _c : 0,
            commits: (_d = repo.commits) !== null && _d !== void 0 ? _d : 0,
            updated_at: (_e = repo.updated_at) !== null && _e !== void 0 ? _e : new Date().toISOString(),
            commitsURL
        };
    };
    class Model {
        constructor(nodeId) {
            this.bound = false;
            this.$appending = (element) => {
                if (element instanceof HTMLElement && typeof $ === "function") {
                    $(element).hide().fadeIn();
                }
            };
            this.$removing = (element) => {
                if (element instanceof HTMLElement && typeof $ === "function") {
                    $(element).fadeOut();
                }
            };
            const element = document.getElementById(nodeId);
            if (!element) {
                throw new Error(`Could not find element with id "${nodeId}"`);
            }
            this.node = element;
        }
        update() {
            if (!this.bound) {
                ko.applyBindings(this, this.node);
                this.bound = true;
            }
            return this;
        }
    }
    class GithubModel extends Model {
        constructor(info, settings) {
            var _a;
            super("summary");
            this.settings = settings;
            this.repoMap = new Map();
            this.pullMap = new Map();
            this.addOrganization = (organization) => {
                this.orgsSource.push(organization);
            };
            this.addRepo = (repo) => {
                const key = this.getRepoKey(repo);
                const summary = this.createRepoSummary(repo);
                const observable = this.repoMap.get(key);
                if (observable) {
                    observable(summary);
                }
                else {
                    const repoObservable = ko.observable(summary);
                    this.repoMap.set(key, repoObservable);
                    this.reposSource.push(repoObservable);
                }
                this.sortCollection(this.reposSource, this.settings.sortRepoWeights);
            };
            this.updateRepo = (identity, updates) => {
                const key = this.getRepoKey(identity);
                const observable = this.repoMap.get(key);
                if (!observable) {
                    return;
                }
                const current = observable();
                const merged = {
                    name: current.name,
                    full_name: current.full_name,
                    html_url: current.html_url,
                    description: current.description,
                    stargazers_count: current.stargazers_count,
                    subscribers_count: current.subscribers_count,
                    commits: current.commits,
                    updated_at: current.updated_at,
                    ...updates
                };
                observable(this.createRepoSummary(merged));
                this.sortCollection(this.reposSource, this.settings.sortRepoWeights);
            };
            this.addPull = (repo) => {
                const key = this.getRepoKey(repo);
                const summary = this.createRepoSummary(repo);
                const observable = this.pullMap.get(key);
                if (observable) {
                    observable(summary);
                }
                else {
                    const pullObservable = ko.observable(summary);
                    this.pullMap.set(key, pullObservable);
                    this.pullsSource.push(pullObservable);
                }
                this.sortCollection(this.pullsSource, this.settings.sortPullWeights);
            };
            this.user = info.user;
            this.reposSource = ko.observableArray(info.repos.map((repo) => this.createRepoObservable(repo)));
            this.pullsSource = ko.observableArray([]);
            this.orgsSource = ko.observableArray((_a = info.organizations) !== null && _a !== void 0 ? _a : []);
            this.repos = ko.computed(() => this.reposSource().slice(0, this.settings.maxRepos));
            this.pulls = ko.computed(() => this.pullsSource().slice(0, this.settings.maxContributions));
            this.organizations = ko.computed(() => this.orgsSource().slice(0, this.settings.maxOrganizations));
            this.sortCollection(this.reposSource, this.settings.sortRepoWeights);
            this.sortCollection(this.pullsSource, this.settings.sortPullWeights);
            this.update();
        }
        createRepoObservable(repo) {
            const summary = this.createRepoSummary(repo);
            const observable = ko.observable(summary);
            this.repoMap.set(this.getRepoKey(repo), observable);
            return observable;
        }
        createRepoSummary(repo) {
            return createRepoSummary(repo, this.settings.user);
        }
        getRepoKey(repo) {
            var _a;
            return ((_a = repo.full_name) !== null && _a !== void 0 ? _a : repo.name).toLowerCase();
        }
        sortCollection(collection, weights) {
            collection.sort((left, right) => this.computeWeight(right(), weights) - this.computeWeight(left(), weights));
        }
        computeWeight(repo, weights) {
            var _a, _b, _c, _d, _e, _f, _g;
            const starsWeight = ((_a = weights.stars) !== null && _a !== void 0 ? _a : 0) * ((_b = repo.stargazers_count) !== null && _b !== void 0 ? _b : 0);
            const watcherWeight = ((_c = weights.watchers) !== null && _c !== void 0 ? _c : 0) * ((_d = repo.subscribers_count) !== null && _d !== void 0 ? _d : 0);
            const commitWeight = ((_e = weights.commits) !== null && _e !== void 0 ? _e : 0) * ((_f = repo.commits) !== null && _f !== void 0 ? _f : 0);
            const repoDays = Math.floor(new Date(repo.updated_at).getTime() / DAY_IN_MS);
            const activityWeight = ((_g = weights.activity) !== null && _g !== void 0 ? _g : 0) * (repoDays - todayInDays);
            return starsWeight + watcherWeight + commitWeight + activityWeight;
        }
    }
    class ResumeModel extends Model {
        constructor(resume) {
            super("resume");
            this.resume = resume;
            Object.assign(this, resume);
            this.portfolioLink = ko.computed(() => ensureUrl(this.resume.portfolio));
            this.contactLink = ko.computed(() => (this.resume.contact ? `mailto:${this.resume.contact}` : undefined));
            document.title = `Résumé of ${this.resume.name}`;
            this.update();
        }
    }
    const loadOrganizations = (organizations, model) => {
        organizations.forEach((org) => model.addOrganization(org));
    };
    const enrichRepository = async (repo, settings, model) => {
        var _a;
        try {
            const [repoInfo, contributors] = await Promise.all([
                gitGet(repo.url),
                gitGet(repo.contributors_url)
            ]);
            const contributor = contributors.find((item) => item.login === settings.user);
            model.updateRepo(repo, {
                subscribers_count: repoInfo.subscribers_count,
                stargazers_count: repoInfo.stargazers_count,
                commits: (_a = contributor === null || contributor === void 0 ? void 0 : contributor.contributions) !== null && _a !== void 0 ? _a : 0,
                updated_at: repoInfo.updated_at
            });
        }
        catch (error) {
            console.warn("Failed to enrich repository", repo.full_name, error);
        }
    };
    const loadRepositories = async (user, settings, model) => {
        const totalPages = Math.max(1, Math.ceil(user.public_repos / 100));
        const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
        await Promise.all(pages.map(async (page) => {
            try {
                const repos = await gitGet(`users/${settings.user}/repos`, {
                    per_page: 100,
                    page
                });
                repos
                    .filter((repo) => !settings.excludeRepos.has(repo.name.toLowerCase()))
                    .filter((repo) => !repo.fork || repo.stargazers_count > 0 || repo.subscribers_count > 0)
                    .forEach((repo) => {
                    model.addRepo(repo);
                    void enrichRepository(repo, settings, model);
                });
            }
            catch (error) {
                console.warn("Failed to load repository page", page, error);
            }
        }));
    };
    const loadPullRequests = async (response, settings, model) => {
        var _a;
        const pulls = response.items
            .map((item) => toNormalizedPull(item, settings))
            .filter((item) => item !== null);
        const latestPerRepo = new Map();
        for (const pull of pulls) {
            try {
                const events = await gitGet(pull.eventsUrl);
                const merged = events.find((event) => event.event === "merged");
                if (!merged && !settings.includeUnmergedPulls) {
                    continue;
                }
                const [repoInfo, contributors] = await Promise.all([
                    gitGet(pull.repositoryUrl),
                    gitGet(`${pull.repositoryUrl}/contributors`)
                ]);
                const contributor = contributors.find((item) => item.login === settings.user);
                const summary = createRepoSummary({
                    name: repoInfo.name,
                    full_name: repoInfo.full_name,
                    html_url: repoInfo.html_url,
                    description: repoInfo.description,
                    stargazers_count: repoInfo.stargazers_count,
                    subscribers_count: repoInfo.subscribers_count,
                    commits: (_a = contributor === null || contributor === void 0 ? void 0 : contributor.contributions) !== null && _a !== void 0 ? _a : 0,
                    updated_at: pull.updatedAt
                }, settings.user);
                const existing = latestPerRepo.get(pull.repoName.toLowerCase());
                if (!existing ||
                    new Date(summary.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
                    latestPerRepo.set(pull.repoName.toLowerCase(), summary);
                }
            }
            catch (error) {
                console.warn("Failed to process pull request", pull.repoName, error);
            }
        }
        latestPerRepo.forEach((summary) => model.addPull(summary));
    };
    const bootstrap = async () => {
        try {
            const resumeDocument = await fetchResume();
            const settings = normalizeGithubSettings(resumeDocument.github);
            resolveGithubUser(settings);
            const resumeContent = { ...resumeDocument };
            delete resumeContent.github;
            new ResumeModel(resumeContent);
            const [user, organizations, pullRequests] = await Promise.all([
                gitGet(`users/${settings.user}`),
                gitGet(`users/${settings.user}/orgs`),
                gitGet("search/issues", {
                    q: `type:pr+state:closed+author:${settings.user}`,
                    per_page: 100,
                    page: 1
                })
            ]);
            const githubModel = new GithubModel({
                user,
                repos: [],
                organizations: []
            }, settings);
            loadOrganizations(organizations, githubModel);
            const tasks = [];
            if (settings.includeRepos) {
                tasks.push(loadRepositories(user, settings, githubModel));
            }
            if (settings.includePulls) {
                tasks.push(loadPullRequests(pullRequests, settings, githubModel));
            }
            await Promise.all(tasks);
        }
        catch (error) {
            console.error("Failed to initialise resume", error);
        }
    };
    void bootstrap();
})();

(() => {
  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  const GITHUB_API = "https://api.github.com/";
  const API_TOKEN = "45f82a345b26235b0b3f01937f671387b1baca43";

  type SortKey = "stars" | "watchers" | "commits" | "activity";

  interface SortWeights {
    stars?: number;
    watchers?: number;
    commits?: number;
    activity?: number;
  }

  interface RawGithubSettings {
    user?: string;
    "exclude repos"?: string[];
    "include repos"?: boolean;
    "include pulls"?: boolean;
    "include unmerged pulls"?: boolean;
    "max repos"?: number;
    "max contributions"?: number;
    "max organizations"?: number;
    "sort repo weights"?: SortWeights;
    "sort pull weights"?: SortWeights;
  }

  interface GithubSettings {
    user: string;
    excludeRepos: Set<string>;
    includeRepos: boolean;
    includePulls: boolean;
    includeUnmergedPulls: boolean;
    maxRepos: number;
    maxContributions: number;
    maxOrganizations: number;
    sortRepoWeights: SortWeights;
    sortPullWeights: SortWeights;
  }

  interface ResumeContent {
    name: string;
    title?: string;
    phone?: string;
    contact?: string;
    portfolio?: string;
    objective?: string;
    aboutme?: string;
    skills?: string[];
    frameworks?: string[];
    projects?: Array<Record<string, unknown>>;
    experience?: Array<Record<string, unknown>>;
    speaking?: Array<Record<string, unknown>>;
    education?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  }

  interface ResumeDocument extends ResumeContent {
    github?: RawGithubSettings;
  }

  interface GithubUser {
    login: string;
    html_url: string;
    name: string;
    followers: number;
    public_repos: number;
    hireable: boolean | null;
  }

  interface Organization {
    id: number;
    login: string;
    html_url: string;
    name: string;
    url: string;
  }

  interface Repository {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    fork: boolean;
    stargazers_count: number;
    subscribers_count: number;
    updated_at: string;
    url: string;
    contributors_url: string;
  }

  interface Contributor {
    login: string;
    contributions: number;
  }

  interface PullRequestItem {
    id: number;
    url: string;
    repository_url: string;
    events_url: string;
    html_url: string;
    updated_at: string;
  }

  interface PullRequestEvent {
    id: number;
    event: string;
    created_at: string;
  }

  interface SearchIssuesResponse {
    total_count: number;
    incomplete_results: boolean;
    items: PullRequestItem[];
  }

  interface GithubModelInit {
    user: GithubUser;
    repos: RepoLike[];
    organizations: Organization[];
  }

  interface RepoIdentity {
    name: string;
    full_name?: string;
  }

  interface RepoLike extends RepoIdentity {
    html_url: string;
    description?: string | null;
    stargazers_count?: number;
    subscribers_count?: number;
    commits?: number;
    updated_at?: string;
  }

  interface RepoSummary extends RepoLike {
    stargazers_count: number;
    subscribers_count: number;
    commits: number;
    updated_at: string;
    commitsURL: string;
  }

  interface NormalizedPull {
    owner: string;
    repoName: string;
    repositoryUrl: string;
    eventsUrl: string;
    htmlUrl: string;
    updatedAt: string;
  }

  const DEFAULT_SORT_WEIGHTS: Required<SortWeights> = {
    stars: 1,
    watchers: 1,
    commits: 1,
    activity: 0
  };

  const todayInDays = Math.floor(Date.now() / DAY_IN_MS);

  const ensureUrl = (value?: string, fallback = "https://"): string | undefined => {
    if (!value) {
      return undefined;
    }
    if (/^https?:\/\//i.test(value) || /^\/\//.test(value)) {
      return value;
    }
    return `${fallback}${value}`;
  };

  const normalizeGithubSettings = (raw?: RawGithubSettings): GithubSettings => {
    const excludeRepos = new Set((raw?.["exclude repos"] ?? []).map((repo) => repo.toLowerCase()));

    const sortRepoWeights: SortWeights = {
      ...DEFAULT_SORT_WEIGHTS,
      ...(raw?.["sort repo weights"] ?? {})
    };

    const sortPullWeights: SortWeights = {
      ...DEFAULT_SORT_WEIGHTS,
      ...(raw?.["sort pull weights"] ?? {})
    };

    return {
      user: raw?.user?.trim() ?? "",
      excludeRepos,
      includeRepos: raw?.["include repos"] !== false,
      includePulls: raw?.["include pulls"] !== false,
      includeUnmergedPulls: raw?.["include unmerged pulls"] ?? false,
      maxRepos: raw?.["max repos"] ?? 6,
      maxContributions: raw?.["max contributions"] ?? 6,
      maxOrganizations: raw?.["max organizations"] ?? 10,
      sortRepoWeights,
      sortPullWeights
    };
  };

  const resolveGithubUser = (settings: GithubSettings): void => {
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

  const fetchResume = async (): Promise<ResumeDocument> => {
    const resumeUrl = resume?.json ?? "resume.json";
    const response = await fetch(resumeUrl, { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error(`Failed to load resume: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    const minified = typeof JSON.minify === "function" ? JSON.minify(text) : text;
    return JSON.parse(minified) as ResumeDocument;
  };

  const createGithubUrl = (path: string): URL => {
    if (/^https?:/i.test(path)) {
      return new URL(path);
    }
    const normalized = path.startsWith("/") ? path.slice(1) : path;
    return new URL(normalized, GITHUB_API);
  };

  const gitGet = async <T>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> => {
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

    return response.json() as Promise<T>;
  };

  const toNormalizedPull = (item: PullRequestItem, settings: GithubSettings): NormalizedPull | null => {
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

  const createRepoSummary = (repo: RepoLike, userLogin: string): RepoSummary => {
    const commitsURL = `${repo.html_url}/commits?author=${encodeURIComponent(userLogin)}`;
    return {
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description ?? "",
      stargazers_count: repo.stargazers_count ?? 0,
      subscribers_count: repo.subscribers_count ?? 0,
      commits: repo.commits ?? 0,
      updated_at: repo.updated_at ?? new Date().toISOString(),
      commitsURL
    };
  };

  class Model {
    private readonly node: HTMLElement;
    private bound = false;

    constructor(nodeId: string) {
      const element = document.getElementById(nodeId);
      if (!element) {
        throw new Error(`Could not find element with id "${nodeId}"`);
      }
      this.node = element;
    }

    update(): this {
      if (!this.bound) {
        ko.applyBindings(this, this.node);
        this.bound = true;
      }
      return this;
    }

    readonly $appending = (element: Element): void => {
      if (element instanceof HTMLElement && typeof $ === "function") {
        $(element).hide().fadeIn();
      }
    };

    readonly $removing = (element: Element): void => {
      if (element instanceof HTMLElement && typeof $ === "function") {
        $(element).fadeOut();
      }
    };
  }

  class GithubModel extends Model {
    readonly user: GithubUser;
    readonly repos: KnockoutComputed<KnockoutObservable<RepoSummary>[]>;
    readonly pulls: KnockoutComputed<KnockoutObservable<RepoSummary>[]>;
    readonly organizations: KnockoutComputed<Organization[]>;

    private readonly reposSource: KnockoutObservableArray<KnockoutObservable<RepoSummary>>;
    private readonly pullsSource: KnockoutObservableArray<KnockoutObservable<RepoSummary>>;
    private readonly orgsSource: KnockoutObservableArray<Organization>;
    private readonly repoMap = new Map<string, KnockoutObservable<RepoSummary>>();
    private readonly pullMap = new Map<string, KnockoutObservable<RepoSummary>>();

    constructor(info: GithubModelInit, private readonly settings: GithubSettings) {
      super("summary");
      this.user = info.user;
      this.reposSource = ko.observableArray<KnockoutObservable<RepoSummary>>(
        info.repos.map((repo) => this.createRepoObservable(repo))
      );
      this.pullsSource = ko.observableArray<KnockoutObservable<RepoSummary>>([]);
      this.orgsSource = ko.observableArray<Organization>(info.organizations ?? []);

      this.repos = ko.computed(() => this.reposSource().slice(0, this.settings.maxRepos));
      this.pulls = ko.computed(() => this.pullsSource().slice(0, this.settings.maxContributions));
      this.organizations = ko.computed(() => this.orgsSource().slice(0, this.settings.maxOrganizations));

      this.sortCollection(this.reposSource, this.settings.sortRepoWeights);
      this.sortCollection(this.pullsSource, this.settings.sortPullWeights);

      this.update();
    }

    addOrganization = (organization: Organization): void => {
      this.orgsSource.push(organization);
    };

    addRepo = (repo: RepoLike): void => {
      const key = this.getRepoKey(repo);
      const summary = this.createRepoSummary(repo);
      const observable = this.repoMap.get(key);
      if (observable) {
        observable(summary);
      } else {
        const repoObservable = ko.observable<RepoSummary>(summary);
        this.repoMap.set(key, repoObservable);
        this.reposSource.push(repoObservable);
      }
      this.sortCollection(this.reposSource, this.settings.sortRepoWeights);
    };

    updateRepo = (identity: RepoIdentity, updates: Partial<RepoLike>): void => {
      const key = this.getRepoKey(identity);
      const observable = this.repoMap.get(key);
      if (!observable) {
        return;
      }
      const current = observable();
      const merged: RepoLike = {
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

    addPull = (repo: RepoLike): void => {
      const key = this.getRepoKey(repo);
      const summary = this.createRepoSummary(repo);
      const observable = this.pullMap.get(key);
      if (observable) {
        observable(summary);
      } else {
        const pullObservable = ko.observable<RepoSummary>(summary);
        this.pullMap.set(key, pullObservable);
        this.pullsSource.push(pullObservable);
      }
      this.sortCollection(this.pullsSource, this.settings.sortPullWeights);
    };

    private createRepoObservable(repo: RepoLike): KnockoutObservable<RepoSummary> {
      const summary = this.createRepoSummary(repo);
      const observable = ko.observable<RepoSummary>(summary);
      this.repoMap.set(this.getRepoKey(repo), observable);
      return observable;
    }

    private createRepoSummary(repo: RepoLike): RepoSummary {
      return createRepoSummary(repo, this.settings.user);
    }

    private getRepoKey(repo: RepoIdentity): string {
      return (repo.full_name ?? repo.name).toLowerCase();
    }

    private sortCollection(
      collection: KnockoutObservableArray<KnockoutObservable<RepoSummary>>,
      weights: SortWeights
    ): void {
      collection.sort((left, right) => this.computeWeight(right(), weights) - this.computeWeight(left(), weights));
    }

    private computeWeight(repo: RepoSummary, weights: SortWeights): number {
      const starsWeight = (weights.stars ?? 0) * (repo.stargazers_count ?? 0);
      const watcherWeight = (weights.watchers ?? 0) * (repo.subscribers_count ?? 0);
      const commitWeight = (weights.commits ?? 0) * (repo.commits ?? 0);
      const repoDays = Math.floor(new Date(repo.updated_at).getTime() / DAY_IN_MS);
      const activityWeight = (weights.activity ?? 0) * (repoDays - todayInDays);
      return starsWeight + watcherWeight + commitWeight + activityWeight;
    }
  }

  class ResumeModel extends Model {
    readonly portfolioLink: KnockoutComputed<string | undefined>;
    readonly contactLink: KnockoutComputed<string | undefined>;

    constructor(private readonly resume: ResumeContent) {
      super("resume");
      Object.assign(this, resume);

      this.portfolioLink = ko.computed(() => ensureUrl(this.resume.portfolio));
      this.contactLink = ko.computed(() => (this.resume.contact ? `mailto:${this.resume.contact}` : undefined));

      document.title = `Résumé of ${this.resume.name}`;
      this.update();
    }
  }

  const loadOrganizations = (organizations: Organization[], model: GithubModel): void => {
    organizations.forEach((org) => model.addOrganization(org));
  };

  const enrichRepository = async (
    repo: Repository,
    settings: GithubSettings,
    model: GithubModel
  ): Promise<void> => {
    try {
      const [repoInfo, contributors] = await Promise.all([
        gitGet<Repository>(repo.url),
        gitGet<Contributor[]>(repo.contributors_url)
      ]);

      const contributor = contributors.find((item) => item.login === settings.user);
      model.updateRepo(repo, {
        subscribers_count: repoInfo.subscribers_count,
        stargazers_count: repoInfo.stargazers_count,
        commits: contributor?.contributions ?? 0,
        updated_at: repoInfo.updated_at
      });
    } catch (error) {
      console.warn("Failed to enrich repository", repo.full_name, error);
    }
  };

  const loadRepositories = async (
    user: GithubUser,
    settings: GithubSettings,
    model: GithubModel
  ): Promise<void> => {
    const totalPages = Math.max(1, Math.ceil(user.public_repos / 100));
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

    await Promise.all(
      pages.map(async (page) => {
        try {
          const repos = await gitGet<Repository[]>(`users/${settings.user}/repos`, {
            per_page: 100,
            page
          });

          repos
            .filter((repo) => !settings.excludeRepos.has(repo.name.toLowerCase()))
            .filter(
              (repo) =>
                !repo.fork || repo.stargazers_count > 0 || repo.subscribers_count > 0
            )
            .forEach((repo) => {
              model.addRepo(repo);
              void enrichRepository(repo, settings, model);
            });
        } catch (error) {
          console.warn("Failed to load repository page", page, error);
        }
      })
    );
  };

  const loadPullRequests = async (
    response: SearchIssuesResponse,
    settings: GithubSettings,
    model: GithubModel
  ): Promise<void> => {
    const pulls = response.items
      .map((item) => toNormalizedPull(item, settings))
      .filter((item): item is NormalizedPull => item !== null);

    const latestPerRepo = new Map<string, RepoSummary>();

    for (const pull of pulls) {
      try {
        const events = await gitGet<PullRequestEvent[]>(pull.eventsUrl);
        const merged = events.find((event) => event.event === "merged");
        if (!merged && !settings.includeUnmergedPulls) {
          continue;
        }

        const [repoInfo, contributors] = await Promise.all([
          gitGet<Repository>(pull.repositoryUrl),
          gitGet<Contributor[]>(`${pull.repositoryUrl}/contributors`)
        ]);

        const contributor = contributors.find((item) => item.login === settings.user);
        const summary = createRepoSummary(
          {
            name: repoInfo.name,
            full_name: repoInfo.full_name,
            html_url: repoInfo.html_url,
            description: repoInfo.description,
            stargazers_count: repoInfo.stargazers_count,
            subscribers_count: repoInfo.subscribers_count,
            commits: contributor?.contributions ?? 0,
            updated_at: pull.updatedAt
          },
          settings.user
        );

        const existing = latestPerRepo.get(pull.repoName.toLowerCase());
        if (
          !existing ||
          new Date(summary.updated_at).getTime() > new Date(existing.updated_at).getTime()
        ) {
          latestPerRepo.set(pull.repoName.toLowerCase(), summary);
        }
      } catch (error) {
        console.warn("Failed to process pull request", pull.repoName, error);
      }
    }

    latestPerRepo.forEach((summary) => model.addPull(summary));
  };

  const bootstrap = async (): Promise<void> => {
    try {
      const resumeDocument = await fetchResume();
      const settings = normalizeGithubSettings(resumeDocument.github);
      resolveGithubUser(settings);

      const resumeContent = { ...resumeDocument } as ResumeContent & { github?: RawGithubSettings };
      delete resumeContent.github;
      new ResumeModel(resumeContent);

      const [user, organizations, pullRequests] = await Promise.all([
        gitGet<GithubUser>(`users/${settings.user}`),
        gitGet<Organization[]>(`users/${settings.user}/orgs`),
        gitGet<SearchIssuesResponse>("search/issues", {
          q: `type:pr+state:closed+author:${settings.user}`,
          per_page: 100,
          page: 1
        })
      ]);

      const githubModel = new GithubModel(
        {
          user,
          repos: [],
          organizations: []
        },
        settings
      );

      loadOrganizations(organizations, githubModel);

      const tasks: Promise<void>[] = [];
      if (settings.includeRepos) {
        tasks.push(loadRepositories(user, settings, githubModel));
      }
      if (settings.includePulls) {
        tasks.push(loadPullRequests(pullRequests, settings, githubModel));
      }

      await Promise.all(tasks);
    } catch (error) {
      console.error("Failed to initialise resume", error);
    }
  };

  void bootstrap();
})();

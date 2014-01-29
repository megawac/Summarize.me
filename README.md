Summarize.me
=============

A JSON resume generator and Github summarizer inspired by [jsonme](https://github.com/bittersweetryan/jsonme) and [darsa.in](//darsa.in/).
using a given `resume.json` file and some Github API calls. The templates are compiled through knockout.js, ajax done through jQuery and CSS generated through LESS.

##Usage
This is just a collection of js, css and html files + `resume.json` and Github API calls. You can easily configure this app with [Github pages](http://pages.github.com/) so `<github-username>`.github.io will be a customized version of this resume app (see mine at [megawac.github.io](//megawac.github.io)).
   
The simplest way to create some Github pages for yourself is to follow the steps belows:

1. Fork the repo and rename it to `&lt;github-username>.github.com`
2. Update the resume.json file appropriately
3. Done! Browse to `<github-username>.github.io`



Yo heads up, this makes a bunch of API calls. The summary generated for Paul Irish needed about 225 requests and retrieved 400KB of data. I'm actively trying to reduce these figs.

# Aurelia-cli task to load and post i18n files from OneSkyApp

## Install

    npm i --save-dev github:hadrienl/aurelia-cli-i18n-oneskly-task

## Configuration

Set OneSky credentials as environment variables :

```
export OS_KEY=YOUR_API_KEY
export OS_SECRET=YOUR_API_SECRET
```

Copy the files `tasks/i18n.js` and `tasks/i18n.json` to your app's aurelia folder : `aurelia_project/tasks`.

Update your `/aurelia_project/aurelia.json` file to add your locales files config. Create a `i18n` property and set the following properties: 

* `langs`: List of langs to  load. Common configuration for all files.
* `files`: List of files to load.
  * `name`: File name in OneSkyApp
  * `projectId`: Project ID in OneSkyApp
  * `rename`: If you want to rename the file in your app filesystem
  * `langs`: List of langs to load for this file only
  * `upload`: Set to `true` if you want this file to be uploaded to OneSky with `au i18n send` command

Exemple: 

```
{
  …
  "i18n": {
    "langs": ["en", "fr"],
    "files": [{
      "name": "translation",
      "projectId": "12345",
      "upload": true
    }, {
      "name": "translation",
      "rename": "other-project-translation",
      "langs": ["en"],
      "projectId": "67890"
    }]
  },
  …
}
```

## Usage

    $ au i18n load

Will load all files in `ì18n` folder.

    $ au i18n send

Will send all files to OneSkyApp.


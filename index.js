const onesky = require('@brainly/onesky-utils');
const fs = require('fs');

let i18nConfig;
let localesPath = `${__dirname}/../../i18n/`;

const {OS_KEY, OS_SECRET} = process.env;

module.exports = function i18n({ config, command, path }, done = () => {}) {
  if (!OS_KEY) {
    console.log('You must specify a valid API key in `OS_KEY` env var');
    return;
  }
  if (!OS_SECRET) {
    console.log('You must specify a valid API secret in `OS_SECRET` env var');
    return;
  }

  i18nConfig = config;
  localesPath = path || localesPath;

  switch (command) {
  case 'send':
    return sendAll().then(() => done());
  case 'load':
    return loadAll().then(() => done());
  default:
    done('You must specify an action : send or load');
  }
};

function loadAll() {
  const promises = [];
  for (let file of i18nConfig.files) {
    const langs = file.langs || i18nConfig.langs;
    for (let lang of langs) {
      promises.push(loadFile({
        projectId: file.projectId,
        file: file.name,
        lang,
        rename: file.rename
      }));
    }
  }
  return Promise.all(promises);
}

function loadFile({ projectId, file, lang, rename }) {
  return onesky.getFile({
    secret: OS_SECRET,
    apiKey: OS_KEY,
    projectId,
    language: lang,
    fileName: `${file}.json`
  })
  .then(content => {
    try {
      content = JSON.parse(content);
    } catch (e) {
      content = null;
    }

    if (!content ||
        !content[lang] ||
        !content[lang].translation) {
      return;
    }

    cleanContent(content);

    content = JSON.stringify(content[lang].translation, null, '  ');

    writeFile({ file: rename || file, lang, content });
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
}

function writeFile({ file, lang, content }) {
  if (!fs.existsSync(`${localesPath}`)) {
    fs.mkdirSync(`${localesPath}`);
  }
  if (!fs.existsSync(`${localesPath}${lang}`)) {
    fs.mkdirSync(`${localesPath}${lang}`);
  }
  fs.writeFileSync(`${localesPath}${lang}/${file}.json`, content, 'utf-8');
}

function sendAll() {
  const promises = [];
  for (let file of i18nConfig.files) {
    const langs = file.langs || i18nConfig.langs;
    if (!file.upload) continue;

    for (let lang of langs) {
      promises.push(postFile({
        projectId: file.projectId,
        file: file.rename || file.name,
        lang,
        rename: file.name
      }));
    }
  }
  return Promise.all(promises);
}

function postFile({ projectId, file, lang, rename }) {
  const path = `${localesPath}/${lang}/${file}.json`;
  if (!fs.existsSync(path)) {
    return;
  }

  file = rename || file;

  let translations = fs.readFileSync(path).toString();
  translations = `{"${lang}": {"translation": ${translations}}}`;

  return onesky.postFile({
    secret: OS_SECRET,
    apiKey: OS_KEY,
    projectId: projectId,
    language: lang,
    fileName: `${file}.json`,
    format: 'I18NEXT_MULTILINGUAL_JSON',
    content: translations,
    keepStrings: false
  })
  .then(() => console.log(`${file}.json - ${lang} sent`))
  .catch(error => console.error(error));
}

function cleanContent(content) {
  for (let key of Object.keys(content)) {
    if (typeof content[key] === 'object') {
      if (Array.isArray(content[key])) {
        content[key] = content[key].join('\n');
      } else {
        cleanContent(content[key]);
      }
    }
  }
}

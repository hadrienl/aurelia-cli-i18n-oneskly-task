import onesky from 'onesky-utils';
import fs from 'fs';
import project from '../aurelia.json';
import {CLIOptions} from 'aurelia-cli';

const i18nConfig = project.i18n;

const {OS_KEY, OS_SECRET} = process.env;

const LOCALES_PATH = `${__dirname}/../../i18n/`;

export default function i18n(project) {
  if (!OS_KEY) {
    console.log('You must specify a valid API key in `OS_KEY` env var');
    return;
  }
  if (!OS_SECRET) {
    console.log('You must specify a valid API secret in `OS_SECRET` env var');
    return;
  }
  switch (CLIOptions.instance.args[0]) {
  case 'send':
    return sendAll();
  case 'load':
    return loadAll();
  default:
    console.log('You must specify an action : send or load');
  }
}

function loadAll() {
  for (let file of i18nConfig.files) {
    const langs = file.langs || i18nConfig.langs;
    for (let lang of langs) {
      loadFile({
        projectId: file.projectId,
        file: file.name,
        lang,
        rename: file.rename
      });
    }
  }
}

function loadFile({ projectId, file, lang, rename }) {
  onesky.getFile({
    secret: OS_SECRET,
    apiKey: OS_KEY,
    projectId,
    language: lang,
    fileName: `${file}.json`
  })
  .then(content => {
    if (!content) {
      throw new Error('no content');
    }
    content = JSON.parse(content);
    if (!content ||
        !content[lang] ||
        !content[lang].translation) {
      return;
    }

    cleanContent(content);

    content = JSON.stringify(content[lang][file], null, '  ');

    writeFile({ file: rename || file, lang, content });
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
}

function writeFile({ file, lang, content }) {
  if (!fs.existsSync(`${LOCALES_PATH}`)) {
    fs.mkdirSync(`${LOCALES_PATH}`);
  }
  if (!fs.existsSync(`${LOCALES_PATH}${lang}`)) {
    fs.mkdirSync(`${LOCALES_PATH}${lang}`);
  }
  fs.writeFileSync(`${LOCALES_PATH}${lang}/${file}.json`, content, 'utf-8');
}

function sendAll() {
  for (let file of i18nConfig.files) {
    const langs = file.langs || i18nConfig.langs;
    if (!file.upload) continue;

    for (let lang of langs) {
      postFile({
        projectId: file.projectId,
        file: file.rename || file.name,
        lang,
        rename: file.name
      });
    }
  }
}

function postFile({ projectId, file, lang, rename }) {
  const path = `${LOCALES_PATH}/${lang}/${file}.json`;
  if (!fs.existsSync(path)) {
    return;
  }

  file = rename || file;

  let translations = fs.readFileSync(path).toString();
  translations = `{"${lang}": {"${file}": ${translations}}}`;

  onesky.postFile({
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

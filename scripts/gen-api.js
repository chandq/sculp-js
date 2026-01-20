const shelljs = require('shelljs');

// shelljs.exec('api-extractor init');
shelljs.rm('-rf', 'docs/markdown/*');
shelljs.exec('api-extractor run --local --verbose');
shelljs.cp('-R', 'temp/sculp-js.api.json', 'docs/input/');
shelljs.cd('docs');
shelljs.exec('api-documenter markdown');
shelljs.cd('..');
shelljs.echo('API docs generated successfully');
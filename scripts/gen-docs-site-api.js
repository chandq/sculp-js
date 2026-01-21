const shelljs = require('shelljs');

// shelljs.exec('api-extractor init');
shelljs.rm('-rf', 'api-docs/markdown/*');
shelljs.exec('api-extractor run --local --verbose');
shelljs.cp('-R', 'temp/sculp-js.api.json', 'api-docs/input/');
shelljs.cd('api-docs');
shelljs.exec('api-documenter markdown');
shelljs.cd('..');
shelljs.echo('API api-docs generated successfully');

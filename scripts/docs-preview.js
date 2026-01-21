const shelljs = require('shelljs');

shelljs.exec('mock-service-cli -b /sculp-js -D ./docs-site/.vitepress/dist');

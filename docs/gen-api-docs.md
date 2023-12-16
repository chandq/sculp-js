# Generate API docs by powerful ts-doc

**require follows-as directory structure by api-documenter**

```text
./docs
  ├── input               # move the `<project-name>.api.json` from temp dir to input dir
  └── markdown            # generate api markdown file by `api-documenter markdown`
  └── temp                # generate by `api-extractor run --local --verbose`
|-- api-extractor.json    # generate by `api-extractor init`
```

## Install globally api-extractor api-documenter

```bash
npm install -g @microsoft/api-extractor @microsoft/api-documenter
```

## Generate markdown steps

1. Init api-extractor

   enter root directory of project

```bash
api-extractor init
```

after exec completely, will generate `api-extractor.json` file

2. generate API JSON file for api markdown

```bash
api-extractor run --local --verbose
```

3. Enter into docs directory

```bash
api-documenter markdown
```

after exec completely, will generate all api markdown file in markdown directory

## Reference documents

1. [API Extractor](https://api-extractor.com/pages/setup/invoking/)
2. [Generating API docs](https://api-extractor.com/pages/setup/generating_docs/)

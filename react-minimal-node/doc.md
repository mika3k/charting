
# Prepare

```console
$ mkdir -p src
$ npm init
$ npm install babel-cli@6 babel-preset-react-app@3
$ npx babel --watch src --out-dir . --presets react-app/prod
```

# Development

Write code using JSX in src/ folder

# Transpile

`npx babel --watch ......` above will start process watching src folder and transpile
.js files in it outputting result to working directory.

# Run

Open file index.html in browser using open file command
or serve index.html and transpiled .js files using
static file server.

.js files are normal scripts (umd) and don't need cors headers from server.

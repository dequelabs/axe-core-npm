# @axe-core/cli

Provides a command line interface for [axe](https://github.com/dequelabs/axe-core) to run quick accessibility tests.

Previous versions of this program were maintained at [dequelabs/axe-cli](https://github.com/dequelabs/axe-cli).

This package does not follow Semantic Versioning (SemVer) but instead uses the major and minor version (but not patch version) of axe-core that the package uses. For example, if the API version is v4.7.2, then the axe-core version used by the package will be v4.7.x. The patch version of this package may include bug fixes and new API features but will not introduce breaking changes.

## Getting Started

Install [Node.js](https://docs.npmjs.com/getting-started/installing-node) if you haven't already. This project requires Node 6+. By default, axe-cli runs Chrome in headless mode, which requires Chrome 59 or up.

Install axe CLI globally: `npm install @axe-core/cli -g`

Lastly, install the webdrivers of the browsers you wish to use. A webdriver is a driver for your web browsers. It allows other programs on your machine to open a browser and operate it.

To install the latest version of Chromedriver globally, install browser-driver-manager: `npm install -g browser-driver-manager`. Then run `npx browser-driver-manager install chrome`.

Current information about other available webdrivers can be found at [selenium-webdriver project](https://www.npmjs.com/package/selenium-webdriver). Alternatively, you could use [Webdriver manager](https://www.npmjs.com/package/webdriver-manager)

## Usage

After installing, you can now run the `axe` command in your CLI, followed by the URL of the page you wish to test:

```
axe https://www.deque.com
```

You can run multiple pages at once, simply add more URLs to the command. Keep in mind that axe-cli is not a crawler, so if you find yourself testing dozens of pages at once, you may want to consider switching over to something like [@axe-core/webdriverjs](https://www.npmjs.com/package/@axe-core/webdriverjs). If you do not specify the protocol, http will be used by default:

```
axe www.deque.com, dequeuniversity.com
```

## Running specific rules

You can use the `--rules` flag to set which rules you wish to run, or you can use `--tags` to tell axe to run all rules that have that specific tag. For example:

```
axe www.deque.com --rules color-contrast,html-has-lang
```

Or, to run all wcag2a rules:

```
axe www.deque.com --tags wcag2a
```

In case you want to disable some rules, you can use `--disable` followed by a list of rules. These will be skipped when analyzing the site:

```
axe www.deque.com --disable color-contrast
```

This option can be combined with either `--tags` or `--rules`.

A list of rules and what tags they have is available at: https://dequeuniversity.com/rules/worldspace/3.0/.

## Saving the results

Results can be saved as JSON data, using the `--save` and `--dir` flags. By passing a filename to `--save` you indicate how the file should be called. If no filename is passed, a default will be used. For example:

```
axe www.deque.com --save deque-site.json
```

Or:

```
axe www.deque.com --dir ./axe-results/
```

## Sending results to STDOUT

To output the test results to STDOUT, provide the `--stdout` flag. This flag has the side-effect of silencing all other logs/output (other than errors, which are written to STDERR).

To print the entire result object to your terminal, do:

```
axe --stdout www.deque.com
```

To pipe the results to a file, do:

```
axe --stdout www.deque.com > your_file.json
```

To pipe the results to a JSON-parsing program for further processing, do:

```
axe --stdout www.deque.com | jq ".[0].violations"
```

## Defining the scope of a test

If you want to only test a specific area of a page, or wish to exclude some part of a page you can do so using the `--include` and `--exclude` flags and pass it a CSS selector:

```
axe www.deque.com --include "#main" --exclude "#aside"
```

You may pass multiple selectors with a comma-delimited string. For example:

```
axe www.deque.com --include "#div1,#div2,#div3"
```

## Custom axe-core versions

Axe-cli will look for locally available versions of axe-core. If the directory from where you start axe-cli has an `axe.js` file, or has a `node_modules` directory with axe-core installed in it. Axe-cli will use this version of axe-core instead of the default version installed globally.

To specify the exact file axe-core file axe-cli should use, you can use the `--axe-source` flag (`-a` for short), with a relative or absolute path to the file.

```
axe www.deque.com --axe-source ./axe.nl.js
```

## Different browsers

Axe-cli can run in a variety of web browsers. By default axe-cli uses Chrome in headless mode. But axe-cli is equally capable of testing pages using other web browsers. **Running in another browser requires that browser's webdriver to be available on your PATH**. You can find a list of available webdrivers and how to install them at: https://www.selenium.dev/documentation/en/webdriver/

To run axe-cli using another browser, pass it in as the `--browser` option:

```
axe www.deque.com --browser chrome
```

Or for short:

```
axe www.deque.com -b c
```

## Custom Chrome Flags

When using the Headless Chrome browser, you may provide any number of [flags to configure how the browser functions](https://peter.sh/experiments/chromium-command-line-switches/).

Options are passed by name, without their leading `--` prefix. For example, to provide the `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage` flags to the Chrome binary, you'd do:

```
axe --chrome-options="no-sandbox,disable-setuid-sandbox,disable-dev-shm-usage" www.deque.com
```

## CI integration

Axe-cli can be ran within the CI tooling for your project. Many tools are automatically configured to halt/fail builds when a process exits with a code of `1`.

Use the `--exit` flag, `-q` for short, to have the axe-cli process exit with a failure code `1` when any rule fails to pass.

```
axe www.deque.com --exit
```

## Timing and timeout

For debugging and managing timeouts, there are two options available. With `--timer` set, axe-cli will log how long it takes to load the page, and how long it takes to run axe-core. If you find the execution of axe-core takes too long, which can happen on very large pages, use `--timeout` to increase the time axe has to test that page:

```
axe www.cnn.com --timeout=120
```

## Delay audit to ensure page is loaded

If you find your page is not ready after axe has determined it has loaded, you can use `--load-delay` followed by a number in milliseconds. This will make axe wait that time before running the audit after the page has loaded.

```
axe www.deque.com --load-delay=2000
```

## Verbose output

To see additional information like test tool name, version and environment details, use the `--verbose` flag, `-v` for short.

```
axe www.deque.com --verbose
```

## ChromeDriver Path

If you need to test your page using an older version of Chrome, you can use `--chromedriver-path` followed by the absolute path to the desired version of the ChromeDriver executable.

```
axe www.deque.com --chromedriver-path="absolute/path/to/chromedriver"
```

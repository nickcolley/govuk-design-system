'use strict'

const paths = require('./paths.js')

const fs = require('fs')
const path = require('path')
const nunjucks = require('nunjucks')
const matter = require('gray-matter')

const beautify = require('js-beautify').html

nunjucks.configure(paths.layouts)

// This helper function takes a path of a file and
// returns the contents as string
exports.getFileContents = path => {
  let fileContents
  try {
    fileContents = fs.readFileSync(path)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(err.message)
    } else {
      throw err
    }
  }
  return fileContents.toString()
}

// This helper function takes a path of a *.md.njk file and
// returns the Nunjucks syntax inside that file without markdown data and imports
exports.getNunjucksCode = path => {
  const fileContents = this.getFileContents(path)

  const parsedFile = matter(fileContents)

  // Omit any `{% extends "foo.njk" %}` nunjucks code, because we extend
  // templates that only exist within the Design System – it's not useful to
  // include this in the code we expect others to copy.
  const content = parsedFile.content
    .replace(
      /{%\s*extends\s*\S*\s*%}\s+/,
      ''
    )
    // Remove empty lines to avoid broken markdown rendering
    .replace(
      /^\s*[\r\n]/gm,
      ''
    )

  return content
}

// This helper function takes a path of a *.md.njk file and
// returns the frontmatter as an object
exports.getFrontmatter = path => {
  const fileContents = this.getFileContents(path)

  const parsedFile = matter(fileContents)
  return parsedFile.data
}

// Get 'fingerprinted' version of a given asset file.
exports.getFingerprint = function (file) {
  // Grab fingerprint array from the template context
  const filePath = this.lookup('path')
  const fingerprints = this.lookup('fingerprint')

  // If that fails, and we know the path of the current file, look for a
  // fingerprinted asset relative to the current file (e.g. `../foo.css`)
  //
  // We only know the path of the current file when we're compiling the layout –
  // calls to this function with a relative path will fail if made from the
  // source files themselves.
  if (!fingerprints[file] && filePath) {
  // Use path.join to correctly join, but metalsmith-fingerprint-ignore
  // always expects forward slashes, so replace any backslashes (Windows)
  // with a forward slashes.
    file = path.join(filePath, file).replace(/\\/g, '/')
  }

  // The thrown error will stop the build, but not provide any useful output,
  // so we have to console.log as well.
  if (!fingerprints[file]) {
    console.log(`Could not find fingerprint for file ${file}`)
    throw new Error(`Could not find fingerprint for file ${file}`)
  }

  // Look for a fingerprinted asset at this path relative to the site root
  return '/' + fingerprints[file]
}

// This helper function takes a path of a *.md.njk file and
// returns the HTML rendered by Nunjucks without markdown data
exports.getHTMLCode = path => {
  const fileContents = this.getFileContents(path)

  const parsedFile = matter(fileContents)
  const content = parsedFile.content

  let html
  try {
    html = nunjucks.renderString(content)
  } catch (err) {
    if (err) {
      console.log('Could not get HTML code from ' + path)
    }
  }

  return beautify(html.trim(), {
    indent_size: 2,
    end_with_newline: false,
    // Remove blank lines
    max_preserve_newlines: 0,
    // set unformatted to a small group of elements, not all inline (the default)
    // otherwise tags like label arent indented properly
    unformatted: ['code', 'pre', 'em', 'strong'],
    // Ensure no empty lines after <head> and <body> tags - this breaks markdown
    // rendering
    extra_liners: []
  })
}

// This helper function takes a path and
// returns the directories found under that path
exports.getDirectories = itemPath => {
  let files
  let directories
  try {
    files = fs.readdirSync(itemPath)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(err.message)
    } else {
      throw err
    }
  }
  if (files) {
    directories = files.filter(filePath => fs.statSync(path.join(itemPath, filePath)).isDirectory())
  }
  return directories
}

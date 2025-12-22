# Webtionary

A TypeScript-based web crawler that uses Puppeteer to systematically discover and index URLs from websites.

## Overview

Webtionary is a breadth-first web crawler that starts from a given URL and recursively discovers all linked pages. It maintains a history of visited URLs and a queue of pages to crawl, while optimizing performance by blocking unnecessary resource types.

## Features

- **Breadth-First Crawling**: Systematically explores websites level by level
- **Duplicate Prevention**: Tracks visited URLs to avoid redundant crawling
- **Resource Optimization**: Blocks images, media, stylesheets, and fonts to speed up crawling
- **Performance Metrics**: Tracks and displays crawling statistics including:
  - Number of iterations
  - Index size (unique URLs discovered)
  - Queue size (URLs pending crawl)
  - Time per page
  - Average crawl time
- **Headless Browser**: Runs in headless mode for efficient background operation

## How It Works

1. **Initialization**: Starts with a seed URL added to the queue
2. **Page Loading**: Opens each URL using Puppeteer with optimized settings
3. **Link Extraction**: Extracts all `href` attributes from anchor tags
4. **Queue Management**: Adds newly discovered URLs to the crawl queue
5. **Deduplication**: Skips URLs already present in history
6. **Statistics**: Logs progress and performance metrics for each iteration

## Performance Considerations

- Request interception blocks unnecessary resources (images, CSS, fonts)
- Uses `domcontentloaded` instead of full page load for faster crawling
- Maintains a set-based history for O(1) duplicate checking
- Closes pages after extracting links to free memory
- Built with Bun for enhanced TypeScript performance

## Example Output
```
--------    Iteration: 1    --------
Index size: 1
Queue size: 15
Found 42 unique URLs.
Elapsed: 1234 ms
Avg time 1000 ms
```

## Limitations

- No robots.txt compliance checking
- No rate limiting (may overwhelm small servers)
- Single-threaded crawling
- No handling of JavaScript-rendered links beyond initial page load
- 7-second timeout may miss slow-loading pages

## Future Enhancements

- Add configurable crawl depth limits
- Implement rate limiting and politeness delays
- Add robots.txt parsing
- Support for authenticated pages
- Export crawl results to various formats (JSON, CSV)
- Multi-threaded/parallel crawling

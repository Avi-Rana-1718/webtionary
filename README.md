# Webtionary

A high-performance web crawler built with Puppeteer Cluster and Bun that indexes web pages and exports results to CSV.

## Features

- **Concurrent Crawling**: Uses puppeteer-cluster for parallel page processing
- **Depth Control**: Limit crawl depth to control exploration scope
- **Index Limiting**: Set maximum number of pages to index
- **Resource Optimization**: Automatically blocks images, media, stylesheets, and fonts
- **CSV Export**: Outputs page titles and URLs to a structured CSV file
- **Domain-Aware**: Maintains depth when crawling within origin domain, resets for external links
- **Duplicate Prevention**: Tracks visited URLs to avoid redundant crawling

## Installation

```bash
bun install puppeteer-cluster
```

### Request Interception

Blocked resource types for faster crawling:
- Images
- Media (video/audio)
- Stylesheets
- Fonts

## Performance Considerations

- **Queue Management**: Tracks queue size to prevent excessive memory usage
- **Timeout**: 7-second timeout per page load
- **Resource Blocking**: Reduces bandwidth and speeds up crawling
- **Duplicate Detection**: Prevents re-crawling visited URLs

## Example Output

```bash
0 1 https://joji.lnk.to/pissinthewind
Index size: 1 | Queue size: 5
1 1 https://spotify.com/track/xyz
Index size: 2 | Queue size: 8
max depth reached 1 https://apple.com/music/xyz
Run duration: 12.34
```

## Limitations

- Only follows HTTP/HTTPS links
- Respects `maxDepth` and `indexLimit` constraints
- Requires pages to have `domcontentloaded` event
- No JavaScript-rendered content waiting beyond initial load

## Error Handling

- **Network Errors**: Logged and skipped
- **Timeout Errors**: Page load timeouts are handled gracefully
- **Non-200 Responses**: Logged and excluded from index

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

## Notes

- The crawler respects depth limits per domain origin
- External links reset the depth counter to 0
- Queue size includes pending URLs not yet visited
- History size represents unique URLs indexed
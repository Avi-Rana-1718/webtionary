import type { Page } from "puppeteer";
import { Cluster } from "puppeteer-cluster";

export class Webtionary {
  private history: Set<string>;
  private cluster!: Cluster;

  private maxDepth: number;
  private indexLimit: number;
  private queueSize: number = 0;

  constructor(seedUrl: string, indexLimit = -1, maxDepth = -1) {
    this.history = new Set();
    this.indexLimit = indexLimit;
    this.maxDepth = maxDepth;
    this.build(seedUrl);
  }

  private async build(seedUrl: string) {
    const startTime = Date.now();
    this.cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE,
      maxConcurrency: 5,
      puppeteerOptions: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      },
    });

    this.cluster.on("taskerror", (err, data) => {
      console.log(`Error crawling ${data}: ${err.message}`);
    });

    this.queueSize++;
    this.cluster.queue([seedUrl, 0], this.crawl.bind(this));

    await this.cluster.idle();
    await this.cluster.close();
    console.log("Run duration:", ((Date.now()-startTime)/1000).toFixed(2));
    
  }

  private async crawl({ page, data }: { page: Page; data: [string, number] }) {
    const url = data[0];
    const currDepth = data[1];
    
    
    // Check if already visited first
    if (this.history.has(url)) return;
    
    // Check limits
    if (this.maxDepth != -1 && currDepth >= this.maxDepth) return;
    if (this.indexLimit != -1 && this.history.size >= this.indexLimit) return;

    this.history.add(url);

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        ["image", "media", "stylesheet", "font"].includes(req.resourceType())
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 7000,
    });
    if (response?.status() != 200) {
      console.log("Error while fetching page");
      this.queueSize--;
      return;
    }

    const hrefs: string[] = await page.$$eval("a[href]", (anchors) => {
      return Array.from(anchors)
        .map((a) => a.href)
        .filter((url): string => url.includes("http"));
    });

    console.log("Index size:", this.history.size, "| Queue size:", this.queueSize);


    // Only queue URLs that haven't been visited
    hrefs.forEach((url) => {
      if(this.queueSize>=this.indexLimit) return;
      if (!this.history.has(url)) {
        this.queueSize++;
        this.cluster.queue([url, currDepth + 1], this.crawl.bind(this));
      }
    });
  }
}

new Webtionary("https://avirana.com", 100);

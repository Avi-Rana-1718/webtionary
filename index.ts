import type { Page } from "puppeteer";
import { Cluster } from "puppeteer-cluster";

export class Webtionary {
  private history: Set<string>;
  private cluster!: Cluster;
  private writer: any;

  private maxDepth: number;
  private indexLimit: number;
  private queueSize: number = 0;

  constructor(seedUrl: string, indexLimit = -1, maxDepth = -1) {
    this.history = new Set();
    this.writer = Bun.file("output.csv").writer();
    this.writer.write("title,url \n");
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
    console.log("Run duration:", ((Date.now() - startTime) / 1000).toFixed(2));
  }

  private async crawl({ page, data }: { page: Page; data: any }) {
    const url = new URL(data[0]);
    const currDepth = Number(data[1]);

    if (this.history.has(url.toString())) return;
    console.log(currDepth, this.maxDepth, url.toString());

    if (this.maxDepth != -1 && currDepth >= this.maxDepth) {
      console.log("max depth reachhed", currDepth, url.toString());
      this.queueSize--;
      return;
      
    };
    if (this.indexLimit != -1 && this.history.size >= this.indexLimit) return;
    this.history.add(url.toString());

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

    const response = await page.goto(url.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 7000,
    });
    if (response?.status() != 200) {
      console.log("Error while fetching page");
      this.queueSize--;
      return;
    }

    const queryData = await page.evaluate(() => ({
      title: document.title,
      hrefs: Array.from(document.querySelectorAll("a[href]"))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((url) => url.includes("http")),
    }));

    this.writer.write(queryData.title + "," + url + " \n");

    console.log(
      "Index size:",
      this.history.size,
      "| Queue size:",
      this.queueSize
    );

    // Only queue URLs that haven't been visited
    queryData.hrefs.forEach((currUrl) => {
      if (this.indexLimit != -1 && this.queueSize >= this.indexLimit) return;
      if (!this.history.has(currUrl)) {
        if (new URL(currUrl).origin == url.origin) {
          if(currDepth+1!=this.maxDepth)
          this.cluster.queue([currUrl, currDepth + 1], this.crawl.bind(this));
        } else {
          this.cluster.queue([currUrl, 0], this.crawl.bind(this));
        }
        this.queueSize++;
      }
    });
  }
}

new Webtionary("https://joji.lnk.to/pissinthewind", -1, 1);

import type { Browser, HTTPRequest, HTTPResponse, Page } from "puppeteer";
import * as puppeteer from "puppeteer";

class Webtionary {
  history: Set<string>;
  private queue: string[];
  private client!: Browser;
  private pageLoader!: Page;
  private totalTime: number;

  constructor(startURL: string) {
    this.history = new Set();
    this.queue = [startURL];
    this.totalTime = 0;
  }

  async loadPuppeteer() {
    this.client = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  }

  async crawl() {
    let i = 0;

    this.client.newPage().then((page) => {
      page.setRequestInterception(true);
      page.on("request", (req: HTTPRequest) => {
        if (
          ["image", "media", "stylesheet", "font"].includes(req.resourceType())
        )
          req.abort();
        else req.continue();
      });
    });
    
    while (this.queue.length > 0) {
      console.log("--------    Iteration:", ++i, "    --------");
      console.log("Index size:", this.history.size);
      console.log("Queue size:", this.queue.length);

      const startTime = Date.now();

      const currUrl = this.queue.shift();
      if (!currUrl) throw new Error("Invalid URL");

      if (this.history.has(currUrl)) {
        console.log("URL already present");
        continue;
      }

      this.history.add(currUrl);
      this.pageLoader = await this.client.newPage();

      const response: HTTPResponse | null = await this.pageLoader.goto(
        currUrl,
        { waitUntil: "domcontentloaded", timeout: 7000 }
      );
      if (response?.status() != 200) {
        console.log("Unable to load page");
        continue;
      }

      const hrefs: string[] = await this.pageLoader.$$eval(
        "a[href]",
        (anchors) => {
          return Array.from(anchors)
            .map((a) => a.href)
            .filter((url): string => url.includes("http"));
        }
      );

      await this.pageLoader.close();

      const uniqueUrls: Set<string> = new Set(hrefs);

      const elapsed = Date.now()-startTime;
      this.totalTime+=elapsed;

      console.log("Found", uniqueUrls.size, "unqiue URLs.");
      console.log("Elapsed:", elapsed, "ms");
      console.log("Avg time", Number(this.totalTime/i).toFixed(1), "ms");
      if (uniqueUrls) this.queue.push(...Array.from(uniqueUrls));
    }
    this.client.close();
  }
}

async function main() {
  const webtionaryClient: Webtionary = new Webtionary("https://avirana.com");
  await webtionaryClient.loadPuppeteer();
  await webtionaryClient.crawl();

  webtionaryClient.history;
}

main();

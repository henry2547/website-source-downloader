import { NextResponse } from 'next/server';
import archiver from 'archiver';
import { PassThrough, Readable } from 'stream'; 
import axios from 'axios';
import { JSDOM } from 'jsdom';
import robotsParser from 'robots-parser';


const MAX_ASSETS = 1000;
const TIMEOUT = 15000;

function sanitizePath(path: string) {
  return path.replace(/^(\.\.[/\\])+/, '').replace(/[^a-zA-Z0-9\-_.\/]/g, '_');
}

async function checkRobotsTxt(url: string) {
  try {
    const base = new URL(url);
    const robotsUrl = `${base.origin}/robots.txt`;
    const res = await axios.get(robotsUrl, { timeout: 3000 });
    const robots = robotsParser(robotsUrl, res.data);
    return robots.isAllowed(url, 'Mozilla/5.0');
  } catch {
    return true; // If robots.txt can't be fetched, allow by default
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const urls: string[] = Array.isArray(body.urls) ? body.urls : [body.url];
    const option = body.option || 'assets';

    // Rate limiting: max 5 URLs per request
    if (urls.length > 5) {
      return NextResponse.json(
        { error: 'Too many URLs in one request.' },
        { status: 429 }
      );
    }

    const passThrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });
    const logs: string[] = [];
    const log = (message: string) => {
      logs.push(message);
      console.log(message);
    };

    archive.pipe(passThrough);

    let assetCount = 0;

    // Asset types configuration
    const assetTypes = [
      { selector: 'link[rel="stylesheet"]', attr: 'href' },
      { selector: 'script[src]', attr: 'src' },
      { selector: 'img[src]', attr: 'src' },
      { selector: 'source[src]', attr: 'src' },
      { selector: 'video[src]', attr: 'src' },
      { selector: 'audio[src]', attr: 'src' },
      { selector: 'a[href]', attr: 'href' }
    ];

    const downloadedUrls = new Set<string>();

    const downloadAsset = async (
      assetUrl: string,
      baseUrl: URL,
      mainDomain: string
    ) => {
      if (assetCount >= MAX_ASSETS) {
        log(`Asset limit reached (${MAX_ASSETS}). Skipping further downloads.`);
        return;
      }
      if (downloadedUrls.has(assetUrl)) {
        log(`Skipping already downloaded: ${assetUrl}`);
        return;
      }
      if (!assetUrl.startsWith(baseUrl.origin)) {
        log(`Skipping asset from different domain: ${assetUrl}`);
        return;
      }
      if (assetUrl.startsWith('data:')) {
        log(`Skipping data URL: ${assetUrl}`);
        return;
      }
      if (!(await checkRobotsTxt(assetUrl))) {
        log(`Blocked by robots.txt: ${assetUrl}`);
        return;
      }
      downloadedUrls.add(assetUrl);

      try {
        const assetResponse = await axios.get(assetUrl, {
          responseType: 'arraybuffer',
          timeout: TIMEOUT,
        });

        assetCount++;
        let assetPath = new URL(assetUrl).pathname;
        assetPath = assetPath === '/' ? 'index.html' : assetPath;
        const normalizedPath = sanitizePath(
          (mainDomain ? `${mainDomain}/` : '') + (assetPath.startsWith('/') ? assetPath.slice(1) : assetPath)
        );

        log(`Downloading asset: ${assetUrl} to ${normalizedPath}`);
        archive.append(Buffer.from(assetResponse.data), { name: normalizedPath });

        // Recursively parse HTML for more assets (only for "full" option)
        if (
          option === 'full' &&
          assetResponse.headers['content-type']?.includes('text/html')
        ) {
          const htmlContent = assetResponse.data.toString();
          const subDom = new JSDOM(htmlContent, { url: assetUrl });
          const subDoc = subDom.window.document;

          for (const { selector, attr } of assetTypes) {
            const elements = Array.from(subDoc.querySelectorAll(selector));
            for (const element of elements) {
              const src = element.getAttribute(attr);
              if (src) {
                const absoluteUrl = new URL(src, assetUrl).toString();
                await downloadAsset(absoluteUrl, baseUrl, mainDomain);
              }
            }
          }
        }
      } catch (error: any) {
        log(`Failed to download ${assetUrl}: ${error.message}`);
      }
    };

    // Download each URL (batch support)
    for (const url of urls) {
      try {
        const baseUrl = new URL(url);
        const mainDomain = baseUrl.hostname;

        log(`Starting download of ${url}`);

        // robots.txt check for main page
        if (!(await checkRobotsTxt(url))) {
          log(`Blocked by robots.txt: ${url}`);
          continue;
        }

        // Download main HTML
        log(`Downloading main page: ${url}`);
        const response = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: TIMEOUT,
        });

        const html = response.data;
        const dom = new JSDOM(html, { url });
        const doc = dom.window.document;

        // Save main page
        let mainPagePath = baseUrl.pathname === '/' ? 'index.html' : baseUrl.pathname;
        mainPagePath = sanitizePath((mainDomain ? `${mainDomain}/` : '') + (mainPagePath.startsWith('/') ? mainPagePath.slice(1) : mainPagePath));
        archive.append(html, { name: mainPagePath });
        log(`Saved main page as ${mainPagePath}`);

        // Only download assets if option is not "html"
        if (option !== 'html') {
          for (const { selector, attr } of assetTypes) {
            const elements = Array.from(doc.querySelectorAll(selector));
            log(`Found ${elements.length} assets of type ${selector} on main page`);
            for (const element of elements) {
              const src = element.getAttribute(attr);
              if (src) {
                const absoluteUrl = new URL(src, url).toString();
                // For "assets" option, only download direct assets (no recursion)
                if (option === 'assets') {
                  await downloadAsset(
                    absoluteUrl,
                    baseUrl,
                    mainDomain
                  );
                } else {
                  // For "full", allow recursion (no depth limit)
                  await downloadAsset(
                    absoluteUrl,
                    baseUrl,
                    mainDomain
                  );
                }
              }
            }
          }
        }
      } catch (error: any) {
        log(`Failed to process ${url}: ${error.message}`);
      }
    }


    await archive.finalize();
    log(`ZIP archive finalized`);
    
    const webStream = new ReadableStream({
      start(controller) {
        passThrough.on('data', (chunk) => controller.enqueue(chunk));
        passThrough.on('end', () => controller.close());
        passThrough.on('error', (err) => controller.error(err));
      }
    });
    
    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="archive.zip"`,
        'X-Asset-Count': assetCount.toString(),
        'X-Log-Count': logs.length.toString(),
      },
    });
  } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
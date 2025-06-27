# 🌐 Website Source Downloader

A Next.js application that lets you download complete website source code (HTML, CSS, JS, images) while preserving the original folder structure.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Next.js](https://img.shields.io/badge/Next.js-13.5+-black?logo=next.js)

## ✨ Features

- **Complete website download** - Gets all assets (HTML, CSS, JS, images)
- **Original structure preserved** - Maintains exact folder/file names
- **Recursive downloading** - Follows and downloads linked pages
- **Progress tracking** - Real-time download logs and progress bar
- **ZIP packaging** - Everything bundled in a single download

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/henry2547/website-source-downloader.git
   cd website-source-downloader

2. **Install dependencies**
    npm install
    # or
    yarn install

3. **Run the development server**
    npm run dev
    # or
    yarn dev

4. **Open in browser**
    http://localhost:3000

## 🖥️ Usage

    Enter a website URL (e.g., https://example.com)
    https://i.imgur.com/JQ1qX9N.png

    Click "Download"

        The app will:

            Download the main HTML page

            Find all linked assets (CSS, JS, images)

            Download each asset recursively

            Preserve original folder structure

    Get your ZIP file
    Contains the complete website structure exactly as on the live site.

## ⚙️ Configuration

Create .env.local file for authentication (optional):
env

# For GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

## 🌟 Example Downloads

Try these test websites:
Website	Type	Good for testing
http://example.com	Static	Basic structure
https://www.w3schools.com/html/	Tutorial	Linked assets
https://getbootstrap.com/docs/5.3/examples/	Framework	CSS/JS heavy
## 📦 Technical Stack

    Frontend: Next.js 13 (App Router), TypeScript, Tailwind CSS

    Backend: Next.js API Routes

    Dependencies:

        axios - HTTP requests

        jsdom - HTML parsing

        archiver - ZIP creation

        next-auth - Authentication

## ⚠️ Limitations

    Cannot download content behind logins

    May miss dynamically loaded content (SPAs)

    Respects robots.txt restrictions

## 📄 License

MIT © [Henry Muchiri]

Happy downloading! 🎉
For issues/feature requests, please open an issue.
text

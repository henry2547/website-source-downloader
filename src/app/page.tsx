"use client";
import { useState } from "react";
import DownloadCard from "./components/DownloadCard";

function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-50">
      <button
        className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
        onClick={() => setOpen(!open)}
        aria-label="Open menu"
      >
        {/* Hamburger icon */}
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <button
            className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              setOpen(false);
              (
                document.getElementById(
                  "about-modal"
                ) as HTMLDialogElement | null
              )?.showModal();
            }}
          >
            About
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              setOpen(false);
              (
                document.getElementById(
                  "contact-modal"
                ) as HTMLDialogElement | null
              )?.showModal();
            }}
          >
            Contact Us
          </button>
        </div>
      )}
    </div>
  );
}

function AboutModal() {
  return (
    <dialog
      id="about-modal"
      className="rounded-xl p-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl"
    >
      <form method="dialog" className="p-6">
        <h1 className="text-xl text-gray-700 dark:text-gray-200 font-bold mb-2">About</h1>
        <p className="mb-4 text-gray-700 dark:text-gray-200">
          Website Source Downloader lets you download the HTML, CSS, JS, and
          images of any public website for offline use or learning purposes. You
          can use it to archive sites, study web development techniques, or
          create offline backups for reference. Simply enter the website URL,
          choose your download options, and get a ZIP file containing the full
          site structure and assets.
        </p>
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          type="submit"
        >
          Close
        </button>
      </form>
    </dialog>
  );
}

function ContactModal() {
  return (
    <dialog
      id="contact-modal"
      className="rounded-xl p-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl"
    >
      <form method="dialog" className="p-6">
        <h2 className="text-xl text-gray-700 dark:text-gray-200 font-bold mb-2">Contact Us</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-200">
          For support or feedback, email us at{" "}
          <a
            href="mailto:henrynjue255@gmail.com"
            className="text-blue-600 underline"
          >
            henrynjue255@gmail.com
          </a>
          . We value your suggestions and are happy to help with any issues or
          questions you may have.
          <br />
          You can also reach out for feature requests or to report bugs. Thank
          you for using Website Source Downloader!
        </p>
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          type="submit"
        >
          Close
        </button>
      </form>
    </dialog>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AboutModal />
      <ContactModal />
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-end">
          <HamburgerMenu />
        </div>
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Website Source Downloader
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Download complete website source code including HTML, CSS, JS, and
            images
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <DownloadCard />
        </div>
      </div>
    </main>
  );
}

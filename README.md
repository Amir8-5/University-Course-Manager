# Course Manager

A modern, responsive Next.js web application for college and university students to track their courses, assignments, tests, and overall GPA. This project features an automatic syllabus parser that leverages LLMs to instantly convert syllabus PDFs and text into structured grading rows.

## Features

- **Dashboard & GPA Visualization**: Clean, purple-accented aesthetics with an SVG donut chart for quick GPA visualization. Follows a streamlined 0.5/1.0 credit system.
- **Syllabus Parser**: Upload your syllabus and let **LlamaParse** and **Groq** automatically extract your grading policy and weighting—formatted accurately to two decimal places.
- **Smart Client-Side PDF Cropping**: Rather than paying for and sending 50 pages of university policies, the app uses `pdf-lib` inside the browser to automatically crop syllabus PDFs to the first few relevant pages.
- **Payload Compression**: Say goodbye to `403 Payload Too Large` errors! The app intercepts network fetching and uses the native `CompressionStream` to safely gzip huge syllabus documents before sending them to the backend API.
- **Rate Limiting & Admin Fallback**: Enforces a strict 1-upload-per-day rate limit per IP to prevent LLM abuse, with a "lock" button allowing the injection of an `ADMIN_TOKEN` to perfectly bypass it for testing.
- **Persistent Local Data**: Your classes, grades, and progress are saved locally in the browser via `zustand`. No accounts required!

## Environment Variables

To run this application locally with the syllabus parsing features, you must create a `.env.local` file in the root of the project with the following keys:

```ini
# Core LLM extraction
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# PDF and File extraction
LLAMA_CLOUD_API_KEY=llx-your_llamacloud_api_key_here

# Used to bypass the 1-per-day upload limit in the UI (Lock Icon)
ADMIN_TOKEN=your_secret_admin_token
```

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **LLM Integrations**: [Groq SDK](https://console.groq.com/), [LlamaParse](https://cloud.llamaindex.ai/)
- **Utilities**: `pdf-lib` (Client-side PDF truncation)

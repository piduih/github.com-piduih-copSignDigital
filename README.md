# PDF Company Stamper (Cop Syarikat Online)

**The Easiest Way to Stamp & Sign PDFs / Cara Paling Mudah Cop Syarikat pada PDF**

A secure, client-side web application that allows users to add company stamps (chops), signatures, and QR codes to PDF documents directly in the browser. No files are uploaded to any server, ensuring 100% privacy.

## ✨ Key Features (Ciri Utama)

*   **🔒 100% Private:** All processing happens in your browser. Files never leave your device.
*   **🖱️ Drag & Drop:** Simply drop your PDF, add your stamp, and download.
*   **🤖 AI-Powered:**
    *   **Smart Suggestions:** Uses Google Gemini / OpenAI to auto-format your address and company details professionally.
    *   **Document Summary:** Summarize PDF content with one click.
*   **📂 Batch Processing:** Stamp 100 files at once and download them as a ZIP.
*   **🎨 Customizable:**
    *   Move stamp position (Drag & Drop).
    *   Add Company Logo.
    *   Add Digital Signature (Type or Upload).
    *   Add QR Codes.

## 🛠️ Tech Stack

*   **Framework:** React 19 (Vite)
*   **Styling:** Tailwind CSS
*   **PDF Manipulation:** `pdf-lib` & `pdf.js`
*   **AI Integration:** Google Gen AI SDK (`@google/genai`) & Custom OpenAI-compatible endpoints.
*   **Icons:** Heroicons (SVG)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/pdf-stamper.git
    cd pdf-stamper
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open your browser:**
    Navigate to `http://localhost:5173`.

## 🤖 AI Configuration (Optional)

To use the AI features (Summarization & Suggestions), you need an API Key:

1.  Click on the **Settings (Gear Icon)** in the app.
2.  Go to **AI Configuration**.
3.  Choose **Google Gemini** (Recommended for free tier) or OpenAI.
4.  Enter your API Key.
    *   Get Gemini Key: [Google AI Studio](https://aistudio.google.com/)

## 📄 License

This project is open-source. Feel free to use it for personal or commercial purposes.

---
**Powered by [afiladesign.com](https://afiladesign.com)**

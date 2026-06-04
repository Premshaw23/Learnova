
//  Install:
//    npm install @langchain/community @langchain/core pdfjs-dist tesseract.js
//
//  Every loader returns  Document[]  — the standard LangChain shape:
//    { pageContent: string, metadata: { source, page, fileType } }
//  This means your TextSplitter and Retriever need zero changes
//  regardless of which loader ran.


import { BaseDocumentLoader }   from "@langchain/core/document_loaders/base";
import { Document }             from "@langchain/core/documents";
import { createWorker }         from "tesseract.js";

let pdfjsLib = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
  ).toString();

  pdfjsLib = pdfjs;
  return pdfjsLib;
}
const SCANNED_CHAR_THRESHOLD = 100;  // chars across first 3 pages — below this = scanned
const OCR_RENDER_SCALE       = 2.0;  // 2x scale improves Tesseract accuracy significantly
const OCR_IMAGE_QUALITY      = 0.90; // JPEG quality for canvas → Tesseract
const MAX_FILE_SIZE_MB       = 20;


/**
 * Load any supported file and return LangChain Documents.
 *
 * @param   {File}      file        File from <input> or drag-drop
 * @param   {Function}  onProgress  ({ stage, page, total, percent }) => void
 * @returns {Promise<Document[]>}   Array of LangChain Document objects
 *
 * @example
 * const docs = await loadDocument(file, ({ stage, percent }) => {
 *   console.log(`${stage} — ${percent}%`);
 * });
 * // docs[0].pageContent  → extracted text of page 1
 * // docs[0].metadata     → { source: "notes.pdf", page: 1, fileType: "pdf-text" }
 */
export async function loadDocument(file, onProgress = () => {}) {
  validateFile(file);

  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "pdf") {
    return await routePDFLoader(file, onProgress);
  }

  if (ext === "txt" || ext === "md") {
    return loadFromText(await file.text(), file.name);
  }

  throw new Error(`".${ext}" is not supported. Upload a PDF, TXT, or MD file.`);
}



async function routePDFLoader(file, onProgress) {
  onProgress({ stage: "Detecting PDF type", page: 0, total: 0, percent: 0 });

  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = await getPdfJs();
const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const isScanned   = await detectScannedPDF(pdf);

  if (isScanned) {
    // Route to our custom LangChain loader
    const loader = new ScannedPDFLoader(file, { onProgress });
    return await loader.load();
  } else {
    // Use LangChain's built-in WebPDFLoader
    return await loadTextPDF(file, onProgress);
  }
}

//  TEXT-BASED PDF  —  WebPDFLoader (LangChain built-in)
//  Returns one Document per page with metadata


async function loadTextPDF(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = await getPdfJs();
const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const docs = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const text = content.items
      .map(item => item.str)
      .join(" ");

    docs.push(
      new Document({
        pageContent: text,
        metadata: {
          source: file.name,
          page: pageNum,
          fileType: "pdf-text",
        },
      })
    );
  }

  return docs;
}
//  SCANNED PDF LOADER  —  Custom LangChain Loader
//
//  Extends BaseDocumentLoader so it plugs into any
//  LangChain pipeline exactly like a built-in loader.
//
//  Pipeline per page:
//    PDF.js renders page → off-screen canvas
//    → Tesseract.js OCR  → pageContent string
//    → wrapped in Document with metadata

export class ScannedPDFLoader extends BaseDocumentLoader {
  /**
   * @param {File}     file
   * @param {Object}   options
   * @param {string}   options.language   Tesseract language code (default: "eng")
   * @param {Function} options.onProgress Progress callback
   */
  constructor(file, options = {}) {
    super();
    this.file       = file;
    this.language   = options.language   ?? "eng";
    this.onProgress = options.onProgress ?? (() => {});
  }

  /**
   * Required by BaseDocumentLoader.
   * Returns Document[] — one per page.
   */
  async load() {
    const arrayBuffer = await this.file.arrayBuffer();
    const pdfjs = await getPdfJs();
const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    // Initialise Tesseract worker once — reused across all pages
    const worker = await createWorker(this.language, 1, {
      logger: () => {},  // suppress Tesseract console noise
    });

    const documents = [];

    try {
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        this.onProgress({
          stage:   "Running OCR",
          page:    pageNum,
          total:   pdf.numPages,
          percent: Math.round((pageNum / pdf.numPages) * 100),
        });

        const pageText = await this._ocrPage(pdf, pageNum, worker);

        // Produce a LangChain Document for this page
        documents.push(
          new Document({
            pageContent: pageText,
            metadata: {
              source:   this.file.name,
              page:     pageNum,
              fileType: "pdf-scanned",
            },
          })
        );
      }
    } finally {
      // Always terminate — frees WASM memory even if an error occurs mid-PDF
      await worker.terminate();
    }

    return documents;
  }

  /**
   * Render one PDF page to canvas and OCR it.
   * @private
   */
  async _ocrPage(pdf, pageNumber, worker) {
    const page     = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: OCR_RENDER_SCALE });

    const canvas  = document.createElement("canvas");
    canvas.width  = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport,
    }).promise;

    const imageData = canvas.toDataURL("image/jpeg", OCR_IMAGE_QUALITY);

    const { data: { text } } = await worker.recognize(imageData);
    return text.trim();
  }
}

/**
 * Wrap a plain text string into LangChain Document shape.
 * Used internally for .txt / .md files and pasted content.
 *
 * @param {string} text
 * @param {string} source  Label shown in metadata (filename or "pasted-content")
 * @returns {Document[]}
 */
export function loadFromText(text, source = "pasted-content") {
  if (!text?.trim()) throw new Error("Text content is empty.");

  return [
    new Document({
      pageContent: text.trim(),
      metadata: { source, page: 1, fileType: "plain-text" },
    }),
  ];
}


/**
 * Load directly pasted text into LangChain Document shape.
 *
 * @param   {string}     rawText
 * @returns {Document[]}
 *
 * @example
 * const docs = loadFromPaste(pastedText);
 */
export function loadFromPaste(rawText) {
  return loadFromText(rawText, "pasted-content");
}


async function detectScannedPDF(pdf) {
  const pagesToSample = Math.min(3, pdf.numPages);
  let totalChars = 0;

  for (let i = 1; i <= pagesToSample; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    totalChars += content.items.reduce((acc, item) => acc + item.str.length, 0);
  }

  return totalChars < SCANNED_CHAR_THRESHOLD;
}

function validateFile(file) {
  if (!file) throw new Error("No file provided.");

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    throw new Error(
      `File is ${sizeMB.toFixed(1)} MB — max allowed is ${MAX_FILE_SIZE_MB} MB.`
    );
  }

  const ext = file.name.split(".").pop().toLowerCase();
  if (!["pdf", "txt", "md"].includes(ext)) {
    throw new Error(`".${ext}" is not supported. Upload a PDF, TXT, or MD file.`);
  }
}
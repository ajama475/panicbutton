import * as pdfjs from "pdfjs-dist/legacy/build/pdf";


pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`;

export interface ParseResult {
  text: string;
  metadata: {
    pages: number;
  };
}

export async function parsePDF(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
        
      fullText += pageText + "\n";
    }

    return {
      text: fullText,
      metadata: { pages: pdf.numPages },
    };
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw error;
  }
}



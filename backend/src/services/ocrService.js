const Tesseract = require("tesseract.js");
const { PDFParse } = require("pdf-parse");

const extractTextFromImageBuffer = async (buffer) => {
  const language = process.env.TESSERACT_LANG || "eng";
  const {
    data: { text, confidence },
  } = await Tesseract.recognize(buffer, language);

  const normalizedConfidence =
    typeof confidence === "number"
      ? Math.max(0, Math.min(1, confidence / 100))
      : null;

  return {
    text: (text || "").trim(),
    confidence: normalizedConfidence,
  };
};

const extractTextFromPdfBuffer = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  await parser.destroy();

  const extractedText = (pdfData?.text || "").trim();

  return {
    text: extractedText,
    confidence: extractedText.length > 0 ? 1 : 0,
  };
};

module.exports = {
  extractTextFromImageBuffer,
  extractTextFromPdfBuffer,
};
import { PDFDocument, PDFPage, PDFFont, StandardFonts, degrees, rgb } from "pdf-lib";
import QRCode from "qrcode";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 32;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  green: rgb(23 / 255, 52 / 255, 34 / 255),
  leaf: rgb(116 / 255, 192 / 255, 68 / 255),
  orange: rgb(226 / 255, 111 / 255, 45 / 255),
  cream: rgb(244 / 255, 239 / 255, 228 / 255),
  paper: rgb(1, 1, 1),
  ink: rgb(30 / 255, 48 / 255, 38 / 255),
  muted: rgb(92 / 255, 108 / 255, 98 / 255),
  line: rgb(216 / 255, 223 / 255, 217 / 255),
};

export type VisitorPassDetails = {
  visitor_name: string;
  reference_id: string;
  dates: string;
  venue: string;
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    font: PDFFont;
    size: number;
    maxWidth: number;
    lineHeight?: number;
    color?: ReturnType<typeof rgb>;
  },
) {
  const lines = wrapText(text, options.font, options.size, options.maxWidth);
  const lineHeight = options.lineHeight ?? options.size * 1.3;
  lines.forEach((line, index) => {
    page.drawText(line, {
      x: options.x,
      y: options.y - index * lineHeight,
      font: options.font,
      size: options.size,
      color: options.color ?? COLORS.ink,
    });
  });
  return options.y - lines.length * lineHeight;
}

function drawLabelValue(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  regular: PDFFont,
  bold: PDFFont,
) {
  page.drawText(label.toUpperCase(), {
    x,
    y,
    font: bold,
    size: 8,
    color: COLORS.muted,
  });

  return drawWrappedText(page, value, {
    x,
    y: y - 17,
    font: bold,
    size: 13,
    maxWidth,
    lineHeight: 17,
    color: COLORS.green,
  });
}

function drawAiaeMark(page: PDFPage, x: number, y: number, bold: PDFFont) {
  page.drawRectangle({
    x,
    y,
    width: 91,
    height: 61,
    color: COLORS.paper,
    borderColor: COLORS.leaf,
    borderWidth: 2,
  });
  page.drawEllipse({ x: x + 17, y: y + 42, xScale: 9, yScale: 15, rotate: degrees(-30), color: COLORS.leaf });
  page.drawLine({ start: { x: x + 12, y: y + 30 }, end: { x: x + 23, y: y + 50 }, thickness: 1.5, color: COLORS.green });
  page.drawText("AIAE", { x: x + 31, y: y + 31, font: bold, size: 20, color: COLORS.green });
  page.drawText("AFRICA 2026", { x: x + 10, y: y + 10, font: bold, size: 7, color: COLORS.orange });
}

export async function createVisitorPassPdf(details: VisitorPassDetails) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(`2026 AIAE Visitor Pass - ${details.reference_id}`);
  pdf.setAuthor("Agri-Africa Exhibition Limited");
  pdf.setSubject("2026 Africa International Agricultural Expo Visitor Pass");
  pdf.setKeywords(["AIAE", "visitor pass", details.reference_id]);
  pdf.setCreator("Agri Africa Expo Registration");

  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: COLORS.cream });
  page.drawRectangle({
    x: MARGIN,
    y: MARGIN,
    width: CONTENT_WIDTH,
    height: PAGE_HEIGHT - MARGIN * 2,
    color: COLORS.paper,
    borderColor: COLORS.green,
    borderWidth: 1.2,
  });

  const headerBottom = 690;
  page.drawRectangle({ x: MARGIN, y: headerBottom, width: CONTENT_WIDTH, height: 119.9, color: COLORS.green });
  drawAiaeMark(page, 52, 735, bold);

  page.drawText("2026 AFRICA INTERNATIONAL", { x: 196, y: 784, font: bold, size: 14, color: COLORS.paper });
  page.drawText("AGRICULTURAL EXPO", { x: 196, y: 762, font: bold, size: 18, color: COLORS.leaf });
  drawWrappedText(page, "Gathering Global Agricultural Wisdom to Promote Modernization of African Agriculture", {
    x: 52,
    y: 715,
    font: regular,
    size: 10,
    maxWidth: 330,
    lineHeight: 13,
    color: COLORS.paper,
  });

  page.drawRectangle({ x: MARGIN, y: 646, width: CONTENT_WIDTH, height: 44, color: COLORS.orange });
  const passTitle = "VISITOR PASS";
  page.drawText(passTitle, {
    x: (PAGE_WIDTH - bold.widthOfTextAtSize(passTitle, 18)) / 2,
    y: 660,
    font: bold,
    size: 18,
    color: COLORS.paper,
  });

  const visitorBottom = 486;
  const dividerX = 310;
  page.drawLine({ start: { x: dividerX, y: visitorBottom }, end: { x: dividerX, y: 646 }, thickness: 1, color: COLORS.line });

  const fullName = details.visitor_name.trim() || "Visitor";
  let detailY = 619;
  detailY = drawLabelValue(page, "Visitor Name", fullName, 55, detailY, 235, regular, bold) - 8;
  detailY = drawLabelValue(page, "Reference ID", details.reference_id, 55, detailY, 235, regular, bold) - 8;

  page.drawText("REGISTRATION STATUS", { x: 55, y: detailY, font: bold, size: 8, color: COLORS.muted });
  page.drawCircle({ x: 62, y: detailY - 24, size: 8, color: COLORS.leaf });
  page.drawLine({ start: { x: 58, y: detailY - 24 }, end: { x: 61, y: detailY - 28 }, thickness: 1.6, color: COLORS.paper });
  page.drawLine({ start: { x: 61, y: detailY - 28 }, end: { x: 67, y: detailY - 19 }, thickness: 1.6, color: COLORS.paper });
  page.drawText("Confirmed", { x: 77, y: detailY - 29, font: bold, size: 13, color: COLORS.green });

  // The QR code is generated dynamically from the same reference ID used by check-in.
  const qrCode = await QRCode.toBuffer(details.reference_id, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 720,
    color: { dark: "#173422", light: "#FFFFFF" },
  });
  const qrImage = await pdf.embedPng(qrCode);
  page.drawImage(qrImage, { x: 373, y: 507, width: 122, height: 122 });
  page.drawText("QR CODE", { x: 414, y: 496, font: bold, size: 8, color: COLORS.orange });

  // Event details section
  page.drawLine({ start: { x: MARGIN, y: visitorBottom }, end: { x: PAGE_WIDTH - MARGIN, y: visitorBottom }, thickness: 1, color: COLORS.green });
  page.drawRectangle({ x: MARGIN, y: 324, width: CONTENT_WIDTH, height: 162, color: rgb(249 / 255, 251 / 255, 249 / 255) });
  page.drawText("EVENT DETAILS", { x: 54, y: 464, font: bold, size: 10, color: COLORS.orange });
  page.drawText("THEME", { x: 54, y: 443, font: bold, size: 7.5, color: COLORS.muted });
  drawWrappedText(page, "Gathering Global Agricultural Wisdom to Promote Modernization of African Agriculture", {
    x: 54, y: 428, font: bold, size: 10.5, maxWidth: 360, lineHeight: 13, color: COLORS.green,
  });
  page.drawText("DATES", { x: 54, y: 395, font: bold, size: 7.5, color: COLORS.muted });
  page.drawText(details.dates, { x: 54, y: 380, font: bold, size: 10.5, color: COLORS.green });
  page.drawText("VENUE", { x: 54, y: 357, font: bold, size: 7.5, color: COLORS.muted });
  drawWrappedText(page, details.venue, {
    x: 54, y: 342, font: bold, size: 10.5, maxWidth: 330, lineHeight: 13, color: COLORS.green,
  });

  // Entry instructions section
  page.drawLine({ start: { x: MARGIN, y: 324 }, end: { x: PAGE_WIDTH - MARGIN, y: 324 }, thickness: 1, color: COLORS.green });
  page.drawText("ENTRY INSTRUCTIONS", { x: 54, y: 302, font: bold, size: 10, color: COLORS.orange });
  const instructions = [
    "Present this Visitor Pass at the registration desk.",
    "Your QR Code will be scanned for entry.",
    "If the QR Code cannot be scanned, your Reference ID will be used for manual verification.",
    "You may present this pass digitally or as a printed copy.",
  ];
  let instructionY = 280;
  instructions.forEach((instruction) => {
    page.drawCircle({ x: 58, y: instructionY + 3, size: 2.2, color: COLORS.leaf });
    const lines = wrapText(instruction, regular, 9.5, 468);
    lines.forEach((line, index) => {
      page.drawText(line, { x: 68, y: instructionY - index * 12, font: regular, size: 9.5, color: COLORS.ink });
    });
    instructionY -= lines.length * 12 + 10;
  });

  // Assistance section
  page.drawLine({ start: { x: MARGIN, y: 164 }, end: { x: PAGE_WIDTH - MARGIN, y: 164 }, thickness: 1, color: COLORS.green });
  page.drawText("NEED ASSISTANCE?", { x: 54, y: 145, font: bold, size: 9, color: COLORS.orange });
  page.drawText("Agri-Africa Exhibition Limited", { x: 54, y: 127, font: bold, size: 10.5, color: COLORS.green });
  page.drawText("Website: www.agriexpo.africa", { x: 54, y: 106, font: regular, size: 9, color: COLORS.ink });
  page.drawText("Email: info@agriexpo.africa", { x: 54, y: 91, font: regular, size: 9, color: COLORS.ink });
  page.drawText("Phone: +254 710 883 625", { x: 54, y: 76, font: regular, size: 9, color: COLORS.ink });

  // Pass validity notice
  page.drawLine({ start: { x: MARGIN, y: 64 }, end: { x: PAGE_WIDTH - MARGIN, y: 64 }, thickness: 1, color: COLORS.green });
  page.drawText("This Visitor Pass is valid only for the registered attendee.", { x: 54, y: 48, font: bold, size: 8.5, color: COLORS.green });
  page.drawText("It is non-transferable and must be presented upon entry.", { x: 54, y: 36, font: regular, size: 8.5, color: COLORS.muted });

  return Buffer.from(await pdf.save());
}

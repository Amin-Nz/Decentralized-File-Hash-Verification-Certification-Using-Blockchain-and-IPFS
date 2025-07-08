// utils/pdfGenerator.js
import jsPDF from 'jspdf';

// Helper function to sanitize text for PDF generation
const sanitizeText = (text) => {
  if (!text) return '';
  
  // Replace problematic Unicode characters
  return text
    .replace(/[\u{1F000}-\u{1F9FF}]/gu, '') // Remove emoji and symbols
    .replace(/[\u{2000}-\u{2FFF}]/gu, '') // Remove general punctuation
    .replace(/[\u{3000}-\u{9FFF}]/gu, '') // Remove CJK characters
    .replace(/[\u{A000}-\u{AFFF}]/gu, '') // Remove other problematic ranges
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '?'); // Replace non-printable chars with ?
};

// Alternative: Keep Unicode but replace only problematic chars
const sanitizeTextPreserveUnicode = (text) => {
  if (!text) return '';
  
  // Only replace the most problematic characters
  return text
    .replace(/[\u{1F000}-\u{1F9FF}]/gu, '[emoji]') // Replace emojis with placeholder
    .replace(/[\u{E000}-\u{F8FF}]/gu, '?') // Replace private use area
    .replace(/[\u{FFF0}-\u{FFFF}]/gu, '?'); // Replace specials
};

export const generateCertificate = async (data) => {
  try {
    const {
      fileInfo,
      hashes,
      ipfsCID,
      txHash,
      walletAddress,
      contractAddress,
      tags,
      notes
    } = data;

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set font to one that supports more characters
    // You might need to load a custom font that supports Unicode
    doc.setFont('helvetica', 'normal');

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('File Integrity Certificate', 20, 30);

    // Certificate info
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45);

    // File Information Section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('File Information:', 20, 65);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    // Sanitize all text fields
    const sanitizedFileName = sanitizeText(fileInfo.name);
    const sanitizedTags = sanitizeText(tags);
    const sanitizedNotes = sanitizeText(notes);

    doc.text(`Name: ${sanitizedFileName}`, 25, 75);
    doc.text(`Size: ${formatFileSize(fileInfo.size)}`, 25, 85);
    doc.text(`Type: ${sanitizeText(fileInfo.type)}`, 25, 95);
    doc.text(`Modified: ${sanitizeText(fileInfo.lastModified)}`, 25, 105);

    // Hash Values Section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Hash Values:', 20, 125);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    let yPos = 135;
    if (hashes.sha256) {
      doc.text('SHA256:', 25, yPos);
      doc.text(hashes.sha256, 25, yPos + 10);
      yPos += 20;
    }
    
    if (hashes.sha1) {
      doc.text('SHA1:', 25, yPos);
      doc.text(hashes.sha1, 25, yPos + 10);
      yPos += 20;
    }
    
    if (hashes.sha512) {
      doc.text('SHA512:', 25, yPos);
      // Split long hash into multiple lines
      const sha512Lines = splitTextToLines(hashes.sha512, 60);
      sha512Lines.forEach((line, index) => {
        doc.text(line, 25, yPos + 10 + (index * 10));
      });
      yPos += 10 + (sha512Lines.length * 10) + 10;
    }

    // Blockchain Information Section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Blockchain Information:', 20, yPos);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    yPos += 10;

    doc.text(`Wallet Address: ${walletAddress}`, 25, yPos);
    yPos += 10;
    doc.text(`Contract Address: ${contractAddress}`, 25, yPos);
    yPos += 10;
    doc.text(`Transaction Hash: ${txHash}`, 25, yPos);
    yPos += 10;

    // IPFS Information (if available)
    if (ipfsCID) {
      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('IPFS Information:', 20, yPos);
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      yPos += 10;
      doc.text(`IPFS CID: ${ipfsCID}`, 25, yPos);
      yPos += 10;
    }

    // Additional Information
    if (sanitizedTags || sanitizedNotes) {
      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Additional Information:', 20, yPos);
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      yPos += 10;
      
      if (sanitizedTags) {
        doc.text(`Tags: ${sanitizedTags}`, 25, yPos);
        yPos += 10;
      }
      
      if (sanitizedNotes) {
        doc.text('Notes:', 25, yPos);
        yPos += 10;
        // Split notes into multiple lines if too long
        const notesLines = splitTextToLines(sanitizedNotes, 70);
        notesLines.forEach((line, index) => {
          doc.text(line, 25, yPos + (index * 10));
        });
        yPos += notesLines.length * 10;
      }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('This certificate verifies the integrity and blockchain registration of the above file.', 20, 280);

    // Save the PDF
    const fileName = `certificate_${sanitizedFileName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate certificate: ${error.message}`);
  }
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Helper function to split text into lines
const splitTextToLines = (text, maxCharsPerLine) => {
  const lines = [];
  let currentLine = '';
  
  for (let i = 0; i < text.length; i++) {
    currentLine += text[i];
    if (currentLine.length >= maxCharsPerLine) {
      lines.push(currentLine);
      currentLine = '';
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import logger from './logger.js';

/**
 * Generate a consent form PDF
 * @param {object} consentData - Consent form data
 * @param {string} consentData.businessName - Business name
 * @param {string} consentData.customerName - Customer name
 * @param {string} consentData.consentType - Type of consent
 * @param {string} consentData.content - Consent form content
 * @param {string} consentData.customerSignature - Customer signature (data URL or text)
 * @param {string} consentData.witnessName - Optional witness name
 * @param {string} consentData.witnessSignature - Optional witness signature
 * @param {Date} consentData.signedAt - Signature date
 * @returns {Promise<string>} - Path to generated PDF
 */
export async function generateConsentPDF(consentData) {
  try {
    const {
      businessName,
      customerName,
      consentType,
      content,
      customerSignature,
      witnessName,
      witnessSignature,
      signedAt
    } = consentData;

    // Ensure uploads/consents directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'consents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate filename
    const timestamp = Date.now();
    const filename = `consent-${consentType.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Pipe to file
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(businessName, { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(16)
      .text('CONSENT FORM', { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Type: ${consentType}`, { align: 'center' })
      .moveDown(1.5);

    // Horizontal line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(1);

    // Customer information
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Customer Information:', { underline: true })
      .moveDown(0.5);

    doc
      .font('Helvetica')
      .text(`Name: ${customerName}`)
      .text(`Date: ${new Date(signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`)
      .moveDown(1.5);

    // Consent content
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Consent Agreement:', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(content, {
        align: 'justify',
        lineGap: 4
      })
      .moveDown(2);

    // Signatures section
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Signatures:', { underline: true })
      .moveDown(1);

    // Customer signature
    const signatureY = doc.y;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Customer Signature:', 50, signatureY);

    // If signature is a data URL (image), you could embed it
    // For now, we'll just display the signature text
    if (customerSignature && customerSignature.startsWith('data:image')) {
      doc
        .fontSize(8)
        .fillColor('gray')
        .text('[Digital Signature]', 50, signatureY + 30)
        .fillColor('black');
    } else {
      doc
        .fontSize(14)
        .font('Helvetica-Oblique')
        .text(customerSignature || customerName, 50, signatureY + 30)
        .font('Helvetica');
    }

    doc
      .moveTo(50, signatureY + 50)
      .lineTo(250, signatureY + 50)
      .stroke();

    // Witness signature (if provided)
    if (witnessName && witnessSignature) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Witness Signature:', 300, signatureY);

      if (witnessSignature.startsWith('data:image')) {
        doc
          .fontSize(8)
          .fillColor('gray')
          .text('[Digital Signature]', 300, signatureY + 30)
          .fillColor('black');
      } else {
        doc
          .fontSize(14)
          .font('Helvetica-Oblique')
          .text(witnessSignature || witnessName, 300, signatureY + 30)
          .font('Helvetica');
      }

      doc
        .moveTo(300, signatureY + 50)
        .lineTo(500, signatureY + 50)
        .stroke();

      doc
        .fontSize(8)
        .text(witnessName, 300, signatureY + 55);
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor('gray')
      .text(
        `This is a digitally signed consent form. Generated on ${new Date().toLocaleDateString('en-US')}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );

    // Finalize PDF
    doc.end();

    // Wait for file to be written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    logger.info(`✅ Generated consent PDF: ${filename}`);

    return filePath;
  } catch (error) {
    logger.error(`❌ Failed to generate consent PDF: ${error.message}`);
    throw new Error(`Failed to generate consent PDF: ${error.message}`);
  }
}

/**
 * Generate a clinical note PDF (for export purposes)
 * @param {object} noteData - Clinical note data
 * @returns {Promise<string>} - Path to generated PDF
 */
export async function generateClinicalNotePDF(noteData) {
  try {
    const {
      businessName,
      patientName,
      practitionerName,
      noteDate,
      diagnosis,
      treatment,
      notes,
      followUp
    } = noteData;

    const uploadsDir = path.join(process.cwd(), 'uploads', 'clinical-notes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `clinical-note-${timestamp}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(businessName, { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(14)
      .text('CLINICAL NOTE', { align: 'center' })
      .moveDown(1.5);

    // Patient info
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Patient Information:')
      .moveDown(0.3);

    doc
      .font('Helvetica')
      .text(`Patient: ${patientName}`)
      .text(`Practitioner: ${practitionerName}`)
      .text(`Date: ${new Date(noteDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`)
      .moveDown(1.5);

    // Diagnosis
    if (diagnosis) {
      doc
        .font('Helvetica-Bold')
        .text('Diagnosis:')
        .moveDown(0.3);

      doc
        .font('Helvetica')
        .text(diagnosis, { align: 'justify' })
        .moveDown(1);
    }

    // Treatment
    if (treatment) {
      doc
        .font('Helvetica-Bold')
        .text('Treatment:')
        .moveDown(0.3);

      doc
        .font('Helvetica')
        .text(treatment, { align: 'justify' })
        .moveDown(1);
    }

    // Notes
    if (notes) {
      doc
        .font('Helvetica-Bold')
        .text('Notes:')
        .moveDown(0.3);

      doc
        .font('Helvetica')
        .text(notes, { align: 'justify' })
        .moveDown(1);
    }

    // Follow-up
    if (followUp) {
      doc
        .font('Helvetica-Bold')
        .text('Follow-up Instructions:')
        .moveDown(0.3);

      doc
        .font('Helvetica')
        .text(followUp, { align: 'justify' });
    }

    // Footer - HIPAA warning
    doc
      .fontSize(8)
      .fillColor('red')
      .text(
        '⚠️ CONFIDENTIAL - Protected Health Information (PHI). Unauthorized disclosure is prohibited.',
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    logger.info(`✅ Generated clinical note PDF: ${filename}`);

    return filePath;
  } catch (error) {
    logger.error(`❌ Failed to generate clinical note PDF: ${error.message}`);
    throw new Error(`Failed to generate clinical note PDF: ${error.message}`);
  }
}

export default {
  generateConsentPDF,
  generateClinicalNotePDF
};

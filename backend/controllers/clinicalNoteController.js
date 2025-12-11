import ClinicalNote from '../models/ClinicalNote.js';
import Salon from '../models/Salon.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Clinical Notes Controller
 * For Medical Aesthetics / Physiotherapy
 * ⚠️ HIPAA COMPLIANCE: All PHI access is logged
 */

// ==================== CREATE CLINICAL NOTE ====================
export const createClinicalNote = async (req, res) => {
  try {
    const {
      salonId,
      customerId,
      bookingId,
      noteType,
      subject,
      content, // Plain text - will be encrypted
      treatmentDate,
      accessLevel,
      consentFormId
    } = req.body;

    const userId = req.user.id;

    // Verify salon has HIPAA enabled
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (!salon.compliance?.hipaaEnabled) {
      return res.status(403).json({
        success: false,
        message: 'HIPAA compliance not enabled for this business'
      });
    }

    // Verify practitioner is authorized
    const isOwner = salon.owner.toString() === userId;
    // TODO: Check if user is authorized practitioner
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Create clinical note with encrypted content
    const clinicalNote = new ClinicalNote({
      salonId,
      customerId,
      bookingId,
      practitionerId: userId,
      noteType,
      subject,
      treatmentDate: treatmentDate || new Date(),
      accessLevel: accessLevel || 'restricted',
      consentFormId,
      hipaaCompliant: true
    });

    // Encrypt the content
    clinicalNote.encryptContent(content);

    await clinicalNote.save();

    // Log PHI creation in audit log
    await AuditLog.create({
      userId,
      action: 'PHI_CREATE',
      category: 'phi',
      description: 'Created clinical note',
      resourceType: 'clinical-note',
      resourceId: clinicalNote._id,
      isPHIAccess: true,
      phiAccessDetails: {
        patientId: customerId,
        dataType: 'clinical-note',
        accessReason: 'create',
        justification: `Created ${noteType} note`
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(201).json({
      success: true,
      message: 'Clinical note created (encrypted)',
      clinicalNote: {
        _id: clinicalNote._id,
        noteType: clinicalNote.noteType,
        subject: clinicalNote.subject,
        treatmentDate: clinicalNote.treatmentDate,
        createdAt: clinicalNote.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating clinical note:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET CLINICAL NOTE (DECRYPT) ====================
export const getClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { accessReason, justification } = req.query;

    const clinicalNote = await ClinicalNote.findById(id)
      .populate('practitionerId', 'name email')
      .populate('customerId', 'name email');

    if (!clinicalNote) {
      return res.status(404).json({ success: false, message: 'Clinical note not found' });
    }

    // Verify authorization
    const salon = await Salon.findById(clinicalNote.salonId);
    const isOwner = salon.owner.toString() === userId;
    const isPractitioner = clinicalNote.practitionerId._id.toString() === userId;

    if (!isOwner && !isPractitioner) {
      // Check if shared with user
      const sharedAccess = clinicalNote.sharedWith.find(
        share => share.userId.toString() === userId &&
          (!share.expiresAt || share.expiresAt > new Date())
      );

      if (!sharedAccess) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to PHI' });
      }
    }

    // Decrypt content
    let decryptedContent;
    try {
      decryptedContent = clinicalNote.decryptContent();
    } catch (error) {
      console.error('Decryption failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to decrypt clinical note'
      });
    }

    // Log PHI access in audit log
    await AuditLog.create({
      userId,
      action: 'PHI_ACCESS',
      category: 'phi',
      description: 'Accessed clinical note',
      resourceType: 'clinical-note',
      resourceId: clinicalNote._id,
      isPHIAccess: true,
      phiAccessDetails: {
        patientId: clinicalNote.customerId._id,
        dataType: 'clinical-note',
        accessReason: accessReason || 'view',
        justification: justification || 'Practitioner access'
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      clinicalNote: {
        ...clinicalNote.toObject(),
        content: decryptedContent,
        encryptedContent: undefined,
        encryptedIV: undefined,
        encryptedAuthTag: undefined
      }
    });
  } catch (error) {
    console.error('Error getting clinical note:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET PATIENT CLINICAL NOTES ====================
export const getPatientClinicalNotes = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.user.id;
    const { salonId, noteType } = req.query;

    // Verify authorization
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    const isOwner = salon.owner.toString() === userId;
    // TODO: Check if user is authorized practitioner
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const query = {
      salonId,
      customerId,
      deletedAt: null
    };

    if (noteType) query.noteType = noteType;

    const clinicalNotes = await ClinicalNote.find(query)
      .sort({ treatmentDate: -1 })
      .populate('practitionerId', 'name email')
      .select('-encryptedContent -encryptedIV -encryptedAuthTag')
      .lean();

    // Log batch PHI access
    await AuditLog.create({
      userId,
      action: 'PHI_BATCH_ACCESS',
      category: 'phi',
      description: `Accessed ${clinicalNotes.length} clinical notes for patient`,
      resourceType: 'clinical-note',
      isPHIAccess: true,
      phiAccessDetails: {
        patientId: customerId,
        dataType: 'clinical-note',
        accessReason: 'patient-history-review',
        justification: 'Reviewing patient history'
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      clinicalNotes
    });
  } catch (error) {
    console.error('Error getting patient clinical notes:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPDATE CLINICAL NOTE ====================
export const updateClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, content, noteType, accessLevel } = req.body;
    const userId = req.user.id;

    const clinicalNote = await ClinicalNote.findById(id);
    if (!clinicalNote) {
      return res.status(404).json({ success: false, message: 'Clinical note not found' });
    }

    // Verify authorization
    if (clinicalNote.practitionerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Track changes for audit
    const previousValues = {
      subject: clinicalNote.subject,
      noteType: clinicalNote.noteType,
      accessLevel: clinicalNote.accessLevel
    };

    // Update fields
    if (subject) clinicalNote.subject = subject;
    if (noteType) clinicalNote.noteType = noteType;
    if (accessLevel) clinicalNote.accessLevel = accessLevel;

    // Re-encrypt content if provided
    if (content) {
      clinicalNote.encryptContent(content);
    }

    await clinicalNote.save();

    // Log update in audit log
    await AuditLog.create({
      userId,
      action: 'PHI_UPDATE',
      category: 'phi',
      description: 'Updated clinical note',
      resourceType: 'clinical-note',
      resourceId: clinicalNote._id,
      isPHIAccess: true,
      phiAccessDetails: {
        patientId: clinicalNote.customerId,
        dataType: 'clinical-note',
        accessReason: 'update',
        justification: 'Updated clinical note'
      },
      previousValues,
      newValues: {
        subject: clinicalNote.subject,
        noteType: clinicalNote.noteType,
        accessLevel: clinicalNote.accessLevel
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      message: 'Clinical note updated',
      clinicalNote: {
        _id: clinicalNote._id,
        subject: clinicalNote.subject,
        noteType: clinicalNote.noteType,
        updatedAt: clinicalNote.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating clinical note:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== DELETE CLINICAL NOTE ====================
export const deleteClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const clinicalNote = await ClinicalNote.findById(id);
    if (!clinicalNote) {
      return res.status(404).json({ success: false, message: 'Clinical note not found' });
    }

    // Verify authorization (only practitioner or owner)
    const salon = await Salon.findById(clinicalNote.salonId);
    const isOwner = salon.owner.toString() === userId;
    const isPractitioner = clinicalNote.practitionerId.toString() === userId;

    if (!isOwner && !isPractitioner) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Soft delete
    clinicalNote.deletedAt = new Date();
    clinicalNote.deletedBy = userId;
    await clinicalNote.save();

    // Log deletion in audit log
    await AuditLog.create({
      userId,
      action: 'PHI_DELETE',
      category: 'phi',
      description: 'Deleted clinical note',
      resourceType: 'clinical-note',
      resourceId: clinicalNote._id,
      isPHIAccess: true,
      phiAccessDetails: {
        patientId: clinicalNote.customerId,
        dataType: 'clinical-note',
        accessReason: 'delete',
        justification: 'Soft deleted clinical note'
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      message: 'Clinical note deleted'
    });
  } catch (error) {
    console.error('Error deleting clinical note:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== SHARE CLINICAL NOTE ====================
export const shareClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { shareWithUserId, expiresInDays } = req.body;
    const userId = req.user.id;

    const clinicalNote = await ClinicalNote.findById(id);
    if (!clinicalNote) {
      return res.status(404).json({ success: false, message: 'Clinical note not found' });
    }

    // Verify authorization
    if (clinicalNote.practitionerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Calculate expiration
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    clinicalNote.sharedWith.push({
      userId: shareWithUserId,
      sharedAt: new Date(),
      expiresAt
    });

    await clinicalNote.save();

    return res.json({
      success: true,
      message: 'Clinical note shared'
    });
  } catch (error) {
    console.error('Error sharing clinical note:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

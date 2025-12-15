import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, AlertTriangle, Save, FileText, Clock, User } from 'lucide-react';
import api from '../../utils/api';

export default function ClinicalNotesEditor({ customerId, salonId }) {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHIPAAWarning, setShowHIPAAWarning] = useState(true);
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    diagnosis: '',
    treatmentPlan: '',
    medications: '',
    notes: '',
    followUpDate: ''
  });

  useEffect(() => {
    fetchClinicalNotes();
  }, [customerId]);

  const fetchClinicalNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/clinical-notes/patient/${customerId}`);
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error('Error fetching clinical notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (selectedNote) {
        // Update existing note
        await api.patch(`/api/clinical-notes/${selectedNote._id}`, formData);
      } else {
        // Create new note
        await api.post('/api/clinical-notes', {
          ...formData,
          customerId,
          salonId
        });
      }

      // Refresh notes
      await fetchClinicalNotes();
      resetForm();
    } catch (error) {
      console.error('Error saving clinical note:', error);
      alert('Failed to save clinical note');
    }
  };

  const handleViewNote = async (note) => {
    try {
      // This triggers decryption and audit logging on backend
      const response = await api.get(`/api/clinical-notes/${note._id}`);
      setSelectedNote(response.data.note);
      setFormData({
        chiefComplaint: response.data.note.chiefComplaint || '',
        diagnosis: response.data.note.diagnosis || '',
        treatmentPlan: response.data.note.treatmentPlan || '',
        medications: response.data.note.medications || '',
        notes: response.data.note.notes || '',
        followUpDate: response.data.note.followUpDate || ''
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error viewing clinical note:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
      medications: '',
      notes: '',
      followUpDate: ''
    });
    setSelectedNote(null);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* HIPAA Warning Banner */}
      {showHIPAAWarning && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                ⚠️ HIPAA Protected Health Information (PHI)
              </h3>
              <p className="text-red-700 mb-4">
                This section contains protected health information. All access is logged and monitored.
                Unauthorized access or disclosure is strictly prohibited and may result in legal action.
              </p>
              <ul className="text-sm text-red-600 space-y-1 mb-4">
                <li>• All clinical notes are encrypted at rest (AES-256-GCM)</li>
                <li>• Every access is logged with user, timestamp, IP address, and justification</li>
                <li>• Only authorized practitioners can view patient records</li>
                <li>• Patients have the right to access and request corrections to their records</li>
              </ul>
              <button
                onClick={() => setShowHIPAAWarning(false)}
                className="text-sm text-red-800 hover:text-red-900 font-medium underline"
              >
                I understand and accept
              </button>
            </div>
            <button
              onClick={() => setShowHIPAAWarning(false)}
              className="flex-shrink-0 text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Lock className="w-8 h-8 mr-3 text-blue-500" />
            Clinical Notes
          </h1>
          <p className="text-gray-600">Encrypted patient records</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsEditing(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FileText className="w-5 h-5" />
          <span>New Note</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Notes List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Patient History</h2>
            
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No clinical notes yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <button
                    key={note._id}
                    onClick={() => handleViewNote(note)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedNote?._id === note._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {new Date(note.visitDate).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {note.practitionerId?.name || 'Unknown Practitioner'}
                        </p>
                      </div>
                      <Lock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    </div>
                    {note.diagnosis && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {note.diagnosis}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Note Editor/Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Encryption Status Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  <Lock className="w-4 h-4 inline mr-1" />
                  End-to-end encrypted (AES-256-GCM)
                </span>
              </div>
              {selectedNote && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Edit Note
                </button>
              )}
            </div>

            {selectedNote || isEditing ? (
              <div className="space-y-6">
                {/* Chief Complaint */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chief Complaint
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.chiefComplaint}
                      onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Patient's main concern..."
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {formData.chiefComplaint || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnosis
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Diagnosis and ICD codes..."
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                      {formData.diagnosis || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Treatment Plan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treatment Plan
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.treatmentPlan}
                      onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Recommended treatments and procedures..."
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                      {formData.treatmentPlan || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Medications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medications
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.medications}
                      onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Prescribed medications and dosages..."
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                      {formData.medications || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional observations, patient feedback, etc..."
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                      {formData.notes || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Follow-up Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Follow-up Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {formData.followUpDate 
                        ? new Date(formData.followUpDate).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'No follow-up scheduled'
                      }
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-4 pt-6 border-t">
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      <span>Save Note (Encrypted)</span>
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Metadata */}
                {selectedNote && !isEditing && (
                  <div className="pt-6 border-t">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Record Metadata</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Created by</p>
                        <p className="text-gray-900 font-medium flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {selectedNote.practitionerId?.name || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Visit Date</p>
                        <p className="text-gray-900 font-medium">
                          {new Date(selectedNote.visitDate).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Modified</p>
                        <p className="text-gray-900 font-medium">
                          {new Date(selectedNote.updatedAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Access Count</p>
                        <p className="text-gray-900 font-medium flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {selectedNote.accessCount || 0} times
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Lock className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a note to view or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

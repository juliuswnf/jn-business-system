import { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, XCircle, AlertTriangle, Download, Upload, Edit, Eye, FileSignature } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

/**
 * Consent Form Flow Component
 * Digital consent forms with signature capture for HIPAA compliance
 */
export default function ConsentFormFlow({ customerId, businessType }) {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const signatureRef = useRef(null);

  useEffect(() => {
    fetchForms();
  }, [customerId]);

  const fetchForms = async () => {
    try {
      const response = await fetch(`/api/consent-forms/customer/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setForms(data.forms);
      }
    } catch (error) {
      console.error('Failed to fetch consent forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignForm = async (e) => {
    e.preventDefault();

    if (signatureRef.current.isEmpty()) {
      alert('Please provide a signature');
      return;
    }

    const formData = new FormData(e.target);
    const signatureData = signatureRef.current.toDataURL();

    try {
      const response = await fetch('/api/consent-forms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId,
          formType: formData.get('formType'),
          formTitle: formData.get('formTitle'),
          formContent: formData.get('formContent'),
          signature: signatureData,
          customerName: formData.get('customerName'),
          customerEmail: formData.get('customerEmail'),
          customerConsent: formData.get('customerConsent') === 'on'
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowSignModal(false);
        fetchForms();
        alert('Consent form signed successfully');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to sign form:', error);
      alert('Failed to sign form');
    }
  };

  const handleRevokeConsent = async () => {
    const reason = document.getElementById('revocationReason').value;

    if (!reason || reason.length < 10) {
      alert('Please provide a detailed reason for revocation (min 10 characters)');
      return;
    }

    try {
      const response = await fetch(`/api/consent-forms/${selectedForm._id}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      if (data.success) {
        setShowRevokeModal(false);
        setSelectedForm(null);
        fetchForms();
        alert('Consent revoked successfully');
      }
    } catch (error) {
      console.error('Failed to revoke consent:', error);
      alert('Failed to revoke consent');
    }
  };

  const clearSignature = () => {
    signatureRef.current.clear();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'revoked': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5" />;
      case 'revoked': return <XCircle className="w-5 h-5" />;
      case 'expired': return <AlertTriangle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getFormTemplates = () => {
    const templates = {
      'medical-aesthetics': [
        {
          type: 'treatment_consent',
          title: 'Treatment Consent Form',
          content: `I hereby consent to the medical aesthetic treatment(s) described below. I understand the procedure, risks, benefits, and alternatives have been explained to me.

Procedure: [To be specified]
Provider: [Provider name]

RISKS: Bruising, swelling, allergic reaction, infection, asymmetry, unsatisfactory results
BENEFITS: Improved appearance, enhanced confidence
ALTERNATIVES: Non-treatment, alternative procedures

I acknowledge:
1. I have disclosed all medical conditions and medications
2. I understand there are no guarantees of results
3. I will follow all post-treatment instructions
4. I understand additional treatments may be needed

I consent to photographs being taken for medical records purposes only.`
        },
        {
          type: 'hipaa_authorization',
          title: 'HIPAA Authorization for Release of PHI',
          content: `I authorize [Practice Name] to use and disclose my Protected Health Information (PHI) for the following purposes:

PURPOSE: Treatment, payment, healthcare operations

INFORMATION TO BE DISCLOSED:
☐ Medical records
☐ Clinical notes
☐ Diagnostic images
☐ Treatment history
☐ Billing information

This authorization expires: [Date or Event]

I understand:
1. I have the right to revoke this authorization at any time
2. Treatment will not be conditioned on signing this authorization
3. Information disclosed may be subject to re-disclosure
4. I may inspect or receive a copy of information disclosed

RIGHT TO REVOKE: I may revoke this authorization in writing at any time by contacting the Privacy Officer.`
        }
      ],
      'personal-training': [
        {
          type: 'liability_waiver',
          title: 'Fitness Training Liability Waiver',
          content: `ASSUMPTION OF RISK AND WAIVER OF LIABILITY

I, the undersigned, acknowledge that physical exercise involves inherent risks including but not limited to:
- Muscle soreness, strain, sprains
- Joint pain or injury
- Cardiovascular events
- Equipment-related injuries

I HEREBY:
1. Assume all risks associated with participation in fitness training
2. Waive any claims against [Business Name], trainers, and staff
3. Release from liability for injuries sustained during training
4. Acknowledge I have disclosed all relevant health conditions
5. Confirm I am physically capable of participating

MEDICAL CLEARANCE: I confirm I have consulted a physician if I have any medical conditions, or I waive the requirement for medical clearance.

EMERGENCY: I authorize staff to seek emergency medical treatment on my behalf if needed.`
        },
        {
          type: 'photo_consent',
          title: 'Progress Photo & Marketing Consent',
          content: `CONSENT FOR PHOTOGRAPHY AND USE OF IMAGES

I consent to having progress photographs taken for the following purposes:

☐ Training progress tracking (private, medical records only)
☐ Marketing materials (website, social media, promotional materials)
☐ Before/after portfolio (anonymized or identified)

USAGE RIGHTS:
- Grant [Business Name] a non-exclusive, royalty-free license to use images
- Understand images may be edited or cropped
- Retain right to request removal from marketing materials

PRIVACY:
☐ Name may be used
☐ First name only
☐ No identifying information (anonymous)

I understand I may revoke this consent at any time in writing.`
        }
      ],
      'tattoo-piercing': [
        {
          type: 'tattoo_consent',
          title: 'Tattoo/Piercing Consent & Aftercare',
          content: `INFORMED CONSENT FOR BODY ART

I consent to receive a tattoo/piercing at [Studio Name].

ACKNOWLEDGMENTS:
1. I am at least 18 years of age (or have parental consent)
2. I am not under the influence of alcohol or drugs
3. I do not have any health conditions that contraindicate body art
4. I have reviewed and approved the design/placement
5. I understand tattoos/piercings are permanent modifications

HEALTH SCREENING - I confirm I DO NOT have:
☐ Blood disorders (hemophilia, clotting disorders)
☐ Skin conditions (psoriasis, eczema at site)
☐ Diabetes (uncontrolled)
☐ Immunocompromised conditions
☐ Allergies to inks/metals/latex
☐ Pregnancy

RISKS: Infection, allergic reaction, scarring, keloids, bleeding, nerve damage, unsatisfactory results

AFTERCARE: I will follow all aftercare instructions provided and understand healing is my responsibility.

PHOTO CONSENT: ☐ Yes ☐ No - I consent to photos for portfolio/social media`
        }
      ],
      'spa-wellness': [
        {
          type: 'spa_treatment_consent',
          title: 'Spa Treatment Consent Form',
          content: `SPA TREATMENT CONSENT

Treatment(s): [To be specified]
Date: [Date]

MEDICAL HISTORY DISCLOSURE:
Please indicate if you have any of the following:
☐ Pregnancy
☐ Heart conditions
☐ High/low blood pressure
☐ Skin sensitivities or allergies
☐ Recent surgery or injuries
☐ Medications (list): _________________

I acknowledge:
1. I have accurately disclosed my medical history
2. I understand the spa treatments are for relaxation/wellness, not medical treatment
3. I will inform my therapist of any discomfort during treatment
4. I understand risks may include allergic reactions, skin irritation, or muscle soreness

CANCELLATION POLICY: I understand cancellations within 24 hours may incur a fee.

PHOTO/TESTIMONIAL CONSENT: ☐ Yes ☐ No - I consent to photos/testimonials for marketing`
        }
      ]
    };

    return templates[businessType] || templates['medical-aesthetics'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-blue-600" />
            Consent Forms
          </h1>
          <p className="text-gray-600 mt-2">Digital consent management with e-signatures</p>
        </div>
        <button
          onClick={() => setShowSignModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileSignature className="w-5 h-5" />
          Sign New Form
        </button>
      </div>

      {/* Forms List */}
      <div className="grid grid-cols-1 gap-6">
        {forms.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No consent forms on file</p>
            <button
              onClick={() => setShowSignModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign your first consent form
            </button>
          </div>
        ) : (
          forms.map((form) => (
            <div
              key={form._id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getStatusColor(form.status)}`}>
                    {getStatusIcon(form.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{form.formTitle}</h3>
                    <p className="text-sm text-gray-600 mt-1">{form.formType.replace(/_/g, ' ')}</p>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Signed:</span> {new Date(form.signedDate).toLocaleDateString()}
                      </div>
                      {form.expirationDate && (
                        <div>
                          <span className="font-medium">Expires:</span> {new Date(form.expirationDate).toLocaleDateString()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">IP:</span> {form.ipAddress}
                      </div>
                    </div>

                    {form.status === 'revoked' && form.revokedDate && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Revoked:</strong> {new Date(form.revokedDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          <strong>Reason:</strong> {form.revocationReason}
                        </p>
                      </div>
                    )}

                    {form.status === 'expired' && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg inline-flex">
                        <AlertTriangle className="w-4 h-4" />
                        <span>This consent has expired. Please sign a new form.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedForm(form)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View form"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => window.open(`/api/consent-forms/${form._id}/pdf`, '_blank')}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  {form.status === 'active' && (
                    <button
                      onClick={() => {
                        setSelectedForm(form);
                        setShowRevokeModal(true);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Revoke Consent
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sign Form Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 my-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sign Consent Form</h3>
            
            <form onSubmit={handleSignForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Type
                </label>
                <select
                  name="formType"
                  required
                  onChange={(e) => {
                    const template = getFormTemplates().find(t => t.type === e.target.value);
                    if (template) {
                      document.getElementById('formTitle').value = template.title;
                      document.getElementById('formContent').value = template.content;
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select form type...</option>
                  {getFormTemplates().map((template) => (
                    <option key={template.type} value={template.type}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Title
                </label>
                <input
                  type="text"
                  id="formTitle"
                  name="formTitle"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Content (Scroll to read entire form)
                </label>
                <textarea
                  id="formContent"
                  name="formContent"
                  rows={12}
                  required
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 font-mono text-sm"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signature
                </label>
                <div className="border-2 border-gray-300 rounded-lg bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: 700,
                      height: 200,
                      className: 'signature-canvas'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear Signature
                </button>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="customerConsent"
                  name="customerConsent"
                  required
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="customerConsent" className="text-sm text-gray-700">
                  I have read and understood the above consent form. I acknowledge that I have had the opportunity to ask questions and all my questions have been answered to my satisfaction. I voluntarily agree to the treatment/services described in this consent form.
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignModal(false);
                    clearSignature();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Consent Modal */}
      {showRevokeModal && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Revoke Consent</h3>
            
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                You are about to revoke consent for: <strong>{selectedForm.formTitle}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Revocation *
                </label>
                <textarea
                  id="revocationReason"
                  rows={4}
                  required
                  placeholder="Please provide a detailed reason for revoking this consent..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
                <p className="text-xs text-gray-600 mt-1">Minimum 10 characters required</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRevokeModal(false);
                    setSelectedForm(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeConsent}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Revoke Consent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Form Modal */}
      {selectedForm && !showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{selectedForm.formTitle}</h3>
              <button
                onClick={() => setSelectedForm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                  {selectedForm.formContent}
                </pre>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Signature:</h4>
                <img
                  src={selectedForm.signature}
                  alt="Signature"
                  className="border border-gray-300 rounded-lg bg-white p-2"
                />
              </div>

              <div className="border-t border-gray-200 pt-4 text-sm text-gray-600">
                <p><strong>Signed by:</strong> {selectedForm.customerName}</p>
                <p><strong>Email:</strong> {selectedForm.customerEmail}</p>
                <p><strong>Date:</strong> {new Date(selectedForm.signedDate).toLocaleString()}</p>
                <p><strong>IP Address:</strong> {selectedForm.ipAddress}</p>
                <p><strong>Status:</strong> <span className={`font-medium ${selectedForm.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{selectedForm.status}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

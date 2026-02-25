/**
 * NO-SHOW-KILLER Policy & Terms
 * Legal compliance for No-Show-Fee charging
 */

export const NO_SHOW_POLICY = {
  de: {
    fullTerms: `
NO-SHOW-GEBÜHR RICHTLINIE

DEFINITION
Ein "No-Show" liegt vor, wenn Sie nicht zu Ihrem gebuchten Termin erscheinen und diesen nicht mindestens 24 Stunden vorher storniert haben.

GEBÜHR
Bei einem No-Show wird automatisch eine Gebühr von €15,00 von Ihrer hinterlegten Kreditkarte abgebucht.

ZAHLUNGSMETHODE
Sie verpflichten sich, eine gültige Kreditkarte bei der Buchung zu hinterlegen. Die Karte wird NICHT belastet, außer bei einem No-Show.

STORNIERUNG
Sie können Ihren Termin kostenlos stornieren, wenn Sie dies mindestens 24 Stunden vor dem Termin tun.

RECHTSWEGE
Bei Streitigkeiten können Sie sich an den Kundenservice wenden. Bei Zahlungsstreitigkeiten über Stripe können Sie einen Dispute einreichen.

DATENSCHUTZ
Ihre Kreditkartendaten werden verschlüsselt über Stripe gespeichert und nach 90 Tagen automatisch gelöscht (DSGVO-konform).

DURCHSETZUNG
Durch die Buchung akzeptieren Sie diese Richtlinie. Die Gebühr wird automatisch abgebucht, wenn Sie nicht erscheinen.
    `.trim(),

    checkboxText: 'Ich akzeptiere die No-Show-Gebühr von €15 bei Nichterscheinen und habe die Richtlinie gelesen.',

    shortText: 'Bei Nichterscheinen wird eine Gebühr von €15,00 automatisch von Ihrer Kreditkarte abgebucht. Sie können kostenlos stornieren, wenn Sie dies mindestens 24 Stunden vorher tun.',

    title: 'No-Show-Gebühr Richtlinie'
  },

  en: {
    fullTerms: `
NO-SHOW FEE POLICY

DEFINITION
A "No-Show" occurs when you do not appear for your booked appointment and have not cancelled it at least 24 hours in advance.

FEE
In case of a No-Show, a fee of €15.00 will be automatically charged to your stored credit card.

PAYMENT METHOD
You agree to provide a valid credit card when booking. The card will NOT be charged except in case of a No-Show.

CANCELLATION
You can cancel your appointment free of charge if you do so at least 24 hours before the appointment.

DISPUTES
In case of disputes, you can contact customer service. For payment disputes via Stripe, you can file a dispute.

DATA PROTECTION
Your credit card data is encrypted and stored via Stripe and will be automatically deleted after 90 days (GDPR compliant).

ENFORCEMENT
By booking, you accept this policy. The fee will be automatically charged if you do not appear.
    `.trim(),

    checkboxText: 'I accept the No-Show fee of €15 for no-shows and have read the policy.',

    shortText: 'In case of no-show, a fee of €15.00 will be automatically charged to your credit card. You can cancel free of charge if you do so at least 24 hours in advance.',

    title: 'No-Show Fee Policy'
  }
};

/**
 * Get policy text by language
 * @param {String} language - Language code ('de' or 'en')
 * @returns {Object} Policy object
 */
export const getPolicy = (language = 'de') => {
  return NO_SHOW_POLICY[language] || NO_SHOW_POLICY.de;
};

/**
 * Generate dispute evidence text
 * @param {Object} booking - Booking document
 * @param {Object} salon - Salon document
 * @returns {String} Evidence text
 */
export const generateDisputeEvidence = (booking, salon) => {
  const bookingDate = new Date(booking.bookingDate);
  const cancellationDeadline = new Date(bookingDate.getTime() - 24 * 60 * 60 * 1000);

  return `
DISPUTE EVIDENCE - NO-SHOW FEE

Booking Details:
- Booking ID: ${booking._id}
- Customer: ${booking.customerName} (${booking.customerEmail})
- Service: ${booking.serviceId?.name || 'Service'}
- Appointment Date: ${bookingDate.toLocaleString('de-DE')}
- Booking Created: ${booking.createdAt.toLocaleString('de-DE')}

Policy Acceptance:
- Accepted: ${booking.noShowFeeAcceptance?.accepted ? 'Yes' : 'No'}
- Accepted At: ${booking.noShowFeeAcceptance?.acceptedAt?.toLocaleString('de-DE') || 'N/A'}
- IP Address: ${booking.noShowFeeAcceptance?.ipAddress || 'N/A'}

Cancellation Policy:
- Free cancellation deadline: ${cancellationDeadline.toLocaleString('de-DE')}
- Customer did not cancel before deadline
- Customer did not appear for appointment

Reminders Sent:
${booking.disputeEvidence?.remindersSent?.map(r => `- ${r.type.toUpperCase()} sent at ${new Date(r.sentAt).toLocaleString('de-DE')} (Status: ${r.deliveryStatus})`).join('\n') || '- No reminders sent'}

Service Description:
${booking.disputeEvidence?.serviceDescription || booking.serviceId?.name || 'Service booking'}

Salon Information:
- Salon: ${salon.name}
- Contact: ${salon.email} | ${salon.phone || 'N/A'}
  `.trim();
};

export default {
  NO_SHOW_POLICY,
  getPolicy,
  generateDisputeEvidence
};


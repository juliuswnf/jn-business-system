import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Waitlist from '../models/Waitlist.js';
import SlotSuggestion from '../models/SlotSuggestion.js';
import { sendWaitlistOffer } from '../services/smsService.js';

/**
 * Waitlist Matcher Worker
 *
 * Runs every 15 minutes
 * Finds free/cancelled slots and matches them with waitlist customers
 * Uses rule-based matching with priority scoring
 */

let isRunning = false;

async function processWaitlistMatching() {
  if (isRunning) {
    console.log('[WaitlistMatcher] Already running, skipping...');
    return;
  }

  isRunning = true;
  console.log('[WaitlistMatcher] Starting waitlist matcher worker...');

  try {
    // Find recently cancelled bookings (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const cancelledBookings = await Booking.find({
      status: 'cancelled',
      cancelledAt: { $gte: oneHourAgo },
      startTime: { $gte: new Date() } // Only future slots
    })
      .populate('salon', 'businessName phone')
      .populate('service', 'name duration price');

    console.log(`[WaitlistMatcher] Found ${cancelledBookings.length} recently cancelled bookings`);

    let matched = 0;
    let skipped = 0;
    let errors = 0;

    for (const booking of cancelledBookings) {
      try {
        // Check if slot already has a suggestion (avoid duplicates)
        const existingSuggestion = await SlotSuggestion.findOne({
          originalBookingId: booking._id,
          status: { $in: ['pending', 'filled'] }
        });

        if (existingSuggestion) {
          skipped++;
          continue;
        }

        // Find waitlist entries for this salon and service
        const waitlist = await Waitlist.find({
          salonId: booking.salon._id,
          preferredService: booking.service._id,
          status: 'active'
        })
          .populate('customerId', 'firstName lastName phone email')
          .sort({ priorityScore: -1 }) // Highest priority first
          .limit(10); // Top 10 candidates

        if (waitlist.length === 0) {
          console.log(`[WaitlistMatcher] No waitlist entries for booking ${booking._id}`);
          skipped++;
          continue;
        }

        console.log(`[WaitlistMatcher] Found ${waitlist.length} waitlist candidates for booking ${booking._id}`);

        // Score each candidate
        const scoredCandidates = waitlist.map(entry => {
          let matchScore = entry.priorityScore; // Start with base priority

          // Bonus: Exact time match (preferred date/time)
          if (entry.preferredDate && entry.preferredTime) {
            const preferredDateTime = new Date(entry.preferredDate);
            const [hours, minutes] = entry.preferredTime.split(':');
            preferredDateTime.setHours(parseInt(hours), parseInt(minutes));

            const timeDiff = Math.abs(booking.startTime - preferredDateTime);
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

            if (daysDiff < 1) matchScore += 20; // Same day: +20 points
            else if (daysDiff < 3) matchScore += 10; // Within 3 days: +10 points
            else if (daysDiff < 7) matchScore += 5; // Within 1 week: +5 points
          }

          // Bonus: Flexible times match
          if (entry.flexibleTimes && entry.flexibleTimes.length > 0) {
            const bookingTime = booking.startTime.toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit'
            });
            if (entry.flexibleTimes.includes(bookingTime)) {
              matchScore += 15; // Flexible time match: +15 points
            }
          }

          // Bonus: Quick responder (last notification response)
          if (entry.lastResponseTime) {
            const responseTimeDiff = new Date() - entry.lastResponseTime;
            const responseHours = responseTimeDiff / (1000 * 60 * 60);
            if (responseHours < 24) matchScore += 10; // Responded within 24h: +10 points
          }

          return {
            entry,
            matchScore: Math.min(matchScore, 100) // Cap at 100
          };
        });

        // Sort by match score (highest first)
        scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

        // Offer slot to top candidate
        const topCandidate = scoredCandidates[0];

        // Create slot suggestion
        const suggestion = await SlotSuggestion.create({
          salonId: booking.salon._id,
          customerId: topCandidate.entry.customerId._id,
          serviceId: booking.service._id,
          waitlistId: topCandidate.entry._id,
          originalBookingId: booking._id,
          suggestedSlot: booking.startTime,
          matchScore: topCandidate.matchScore,
          rankedCustomers: scoredCandidates.map((sc, index) => ({
            customerId: sc.entry.customerId._id,
            priorityScore: sc.entry.priorityScore,
            matchScore: sc.matchScore,
            rank: index + 1
          })),
          status: 'pending'
        });

        // Send SMS offer
        try {
          await sendWaitlistOffer(topCandidate.entry, suggestion);
          console.log(`[WaitlistMatcher] ✅ Matched slot ${booking._id} to customer ${topCandidate.entry.customerId._id} (score: ${topCandidate.matchScore})`);

          // Update waitlist entry
          topCandidate.entry.notificationsSent += 1;
          topCandidate.entry.lastNotificationSent = new Date();
          await topCandidate.entry.save();

          matched++;
        } catch (smsError) {
          console.error(`[WaitlistMatcher] Failed to send waitlist SMS:`, smsError.message);
          errors++;
        }

      } catch (error) {
        console.error(`[WaitlistMatcher] Error processing booking ${booking._id}:`, error);
        errors++;
      }
    }

    console.log(`[WaitlistMatcher] Finished: ${matched} matched, ${skipped} skipped, ${errors} errors`);

  } catch (error) {
    console.error('[WaitlistMatcher] Fatal error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the waitlist matcher worker
 */
export function startWaitlistMatcher() {
  console.log('[WaitlistMatcher] Initializing waitlist matcher worker (runs every 15 minutes)...');

  // Run immediately on startup
  processWaitlistMatching();

  // Schedule to run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    processWaitlistMatching();
  });

  console.log('[WaitlistMatcher] Worker scheduled ✅');
}

export default startWaitlistMatcher;

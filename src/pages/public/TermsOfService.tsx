import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck2, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  HelpCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Scale, 
  Phone, 
  Mail, 
  MapPin,
  Sparkles
} from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="bg-background min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Navigation Breadcrumb / Back */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Header Hero */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-10 shadow-sm mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4">
              <FileCheck2 className="w-3.5 h-3.5" />
              Customer Agreement & Platform Rules
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              NearMitra Terms of Service
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
              Please read these Terms carefully before booking or utilizing NearMitra's home maintenance, repair, and doorstep services.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-border/50 text-xs text-muted-foreground">
              <span><strong>Last Updated:</strong> March 2026</span>
              <span>•</span>
              <span><strong>Version:</strong> 2.4</span>
              <span>•</span>
              <span><strong>Jurisdiction:</strong> Mumbai, Maharashtra, India</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground mb-1">30-Day Guarantee</h4>
              <p className="text-[11px] text-muted-foreground">Every completed service is covered with a 30-day free rework warranty.</p>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground mb-1">Pay Post-Satisfaction</h4>
              <p className="text-[11px] text-muted-foreground">No advance deposits. Inspect the completed job before paying safely.</p>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground mb-1">Free Cancellation</h4>
              <p className="text-[11px] text-muted-foreground">Reschedule or cancel your booking at zero penalty up to 1 hour before arrival.</p>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-10 shadow-sm space-y-10 text-foreground">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              Acceptance of Terms
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing, browsing, or placing a service booking through NearMitra (website, mobile interface, or telephone helpline), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our accompanying Privacy Policy. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <hr className="border-border/50" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              Platform Role & Nature of Services
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              NearMitra operates a technology-enabled hyperlocal marketplace connecting residential and commercial consumers with independent, certified, and background-checked technicians ("Service Providers"). 
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              While NearMitra standardizes pricing, verifies technician credentials, and provides quality assurance warranties, the physical repairs and installations are carried out by trained service professionals dispatched to your premises.
            </p>
          </section>

          <hr className="border-border/50" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
              Bookings, Scheduling & Service Arrival
            </h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground pl-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Accurate Information:</strong> You agree to provide a valid telephone number, address, landmark, and description of the repair or maintenance required.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Arrival Window:</strong> While we endeavor to dispatch technicians within 30-45 minutes or at your chosen scheduled slot, arrival times may vary slightly due to traffic congestion, adverse weather, or unforeseen transit delays.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Premises Access:</strong> You agree to grant the assigned technician safe and reasonable access to the property and the relevant equipment (e.g. electrical mains, water stopcocks).</span>
              </li>
            </ul>
          </section>

          <hr className="border-border/50" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
              Pricing, Rate Cards & Payments
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Transparent Inspection & Estimates:</strong> Base visiting charges or service minimums are displayed prior to booking. If extensive repairs or additional replacement parts are required (e.g., replacement compressor, new water pump, modular switchboard), the technician will inspect the issue and obtain your verbal/written approval on the exact itemized quotation before proceeding.
              </p>
              <p>
                <strong>Post-Service Payment:</strong> You are not required to pay advance booking fees. Payment is due strictly upon completion of the service and after you have inspected the technician's work.
              </p>
              <p>
                <strong>Payment Methods:</strong> You can pay directly via secure digital methods (UPI, GPay, PhonePe, Paytm, Debit/Credit Card) or Cash on Delivery. A digital receipt and invoice will be available on your booking tracking page.
              </p>
            </div>
          </section>

          <hr className="border-border/50" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">5</span>
              Cancellations & Rescheduling
            </h2>
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Free Cancellation Window:</strong> You may cancel or reschedule any scheduled booking free of charge up to <strong>1 hour before</strong> the designated time slot.
              </p>
              <p>
                <strong>Late Cancellation:</strong> If a cancellation is requested after a technician has already reached your doorstep, a nominal visiting inspection fee of ₹99 may be levied to compensate the professional's travel expenses.
              </p>
            </div>
          </section>

          <hr className="border-border/50" />

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">6</span>
              NearMitra 30-Day Guarantee & Damage Protection
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We stand firmly behind the caliber of our workmanship:
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>
                  <strong>30-Day Free Rework:</strong> If the exact fault repaired reoccurs within 30 calendar days from the date of completion, NearMitra will dispatch a senior technician to re-inspect and correct the issue at zero service labor cost.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>
                  <strong>Accidental Damage Cover:</strong> In the rare event of accidental property damage directly resulting from technician negligence during the performance of the booked service, NearMitra provides damage reimbursement protection up to ₹10,000, subject to incident reporting within 48 hours and photographic inspection.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>
                  <strong>Warranty Exclusions:</strong> Guarantee does not cover damages caused by pre-existing structural defects, customer tampering, external power surges, unauthorized third-party interventions, or ordinary wear-and-tear.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border/50" />

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">7</span>
              Customer Code of Conduct
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              NearMitra enforces a zero-tolerance policy against harassment, abuse, discrimination, or unsafe working environments toward service professionals. Customers must ensure an adult is present on the premises during the service visit.
            </p>
          </section>

          <hr className="border-border/50" />

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">8</span>
              Dispute Resolution & Governing Law
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These terms are governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, controversy, or claim arising out of or relating to this agreement shall be submitted to the exclusive jurisdiction of the competent courts in <strong>Mumbai, Maharashtra</strong>.
            </p>
          </section>

          <hr className="border-border/50" />

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">9</span>
              Contact Support
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Have questions regarding our service conditions, billing, or warranty claims? Our team is available 7 days a week:
            </p>
            <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <span><strong>Support Email:</strong> <a href="mailto:support@nearmitra.in" className="text-primary hover:underline">support@nearmitra.in</a></span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary" />
                <span><strong>Customer Helpline:</strong> <a href="tel:+919152106425" className="text-primary hover:underline">+91 91521 06425</a></span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                <span><strong>Headquarters:</strong> NearMitra Technologies Pvt. Ltd., Mumbai, Maharashtra 400001, India</span>
              </div>
            </div>
          </section>

        </div>

        {/* Bottom CTA to return */}
        <div className="mt-10 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/privacy"
              className="text-sm font-semibold text-primary hover:underline"
            >
              ← Read Privacy Policy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Back to Home
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/book"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Book a Service Now →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

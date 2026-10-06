import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowLeft,
  Server,
  UserCheck,
  AlertCircle
} from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4">
              <Shield className="w-3.5 h-3.5" />
              Legal & Compliance
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              NearMitra Privacy Policy
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
              Your trust is our highest priority. This policy outlines how NearMitra collects, protects, uses, and respects your personal information when you use our home services platform.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-border/50 text-xs text-muted-foreground">
              <span><strong>Effective Date:</strong> January 1, 2026</span>
              <span>•</span>
              <span><strong>Last Updated:</strong> March 2026</span>
              <span>•</span>
              <span><strong>Governing Law:</strong> Digital Personal Data Protection (DPDP) Act 2023 & IT Act India</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground mb-1">Zero Data Selling</h4>
              <p className="text-[11px] text-muted-foreground">We never sell your phone number, address, or booking data to third-party marketers.</p>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground mb-1">Verified Sharing</h4>
              <p className="text-[11px] text-muted-foreground">Your address is shared strictly with the assigned technician only for fulfilling your service.</p>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-600">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground mb-1">Encrypted Storage</h4>
              <p className="text-[11px] text-muted-foreground">All customer transactions, authentication credentials, and chats are encrypted in transit and at rest.</p>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-10 shadow-sm space-y-10 text-foreground">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              Information We Collect
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To connect you with qualified service professionals and guarantee timely service completion, we collect the following types of information:
            </p>
            <ul className="space-y-2.5 text-sm text-muted-foreground pl-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Contact Details:</strong> Your full name, telephone number, and email address provided during registration or booking.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Service Location:</strong> Your complete doorstep address, apartment/flat number, landmark, and approximate GPS coordinates to dispatch the nearest verified provider.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Service Request Details:</strong> Problem descriptions, uploaded photos/audio notes of repair needs, selected time slots, and special instructions.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Payment Information:</strong> Transaction identifiers, payment method types (UPI, Card, Cash on Delivery). Note: We do not store raw credit card numbers or UPI PINs; payments are processed securely through certified gateway partners.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Communications & Feedback:</strong> Service ratings, customer reviews, customer support messages, and AI assistant chat interactions.</span>
              </li>
            </ul>
          </section>

          <hr className="border-border/50" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              How We Use Your Information
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We process your data strictly to operate, maintain, and enhance the NearMitra experience:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                <p className="font-semibold text-foreground">Dispatch & Service Execution</p>
                <p className="text-muted-foreground">Assigning the closest verified technician, calculating arrival ETA, and sharing service requirements.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                <p className="font-semibold text-foreground">Status Updates & Alerts</p>
                <p className="text-muted-foreground">Sending SMS, WhatsApp, and email alerts regarding booking confirmation, technician arrival, and invoice receipts.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                <p className="font-semibold text-foreground">Quality & 30-Day Guarantee</p>
                <p className="text-muted-foreground">Verifying job completion, tracking customer satisfaction ratings, and honoring rework warranties.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                <p className="font-semibold text-foreground">Safety & Fraud Prevention</p>
                <p className="text-muted-foreground">Preventing unauthorized access, resolving service disputes, and ensuring customer and provider safety.</p>
              </div>
            </div>
          </section>

          <hr className="border-border/50" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
              Data Sharing & Disclosures
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We respect your confidentiality. Personal information is only shared under these limited scenarios:
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>
                  <strong>Assigned Service Professionals:</strong> Once a booking is confirmed, the assigned technician receives your name, phone number, and address solely to visit your premises and complete the requested service.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>
                  <strong>Technology Infrastructure Partners:</strong> Cloud hosting (Supabase, AWS), SMS gateway providers, and mapping services operate under strict non-disclosure and security agreements.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p>
                  <strong>Legal Requirements:</strong> We may disclose information if mandated by Indian law enforcement, court orders, or applicable regulations to investigate fraud or security threats.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border/50" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
              Data Protection & Security Measures
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              NearMitra implements robust industry-standard technical and organizational security controls to safeguard your data against accidental loss, unauthorized access, alteration, or disclosure:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>End-to-end TLS 1.3 encryption for all web communications and API calls.</li>
              <li>Row Level Security (RLS) policies ensuring customers and providers can only view their own authorized booking data.</li>
              <li>Regular vulnerability scans and database backup protocols.</li>
              <li>Strict internal confidentiality controls restricting access on a need-to-know basis.</li>
            </ul>
          </section>

          <hr className="border-border/50" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">5</span>
              Your Rights Under the DPDP Act
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Under India's Digital Personal Data Protection (DPDP) Act, you possess the right to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="font-semibold text-foreground block mb-0.5">Right to Access:</span>
                Request a summary of personal data held about you and processing activities.
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="font-semibold text-foreground block mb-0.5">Right to Correction:</span>
                Update inaccurate or outdated contact numbers, addresses, or profile details.
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="font-semibold text-foreground block mb-0.5">Right to Erasure:</span>
                Request the deletion of your account and personal history, subject to legal record-keeping requirements.
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="font-semibold text-foreground block mb-0.5">Right of Grievance Redressal:</span>
                Direct concerns to our designated Grievance Officer for prompt investigation within 30 days.
              </div>
            </div>
          </section>

          <hr className="border-border/50" />

          {/* Section 6: Contact & Grievance */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">6</span>
              Grievance Officer & Contact Details
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have inquiries, complaints, or wish to exercise your data privacy rights, please reach out to our dedicated Grievance Officer:
            </p>
            
            <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium"><strong>Designation:</strong> Data Protection & Grievance Officer</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <span><strong>Email:</strong> <a href="mailto:support@nearmitra.in" className="text-primary hover:underline">support@nearmitra.in</a> / <a href="mailto:grievance@nearmitra.in" className="text-primary hover:underline">grievance@nearmitra.in</a></span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary" />
                <span><strong>Helpline:</strong> <a href="tel:+919152106425" className="text-primary hover:underline">+91 91521 06425</a> (7:00 AM - 10:00 PM IST)</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                <span><strong>Registered Office:</strong> NearMitra Technologies Pvt. Ltd., Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </section>

        </div>

        {/* Bottom CTA to return */}
        <div className="mt-10 text-center">
          <p className="text-xs text-muted-foreground mb-4">
            Looking for service terms or want to book an expert?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/terms"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Read Terms of Service →
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/services"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Browse Services
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/book"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Book a Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

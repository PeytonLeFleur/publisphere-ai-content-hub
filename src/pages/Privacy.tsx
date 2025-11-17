import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-foreground">
          <p className="text-muted-foreground">Last updated: November 2024</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              Publisphere ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our white-label AI content automation platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Account information (name, email, agency name)</li>
              <li>Billing information (processed securely through Stripe)</li>
              <li>Content you create or upload through the Service</li>
              <li>WordPress site credentials (encrypted and stored securely)</li>
              <li>Communications with our support team</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.2 API Keys</h3>
            <p className="text-muted-foreground">
              We collect and encrypt API keys you provide (e.g., Anthropic, Unsplash). These keys are:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Encrypted at rest using industry-standard encryption</li>
              <li>Only used to make API calls on your behalf</li>
              <li>Never shared with third parties</li>
              <li>Accessible only to you through your account</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Usage data (features used, pages visited, time spent)</li>
              <li>Device information (browser type, operating system)</li>
              <li>IP address and location data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-3">We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide and maintain the Service</li>
              <li>Process your transactions and manage your account</li>
              <li>Generate content using your API keys on your behalf</li>
              <li>Send administrative information and updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns to improve the Service</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">4.1 Third-Party Service Providers</h3>
            <p className="text-muted-foreground">
              We share data with trusted third-party service providers who assist us in operating the Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Anthropic (Claude AI):</strong> We send prompts to generate content using your API key</li>
              <li><strong>Unsplash:</strong> We search for images using your API key</li>
              <li><strong>WordPress:</strong> We publish content to your connected WordPress sites</li>
              <li><strong>Stripe:</strong> We process payments securely</li>
              <li><strong>Cloud hosting providers:</strong> For data storage and service delivery</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              These providers have access only to information necessary to perform their functions and are obligated to maintain confidentiality.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.2 What We Don't Share</h3>
            <p className="text-muted-foreground">
              We do not sell, rent, or trade your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure API key storage with encryption</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your information for as long as your account is active or as needed to provide services. Specific retention periods:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Account data: Until account deletion plus 90 days</li>
              <li>Generated content: As long as you maintain your account</li>
              <li>Job logs: 90 days (failed jobs retained for 180 days)</li>
              <li>API keys: Until removed or account deleted</li>
              <li>Billing records: 7 years for legal compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground mb-3">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Export:</strong> Request a portable copy of your data</li>
              <li><strong>Objection:</strong> Object to certain data processing activities</li>
              <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              To exercise these rights, please contact us at privacy@publisphere.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze usage patterns</li>
              <li>Improve service performance</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              You can control cookies through your browser settings. However, disabling cookies may affect Service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Publisphere is not intended for users under 18. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through the Service. Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-muted-foreground mt-3">
              Email: privacy@publisphere.com<br />
              For data protection inquiries: dpo@publisphere.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link to="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

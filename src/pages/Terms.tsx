import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-foreground">
          <p className="text-muted-foreground">Last updated: November 2024</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using Publisphere ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use of Service</h2>
            <p className="text-muted-foreground">
              Publisphere is a white-label AI content automation platform designed for agencies to provide content generation services to their clients.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You must be at least 18 years old to use this Service</li>
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must not use the Service for any illegal purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="text-muted-foreground mb-3">
              As a user of Publisphere, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate and complete information when creating an account</li>
              <li>Maintain the security of your password and API keys</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Not share your account credentials with unauthorized parties</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. API Keys and Third-Party Services</h2>
            <p className="text-muted-foreground">
              Publisphere operates on a "Bring Your Own Key" (BYOK) model. Users and their clients are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Obtaining and maintaining their own API keys for services like Anthropic Claude and Unsplash</li>
              <li>All costs associated with API usage</li>
              <li>Compliance with third-party service providers' terms of service</li>
              <li>Security and proper storage of API keys</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Publisphere is not responsible for any issues arising from third-party services or API key management.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Content Ownership</h2>
            <p className="text-muted-foreground">
              All content generated through the Service using your API keys belongs to you and your clients. Publisphere claims no ownership rights over content generated through the platform.
            </p>
            <p className="text-muted-foreground mt-3">
              You are responsible for ensuring that generated content:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Complies with copyright laws</li>
              <li>Does not infringe on third-party rights</li>
              <li>Meets quality and accuracy standards for your use case</li>
              <li>Is reviewed before publication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. White Label Features</h2>
            <p className="text-muted-foreground">
              As a lifetime license holder, you may customize the platform with your branding. You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Resell or redistribute the Publisphere software itself</li>
              <li>Claim the underlying technology as your own</li>
              <li>Reverse engineer or attempt to extract the source code</li>
              <li>Remove attribution in a way that violates licensing terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Publisphere provides the Service "as is" without warranty of any kind. We are not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Quality, accuracy, or appropriateness of AI-generated content</li>
              <li>Costs associated with third-party API usage</li>
              <li>Downtime or service interruptions of third-party services</li>
              <li>Data loss or security breaches resulting from user negligence</li>
              <li>Any damages arising from use or inability to use the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Service Modifications</h2>
            <p className="text-muted-foreground">
              Publisphere reserves the right to modify or discontinue, temporarily or permanently, the Service with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Payment and Refunds</h2>
            <p className="text-muted-foreground">
              Lifetime license purchases are one-time payments. We offer a 60-day money-back guarantee. Refund requests must be submitted within 60 days of purchase. After this period, all sales are final.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at support@publisphere.com
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

export default Terms;

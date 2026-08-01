import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Aether" },
      {
        name: "description",
        content:
          "What Aether collects, how your birth data and chat history are used, and the rights you hold over your personal information.",
      },
      { property: "og:title", content: "Privacy Policy — Aether" },
      {
        property: "og:description",
        content: "How Aether handles your account information, astrological data, and chat logs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalLayout eyebrow="Your data" title="Privacy Policy">
      <LegalSection heading="1. Information We Collect">
        <p>
          To provide personalized astrological readings, we collect information you directly provide,
          including:
        </p>
        <p>
          <span className="text-stone-200">Account Information:</span> Name, email address, and
          authentication credentials.
        </p>
        <p>
          <span className="text-stone-200">Astrological Data:</span> Date of birth, exact time of
          birth, and place of birth.
        </p>
        <p>
          <span className="text-stone-200">Interactive Data:</span> Queries, prompts, and
          conversation logs submitted within the AI chat interface.
        </p>
      </LegalSection>

      <LegalSection heading="2. How We Use Your Data & AI Models">
        <p>
          We use your data strictly to generate astrological charts, deliver personalized insights,
          and maintain account functionality.
        </p>
        <p>
          <span className="text-stone-200">No Selling of Personal Data:</span> We do not sell, rent,
          or lease your personal information or astrological data to third parties.
        </p>
        <p>
          <span className="text-stone-200">AI Model Training:</span> Your private chat history and
          personal identification details are not used to train publicly available AI models.
        </p>
        <p>
          <span className="text-stone-200">Security:</span> Astrological data and chat logs are
          transmitted and stored using industry-standard encryption protocols.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your Rights & Data Control">
        <p>
          Under applicable data protection laws (such as GDPR and CCPA), you reserve the right to
          access, export, or permanently delete your personal profile, birth data, and chat history
          at any time through your account settings or by contacting our privacy team.
        </p>
      </LegalSection>

      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground pt-6">
        Questions?{" "}
        <a href="mailto:support@aetherhoroscope.com" className="text-accent hover:text-stone-100">
          support@aetherhoroscope.com
        </a>{" "}
        ·{" "}
        <Link to="/terms" className="text-accent hover:text-stone-100">
          Terms of Service
        </Link>
      </p>
    </LegalLayout>
  );
}

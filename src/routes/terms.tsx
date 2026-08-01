import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Aether" },
      {
        name: "description",
        content:
          "The terms governing your use of Aether, including the nature of AI-generated astrological content, eligibility, and limitation of liability.",
      },
      { property: "og:title", content: "Terms of Service — Aether" },
      {
        property: "og:description",
        content: "How Aether's AI-generated readings may be used, who may register, and liability limits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalLayout eyebrow="The agreement" title="Terms of Service">
      <LegalSection heading="1. AI-Generated Content & Nature of Services">
        <p>
          The Services provide astrological interpretations and insights generated using artificial
          intelligence ("AI Content"). You acknowledge and agree that:
        </p>
        <p>
          AI Content is generated automatically based on statistical patterns and symbolic
          astrological frameworks. It is designed solely for self-reflection, personal exploration,
          and entertainment purposes.
        </p>
        <p>
          AI Content does not constitute, and should never be used as a substitute for, professional
          medical, psychological, psychiatric, legal, financial, or tax advice.
        </p>
        <p>
          The Company makes no representations or warranties regarding the accuracy, completeness, or
          reliability of any AI Content. You assume full responsibility for any actions taken based
          on information provided through the Services.
        </p>
      </LegalSection>

      <LegalSection heading="2. User Eligibility & Accounts">
        <p>
          You must be at least 13 years of age (or 18 where required by applicable law for paid
          transactions) to register an account. By creating an account, you represent that you meet
          these age requirements and that all registration information you submit—including birth
          date, time, and location—is accurate to the best of your knowledge.
        </p>
      </LegalSection>

      <LegalSection heading="3. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, the Company, its affiliates, officers,
          and employees shall not be liable for any indirect, incidental, special, consequential, or
          punitive damages arising out of or related to your use of, or inability to use, the
          Services or AI Content.
        </p>
      </LegalSection>

      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground pt-6">
        Questions?{" "}
        <a href="mailto:support@aetherhoroscope.com" className="text-accent hover:text-stone-100">
          support@aetherhoroscope.com
        </a>{" "}
        ·{" "}
        <Link to="/privacy" className="text-accent hover:text-stone-100">
          Privacy Policy
        </Link>
      </p>
    </LegalLayout>
  );
}

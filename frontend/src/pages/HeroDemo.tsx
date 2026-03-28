import React from 'react';
import AnimatedShaderHero from "@/components/ui/animated-shader-hero";

// Demo Component showing how to use the Hero
const HeroDemo: React.FC = () => {
  const handlePrimaryClick = () => {
    console.log('Get Started clicked!');
  };

  return (
    <div className="w-full h-full min-h-screen overflow-y-auto">
      <AnimatedShaderHero
        trustBadge={{
          text: "Trusted by forward-thinking teams.",
          icons: ["✨"]
        }}
        headline={{
          line1: "Launch Your",
          line2: "Workflow Into Orbit"
        }}
        subtitle="Supercharge productivity with AI-powered automation and integrations built for the next generation of teams — fast, seamless, and limitless."
        buttons={{
          primary: {
            text: "Get Started for Free",
            onClick: handlePrimaryClick
          }
        }}
      />
      
      {/* Additional content below hero */}
      <div className="bg-background/50 backdrop-blur-xl p-8 border-t border-foreground/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How to Use the Hero Component
          </h2>
          <div className="bg-foreground/5 p-6 rounded-lg border border-foreground/10">
            <pre className="text-sm text-foreground/60 overflow-x-auto whitespace-pre-wrap">
{`<AnimatedShaderHero
  trustBadge={{
    text: "Your trust badge text",
    icons: ["🚀", "✨"]
  }}
  headline={{
    line1: "Your First Line",
    line2: "Your Second Line"
  }}
  subtitle="Your compelling subtitle text goes here..."
  buttons={{
    primary: {
      text: "Primary CTA",
      onClick: handlePrimaryClick
    }
  }}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroDemo;

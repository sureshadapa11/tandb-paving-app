// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const SITE_URL = "https://frontend-khaki-tau-70.vercel.app";
const OG_IMAGE = `${SITE_URL}/assets/images/hero-excavator.webp`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Primary SEO */}
        <title>T&B Paving — Expert Driveways, Patios & Paths | Essex & Suffolk</title>
        <meta name="description" content="T&B Paving: professional block paving, resin driveways, patios and garden paths across Essex & Suffolk. Free site survey. 10-year guarantee. Call 01376 618683." />
        <meta name="keywords" content="driveways Essex, block paving Essex, resin driveway Essex, patios Essex, paving contractor Essex, driveway installation, T&B Paving" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="T&B Paving" />
        <link rel="canonical" href={SITE_URL} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="T&B Paving" />
        <meta property="og:title" content="T&B Paving — Expert Driveways, Patios & Paths" />
        <meta property="og:description" content="Professional paving services across Essex & Suffolk. Block paving, resin driveways, patios and more. Free site survey, 10-year guarantee." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_GB" />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="T&B Paving — Expert Driveways, Patios & Paths" />
        <meta name="twitter:description" content="Professional paving services across Essex & Suffolk. Free site survey, 10-year guarantee." />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* Local business schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "T&B Paving",
              "description": "Professional driveways, patios and garden paths across Essex & Suffolk.",
              "url": SITE_URL,
              "telephone": "01376618683",
              "email": "bbirdpaving@gmail.com",
              "address": {
                "@type": "PostalAddress",
                "addressRegion": "Essex",
                "addressCountry": "GB",
              },
              "areaServed": ["Essex", "Suffolk"],
              "priceRange": "££",
              "openingHours": "Mo-Sa 07:30-18:00",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "reviewCount": "50",
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Paving Services",
                "itemListElement": [
                  "Block Paving", "Resin Bound Surfacing", "Patios & Paving",
                  "Tarmac Driveways", "Concrete Driveways", "Gravel & Shingle",
                  "Driveway Cleaning & Sealing", "Garden Paths", "Soakaways & Drainage",
                ].map(name => ({ "@type": "Offer", "itemOffered": { "@type": "Service", name } })),
              },
            }),
          }}
        />

        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
            `,
          }}
        />
      </head>
      <body style={{ margin: 0, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </body>
    </html>
  );
}

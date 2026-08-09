export const metadata = {
  title: "About Sabka Delivery | Karan Nath & Prem Kumar Nath",
  description:
    "Learn about Sabka Delivery and its leadership team, Karan Nath and Prem Kumar Nath, including their roles, education, location and leadership details.",
  alternates: {
    canonical: "https://sabkadelivery.in/about",
  },
  openGraph: {
    title: "About Sabka Delivery | Karan Nath & Prem Kumar Nath",
    description:
      "Meet Karan Nath and Prem Kumar Nath, the leadership behind Sabka Delivery.",
    url: "https://sabkadelivery.in/about",
    siteName: "Sabka Delivery",
    type: "website",
  },
};

const leadershipSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://sabkadelivery.in/about#karan-nath",
      name: "Karan Nath",
      jobTitle: "Owner, Founder & CEO",
      image: "https://sabkadelivery.in/founder/karan.jpg",
      url: "https://sabkadelivery.in/about#karan-nath",
      worksFor: {
        "@type": "Organization",
        name: "Sabka Delivery",
        url: "https://sabkadelivery.in",
      },
      alumniOf: {
        "@type": "EducationalOrganization",
        name: "Primrose English Medium Senior Secondary School, Lala",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Lala Bazar",
        addressRegion: "Assam",
        addressCountry: "IN",
      },
      description:
        "Karan Nath is the Owner, Founder and CEO of Sabka Delivery, a hyperlocal delivery platform serving Lala Bazar and surrounding areas.",
    },
    {
      "@type": "Person",
      "@id": "https://sabkadelivery.in/about#prem-kumar-nath",
      name: "Prem Kumar Nath",
      jobTitle: "Owner, Co-Founder & CEO",
      image: "https://sabkadelivery.in/founder/prem.jpg",
      url: "https://sabkadelivery.in/about#prem-kumar-nath",
      worksFor: {
        "@type": "Organization",
        name: "Sabka Delivery",
        url: "https://sabkadelivery.in",
      },
      alumniOf: {
        "@type": "EducationalOrganization",
        name: "Lala H.S. & M.P. School",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Lala Bazar",
        addressRegion: "Assam",
        addressCountry: "IN",
      },
      description:
        "Prem Kumar Nath is an Owner, Co-Founder and CEO of Sabka Delivery, supporting the development and growth of the hyperlocal delivery platform.",
    },
  ],
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(leadershipSchema),
        }}
      />

      <div className="max-w-6xl mx-auto py-16 px-6">
        <section>
          <p className="text-yellow-400 font-semibold uppercase tracking-widest text-sm">
            Sabka Delivery
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mt-3">
            About Sabka Delivery
          </h1>
          <p className="mt-8 leading-9 text-lg text-gray-200">
            Sabka Delivery is a hyperlocal delivery platform created to provide
            Food, Grocery and Daily Essentials delivery in Lala Bazar,
            Hailakandi District, Assam.
          </p>
          <p className="mt-5 leading-9 text-lg text-gray-200">
            Our goal is to make local delivery faster, smarter, reliable and
            affordable for everyone.
          </p>
        </section>

        <section className="mt-20">
          <div className="text-center mb-12">
            <p className="text-yellow-400 font-semibold uppercase tracking-widest text-sm">
              Leadership
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              Karan Nath &amp; Prem Kumar Nath
            </h2>
            <p className="text-gray-400 mt-4">
              Owners, Founders &amp; CEOs of Sabka Delivery
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <article
              id="karan-nath"
              className="bg-zinc-900 rounded-3xl p-7 border border-yellow-500/20 shadow-xl"
            >
              <div className="text-center">
                <img
                  src="/founder/karan.jpg"
                  alt="Karan Nath - Owner, Founder and CEO of Sabka Delivery"
                  width="220"
                  height="220"
                  loading="eager"
                  className="w-52 h-52 rounded-full object-cover mx-auto border-4 border-yellow-500 shadow-2xl"
                />
                <h2 className="text-3xl font-bold text-yellow-400 mt-6">
                  Karan Nath
                </h2>
                <p className="text-white font-semibold text-lg mt-2">
                  Owner, Founder &amp; CEO
                </p>
                <p className="text-yellow-300 mt-1">Sabka Delivery</p>
              </div>

              <div className="mt-7 bg-black/40 rounded-2xl p-6 space-y-3 text-gray-300">
                <p><strong className="text-white">Name:</strong> Karan Nath</p>
                <p><strong className="text-white">Role:</strong> Owner, Founder &amp; CEO</p>
                <p><strong className="text-white">Company:</strong> Sabka Delivery</p>
                <p><strong className="text-white">School:</strong> Primrose English Medium Senior Secondary School, Lala</p>
                <p><strong className="text-white">Current Class:</strong> Class 8</p>
                <p><strong className="text-white">Location:</strong> Lala Bazar, Hailakandi, Assam, India</p>
              </div>

              <p className="text-gray-400 leading-7 mt-6">
                Karan Nath is the Owner, Founder and CEO of Sabka Delivery. He
                is working on building a customer-first hyperlocal delivery
                platform for Lala Bazar and surrounding areas.
              </p>
            </article>

            <article
              id="prem-kumar-nath"
              className="bg-zinc-900 rounded-3xl p-7 border border-yellow-500/20 shadow-xl"
            >
              <div className="text-center">
                <img
                  src="/founder/prem.jpg"
                  alt="Prem Kumar Nath - Owner, Co-Founder and CEO of Sabka Delivery"
                  width="220"
                  height="220"
                  loading="lazy"
                  className="w-52 h-52 rounded-full object-cover mx-auto border-4 border-yellow-500 shadow-2xl"
                />
                <h2 className="text-3xl font-bold text-yellow-400 mt-6">
                  Prem Kumar Nath
                </h2>
                <p className="text-white font-semibold text-lg mt-2">
                  Owner, Co-Founder &amp; CEO
                </p>
                <p className="text-yellow-300 mt-1">Sabka Delivery</p>
              </div>

              <div className="mt-7 bg-black/40 rounded-2xl p-6 space-y-3 text-gray-300">
                <p><strong className="text-white">Name:</strong> Prem Kumar Nath</p>
                <p><strong className="text-white">Role:</strong> Owner, Co-Founder &amp; CEO</p>
                <p><strong className="text-white">Company:</strong> Sabka Delivery</p>
                <p><strong className="text-white">School:</strong> Lala H.S. &amp; M.P. School</p>
                <p><strong className="text-white">Current Class:</strong> Class 11</p>
                <p><strong className="text-white">Location:</strong> Lala Bazar, Hailakandi, Assam, India</p>
              </div>

              <p className="text-gray-400 leading-7 mt-6">
                Prem Kumar Nath is an Owner, Co-Founder and CEO of Sabka
                Delivery, supporting the development, growth and vision of the
                platform.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-16 bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
          <h2 className="text-3xl font-bold text-yellow-400">Our Mission</h2>
          <p className="mt-4 text-gray-300 leading-8">
            To make local delivery faster, smarter and affordable for everyone.
          </p>
        </section>

        <section className="mt-8 bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
          <h2 className="text-3xl font-bold text-yellow-400">Our Vision</h2>
          <p className="mt-4 text-gray-300 leading-8">
            To become one of India&apos;s most trusted hyperlocal delivery
            companies.
          </p>
        </section>

        <section className="text-center mt-16 pb-6">
          <p className="text-gray-500 text-sm">
            Sabka Delivery — Lala Bazar, Hailakandi, Assam, India
          </p>
          <p className="text-gray-600 text-xs mt-3">
            © {new Date().getFullYear()} Sabka Delivery. All rights reserved.
          </p>
        </section>
      </div>
    </main>
  );
}

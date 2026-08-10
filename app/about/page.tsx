export const metadata = {
  title: "About Sabka Delivery | Prem Kumar Nath & Karan Nath",
  description:
    "Learn about Sabka Delivery, owned by Prem Kumar Nath and founded by Prem Kumar Nath and Karan Nath.",
  keywords: [
    "Sabka Delivery",
    "Karan Nath",
    "Prem Kumar Nath",
    "Sabka Delivery owner",
    "Sabka Delivery founder",
    "Sabka Delivery founders",
  ],
};

const leaders = [
  {
    name: "Prem Kumar Nath",
    role: "Owner • Founder",
    image: "/founder/prem.png",
    alt: "Prem Kumar Nath, Owner and Founder of Sabka Delivery",
    description:
      "Prem Kumar Nath is the owner and founder of Sabka Delivery. He co-founded the platform with Karan Nath.",
  },
  {
    name: "Karan Nath",
    role: "Founder",
    image: "/founder/karan.jpg",
    alt: "Karan Nath, Founder of Sabka Delivery",
    description:
      "Karan Nath is a founder of Sabka Delivery. He co-founded the platform with Prem Kumar Nath.",
  },
];

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://sabkadelivery.in/#organization",
    name: "Sabka Delivery",
    url: "https://sabkadelivery.in",
    description:
      "A hyperlocal delivery platform owned by Prem Kumar Nath and founded by Prem Kumar Nath and Karan Nath.",
    owner: {
      "@type": "Person",
      "@id": "https://sabkadelivery.in/#prem-kumar-nath",
      name: "Prem Kumar Nath",
      jobTitle: "Owner and Founder",
      url: "https://sabkadelivery.in/about",
      image: "https://sabkadelivery.in/founder/prem.png",
    },
    founder: [
      {
        "@type": "Person",
        "@id": "https://sabkadelivery.in/#prem-kumar-nath",
        name: "Prem Kumar Nath",
        jobTitle: "Owner and Founder",
        url: "https://sabkadelivery.in/about",
        image: "https://sabkadelivery.in/founder/prem.png",
      },
      {
        "@type": "Person",
        "@id": "https://sabkadelivery.in/#karan-nath",
        name: "Karan Nath",
        jobTitle: "Founder",
        url: "https://sabkadelivery.in/founder",
        image: "https://sabkadelivery.in/founder/karan.jpg",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-6xl mx-auto py-16 px-6">
        <section className="text-center">
          <p className="text-yellow-400 font-semibold tracking-widest uppercase">
            Sabka Delivery
          </p>
          <h1 className="text-4xl md:text-6xl font-bold mt-3 text-yellow-400">
            About Us
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-gray-300 text-lg leading-8">
            Sabka Delivery is a hyperlocal delivery platform created to make
            food, grocery and daily essentials delivery faster, smarter and
            affordable for everyone.
          </p>
          <p className="mt-4 max-w-3xl mx-auto text-gray-300 text-lg leading-8">
            Sabka Delivery was founded by Prem Kumar Nath and Karan Nath.
            The company is owned by Prem Kumar Nath.
          </p>
        </section>

        <section className="mt-16">
          <div>
            <p className="text-yellow-400 font-semibold uppercase tracking-wider">
              Our Leadership
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Owner & Founders
            </h2>
            <p className="mt-3 text-gray-400">
              Prem Kumar Nath is the owner of Sabka Delivery. Prem Kumar Nath
              and Karan Nath are the founders of Sabka Delivery.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            {leaders.map((leader) => (
              <article
                key={leader.name}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-7 shadow-2xl"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <img
                    src={leader.image}
                    width={180}
                    height={180}
                    alt={leader.alt}
                    loading="lazy"
                    className="w-44 h-44 rounded-full object-cover border-4 border-yellow-500 shadow-xl shrink-0"
                  />

                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl md:text-3xl font-bold text-yellow-400">
                      {leader.name}
                    </h3>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {leader.role}
                    </p>
                    <p className="mt-4 text-gray-300 leading-7">
                      {leader.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-3xl font-bold text-yellow-400">Our Story</h2>
          <p className="mt-5 text-gray-300 text-lg leading-8">
            Sabka Delivery was created by Karan Nath and Prem Kumar Nath with
            a simple goal: make local delivery convenient, dependable and
            accessible. The platform brings local customers and businesses
            together through modern technology and a customer-first approach.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-8 mt-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-bold text-yellow-400">Mission</h2>
            <p className="mt-4 text-gray-300 leading-8">
              To make local delivery faster, smarter and affordable for
              everyone.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-bold text-yellow-400">Vision</h2>
            <p className="mt-4 text-gray-300 leading-8">
              To become one of India&apos;s most trusted hyperlocal delivery
              companies.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

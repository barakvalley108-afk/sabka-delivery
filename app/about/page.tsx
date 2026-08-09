export const metadata = {
  title: "About Sabka Delivery | Karan Nath & Prem Kumar Nath",
  description:
    "Learn about Sabka Delivery and its two equal owners and founders, Karan Nath and Prem Kumar Nath.",
  keywords: [
    "Sabka Delivery",
    "Karan Nath",
    "Prem Kumar Nath",
    "Sabka Delivery owner",
    "Sabka Delivery owners",
    "Sabka Delivery founder",
    "Sabka Delivery founders",
    "Sabka Delivery CEO",
  ],
};

const leaders = [
  {
    name: "Karan Nath",
    role: "Owner • Founder & CEO",
    image: "/founder/karan.jpg",
    alt: "Karan Nath, Owner, Founder and CEO of Sabka Delivery",
    description:
      "Karan Nath is an equal Owner, Founder and CEO of Sabka Delivery. He co-founded the platform with Prem Kumar Nath to build a reliable, customer-first hyperlocal delivery service.",
  },
  {
    name: "Prem Kumar Nath",
    role: "Owner • Founder & CEO",
    image: "/founder/prem.png",
    alt: "Prem Kumar Nath, Owner, Founder and CEO of Sabka Delivery",
    description:
      "Prem Kumar Nath is an equal Owner, Founder and CEO of Sabka Delivery. He co-founded the platform with Karan Nath and works alongside him on the growth and development of the company.",
  },
];

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sabka Delivery",
    url: "https://sabkadelivery.in",
    description:
      "A hyperlocal delivery platform for food, grocery and daily essentials, co-founded and owned equally by Karan Nath and Prem Kumar Nath.",
    founder: [
      {
        "@type": "Person",
        name: "Karan Nath",
        jobTitle: "Owner, Founder & CEO",
        image: "https://sabkadelivery.in/founder/karan.jpg",
      },
      {
        "@type": "Person",
        name: "Prem Kumar Nath",
        jobTitle: "Owner, Founder & CEO",
        image: "https://sabkadelivery.in/founder/prem.png",
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
            Sabka Delivery was co-founded and is equally owned by Karan Nath
            and Prem Kumar Nath. Both founders are part of the company&apos;s
            core leadership.
          </p>
        </section>

        <section className="mt-16">
          <div>
            <p className="text-yellow-400 font-semibold uppercase tracking-wider">
              Our Leadership
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Owners & Founders
            </h2>
            <p className="mt-3 text-gray-400">
              Karan Nath and Prem Kumar Nath are equal owners and co-founders
              of Sabka Delivery. There is no primary or secondary owner.
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

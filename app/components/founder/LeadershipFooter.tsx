export default function LeadershipFooter() {
  return (
    <section
      id="leadership"
      className="border-t border-zinc-800 bg-black px-6 py-16 text-white"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-400">
            Sabka Delivery
          </p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            Owners & Founders of Sabka Delivery
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-400">
            The people behind Sabka Delivery, building a faster, smarter and
            affordable local delivery platform for everyone.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <article className="overflow-hidden rounded-3xl border border-yellow-500/30 bg-zinc-950 shadow-2xl">
            <div className="flex flex-col items-center p-8 text-center">
              <img
                src="/founder/karan.jpg"
                alt="Karan Nath - Founder and CEO of Sabka Delivery"
                className="h-40 w-40 rounded-full border-4 border-yellow-500 object-cover shadow-xl"
                loading="lazy"
              />
              <p className="mt-6 text-sm font-bold uppercase tracking-widest text-yellow-400">
                Founder & CEO
              </p>
              <h3 className="mt-2 text-3xl font-bold">Karan Nath</h3>
              <div className="mt-5 space-y-2 text-sm leading-6 text-gray-300">
                <p><strong className="text-white">Company:</strong> Sabka Delivery</p>
                <p><strong className="text-white">School:</strong> Primrose English Medium Senior Secondary School, Lala</p>
                <p><strong className="text-white">Class:</strong> Class 8</p>
                <p><strong className="text-white">Location:</strong> Lala Bazar, Hailakandi, Assam, India</p>
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-3xl border border-yellow-500/30 bg-zinc-950 shadow-2xl">
            <div className="flex flex-col items-center p-8 text-center">
              <img
                src="/founder/prem.png"
                alt="Prem Kumar Nath - Owner of Sabka Delivery"
                className="h-40 w-40 rounded-full border-4 border-yellow-500 object-cover shadow-xl"
                loading="lazy"
              />
              <p className="mt-6 text-sm font-bold uppercase tracking-widest text-yellow-400">
                Owner
              </p>
              <h3 className="mt-2 text-3xl font-bold">Prem Kumar Nath</h3>
              <div className="mt-5 space-y-2 text-sm leading-6 text-gray-300">
                <p><strong className="text-white">Company:</strong> Sabka Delivery</p>
                <p><strong className="text-white">School:</strong> Lala H.S. & M.P. School</p>
                <p><strong className="text-white">Class:</strong> Class 11</p>
                <p><strong className="text-white">Location:</strong> Lala Bazar, Hailakandi, Assam, India</p>
              </div>
            </div>
          </article>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <h3 className="text-2xl font-bold text-yellow-400">Quick Links</h3>
            <p className="mt-2 text-sm text-gray-400">Start with Food or Grocery delivery.</p>
            <nav className="mt-6 flex flex-col gap-3" aria-label="Quick Links">
              <a href="/food-delivery" className="rounded-xl border border-zinc-800 bg-black px-4 py-3 font-semibold transition hover:border-yellow-500 hover:text-yellow-400">
                🍔 Food Delivery
              </a>
              <a href="/grocery-delivery" className="rounded-xl border border-zinc-800 bg-black px-4 py-3 font-semibold transition hover:border-yellow-500 hover:text-yellow-400">
                🛒 Grocery Delivery
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <p className="text-gray-300">
            Sabka Delivery is a hyperlocal platform for food, grocery and daily
            essentials delivery in Lala Bazar, Hailakandi, Assam.
          </p>
        </div>
      </div>
    </section>
  );
}

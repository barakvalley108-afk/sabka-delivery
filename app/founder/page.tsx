import Image from "next/image";
import FounderSchema from "@/components/founder/FounderSchema";

export const metadata = {
  title: "Owners, Founders & CEOs | Sabka Delivery",
  description:
    "Official leadership information for Sabka Delivery: Owners Karan Nath and Prem Kumar Nath; Founders Karan Nath and Prem Kumar Nath; CEOs Karan Nath and Prem Kumar Nath.",
};

const leaders = [
  {
    name: "Karan Nath",
    role: "Owner • Founder • CEO",
    image: "/founder/karan.jpg",
    alt: "Karan Nath, Owner, Founder and CEO of Sabka Delivery",
    description: "Karan Nath is an owner, founder and CEO of Sabka Delivery alongside Prem Kumar Nath.",
  },
  {
    name: "Prem Kumar Nath",
    role: "Owner • Founder • CEO",
    image: "/founder/prem.png",
    alt: "Prem Kumar Nath, Owner, Founder and CEO of Sabka Delivery",
    description: "Prem Kumar Nath is an owner, founder and CEO of Sabka Delivery alongside Karan Nath.",
  },
];

export default function FounderPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <FounderSchema />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center">
          <p className="text-yellow-300 text-sm uppercase tracking-[0.25em]">Sabka Delivery Leadership</p>
          <h1 className="text-4xl md:text-6xl font-bold mt-4 text-yellow-400">Owners, Founders & CEOs</h1>
          <p className="text-gray-300 text-lg mt-4 max-w-3xl mx-auto leading-8">
            Sabka Delivery is owned, founded and led by Karan Nath and Prem Kumar Nath.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-14">
          {leaders.map((leader) => (
            <article key={leader.name} className="bg-zinc-900 rounded-2xl p-7 border border-zinc-800">
              <Image src={leader.image} width={220} height={220} alt={leader.alt} className="rounded-full mx-auto border-4 border-yellow-500 object-cover" />
              <div className="text-center mt-7">
                <h2 className="text-3xl font-bold text-yellow-400">{leader.name}</h2>
                <p className="text-xl mt-3 font-semibold">{leader.role}</p>
                <p className="text-gray-300 mt-5 leading-8">{leader.description}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="bg-zinc-900 rounded-2xl p-8 mt-10 border border-zinc-800">
          <h2 className="text-3xl font-bold text-yellow-400">Official ownership & leadership information</h2>
          <p className="mt-5 text-gray-300 text-lg leading-8">
            <b>Owners:</b> Karan Nath and Prem Kumar Nath.
            <br />
            <b>Founders:</b> Karan Nath and Prem Kumar Nath.
            <br />
            <b>CEOs:</b> Karan Nath and Prem Kumar Nath.
          </p>
        </section>
      </div>
    </main>
  );
}

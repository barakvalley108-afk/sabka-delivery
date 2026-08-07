"<Image
  src="/founder/karan.jpg"
  width={220}
  height={220}
  alt="Karan Nath"
  className="rounded-full mx-auto border-4 border-yellow-500"
/>";
import FounderSchema from "@/components/founder/FounderSchema";

export const metadata = {
  title: "Karan Nath | Founder & CEO | Sabka Delivery",
  description:
    "Official Founder & CEO profile of Karan Nath, Founder of Sabka Delivery.",
};

export default function FounderPage() {
  const currentYear = new Date().getFullYear();
  const march20 = new Date(currentYear, 2, 20);

  let currentClass = 7;

  if (new Date() >= march20) {
    currentClass += currentYear - 2026 + 1;
  } else {
    currentClass += currentYear - 2026;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <FounderSchema />

      <div className="max-w-5xl mx-auto px-6 py-12">

        <div className="text-center">
          <Image
            src="/founder/karan.jpg"
            width={220}
            height={220}
            alt="Karan Nath"
            className="rounded-full mx-auto border-4 border-yellow-500"
          />

          <h1 className="text-5xl font-bold mt-8 text-yellow-400">
            Karan Nath
          </h1>

          <h2 className="text-2xl mt-3">
            Founder & CEO
          </h2>

          <p className="text-yellow-300 text-lg mt-2">
            Sabka Delivery
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-14">

          <div className="bg-zinc-900 rounded-2xl p-6">

            <h3 className="text-yellow-400 text-2xl font-bold mb-4">
              Founder Information
            </h3>

            <p><b>Name:</b> Karan Nath</p>

            <p><b>Role:</b> Founder & CEO</p>

            <p><b>Company:</b> Sabka Delivery</p>

            <p><b>School:</b> Primrose English Medium Senior Secondary School, Lala</p>

            <p><b>Current Class:</b> {currentClass}</p>

            <p><b>Location:</b> Lala Bazar, Hailakandi, Assam, India</p>

          </div>

          <div className="bg-zinc-900 rounded-2xl p-6">

            <h3 className="text-yellow-400 text-2xl font-bold mb-4">
              About
            </h3>

            <p className="leading-8">
              Karan Nath is the Founder and Chief Executive Officer
              of Sabka Delivery.

              Sabka Delivery is a hyperlocal delivery platform
              created to provide fast food, grocery and
              daily essentials delivery in Lala Bazar,
              Hailakandi District, Assam.

              Alongside his education,
              Karan is building Sabka Delivery with
              modern technology and customer-first service.
            </p>

          </div>

        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 mt-10">

          <h3 className="text-yellow-400 text-3xl font-bold">
            Mission
          </h3>

          <p className="mt-4 leading-8">
            To make local delivery faster,
            smarter and affordable for everyone.
          </p>

        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 mt-10">

          <h3 className="text-yellow-400 text-3xl font-bold">
            Vision
          </h3>

          <p className="mt-4 leading-8">
            To become one of India's most trusted
            hyperlocal delivery companies.
          </p>

        </div>

      </div>
    </main>
  );
}

import Link from "next/link";

export const metadata = {
  title: "About Sabka Delivery",
  description:
    "Learn about Sabka Delivery, founded by Karan Nath.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">

      <div className="max-w-6xl mx-auto py-16 px-6">

        <h1 className="text-5xl font-bold text-yellow-400">
          About Sabka Delivery
        </h1>

        <p className="mt-8 leading-9 text-lg">

          Sabka Delivery is a local hyperlocal delivery platform
          serving Food, Grocery and Daily Essentials.

          It was founded by
          <span className="text-yellow-400 font-bold">
            {" "}Karan Nath{" "}
          </span>

          with a vision of making fast,
          reliable and affordable delivery
          available for everyone.

        </p>

        <div className="mt-12">

          <Link
            href="/founder"
            className="bg-yellow-500 text-black px-8 py-4 rounded-xl font-bold"
          >
            Meet Our Founder
          </Link>

        </div>

      </div>

    </main>
  );
}

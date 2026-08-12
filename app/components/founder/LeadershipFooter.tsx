export default function LeadershipFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-5 py-8 text-zinc-700">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center text-sm">
        <p className="font-medium">Lala Bazar ka apna Food + Grocery delivery platform.</p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a href="/privacy" className="font-semibold underline-offset-4 hover:underline">Privacy Policy</a>
          <a href="/terms" className="font-semibold underline-offset-4 hover:underline">Terms</a>
        </div>
        <p>
          <a
            href="https://wa.me/6000830383"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-green-700 underline-offset-4 hover:underline"
          >
            WhatsApp Support · 6000830383
          </a>
        </p>
      </div>
    </footer>
  );
}

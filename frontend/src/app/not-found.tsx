import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-amber-200">
      <h2 className="text-2xl font-bold font-serif mb-2">Realm Boundary Not Found</h2>
      <p className="text-sm text-zinc-400 mb-4">You have ventured beyond the charted map of Sovereign Lands.</p>
      <Link href="/" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs uppercase tracking-wider">
        Return to Realm
      </Link>
    </div>
  );
}

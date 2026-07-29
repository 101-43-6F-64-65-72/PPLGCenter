import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-building.png"
          alt="Background School"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-950/55" />
      </div>

      <div className="relative z-10">
        <main className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-24">
          <div className="w-full max-w-md rounded-[32px] border border-white/20 bg-[#2c1ee8]/95 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
            <div className="mb-8 flex justify-start">
              <Link
                href="/"
                className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 transition"
              >
                Kembali
              </Link>
            </div>

            <div className="mb-10 flex flex-col items-start gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 border border-white/20">
                <Image
                  src="/images/logo.png"
                  alt="School Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">SMKN 2 SURAKARTA</h1>
                <p className="text-sm text-slate-100/80">
                  Vocational High School Surakarta
                </p>
              </div>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-100/90">
                  School ID
                </label>
                <input
                  type="text"
                  placeholder="Enter your School ID"
                  className="mt-3 w-full rounded-2xl border border-white/20 bg-white/95 px-4 py-3 text-slate-950 outline-none focus:border-[#2c1ee8] focus:ring-2 focus:ring-[#2c1ee8]/25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-100/90">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your Password"
                  className="mt-3 w-full rounded-2xl border border-white/20 bg-white/95 px-4 py-3 text-slate-950 outline-none focus:border-[#2c1ee8] focus:ring-2 focus:ring-[#2c1ee8]/25"
                />
              </div>

              <div className="flex justify-between text-sm text-slate-100/80">
                <div />
                <a href="#" className="font-medium text-white underline decoration-white/40">
                  reset here
                </a>
              </div>

              <button
                type="button"
                className="w-full rounded-2xl bg-white px-6 py-4 text-base font-semibold text-[#2c1ee8] shadow-lg shadow-white/25 transition hover:bg-slate-100"
              >
                Login
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

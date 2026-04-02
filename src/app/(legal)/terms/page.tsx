export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-4 sm:px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Terms of Service</h1>

        <p className="text-white/70 text-sm sm:text-base">
          By using this app, you agree to the following terms.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Usage</h2>
          <p className="text-white/70 text-sm sm:text-base">
            You agree to use this platform responsibly and not attempt to exploit or abuse the system.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Accounts</h2>
          <p className="text-white/70 text-sm sm:text-base">
            You are responsible for maintaining the security of your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Limitations</h2>
          <p className="text-white/70 text-sm sm:text-base">
            We are not liable for any data loss or damages arising from use of the service.
          </p>
        </section>

        <p className="text-white/50 text-xs">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
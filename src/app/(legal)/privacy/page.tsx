export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-4 sm:px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Privacy Policy</h1>

        <p className="text-white/70 text-sm sm:text-base">
          Your privacy matters. This page explains how we collect, use, and protect your data.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Information We Collect</h2>
          <p className="text-white/70 text-sm sm:text-base">
            We collect basic information such as your name, email, and typing activity to improve your experience.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. How We Use Data</h2>
          <p className="text-white/70 text-sm sm:text-base">
            Your data is used to track progress, improve features, and enhance performance analytics.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Data Security</h2>
          <p className="text-white/70 text-sm sm:text-base">
            We use industry-standard practices to protect your data. However, no system is 100% secure.
          </p>
        </section>

        <p className="text-white/50 text-xs">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
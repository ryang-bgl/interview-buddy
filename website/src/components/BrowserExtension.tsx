import {
  Chrome,
  Save,
  Key,
  CheckCircle,
  Shield,
  Code2,
  FileText,
} from "lucide-react";

export function BrowserExtension() {
  const features = [
    {
      icon: Save,
      title: "Instant LeetCode Capture",
      description:
        "Save problem title, URL, difficulty, tags, full statement, your solution code, and notes directly from LeetCode with preview before submission.",
      gradient: "from-sky-500 to-cyan-500",
    },
    {
      icon: Key,
      title: "Secure API Integration",
      description:
        "Use your personal API key to authenticate. All saves are securely stored and tied to your account, ensuring your prep data remains private.",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: CheckCircle,
      title: "Smart Feedback",
      description:
        "Get immediate confirmation on successful saves, clear error messages for network issues, and prompts to reauthenticate when needed.",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      icon: Shield,
      title: "Data Isolation",
      description:
        "Prevents duplicate saves for the same problem and enforces per-user data isolation. Your API key can only access your own captures.",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <section id="extension" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative elements - professional blue tones */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-4 rounded-2xl border border-sky-200 bg-white/90 px-6 py-4 shadow-xl shadow-sky-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-b text-white">
              <img src="/assets/chrome.svg" alt="Chrome logo" width="24" height="24" />
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-900">
                Browser Extension
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-20">
          <h2 className="text-5xl text-gray-900 mb-6 leading-tight">
            Save LeetCode Solutions{" "}
            <span className="bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
              In One Click
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Seamlessly integrates with LeetCode to capture your solutions for spaced
            repetition review during interview prep.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="group relative">
              <div
                className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity blur-xl"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                }}
              ></div>
              <div className="relative bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-gray-200 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-colors cursor-pointer">
                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

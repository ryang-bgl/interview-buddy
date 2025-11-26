import {
  Chrome,
  Save,
  Key,
  CheckCircle,
  Shield,
  ArrowRight,
  Code2,
  FileText,
} from "lucide-react";

export function BrowserExtension() {
  const features = [
    {
      icon: Save,
      title: "Instant Capture",
      description:
        "Captures problem title, URL, difficulty, tags, full statement, your solution code, and optional notes directly from the LeetCode page with a preview before submission.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Key,
      title: "Secure API Integration",
      description:
        "Use your personal API key to authenticate. All saves are securely stored and tied to your account, ensuring your solutions remain private and accessible.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: CheckCircle,
      title: "Smart Feedback",
      description:
        "Get immediate confirmation on successful saves, clear error messages for network issues, and prompts to reauthenticate when your API key expires or is invalid.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Shield,
      title: "Data Isolation",
      description:
        "Prevents duplicate saves for the same problem and enforces per-user data isolation. Your API key can only access your own captures, keeping your data secure.",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <section id="extension" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl text-gray-900 mb-6 leading-tight">
            Save Solutions in{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              One Click
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Seamlessly integrates with LeetCode to capture everything you need
            for effective review later.
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
              <div className="relative bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-gray-200 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-all hover:-translate-y-1">
                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
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

        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-10 md:p-12 shadow-2xl shadow-green-500/30 relative overflow-hidden">
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <h3 className="text-3xl text-white mb-6">
              Works with Your Favorite Platforms
            </h3>
            <p className="text-white/90 text-lg mb-8">
              LeetStack seamlessly captures your solutions and notes from
              LeetCode, HackerRank, and other coding platforms. All your
              interview prep in one place.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                "LeetCode",
                "HackerRank",
                "CodeForces",
                "System Design",
                "Behavioral Prep",
              ].map((platform) => (
                <div
                  key={platform}
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 text-white font-medium"
                >
                  {platform}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

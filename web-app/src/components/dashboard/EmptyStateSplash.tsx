import {
  BookOpen,
  FileText,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Target,
  Zap,
  Clock,
  Star,
  Lightbulb,
  Chrome,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EmptyStateSplashProps {
  onGetStarted?: () => void;
}

export const EmptyStateSplash = ({ onGetStarted }: EmptyStateSplashProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/50">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          {/* Animated Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl shadow-lg">
                <img
                  src="/assets/leetstack.png"
                  alt="LeetStack"
                  className="h-16 w-16 object-contain"
                />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to LeetStack
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your interview prep into an intelligent learning
              journey. Capture DSA questions, create flashcards from any
              webpage, and master System Design & Behavioral questions with
              AI-powered review.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Save 10+ hours/week</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>3x retention rate</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>5,000+ problems solved</span>
            </div>
          </div>
        </div>

        {/* Main CTA Section */}
        <div className="relative mb-12">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-3xl transform rotate-1"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl transform -rotate-1"></div>

          <Card className="relative border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md overflow-hidden">
            {/* Gradient border effect */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

            <CardContent className="p-10">
              <div className="text-center space-y-8">
                {/* Icon with animated background */}
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-2xl shadow-lg">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Heading with gradient text */}
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold">
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Get Started in 30 Seconds
                    </span>
                  </h2>
                  <div className="relative">
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                      Install the Chrome extension to capture what you've
                      learned and
                      <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {" "}
                        ace your tech interview with confidence!
                      </span>
                    </p>
                    {/* Underline decoration */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full opacity-50"></div>
                  </div>
                </div>

                {/* CTA Button with enhanced styling */}
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative group">
                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>

                    <Button
                      size="lg"
                      className="relative text-lg px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-2xl transform transition-all duration-300 hover:scale-105 border-0"
                      onClick={() => {
                        window.open(
                          "https://chromewebstore.google.com/your-extension-url",
                          "_blank"
                        );
                      }}
                    >
                      <Chrome className="mr-3 h-6 w-6" />
                      <span className="font-semibold">
                        Install Extension Free
                      </span>
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>
                  </div>

                  {/* Trust indicators with icons */}
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-300">
                        Easy setup
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        No signup required
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-700 dark:text-purple-300">
                        Works everywhere
                      </span>
                    </div>
                  </div>
                </div>

                {/* Social proof / urgency element */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="relative flex h-2 w-2">
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
                    <div className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></div>
                  </div>
                  <span>
                    Join 1,000+ developers already acing their interviews
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works - Interactive Guide */}
        <Card className="border-0 shadow-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm mb-12">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Lightbulb className="h-6 w-6 text-yellow-500" />
              How to Use LeetStack
            </CardTitle>
            <CardDescription className="text-lg">
              Three simple steps to supercharge your interview preparation
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="text-center space-y-4 group">
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg">
                    <Chrome className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    Install Extension
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Add LeetStack to Chrome in one click from the Web Store. No
                    registration needed - just install and go!
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Takes 30 seconds</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-4 group">
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform"></div>
                  <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
                    <span className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    Capture & Learn
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    On LeetCode: Auto-capture problems and solutions. On any
                    site: Create flashcards for System Design, Behavioral
                    questions, and more.
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Works on any webpage</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-4 group">
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg">
                    <Target className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
                    <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    Review & Master
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Use spaced repetition to review flashcards. Track progress,
                    identify weak areas, and ace your interviews.
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>AI-powered scheduling</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Showcase */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-blue-900 dark:text-blue-100">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
                DSA Problem Mastery
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-3">
                {[
                  {
                    icon: CheckCircle,
                    text: "Auto-captures problem details from LeetCode",
                  },
                  {
                    icon: CheckCircle,
                    text: "Stores your code solutions and personal notes",
                  },
                  {
                    icon: CheckCircle,
                    text: "Tracks difficulty levels and progress metrics",
                  },
                  {
                    icon: CheckCircle,
                    text: "Optimal review timing with spaced repetition",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <item.icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-blue-200/50">
                <p className="text-xs text-blue-600 font-medium">
                  💡 Perfect for daily LeetCode practice sessions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-green-900 dark:text-green-100">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
                Smart Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-3">
                {[
                  {
                    icon: CheckCircle,
                    text: "Works on ANY webpage - blogs, articles, documentation",
                  },
                  {
                    icon: CheckCircle,
                    text: "AI-powered content summarization and extraction",
                  },
                  {
                    icon: CheckCircle,
                    text: "Perfect for System Design & Behavioral questions",
                  },
                  {
                    icon: CheckCircle,
                    text: "Instant flashcard generation from selected text",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <item.icon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-green-200/50">
                <p className="text-xs text-green-600 font-medium">
                  💡 Study System Design patterns and behavioral interview
                  answers
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pro Tips Section */}
        <Card className="border-2 border-dashed border-muted bg-muted/30">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                Pro Tips for Maximum Learning
              </h3>
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                <div className="space-y-2">
                  <div className="font-medium text-blue-600">
                    🎯 Daily Practice
                  </div>
                  <p className="text-muted-foreground">
                    Solve 2-3 problems daily and review flashcards during breaks
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-green-600">
                    📚 Content Variety
                  </div>
                  <p className="text-muted-foreground">
                    Mix LeetCode problems with System Design articles and
                    behavioral prep
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-purple-600">
                    ⚡ Consistent Review
                  </div>
                  <p className="text-muted-foreground">
                    Let AI schedule your reviews for optimal retention
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        {onGetStarted && (
          <div className="text-center mt-12">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Already installed the extension?
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={onGetStarted}
                className="text-base px-8 py-3"
              >
                Start Using LeetStack
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

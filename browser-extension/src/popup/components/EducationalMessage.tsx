interface EducationalMessageProps {
  onSwitchToLeetcodeTab: () => void;
}

export default function EducationalMessage({ onSwitchToLeetcodeTab }: EducationalMessageProps) {
  // Simple icon components using SVG or emoji instead of lucide-react
  const InfoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12,5 19,12 12,19"></polyline>
    </svg>
  );

  const BookOpenIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h6"></path>
    </svg>
  );

  const LightbulbIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v8"></path>
      <path d="M12 18h.01"></path>
      <circle cx="12" cy="12" r="9"></circle>
    </svg>
  );

  const TargetIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  );
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Icon with animation */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
              <InfoIcon />
            </div>
            <div className="absolute -top-1 -right-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Main message */}
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Choose the Right Tool for Your Learning
          </h3>

          <div className="space-y-4">
            {/* DSA Notebook section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <BookOpenIcon />
                </div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  DSA Notebook
                </h4>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Use this to save your LeetCode solutions and review them later in LeetStack.
                Perfect for tracking your coding progress and revisiting problems.
              </p>
              <button
                onClick={onSwitchToLeetcodeTab}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Switch to DSA Notebook
                <ArrowRightIcon />
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-muted"></div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">OR</span>
              <div className="flex-1 h-px bg-muted"></div>
            </div>

            {/* Note→Flashcards section */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-600 rounded-lg text-white">
                  <LightbulbIcon />
                </div>
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Text → Flashcards
                </h4>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200 space-y-2">
                Perfect for:
              </p>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>System Design articles and documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Behavioral interview questions and answers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Technical blog posts and tutorials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Study materials and course content</span>
                </li>
              </ul>
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  💡 Navigate to any webpage with study content to start creating flashcards!
                </p>
              </div>
            </div>
          </div>

          {/* Quick tip */}
          <div className="bg-muted/30 rounded-lg p-3 border border-muted">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TargetIcon />
              <span>Visit a System Design blog or behavioral interview article to use Note→Flashcards effectively.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Hero } from './components/Hero';
import { BrowserExtension } from './components/BrowserExtension';
import { MobileApp } from './components/MobileApp';
import { HowItWorks } from './components/HowItWorks';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <BrowserExtension />
      <MobileApp />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}

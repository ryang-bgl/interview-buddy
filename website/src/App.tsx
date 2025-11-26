import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { TechDetails } from './components/TechDetails';
import { HowItWorks } from './components/HowItWorks';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Features />
      <TechDetails />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NavBar } from './components/NavBar'
import { HeroSection } from './components/HeroSection'
import { ProblemSection } from './components/ProblemSection'
import { FeaturesSection } from './components/FeaturesSection'
import { HowItWorksSection } from './components/HowItWorksSection'
import { PreRegistrationSection } from './components/PreRegistrationSection'
import { SocialProofSection } from './components/SocialProofSection'
import { FaqSection } from './components/FaqSection'
import { FooterSection } from './components/FooterSection'

export default async function MarketingPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SocialProofSection />
        <PreRegistrationSection />
        <FaqSection />
      </main>
      <FooterSection />
    </div>
  )
}

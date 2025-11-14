'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Zap, 
  Brain, 
  MessageCircle, 
  Menu, 
  X,
  Check,
  Facebook,
  Instagram,
  Twitter
} from 'lucide-react'
import UploadModal from './UploadModal'

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const floatVariants = {
    animate: {
      y: [0, -20, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
    }
  }

  // ==================== NAVBAR ====================
  const Navbar = () => (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-white/50 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 font-bold text-xl text-gray-900"
        >
          <BookOpen size={28} className="text-[#3a86ff]" />
          <span>NoteGenie</span>
        </motion.div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'About', 'Contact'].map((item) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              whileHover={{ color: '#3a86ff' }}
              className="text-gray-700 text-sm font-medium transition-colors cursor-pointer"
            >
              {item}
            </motion.a>
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setUploadModalOpen(true)}
          className="hidden md:block px-6 py-2.5 bg-gradient-to-r from-[#3a86ff] to-[#3a86ff] text-white rounded-full font-semibold text-sm hover:shadow-lg transition-shadow cursor-pointer"
        >
          Get Started
        </motion.button>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-gray-900"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden bg-white border-t border-gray-200 px-6 py-4 space-y-3"
        >
          {['Features', 'Pricing', 'About', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="block text-gray-700 font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false)
              setUploadModalOpen(true)
            }}
            className="w-full mt-2 px-6 py-2.5 bg-gradient-to-r from-[#3a86ff] to-[#3a86ff] text-white rounded-full font-semibold cursor-pointer">
            Get Started
          </button>
        </motion.div>
      )}
    </motion.nav>
  )

  // ==================== HERO SECTION ====================
  const HeroSection = () => (
    <section className="min-h-screen bg-white pt-32 pb-16 px-6 relative overflow-hidden">
      {/* Gradient Blobs Background */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-[#3a86ff]/10 to-[#3a86ff]/6 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#3a86ff]/6 to-transparent rounded-full blur-3xl opacity-40" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left: Text Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-6"
        >
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
          >
            Transform Your Lectures into Smart Notes <span className="text-[#3a86ff]">✨</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg text-gray-600 max-w-xl"
          >
            AI-powered notes, summaries, flashcards, and mind maps — all in one place. Upload, transcribe, and study smarter.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setUploadModalOpen(true)}
              className="px-8 py-3 bg-gradient-to-r from-[#3a86ff] to-[#3a86ff] text-white font-semibold rounded-full hover:shadow-lg transition-shadow cursor-pointer"
            >
              Get Started
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 border-2 border-[#3a86ff] text-[#3a86ff] font-semibold rounded-full hover:bg-[#3a86ff]/10 transition-colors cursor-pointer"
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right: Opening Book Illustration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative h-96 md:h-full flex items-center justify-center"
        >
          {/* Opening Book Lottie Animation */}
          <motion.div
            variants={floatVariants}
            animate="animate"
            className="w-full max-w-sm flex items-center justify-center"
          >
            <video
              src="https://cdnl.iconscout.com/lottie/premium/thumb/open-book-animated-icon-gif-download-12239646.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto max-w-sm rounded-2xl shadow-2xl"
              style={{ background: 'transparent' }}
            />
          </motion.div>

          {/* Floating Icons (Platform Logos) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {[
              { icon: 'YT', top: '10%', left: '10%', delay: 0 },
              { icon: 'UD', top: '10%', right: '10%', delay: 0.3 },
              { icon: 'CR', bottom: '20%', left: '5%', delay: 0.6 }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: item.delay }}
                style={{
                  position: 'absolute',
                  top: item.top,
                  bottom: item.bottom,
                  left: item.left,
                  right: item.right
                }}
                className="w-12 h-12 bg-gradient-to-br from-[#3a86ff] to-[#3a86ff] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg"
              >
                {item.icon}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )

  // ==================== FEATURES SECTION ====================
  const FeaturesSection = () => {
    const features = [
      { icon: Brain, title: 'AI Note Summaries', desc: 'Auto-generate comprehensive summaries from lectures' },
      { icon: Zap, title: 'Flashcards Generator', desc: 'Create instant flashcards for quick review' },
      { icon: Brain, title: 'Mind Map View', desc: 'Visualize concepts with interactive mind maps' },
      { icon: MessageCircle, title: 'Transcript Search', desc: 'Search and find anything from your lectures' },
      { icon: BookOpen, title: 'Lecture Upload', desc: 'Easy upload from YouTube, Udemy, or files' },
      { icon: Zap, title: 'Real-time Sync', desc: 'Keep your notes synced across all devices' }
    ]

    return (
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Students Love NoteGenie <span className="text-[#3a86ff]">💚</span>
            </h2>
            <p className="text-xl text-gray-600">Everything you need to ace your studies</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(58,134,255,0.08)' }}
                  className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-[#3a86ff]/20 transition-all cursor-pointer"
              >
                <feature.icon className="w-12 h-12 text-[#3a86ff] mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    )
  }

  // ==================== PRICING SECTION ====================
  const PricingSection = () => {
    const plans = [
      {
        name: 'Free',
        price: '₹0',
        features: ['5 lectures/month', 'Basic summaries', 'Limited flashcards']
      },
      {
        name: 'Student Plan',
        price: '₹99',
        features: ['Unlimited lectures', 'AI summaries', 'Flashcards + Mind maps', 'Transcript search'],
        highlighted: true
      },
      {
        name: 'Pro Plan',
        price: '₹149',
        features: ['Everything in Student', 'Priority support', 'Advanced analytics', 'Team collaboration']
      }
    ]

    return (
      <section id="pricing" className="py-24 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your Plan <span className="text-[#3a86ff]">💰</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, boxShadow: '0 25px 50px rgba(234,88,12,0.25)' }}
                className={`p-8 rounded-2xl transition-all ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-[#3a86ff] to-[#3a86ff] border-2 border-[#3a86ff] shadow-2xl scale-105'
                    : 'bg-gray-800 border-2 border-gray-700 hover:border-[#3a86ff]'
                }`}
              >
                {plan.highlighted && (
                  <div className="inline-block px-3 py-1 bg-white text-[#3a86ff] rounded-full text-xs font-bold mb-4">
                    MOST POPULAR
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <div className={`text-4xl font-bold mb-6 ${plan.highlighted ? 'text-white' : 'text-[#3a86ff]'}`}>
                  {plan.price}
                  <span className={`text-sm font-normal ${plan.highlighted ? 'text-[#3a86ff]/20' : 'text-gray-400'}`}>/month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className={`flex items-center gap-3 ${plan.highlighted ? 'text-white' : 'text-gray-300'}`}>
                      <Check className={`w-5 h-5 ${plan.highlighted ? 'text-white' : 'text-[#3a86ff]'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-3 rounded-full font-bold transition-all cursor-pointer ${
                    plan.highlighted
                      ? 'bg-white text-[#3a86ff] hover:bg-[#3a86ff]/10'
                          : 'bg-[#3a86ff] text-white hover:bg-[#3a86ff]'
                  }`}
                >
                  Get Started
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // ==================== CHATBOT SECTION ====================
  const ChatbotSection = () => (
    <>
      {/* Floating Chat Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ boxShadow: ['0 0 0 0 rgba(58,134,255,0.6)', '0 0 0 10px rgba(58,134,255,0)'] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        onClick={() => setChatOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-[#3a86ff] to-[#3a86ff] rounded-full shadow-xl flex items-center justify-center text-white z-40 hover:shadow-2xl transition-shadow cursor-pointer"
      >
        <MessageCircle size={28} />
      </motion.button>

      {/* Chat Popup */}
      {chatOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-28 right-8 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#3a86ff] to-[#3a86ff] p-4 text-white flex items-center justify-between">
            <h3 className="font-bold">Genie AI Assistant</h3>
            <button onClick={() => setChatOpen(false)} className="text-white hover:bg-[#3a86ff] p-1 rounded cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-gray-700 text-sm">
              <p className="font-semibold mb-2">Hi 👋 I'm Genie!</p>
              <p>Your AI study assistant. Ask me anything about your notes, need help with summaries, or want study tips?</p>
            </div>
            <input
              type="text"
              placeholder="Ask me something..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3a86ff]"
            />
          </div>
        </motion.div>
      )}
    </>
  )

  // ==================== FOOTER SECTION ====================
  const Footer = () => (
    <footer className="bg-white border-t border-gray-200 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
        >
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={28} className="text-[#3a86ff]" />
              <span className="font-bold text-xl text-gray-900">NoteGenie</span>
            </div>
            <p className="text-gray-600 text-sm">Transform your learning with AI-powered notes and interactive study tools.</p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Company</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-600 text-sm hover:text-[#3a86ff] transition-colors cursor-pointer">About Us</a></li>
                <li><a href="#contact" className="text-gray-600 text-sm hover:text-[#3a86ff] transition-colors cursor-pointer">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Follow Us</h4>
              <div className="flex gap-4">
                {[
                  { icon: Facebook, href: '#' },
                  { icon: Instagram, href: '#' },
                  { icon: Twitter, href: '#' }
                ].map((social, idx) => (
                  <motion.a
                    key={idx}
                    href={social.href}
                    whileHover={{ scale: 1.2, color: '#3a86ff' }}
                    className="text-gray-600 transition-colors cursor-pointer"
                  >
                    <social.icon size={20} />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="border-t border-gray-200 pt-8 text-center text-gray-600 text-sm">
          <p>&copy; 2025 NoteGenie. All rights reserved. Made with 💚 for students.</p>
        </div>
      </div>
    </footer>
  )

  // ==================== MAIN RENDER ====================
  return (
    <>
      <main className="min-h-screen bg-white">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <ChatbotSection />
        <Footer />
      </main>
      <UploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
    </>
  )
}
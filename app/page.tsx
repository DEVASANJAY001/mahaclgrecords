'use client'

import React, { useState, useEffect } from "react"
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowRight,
  BookOpen,
  Users,
  FileText,
  GraduationCap,
  Shield,
  Zap,
  Award,
  ChevronRight,
  Globe,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Chatbot from '@/components/chatbot'

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: { icon: any, title: string, description: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="glass h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0">
      <CardHeader>
        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
          <Icon className="h-6 w-6 text-purple-600 group-hover:text-white" />
        </div>
        <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
)

export default function Home() {
  const [showChatbot, setShowChatbot] = useState(false)
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 100], [0.8, 1])
  const headerBlur = useTransform(scrollY, [0, 100], [0, 12])

  useEffect(() => {
    const timer = setTimeout(() => setShowChatbot(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      {/* Dynamic Header */}
      <motion.header
        style={{ backgroundColor: `rgba(255, 255, 255, ${headerOpacity})`, backdropFilter: `blur(${headerBlur}px)` }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 5 }}
                className="relative"
              >
                <img
                  src="/images/maha-logo.png"
                  alt="Logo"
                  className="h-12 w-auto drop-shadow-sm"
                />
              </motion.div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-slate-900 group-hover:text-purple-600 transition-colors">
                  MAHALASHMI
                </h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                  Women's College
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <Link href="#about" className="hover:text-purple-600 transition-colors">About</Link>
              <Link href="#features" className="hover:text-purple-600 transition-colors">Portal Features</Link>
              <Link href="#contact" className="hover:text-purple-600 transition-colors">Contact</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/faculty/login">
                <Button variant="ghost" className="hidden sm:inline-flex font-bold hover:text-purple-600 hover:bg-purple-50">
                  Faculty
                </Button>
              </Link>
              <Link href="/student/login">
                <Button className="bg-slate-900 hover:bg-purple-600 text-white font-bold rounded-full px-6 transition-all hover:shadow-lg hover:shadow-purple-200">
                  Student Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-60 animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-sm font-bold mb-6"
              >
                <Award className="h-4 w-4" />
                Affiliated with University of Madras
              </motion.div>
              <h2 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
                Empowering Women Through <span className="text-gradient">Excellence.</span>
              </h2>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                Nurturing intellectual growth and leadership in a supportive, world-class academic environment. Join the future of higher education.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white h-14 px-10 text-lg font-bold rounded-2xl shadow-xl shadow-purple-200 group transition-all">
                  Explore Programs
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Link href="/faculty/signup">
                  <Button variant="outline" className="h-14 px-10 text-lg font-bold rounded-2xl border-slate-200 hover:bg-slate-50">
                    Faculty Portal
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 p-4 lg:p-8 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-white/40 shadow-2xl">
                <img
                  src="/images/maha-logo.png"
                  alt="College Experience"
                  className="w-full h-auto rounded-3xl drop-shadow-2xl"
                />
              </div>
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 glass p-6 rounded-3xl shadow-xl z-20 hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Live Support</p>
                    <p className="text-sm font-black text-slate-900">24/7 AI Portal</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Students', value: '2500+' },
              { label: 'Faculty', value: '120+' },
              { label: 'Programs', value: '18+' },
              { label: 'Success Rate', value: '98%' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl font-black text-purple-600 mb-2">{stat.value}</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-6">Built for Modern Academia</h2>
            <p className="text-xl text-slate-600">A unified platform designed to streamline administration and enhance the student learning experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Shield}
              title="Secure Portals"
              description="Role-based access control ensuring data privacy for both faculty and students across all modules."
              delay={0.1}
            />
            <FeatureCard
              icon={FileText}
              title="Smart Recording"
              description="Digital marksheets and attendance tracking with automated grade calculation and verification."
              delay={0.2}
            />
            <FeatureCard
              icon={GraduationCap}
              title="Career Growth"
              description="Integrated placement tracking and alumni network to support students beyond their academic years."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Split Portals Section */}
      <section className="py-24 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-purple-600/10 skew-x-12 translate-x-32"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[3rem] bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              <Users className="h-10 w-10 text-purple-400 mb-6" />
              <h3 className="text-2xl font-black text-white mb-4">Faculty Management</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Empower your department with tools for curriculum planning, student tracking, and advanced academic reporting.
              </p>
              <Link href="/faculty/login">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 rounded-xl h-12">
                  Access Portal <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[3rem] bg-white hover:bg-slate-50 transition-colors"
            >
              <BookOpen className="h-10 w-10 text-pink-600 mb-6" />
              <h3 className="text-2xl font-black text-slate-900 mb-4">Student Hub</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Your entire academic journey in one place. View grades, download records, and stay updated with college events.
              </p>
              <Link href="/student/login">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 rounded-xl h-12">
                  Sign In <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="pt-32 pb-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <img src="/images/maha-logo.png" alt="Logo" className="h-10 w-auto" />
                <span className="text-xl font-black tracking-tighter">MAHALASHMI</span>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Leading the way in women's education since inception. Affiliated with the University of Madras.
              </p>
              <div className="flex gap-4">
                {/* Social icons placeholder */}
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer">
                  <Globe className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Reach Us</h4>
              <ul className="space-y-4 text-sm text-slate-600 font-bold">
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-purple-600" />
                  info@mahalashmi.edu.in
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-purple-600" />
                  +91-XXXX-XXXXXX
                </li>
                <li className="flex items-center gap-[12px] items-start">
                  <MapPin className="h-4 w-4 text-purple-600 mt-1" />
                  Chennai, Tamil Nadu, India
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Institution</h4>
              <ul className="space-y-4 text-sm text-slate-600 font-bold">
                <li><Link href="#" className="hover:text-purple-600 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-purple-600 transition-colors">Academics</Link></li>
                <li><Link href="#" className="hover:text-purple-600 transition-colors">Admissions</Link></li>
                <li><Link href="#" className="hover:text-purple-600 transition-colors">Department</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Stay Updated</h4>
              <p className="text-sm text-slate-500 mb-6">Receive the latest academic news and portal updates.</p>
              <div className="relative">
                <Input placeholder="Email Address" className="rounded-xl border-slate-200 pr-12 focus:ring-purple-600" />
                <Button className="absolute right-1 top-1 h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700 rounded-lg">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Mahalashmi Women's College. All rights reserved.
            </p>
            <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      <Chatbot initiallyOpen={showChatbot} onClose={() => setShowChatbot(false)} />
    </div>
  )
}

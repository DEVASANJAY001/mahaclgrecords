'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Chatbot from '@/components/chatbot'

export default function Home() {
  const [showChatbot, setShowChatbot] = useState(true)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/images/maha-logo.png" 
                alt="Mahalashmi College Logo" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-slate-900">MAHALASHMI</h1>
                <p className="text-xs text-slate-600">Women's College of Arts and Science</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/faculty/login">
                <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 bg-transparent">
                  Faculty Login
                </Button>
              </Link>
              <Link href="/student/login">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Student Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 text-balance">
                Excelling in the World of Learning
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Mahalashmi Women's College of Arts and Science, affiliated with the University of Madras, is committed to providing excellence in education and fostering the intellectual and personal growth of our students.
              </p>
              <div className="flex gap-4">
                <Link href="#about">
                  <Button className="bg-purple-600 hover:bg-purple-700">Learn More</Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/images/maha-logo.png" 
                alt="College Logo" 
                className="w-full max-w-md mx-auto drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">About Our College</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  To nurture intellectual excellence and develop socially responsible women leaders who contribute meaningfully to society.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  To be a premier institution of higher education that empowers women through quality academics and holistic development.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Committed to delivering world-class education with a focus on innovation, integrity, and inclusive growth.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* College Details */}
          <div className="bg-slate-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">College Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Location</h4>
                <p className="text-slate-600">Affiliated with University of Madras</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Affiliation</h4>
                <p className="text-slate-600">University of Madras</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Courses Offered</h4>
                <p className="text-slate-600">Arts and Science Programs</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Focus</h4>
                <p className="text-slate-600">Women's Education & Development</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Management System Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">For Faculty</CardTitle>
                <CardDescription>Comprehensive academic management tools</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600">
                  <li>✓ Manage departments and subjects</li>
                  <li>✓ Track student enrollment</li>
                  <li>✓ Input and manage exam marks</li>
                  <li>✓ Generate marksheets</li>
                  <li>✓ Monitor student performance</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">For Students</CardTitle>
                <CardDescription>Access your academic records</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600">
                  <li>✓ View personal marks and grades</li>
                  <li>✓ Download digital marksheets</li>
                  <li>✓ Track academic performance</li>
                  <li>✓ View exam results</li>
                  <li>✓ Export records as PDF</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-purple-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Get Started with Our Management System</h2>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/faculty/login">
              <Button className="bg-white text-purple-600 hover:bg-slate-100">
                Faculty Portal
              </Button>
            </Link>
            <Link href="/student/login">
              <Button variant="outline" className="border-white text-white hover:bg-purple-700 bg-transparent">
                Student Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Mahalashmi Women's College</h3>
              <p className="text-slate-400 text-sm">
                Dedicated to nurturing excellence in education and fostering women's empowerment.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#about" className="hover:text-white">About</a></li>
                <li><a href="/faculty/login" className="hover:text-white">Faculty</a></li>
                <li><a href="/student/login" className="hover:text-white">Students</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <p className="text-slate-400 text-sm">
                For more information, visit our official website or contact the administration office.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2024 Mahalashmi Women's College. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <Chatbot initiallyOpen={showChatbot} onClose={() => setShowChatbot(false)} />
    </div>
  )
}

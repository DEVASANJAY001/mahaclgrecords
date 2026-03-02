'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, MessageCircle } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface ChatbotProps {
  title?: string
  onClose?: () => void
  initiallyOpen?: boolean
}

export default function Chatbot({ title = "Mahalashmi Assistant", onClose, initiallyOpen = true }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am the Mahalashmi College Assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getAIResponse = async (userMessage: string): Promise<string> => {
    // Simple rule-based responses
    const lowerMessage = userMessage.toLowerCase()

    // College information
    if (
      lowerMessage.includes('college') ||
      lowerMessage.includes('mahalashmi') ||
      lowerMessage.includes('about')
    ) {
      return 'Mahalashmi Women\'s College of Arts and Science is affiliated to University of Madras. We offer quality education in various streams. How can I assist you further?'
    }

    if (
      lowerMessage.includes('admission') ||
      lowerMessage.includes('apply') ||
      lowerMessage.includes('enroll')
    ) {
      return 'For admission inquiries, please visit our website or contact the admissions office. We accept applications for various undergraduate and postgraduate programs. What specific information do you need?'
    }

    if (
      lowerMessage.includes('department') ||
      lowerMessage.includes('course') ||
      lowerMessage.includes('subject')
    ) {
      return 'We offer multiple departments including Arts, Science, and Commerce. Students can choose from various subjects. Which department are you interested in?'
    }

    if (
      lowerMessage.includes('fee') ||
      lowerMessage.includes('tuition') ||
      lowerMessage.includes('cost') ||
      lowerMessage.includes('payment')
    ) {
      return 'For fee information, please contact the accounts office or check our website. Different courses have different fee structures. Would you like information about a specific program?'
    }

    if (
      lowerMessage.includes('exam') ||
      lowerMessage.includes('test') ||
      lowerMessage.includes('mark') ||
      lowerMessage.includes('result')
    ) {
      return 'Exam and mark information can be accessed through the student portal using your credentials. Marks are updated by faculty members. Is there a specific exam or subject you need help with?'
    }

    if (
      lowerMessage.includes('faculty') ||
      lowerMessage.includes('teacher') ||
      lowerMessage.includes('professor')
    ) {
      return 'Our college has experienced faculty members across all departments. You can find faculty information on our website or contact the respective department. Need help finding a specific faculty member?'
    }

    if (lowerMessage.includes('library') || lowerMessage.includes('book')) {
      return 'Our college library has a rich collection of books and digital resources. You can access it with your college ID. What would you like to know about the library?'
    }

    if (lowerMessage.includes('student') || lowerMessage.includes('login')) {
      return 'Students can log in using their roll number and DOB in DDMMYY format. If you have forgotten your credentials, contact the office. How can I help you?'
    }

    if (
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('hey')
    ) {
      return 'Hello! Welcome to Mahalashmi College. How can I assist you today?'
    }

    if (
      lowerMessage.includes('thank') ||
      lowerMessage.includes('thanks') ||
      lowerMessage.includes('appreciate')
    ) {
      return 'You\'re welcome! Is there anything else I can help you with?'
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return 'I can help you with information about: College details, Admissions, Departments and Courses, Fees, Exams and Marks, Faculty, Library, and Student Portal access. What would you like to know?'
    }

    // Default response
    return 'That\'s an interesting question! I can help you with college information, admissions, courses, fees, exams, and more. Could you be more specific about what you need?'
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await getAIResponse(input)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      console.error('Error getting response:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  const handleOpenIcon = () => {
    setIsOpen(true)
  }

  // Floating icon when closed
  if (!isOpen) {
    return (
      <button
        onClick={handleOpenIcon}
        className="fixed bottom-4 right-4 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg z-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
        title="Open Chat Assistant"
        aria-label="Open Chat Assistant"
      >
        <MessageCircle size={24} />
      </button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg z-50 max-h-screen flex flex-col">
      <CardHeader className="bg-purple-600 text-white flex flex-row items-center justify-between p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <CardTitle className="text-white text-base">{title}</CardTitle>
        </div>
        <button onClick={handleClose} className="hover:bg-purple-700 p-1 rounded transition-colors">
          <X size={20} />
        </button>
      </CardHeader>
      <CardContent className="p-4 flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-slate-50 p-3 rounded-md">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-slate-200 text-slate-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-200 text-slate-900 px-3 py-2 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage()
            }}
            placeholder="Ask me anything..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

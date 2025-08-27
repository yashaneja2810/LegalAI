'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Shield, 
  Brain, 
  CheckCircle, 
  ArrowRight, 
  Scale, 
  Users, 
  Zap,
  Award,
  BookOpen,
  Eye,
  TrendingUp,
  Star,
  Clock,
  Lock,
  Globe
} from 'lucide-react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Advanced AI Analysis",
      description: "Sophisticated natural language processing powered by cutting-edge AI technology"
    },
    {
      icon: Shield,
      title: "Risk Assessment",
      description: "Comprehensive identification of potential legal risks and unfavorable clauses"
    },
    {
      icon: Eye,
      title: "Clause Interpretation",
      description: "Deep analysis and plain-language explanation of complex legal terminology"
    }
  ];

  const stats = [
    { number: "99.8%", label: "Accuracy Rate", icon: Award },
    { number: "150K+", label: "Documents Analyzed", icon: FileText },
    { number: "50K+", label: "Professionals Trust Us", icon: Users },
    { number: "24/7", label: "AI Availability", icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-golden-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-golden-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Scale className="h-10 w-10 text-golden-600" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-golden-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-golden-700 to-golden-500 bg-clip-text text-transparent">
                  LexisMind
                </span>
                <div className="text-xs text-golden-600 font-medium tracking-wider">LEGAL INTELLIGENCE</div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-golden-600 transition-all duration-300 font-medium relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-golden-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-golden-600 transition-all duration-300 font-medium relative group">
                How It Works
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-golden-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#about" className="text-gray-700 hover:text-golden-600 transition-all duration-300 font-medium relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-golden-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <Link 
                href="/upload"
                className="group bg-gradient-to-r from-golden-600 to-golden-500 text-white px-6 py-3 rounded-xl hover:from-golden-700 hover:to-golden-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <Brain className="h-5 w-5" />
                <span>AI Assistant</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-golden-100/20 via-transparent to-cream-100/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center space-x-2 bg-golden-100 text-golden-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="h-4 w-4" />
              <span>Trusted by Legal Professionals Worldwide</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              <span className="block">Professional Legal</span>
              <span className="block bg-gradient-to-r from-golden-600 via-golden-500 to-golden-400 bg-clip-text text-transparent">
                Document Intelligence
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Transform complex legal documents into clear, actionable insights with our advanced AI technology. 
              Empower your decision-making with professional-grade document analysis and risk assessment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                href="/upload"
                className="group bg-gradient-to-r from-golden-600 to-golden-500 text-white px-10 py-5 rounded-xl hover:from-golden-700 hover:to-golden-600 transition-all duration-300 flex items-center justify-center text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 min-w-[200px]"
              >
                <Brain className="mr-3 h-6 w-6" />
                Launch AI Assistant
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="group border-2 border-golden-300 text-golden-700 px-10 py-5 rounded-xl hover:border-golden-500 hover:bg-golden-50 transition-all duration-300 text-lg font-semibold min-w-[200px] flex items-center justify-center">
                <BookOpen className="mr-3 h-6 w-6" />
                View Demo
              </button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-golden-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-cream-300 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-golden-300 rounded-full opacity-25 animate-pulse"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-golden-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-golden-100 to-cream-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-8 w-8 text-golden-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-cream-50 to-golden-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-golden-100 text-golden-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>Advanced AI Capabilities</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Intelligent Legal Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our sophisticated AI technology provides comprehensive document analysis, 
              risk assessment, and plain-language interpretation of complex legal terms.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`relative p-8 rounded-2xl transition-all duration-500 cursor-pointer group ${
                  activeFeature === index 
                    ? 'bg-white shadow-2xl scale-105 border border-golden-200' 
                    : 'bg-white/70 hover:bg-white hover:shadow-xl hover:scale-102'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                  activeFeature === index 
                    ? 'bg-gradient-to-br from-golden-500 to-golden-400 text-white' 
                    : 'bg-golden-100 text-golden-600 group-hover:bg-golden-200'
                }`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
                
                {activeFeature === index && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-golden-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Simple. Powerful. Professional.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Three streamlined steps to transform your legal documents into clear, actionable insights
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Upload Document",
                description: "Securely upload your legal document using our encrypted platform. Supports PDF, DOC, and DOCX formats with enterprise-grade security.",
                icon: FileText
              },
              {
                step: "02", 
                title: "AI Processing",
                description: "Our advanced AI analyzes your document, identifying key clauses, potential risks, and important legal implications with professional accuracy.",
                icon: Brain
              },
              {
                step: "03",
                title: "Expert Insights",
                description: "Receive comprehensive analysis, risk assessment, and plain-language summaries. Chat with our AI for specific questions and clarifications.",
                icon: TrendingUp
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="text-center">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-golden-500 to-golden-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{item.description}</p>
                </div>
                
                {index < 2 && (
                  <div className="hidden lg:block absolute top-12 left-full w-12 h-0.5 bg-gradient-to-r from-golden-300 to-transparent transform translate-x-6"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-golden-100 text-golden-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Lock className="h-4 w-4" />
                <span>Enterprise Security</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Your Privacy is Our Priority
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                We employ bank-level encryption and security protocols to ensure your sensitive legal documents 
                remain completely confidential and secure throughout the analysis process.
              </p>
              
              <div className="space-y-4">
                {[
                  "End-to-end encryption for all documents",
                  "Zero data retention policy",
                  "SOC 2 Type II compliance",
                  "GDPR and CCPA compliant"
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-golden-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-golden-500 to-golden-400 rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Security Certificate</div>
                    <div className="text-sm text-gray-600">Enterprise Grade Protection</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Encryption Level</span>
                    <span className="font-semibold text-golden-600">AES-256</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Compliance</span>
                    <span className="font-semibold text-golden-600">SOC 2 Type II</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Data Retention</span>
                    <span className="font-semibold text-golden-600">Zero Storage</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-golden-200 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-cream-300 rounded-full opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-golden-600 via-golden-500 to-golden-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-8 leading-tight">
            Ready to Transform Your Legal Documents?
          </h2>
          <p className="text-xl text-golden-100 mb-12 leading-relaxed max-w-3xl mx-auto">
            Join thousands of professionals who trust LexisMind for accurate, 
            comprehensive legal document analysis and risk assessment.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/upload"
              className="group bg-white text-golden-600 px-10 py-5 rounded-xl hover:bg-gray-50 transition-all duration-300 inline-flex items-center text-lg font-bold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 min-w-[250px] justify-center"
            >
              <Brain className="mr-3 h-6 w-6" />
              Start AI Analysis
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button className="group border-2 border-white text-white px-10 py-5 rounded-xl hover:bg-white hover:text-golden-600 transition-all duration-300 text-lg font-bold min-w-[250px] flex items-center justify-center">
              <Globe className="mr-3 h-6 w-6" />
              Schedule Demo
            </button>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full"></div>
          <div className="absolute top-20 right-20 w-24 h-24 border border-white rounded-full"></div>
          <div className="absolute bottom-10 left-1/4 w-20 h-20 border border-white rounded-full"></div>
          <div className="absolute bottom-20 right-1/3 w-16 h-16 border border-white rounded-full"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Scale className="h-8 w-8 text-golden-400" />
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-golden-400 to-golden-300 bg-clip-text text-transparent">
                    LexisMind
                  </span>
                  <div className="text-xs text-golden-400 font-medium tracking-wider">LEGAL INTELLIGENCE</div>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed text-lg mb-6">
                Empowering individuals and professionals with AI-driven legal document analysis. 
                Making complex legal information accessible, understandable, and actionable.
              </p>
              <div className="flex space-x-4">
                {[Award, Users, Globe, Lock].map((Icon, index) => (
                  <div key={index} className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-golden-600 transition-colors duration-300 cursor-pointer">
                    <Icon className="h-5 w-5" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-lg">Platform</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-golden-400 transition-colors duration-300">AI Assistant</a></li>
                <li><a href="#" className="hover:text-golden-400 transition-colors duration-300">Document Analysis</a></li>
                <li><a href="#" className="hover:text-golden-400 transition-colors duration-300">Risk Assessment</a></li>
                <li><a href="#" className="hover:text-golden-400 transition-colors duration-300">API Access</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-lg">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-golden-400 transition-colors duration-300">About Us</a></li>
                <li><a href="#" className="hover:text-golden-400 transition-colors duration-300">Security</a></li>
                <li><a href="#" className="hover:text-golden-400 transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-golden-400 transition-colors duration-300">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              &copy; 2024 LexisMind Legal Intelligence. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Enterprise Security</span>
              <span>•</span>
              <span>SOC 2 Compliant</span>
              <span>•</span>
              <span>GDPR Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
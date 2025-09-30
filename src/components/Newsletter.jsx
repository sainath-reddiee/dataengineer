import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle, Sparkles, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [ref, isIntersecting, hasIntersected] = useIntersectionObserver();

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted with email:', email);
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to subscribe.",
        variant: "destructive"
      });
      return;
    }

    if (!isValidEmail(email.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Check if already subscribed
      const subscriptions = JSON.parse(localStorage.getItem('newsletterSubscriptions') || '[]');
      const trimmedEmail = email.trim().toLowerCase();
      
      if (subscriptions.includes(trimmedEmail)) {
        toast({
          title: "Already Subscribed",
          description: "This email address is already on our list!",
        });
        setLoading(false);
        return;
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Save to localStorage
      subscriptions.push(trimmedEmail);
      localStorage.setItem('newsletterSubscriptions', JSON.stringify(subscriptions));

      // Show success state
      setIsSubscribed(true);
      toast({
        title: "🎉 Successfully Subscribed!",
        description: "Welcome to DataEngineer Hub! You'll receive our latest articles and insights.",
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail('');
      }, 3000);

    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: "Could not save your subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = (e) => {
    e.preventDefault();
    console.log('Button clicked!');
    handleSubmit(e);
  };

  return (
    <section ref={ref} className="py-16 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl floating-animation" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <AnimatePresence>
          {hasIntersected && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="glass-effect rounded-2xl p-8 md:p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-xl"
                >
                  <Mail className="h-8 w-8 text-white" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl md:text-4xl font-bold mb-4"
                >
                  Stay Ahead of the <span className="gradient-text">Data Curve</span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
                >
                  Join 25,000+ data professionals who get weekly insights, tutorials, and industry updates 
                  delivered straight to their inbox. No spam, just pure data engineering gold.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="max-w-md mx-auto mb-8"
                >
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm shadow-lg transition-all duration-300"
                        disabled={isSubscribed || loading}
                      />
                      {isSubscribed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2"
                        >
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        </motion.div>
                      )}
                    </div>
                    <button
                      type="submit"
                      onClick={handleButtonClick}
                      disabled={isSubscribed || loading}
                      className={`px-8 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center shadow-xl ${
                        isSubscribed 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                      } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Subscribing...
                        </>
                      ) : isSubscribed ? (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Subscribed!
                        </>
                      ) : (
                        <>
                          Subscribe
                          <Send className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400"
                >
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span>25K+ subscribers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span>Weekly insights</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>No spam ever</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <span>Unsubscribe anytime</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Newsletter;
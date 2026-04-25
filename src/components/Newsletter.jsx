import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle, Rss, Sparkles, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useNewsletter } from '@/hooks/useWordPress';
import { trackNewsletterSignup } from '@/utils/analytics';

const Newsletter = () => {
  const [ref, , hasIntersected] = useIntersectionObserver();
  const [email, setEmail] = useState('');
  const { subscribe, loading, error, success, reset } = useNewsletter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    const result = await subscribe(email);
    if (result.success) {
      trackNewsletterSignup('newsletter_section');
      setEmail('');
      setTimeout(() => reset(), 5000);
    }
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
                  Get the Weekly <span className="gradient-text">Data Digest</span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
                >
                  New tutorials, tool deep-dives, and data engineering insights delivered to your inbox every week. No spam, unsubscribe anytime.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {success ? (
                    <div className="inline-flex items-center gap-2 text-green-400 font-medium text-lg">
                      <CheckCircle className="h-5 w-5" />
                      You're subscribed — welcome to the Data Digest!
                    </div>
                  ) : (
                    <>
                      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row justify-center gap-3 max-w-lg mx-auto">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          disabled={loading}
                          className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center justify-center px-7 py-3.5 rounded-full font-bold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl transition-all duration-300 group disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Subscribing...
                            </>
                          ) : (
                            <>
                              Subscribe
                              <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>
                      {error && (
                        <div className="inline-flex items-center gap-2 text-red-400 text-sm mt-3">
                          <AlertCircle className="h-4 w-4" />
                          {typeof error === 'string' ? error : 'Subscription failed. Please try again.'}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400 mt-8"
                >
                  <a
                    href="/rss.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 hover:text-orange-400 transition-colors"
                  >
                    <Rss className="h-4 w-4 text-orange-400" />
                    <span>Subscribe via RSS</span>
                  </a>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span>New articles weekly</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-green-400" />
                    <span>Free and open</span>
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

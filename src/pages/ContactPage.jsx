// src/pages/ContactPage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Phone, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import MetaTags from '@/components/SEO/MetaTags';
import { trackContactForm } from '@/utils/analytics';

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Incomplete Form",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Fallback to mailto if no Web3Forms key is configured
    if (!WEB3FORMS_KEY) {
      const subject = encodeURIComponent(`Contact from ${formData.name} via DataEngineer Hub`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      );
      window.location.href = `mailto:sainath@dataengineerhub.blog?subject=${subject}&body=${body}`;
      setLoading(false);
      setFormData({ name: '', email: '', message: '' });
      return;
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: formData.name,
          email: formData.email,
          message: formData.message,
          subject: `Contact from ${formData.name} via DataEngineer Hub`,
          from_name: 'DataEngineer Hub Contact Form',
        }),
      });

      const data = await response.json();

      if (data.success) {
        trackContactForm();
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
        toast({
          title: "Message Sent!",
          description: "Thanks for reaching out. We'll get back to you soon.",
        });
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      toast({
        title: "Failed to Send",
        description: "Something went wrong. Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MetaTags 
        title="Contact Us - Get in Touch"
        description="Contact DataEngineer Hub team. Have questions or suggestions? We'd love to hear from you. Reach us via email or phone."
        keywords="contact data engineer hub, get in touch, data engineering support"
        type="website"
      />
      <div className="pt-4 pb-12 overflow-hidden">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
              Get In <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
              Have a question, suggestion, or just want to say hi? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 mt-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="text-3xl font-bold mb-6">Contact Information</div>
              <p className="text-gray-300 mb-8">
                You can reach us through the following channels. We're excited to connect with our community!
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mt-1">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">Email</div>
                    <p className="text-gray-400">sainath@dataengineerhub.blog</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl mt-1">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">Phone</div>
                    <p className="text-gray-400">+91 9441414140</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl mt-1">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">Location</div>
                    <p className="text-gray-400">Hyderabad, Telangana, India</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="blog-card p-8 rounded-2xl"
            >
              <div className="text-3xl font-bold mb-6">Send us a Message</div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-400 mb-6">Thanks for reaching out. We'll get back to you soon.</p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" value={formData.name} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" required placeholder="john.doe@example.com" value={formData.email} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea id="message" placeholder="Tell us what's on your mind..." rows={5} value={formData.message} onChange={handleChange} disabled={loading} />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold group disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
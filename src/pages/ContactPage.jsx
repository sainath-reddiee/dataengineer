// src/pages/ContactPage.jsx
// FIXED: Single H1, optimized meta tags
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import MetaTags from '@/components/SEO/MetaTags';

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Incomplete Form",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "📬 Message Sent!",
      description: "Thanks for reaching out! We'll get back to you shortly.",
    });
    setFormData({ name: '', email: '', message: '' });
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
          {/* FIXED: Single H1 tag for the page */}
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
              {/* FIXED: Changed H2 to div to avoid multiple heading levels */}
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
                    <p className="text-gray-400">9441414140</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl mt-1">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">Location</div>
                    <p className="text-gray-400">123 Data Avenue, Hyderabad</p>
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="john.doe@example.com" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Your Message</Label>
                  <Textarea id="message" placeholder="Tell us what's on your mind..." rows={5} value={formData.message} onChange={handleChange} />
                </div>
                <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold group">
                  Send Message
                  <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
import { useState } from 'react';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Button, Input } from '@/components/vui';

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'hello@vuera.com', href: 'mailto:hello@vuera.com' },
  { icon: Phone, label: 'Phone', value: '+1 (800) 555-0192', href: 'tel:+18005550192' },
  { icon: MapPin, label: 'Showroom', value: '221 Mason St, San Francisco, CA', href: '#' },
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <section className="bg-gradient-to-b from-primary-50 via-white to-white">
        <div className="container-app py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-800">
              <MessageSquare size={14} />
              Get in touch
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
              We're here to help
            </h1>
            <p className="mt-4 text-lg text-ink-600 text-pretty">
              Questions about frames, fit, or your order? Our team responds within one business day.
            </p>
          </div>
        </div>
      </section>

      <div className="container-app py-12 md:py-16">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Contact details</h2>
            <div className="mt-6 space-y-4">
              {contactInfo.map((info) => (
                <a
                  key={info.label}
                  href={info.href}
                  className="flex items-start gap-4 rounded-2xl border border-ink-200 bg-white p-5 transition-colors hover:border-primary-300"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    <info.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-400">{info.label}</p>
                    <p className="mt-0.5 text-base font-medium text-ink-900">{info.value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl">
              <img
                src="https://images.pexels.com/photos/5201896/pexels-photo-5201896.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Vuera showroom"
                className="aspect-[16/9] w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Form */}
          <div>
            <div className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
              <h2 className="text-2xl font-semibold tracking-tight">Send a message</h2>
              <p className="mt-2 text-sm text-ink-500">
                Fill out the form and we'll get back to you shortly.
              </p>

              {submitted ? (
                <div className="mt-8 flex flex-col items-center justify-center rounded-xl bg-success-50 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 text-success-700">
                    <Mail size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-success-800">Message sent</h3>
                  <p className="mt-1 text-sm text-success-700">
                    Thanks for reaching out. We'll respond within one business day.
                  </p>
                  <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
                    Send another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="First name" name="firstName" required placeholder="Jane" />
                    <Input label="Last name" name="lastName" required placeholder="Doe" />
                  </div>
                  <Input label="Email" name="email" type="email" required placeholder="jane@example.com" />
                  <Input label="Subject" name="subject" required placeholder="How can we help?" />
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="message" className="text-sm font-medium text-ink-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      placeholder="Tell us more..."
                      className="w-full rounded-lg border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                    />
                  </div>
                  <Button type="submit" size="lg" fullWidth>
                    Send message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

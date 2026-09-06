// Central config for the "Buy me a coffee" support feature.
// Keep payment identifiers in one place so the modal, header, footer,
// advertise page, and article popup never drift out of sync.

export const SUPPORT_CONFIG = {
  payeeName: 'Pogaku Satya Sainath Reddy',
  contactEmail: 'sainath@dataengineerhub.blog',
  supportNote:
    'Servers, hosting, and keeping this library free for everyone — about ₹10,000 a month out of one pocket. If a guide here saved you a course fee or a consultant\'s hour, a ₹50 coffee is a real dent ☕',
  upi: {
    id: 'pogaku.r@ptaxis',
  },
  paypal: {
    meUrl: 'https://www.paypal.me/PSATYASAINATHREDDY',
    handle: 'PSATYASAINATHREDDY',
  },
  noteMailto() {
    const subject = encodeURIComponent('A personal note with my support ☕');
    const body = encodeURIComponent(
      'Hi Sainath,\n\nI just sent you a coffee/support payment — here is my note:\n\n'
    );
    return `mailto:${SUPPORT_CONFIG.contactEmail}?subject=${subject}&body=${body}`;
  },
};

export default SUPPORT_CONFIG;

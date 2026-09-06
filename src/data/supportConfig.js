// Central config for the "Buy me a coffee" support feature.
// Keep payment identifiers in one place so the modal, header, footer,
// advertise page, and article popup never drift out of sync.

export const SUPPORT_CONFIG = {
  payeeName: 'Pogaku Satya Sainath Reddy',
  contactEmail: 'sainath@dataengineerhub.blog',
  upi: {
    id: 'pogaku.r@ptaxis',
    // Standard UPI deep link — opens directly in Google Pay / PhonePe / Paytm / BHIM on mobile.
    deepLink(note) {
      const params = new URLSearchParams({
        pa: SUPPORT_CONFIG.upi.id,
        pn: SUPPORT_CONFIG.payeeName,
        cu: 'INR',
        ...(note ? { tn: note } : {}),
      });
      return `upi://pay?${params.toString()}`;
    },
  },
  paypal: {
    email: 'psainath123@gmail.com',
    qrImage: '/assets/support/paypal-qr.jpg',
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

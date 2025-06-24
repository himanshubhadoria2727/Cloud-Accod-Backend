const nodemailer = require('nodemailer');

let emailTransport;

try {
  emailTransport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'info@cloudaccomodation.com',
      pass: process.env.EMAIL_PASSWORD || 'Iplaycoc@123'
    },
    tls: {
      // Only disable certificate validation in development
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production'
  });

  // Verify connection configuration
  emailTransport.verify(function(error, success) {
    if (error) {
      console.error('SMTP connection error:', error);
    } else {
      console.log('SMTP server is ready to send messages');
    }
  });
} catch (error) {
  console.error('Failed to create email transport:', error);
  // Create a mock transport that logs instead of sending emails
  emailTransport = {
    sendMail: function(mailOptions, callback) {
      console.warn('Email not sent (SMTP not configured):', {
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      if (callback) callback(null, { messageId: 'mock-message-id' });
      return Promise.resolve({ messageId: 'mock-message-id' });
    }
  };
}

// Create reusable transporter object using the SMTP transport
const createTransporter = async () => {
  return emailTransport;
};

/**
 * Send a booking confirmation email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.bookingId - Booking ID
 * @param {string} options.propertyName - Property name
 * @param {string} options.checkInDate - Check-in date
 * @param {string} options.checkOutDate - Check-out date or 'Flexible' if not specified
 * @param {string} options.amount - Total amount with currency
 * @param {string} options.customerName - Customer's name
 * @returns {Promise<Object>} - Result of the email sending operation
 */
const sendBookingConfirmation = async ({
  to,
  bookingId,
  propertyName,
  checkInDate,
  checkOutDate,
  amount,
  customerName,
}) => {
  try {
    // Create a new transporter for each email
    const transporter = await createTransporter();
    
    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }
    const bookingLink = `${process.env.NEXT_FRONTEND_URL}/bookings`;
    
    const fromEmail = process.env.EMAIL_USER || 'info@cloudaccomodation.com';
    const mailOptions = {
      from: `"Cloud Accommodation" <${fromEmail}>`,
      to,
      subject: 'Your Booking Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Booking Confirmed!</h2>
          <p>Dear ${customerName},</p>
          <p>Thank you for booking with Cloud Accommodation. Your booking has been confirmed.</p>
          
          <h3>Booking Details:</h3>
          <ul>
            <li><strong>Property:</strong> ${propertyName}</li>
            <li><strong>Booking ID:</strong> ${bookingId}</li>
            <li><strong>Check-in:</strong> ${new Date(checkInDate).toLocaleDateString()}</li>
            <li><strong>Check-out:</strong> ${checkOutDate === 'Flexible' ? 'Flexible' : new Date(checkOutDate).toLocaleDateString()}</li>
            <li><strong>Total Amount:</strong> ${amount}</li>
          </ul>
          
          <p>You can view and manage your booking details by clicking the button below:</p>
          <a href="${bookingLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Booking</a>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>Cloud Accommodation Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmation,
};

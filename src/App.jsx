import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'sending', 'success', 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('sending');

    try {
      const response = await fetch('/api/sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setStatus('success');
      setMessage('');

      // Reset success status after a delay
      setTimeout(() => {
        setStatus('idle');
      }, 3000);

    } catch (error) {
      console.error(error);
      setStatus('error');

      // Reset error status after a delay
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  return (
    <div className="container">
      <h1>Contact Us</h1>
      <form onSubmit={handleSubmit} className="contact-form">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message here..."
          rows={5}
          disabled={status === 'sending'}
          required
        />
        <button
          type="submit"
          disabled={status === 'sending' || !message.trim()}
        >
          {status === 'sending' ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      {status === 'success' && (
        <div className="status success">Message sent successfully!</div>
      )}
      {status === 'error' && (
        <div className="status error">Failed to send message. Please try again.</div>
      )}
    </div>
  )
}

export default App

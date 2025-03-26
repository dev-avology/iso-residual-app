// src/component/footer/footer.component.js
import React from 'react';
import './footer.layout.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <h2>Tracer</h2>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Tracer. All rights reserved.</p>
        <p>Built by <a href="https://www.crittercodes.com">CritterCodes</a></p>
      </div>
    </footer>
  );
}

export default Footer;

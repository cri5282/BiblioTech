import logo from '../../BiblioTech-Logo.png';

const Footer = () => (
  <footer className="footer" role="contentinfo">
    <div className="container footer-inner">
      <img src={logo} alt="BiblioTech Logo" className="footer-logo" />
      <p>BiblioTech — La NOSTRA biblioteca pubblica</p>
    </div>
  </footer>
);

export default Footer;
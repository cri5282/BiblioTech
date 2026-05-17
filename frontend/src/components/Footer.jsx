import { useTheme } from '../context/ThemeContext.jsx';
import darkModeLogo from '../../BiblioTech-DarkModeLogo.png';
import whiteModeLogo from '../../BiblioTech-WhiteModeLogo.png';

const Footer = () => {
  const { theme } = useTheme();
  return (
  <footer className="footer" role="contentinfo">
    <div className="container footer-inner">
      <img src={theme === 'dark' ? darkModeLogo : whiteModeLogo} alt="BiblioTech Logo" className="footer-logo" />
      <p>BiblioTech — La NOSTRA biblioteca pubblica</p>
    </div>
  </footer>
  );
};

export default Footer;
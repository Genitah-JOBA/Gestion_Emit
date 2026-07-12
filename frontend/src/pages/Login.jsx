import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { messageErreur } from '../api/client';
import Icon from '../lib/icons';
import { Field } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState('');
  const [busy, setBusy] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [nomErreur, setNomErreur] = useState('');
  const [mdpErreur, setMdpErreur] = useState('');
  const [nomTouched, setNomTouched] = useState(false);
  const [mdpTouched, setMdpTouched] = useState(false);
  
  const nomInputRef = useRef(null);
  const mdpInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const validerNom = (valeur) => {
    const nomTrim = valeur.trim();
    
    if (nomTrim.length === 0) {
      setNomErreur('Le nom est requis');
      return false;
    }
    
    if (nomTrim.length < 2) {
      setNomErreur('Le nom doit contenir au moins 2 lettres');
      return false;
    }
    
    const regexLettres = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!regexLettres.test(nomTrim)) {
      setNomErreur('Le nom ne doit contenir que des lettres');
      return false;
    }
    
    setNomErreur('');
    return true;
  };

  const validerMdp = (valeur) => {
    if (valeur.length === 0) {
      setMdpErreur('Le mot de passe est requis');
      return false;
    }
    
    if (valeur.length < 4) {
      setMdpErreur('Le mot de passe doit contenir au moins 4 caractères');
      return false;
    }
    
    setMdpErreur('');
    return true;
  };

  const handleNomChange = (e) => {
    const valeur = e.target.value;
    setLoginId(valeur);
    if (nomTouched) {
      validerNom(valeur);
    }
  };

  const handleMdpChange = (e) => {
    const valeur = e.target.value;
    setMdp(valeur);
    if (mdpTouched) {
      validerMdp(valeur);
    }
  };

  const handleNomFocus = (e) => {
    setNomTouched(true);
    e.target.style.borderColor = colors.skyBlue;
    e.target.style.boxShadow = '0 0 0 4px rgba(56, 189, 248, 0.15)';
    e.target.style.background = 'rgba(255,255,255,0.08)';
  };

  const handleMdpFocus = (e) => {
    setMdpTouched(true);
    e.target.style.borderColor = colors.skyBlue;
    e.target.style.boxShadow = '0 0 0 4px rgba(56, 189, 248, 0.15)';
    e.target.style.background = 'rgba(255,255,255,0.08)';
  };

  const handleNomBlur = (e) => {
    const estValide = validerNom(e.target.value);
    if (!estValide && e.target.value.trim().length > 0) {
      setTimeout(() => {
        nomInputRef.current.focus();
      }, 10);
    }
    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
    e.target.style.boxShadow = 'none';
    e.target.style.background = 'rgba(255,255,255,0.05)';
  };

  const handleMdpBlur = (e) => {
    const estValide = validerMdp(e.target.value);
    if (!estValide && e.target.value.length > 0) {
      setTimeout(() => {
        mdpInputRef.current.focus();
      }, 10);
    }
    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
    e.target.style.boxShadow = 'none';
    e.target.style.background = 'rgba(255,255,255,0.05)';
  };

  const handleNomKeyDown = (e) => {
    if (e.key === 'Tab') {
      const estValide = validerNom(loginId);
      if (!estValide && loginId.trim().length > 0) {
        e.preventDefault();
        nomInputRef.current.focus();
      }
    }
  };

  const handleMdpKeyDown = (e) => {
    if (e.key === 'Tab') {
      const estValide = validerMdp(mdp);
      if (!estValide && mdp.length > 0) {
        e.preventDefault();
        mdpInputRef.current.focus();
      }
    }
  };

  async function soumettre(e) {
    e.preventDefault();
    
    const nomValide = validerNom(loginId);
    const mdpValide = validerMdp(mdp);
    
    if (!nomValide) {
      nomInputRef.current.focus();
      return;
    }
    
    if (!mdpValide) {
      mdpInputRef.current.focus();
      return;
    }
    
    setErreur('');
    setBusy(true);
    try {
      await login(loginId, mdp);
      navigate('/dashboard');
    } catch (err) {
      setErreur(messageErreur(err, 'Connexion impossible.'));
    } finally {
      setBusy(false);
    }
  }

  const colors = {
    primary: '#0c1b33',
    secondary: '#1a365d',
    skyBlue: '#38bdf8',
    skyBlueLight: '#7dd3fc',
    skyBluePale: '#e0f2fe',
    skyBlueDark: '#0284c7',
    white: '#ffffff',
    lightBg: '#f0f4f8',
    text: '#0c1b33',
    textLight: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
    errorLight: '#fca5a5',
    success: '#22c55e'
  };

  const fadeInUp = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const fadeInLeft = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateX(0)' : 'translateX(-40px)',
    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const fadeInRight = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateX(0)' : 'translateX(40px)',
    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const scaleIn = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.8)',
    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const estNomValide = loginId.trim().length >= 2 && !nomErreur;
  const estMdpValide = mdp.length >= 4 && !mdpErreur;

  const IconWarning = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );

  const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  const IconStar = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );

  const IconLock = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );

  const IconUser = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const IconShield = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );

  const IconEye = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const IconEyeOff = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <>
      <style>{`
        /* Styles communs */
        .login-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #f0f4f8;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          position: relative;
          flex-direction: row;
        }

        /* PARTIE GAUCHE - Desktop */
        .login-left {
          flex: 0 0 55%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 60px 60px 40px;
          background: #ffffff;
          position: relative;
          order: 0;
          min-height: 100vh;
        }

        .login-left-content {
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          justify-content: center;
        }

        /* PARTIE DROITE - Desktop */
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 40px;
          background: #0c1b33;
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          order: 1;
        }

        .login-right-content {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 100%;
          padding: 20px 0;
        }

        /* Ligne décorative - Desktop */
        .login-left-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 6px;
          height: 100%;
          background: linear-gradient(to bottom, #38bdf8, #7dd3fc);
        }

        /* Logo container */
        .login-logo-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 30px;
        }

        .login-logo-circle {
          background: #ffffff;
          padding: 12px;
          border-radius: 50%;
          border: 2px solid #38bdf8;
          box-shadow: 0 10px 40px rgba(56, 189, 248, 0.2);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-logo-img {
          width: 70px;
          height: 70px;
          display: block;
          border-radius: 50%;
          object-fit: contain;
        }

        .login-ecole-text {
          margin: 4px 0 0 0;
          font-size: 0.7rem;
          color: #64748b;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-align: center;
        }

        /* Footer desktop - tout en bas */
        .login-footer-desktop {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          font-size: 0.7rem;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          width: 100%;
          margin-top: auto;
          flex-shrink: 0;
        }

        /* Footer mobile - caché par défaut */
        .login-footer-mobile {
          display: none;
        }

        /* Formulaire wrapper */
        .login-form-wrapper {
          display: flex;
          flex-direction: column;
          flex: 1;
          justify-content: center;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Champ avec icône fixe */
        .field-wrapper {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 14px;
          top: 14px;
          color: rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          pointer-events: none;
          z-index: 2;
        }

        .field-input {
          width: 100%;
          padding: 14px 16px 14px 42px;
          border-radius: 10px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          outline: none;
          background: rgba(255,255,255,0.05);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          border: 2px solid rgba(255,255,255,0.1);
          position: relative;
          z-index: 1;
        }

        .field-input:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.15);
          background: rgba(255,255,255,0.08);
        }

        .field-error-message {
          color: #fca5a5;
          font-size: 0.75rem;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 5px;
          min-height: 20px;
        }

        .field-success-message {
          color: #22c55e;
          font-size: 0.75rem;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 5px;
          min-height: 20px;
        }

        .field-error-border {
          border-color: #ef4444 !important;
        }

        .field-success-border {
          border-color: #22c55e !important;
        }

        /* ===== RESPONSIVE MOBILE ===== */
        @media (max-width: 768px) {
          .login-container {
            flex-direction: column !important;
          }

          .login-left {
            flex: 0 0 auto !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 30px 20px 20px !important;
            order: 0 !important;
            justify-content: center !important;
          }

          .login-left-content {
            max-width: 100% !important;
            flex: none !important;
          }

          .login-right {
            flex: 0 0 auto !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 30px 20px 25px !important;
            order: 1 !important;
          }

          .login-right-content {
            max-width: 100% !important;
            padding: 10px 0 !important;
          }

          .login-left-line {
            width: 100% !important;
            height: 4px !important;
            background: linear-gradient(to right, #38bdf8, #7dd3fc) !important;
          }

          .login-footer-desktop {
            display: none !important;
          }

          .login-footer-mobile {
            display: flex !important;
            justify-content: center;
            align-items: center;
            gap: 15px;
            font-size: 0.6rem;
            color: rgba(255,255,255,0.3);
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-top: 20px;
            margin-top: 20px;
            flex-shrink: 0;
          }

          .login-logo-wrapper {
            margin-bottom: 15px !important;
          }

          .login-logo-circle {
            padding: 8px !important;
            margin-bottom: 10px !important;
          }

          .login-logo-img {
            width: 55px !important;
            height: 55px !important;
          }

          .login-ecole-text {
            font-size: 0.6rem !important;
            letter-spacing: 0.5px !important;
          }

          .login-title {
            font-size: 1.4rem !important;
            gap: 4px 8px !important;
          }

          .login-subtitle {
            font-size: 0.8rem !important;
            padding-top: 10px !important;
            max-width: 100% !important;
          }

          .login-welcome-title {
            font-size: 1.4rem !important;
          }

          .login-welcome-text {
            font-size: 0.8rem !important;
          }

          .field-input {
            padding: 12px 14px 12px 36px !important;
            font-size: 0.8rem !important;
          }

          .field-icon {
            left: 12px !important;
            top: 12px !important;
          }

          .field-error-message {
            font-size: 0.65rem !important;
          }

          .login-btn {
            padding: 12px !important;
            font-size: 0.8rem !important;
          }

          .login-form-wrapper {
            flex: none !important;
          }
        }

        @media (max-width: 480px) {
          .login-left {
            padding: 20px 15px 15px !important;
          }
          .login-right {
            padding: 20px 15px !important;
          }
          .login-logo-circle {
            padding: 6px !important;
          }
          .login-logo-img {
            width: 45px !important;
            height: 45px !important;
          }
          .login-ecole-text {
            font-size: 0.5rem !important;
          }
          .login-title {
            font-size: 1.1rem !important;
          }
          .login-subtitle {
            font-size: 0.7rem !important;
            padding-top: 8px !important;
          }
          .login-welcome-title {
            font-size: 1.2rem !important;
          }
          .login-welcome-text {
            font-size: 0.8rem !important;
          }
          .field-input {
            padding: 10px 12px 10px 32px !important;
            font-size: 0.75rem !important;
          }
          .field-icon {
            left: 10px !important;
            top: 10px !important;
          }
          .login-btn {
            padding: 10px !important;
            font-size: 0.75rem !important;
          }
          .login-footer-mobile {
            font-size: 0.5rem !important;
            gap: 10px !important;
            padding-top: 15px !important;
            margin-top: 15px !important;
          }
        }

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        
        @keyframes pulseText {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      <div className="login-container">
        {/* Animation de fond */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, ${colors.skyBluePale}33 0%, transparent 50%)`,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 1.5s ease'
        }} />

        {/* ===== PARTIE GAUCHE ===== */}
        <div className="login-left" style={fadeInLeft}>
          <div className="login-left-line" style={{
            transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
            transformOrigin: 'top',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.3s',
          }} />

          <div className="login-left-content">
            <div className="login-logo-wrapper">
              <div className="login-logo-circle" style={scaleIn}>
                <img 
                  src="/logoNoir.png" 
                  alt="Logo EMIT" 
                  className="login-logo-img"
                />
              </div>
              <p className="login-ecole-text" style={fadeInUp}>
                École de Management et d'Innovation Technologique
              </p>
            </div>

            <div style={{ 
              width: '100%',
              marginBottom: '30px',
              ...fadeInUp,
              transitionDelay: '0.5s',
            }}>
              <h2 className="login-title" style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: colors.primary,
                margin: '0 0 10px 0',
                letterSpacing: '-1px',
                lineHeight: 1.2,
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '8px 12px',
                textAlign: 'center',
              }}>
                <span>Vision -</span>
                <span style={{ 
                  color: colors.skyBlueDark,
                  display: 'inline-block',
                  animation: isVisible ? 'pulseText 2s ease-in-out infinite' : 'none'
                }}>Excellence -</span>
                <span>Innovation</span>
              </h2>
              <p className="login-subtitle" style={{
                fontSize: '0.9rem',
                color: colors.textLight,
                margin: '0 auto',
                maxWidth: '420px',
                paddingTop: '20px',
                lineHeight: 1.8,
                textAlign: 'center',
              }}>
                Une plateforme conçue pour l'administration moderne<br />
                et la gestion intelligente des ressources.
              </p>
            </div>
          </div>

          <div className="login-footer-desktop" style={fadeInUp}>
            <span>© {new Date().getFullYear()} EMIT</span>
            <span>•</span>
            <span>Tous droits réservés</span>
          </div>
        </div>

        {/* ===== PARTIE DROITE - FORMULAIRE ===== */}
        <div className="login-right" style={fadeInRight}>
          <div style={{
            position: 'absolute',
            top: '20%',
            right: '10%',
            width: '150px',
            height: '150px',
            border: '1px solid rgba(56, 189, 248, 0.08)',
            borderRadius: '50%',
            transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(180deg)',
            transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.5s',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '25%',
            left: '10%',
            width: '100px',
            height: '100px',
            border: '1px solid rgba(56, 189, 248, 0.06)',
            borderRadius: '50%',
            transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-180deg)',
            transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.7s',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: isVisible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0)',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.3s',
          }} />

          <div className="login-right-content">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              ...fadeInLeft,
              transitionDelay: '0.5s',
            }}>
              <span style={{
                display: 'inline-block',
                width: '40px',
                height: '4px',
                background: colors.skyBlue,
                borderRadius: '2px',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
                transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: '0.6s',
              }} />
              <span style={{
                color: colors.skyBlue,
                fontSize: '0.7rem',
                fontWeight: '500',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(-10px)',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: '0.7s',
              }}>
                Accès privé 
                <span style={{
                  display: 'inline-block',
                  animation: isVisible ? 'float 2s ease-in-out infinite' : 'none',
                  marginLeft: '4px'
                }}>
                  <IconStar />
                </span>
              </span>
            </div>

            <div className="login-form-wrapper">
              <h2 className="login-welcome-title" style={{
                fontSize: '1.6rem',
                fontWeight: '700',
                color: colors.white,
                margin: '0 0 4px 0',
                letterSpacing: '-0.5px',
                fontFamily: "'Inter', sans-serif",
              }}>
                Bienvenue
              </h2>
              <p className="login-welcome-text" style={{
                margin: '0 0 25px 0',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.9rem',
                ...fadeInUp,
                transitionDelay: '0.7s',
              }}>
                Connectez-vous à votre espace
              </p>

              {erreur && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: colors.skyBlueLight,
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  border: `1px solid rgba(56, 189, 248, 0.2)`,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  ...fadeInUp,
                  transitionDelay: '0.5s',
                }}>
                  <IconShield />
                  {erreur}
                </div>
              )}

              <form className="login-form" onSubmit={soumettre}>
                <div style={fadeInUp}>
                  <Field label="Nom">
                    <div className="field-wrapper">
                      <span className="field-icon">
                        <IconUser />
                      </span>
                      <input 
                        ref={nomInputRef}
                        value={loginId} 
                        onChange={handleNomChange}
                        onFocus={handleNomFocus}
                        onBlur={handleNomBlur}
                        onKeyDown={handleNomKeyDown}
                        placeholder="admin" 
                        autoFocus 
                        required
                        className={`field-input ${
                          nomErreur && nomTouched && loginId.trim().length > 0 ? 'field-error-border' :
                          estNomValide && nomTouched ? 'field-success-border' : ''
                        }`}
                      />
                      {nomErreur && nomTouched && loginId.trim().length > 0 && (
                        <div className="field-error-message">
                          <IconWarning />
                          {nomErreur}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

                <div style={fadeInUp}>
                  <Field label="Mot de passe">
                    <div className="field-wrapper">
                      <span className="field-icon">
                        <IconLock />
                      </span>
                      <input 
                        ref={mdpInputRef}
                        type={showPassword ? 'text' : 'password'}
                        value={mdp} 
                        onChange={handleMdpChange}
                        onFocus={handleMdpFocus}
                        onBlur={handleMdpBlur}
                        onKeyDown={handleMdpKeyDown}
                        placeholder="••••••••" 
                        required
                        className={`field-input ${
                          mdpErreur && mdpTouched && mdp.length > 0 ? 'field-error-border' :
                          estMdpValide && mdpTouched ? 'field-success-border' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '14px',
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s ease',
                          borderRadius: '4px',
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => e.target.style.color = colors.skyBlue}
                        onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
                        tabIndex="-1"
                      >
                        {showPassword ? <IconEyeOff /> : <IconEye />}
                      </button>
                      
                      {mdpErreur && mdpTouched && mdp.length > 0 && (
                        <div className="field-error-message">
                          <IconWarning />
                          {mdpErreur}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

                <button 
                  disabled={busy || !estNomValide || !estMdpValide} 
                  className="login-btn"
                  style={{ 
                    width: '100%', 
                    padding: '14px',
                    background: `linear-gradient(135deg, ${colors.skyBlue}, ${colors.skyBlueDark})`,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: (busy || !estNomValide || !estMdpValide) 
                      ? 'not-allowed' 
                      : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: (busy || !estNomValide || !estMdpValide) 
                      ? 0.4 
                      : 1,
                    marginTop: '5px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    position: 'relative',
                    overflow: 'hidden',
                    ...fadeInUp,
                    transitionDelay: '1.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!busy && estNomValide && estMdpValide) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 30px rgba(56, 189, 248, 0.35)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: isVisible && !busy && estNomValide && estMdpValide 
                      ? 'shine 3s ease-in-out infinite' 
                      : 'none'
                  }} />
                  
                  {busy ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '18px',
                        height: '18px',
                        border: '3px solid rgba(255,255,255,0.2)',
                        borderTop: '3px solid #ffffff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      Connexion...
                    </span>
                  ) : 'Se connecter'}
                </button>
              </form>
            </div>

            <div className="login-footer-mobile">
              <span>© {new Date().getFullYear()} EMIT</span>
              <span>•</span>
              <span>Tous droits réservés</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
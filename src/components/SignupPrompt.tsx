import React, { useState } from 'react';
import { User, LogIn, Check, X, Mail } from 'lucide-react';
import { logger } from '../services/logger';
import { transferAnonymousProgressToUser } from '../services/auth';
import { useStore } from '../store';

// Add translations for the signup prompt
const signupTranslations = {
  en: {
    welcomeBack: 'Welcome Back!',
    saveProgress: 'Save Your Progress',
    loginMessage: 'Log in to track your learning progress across all devices.',
    signupMessage: 'Great job on your first quiz! Create an account to save your progress and continue your language journey.',
    noteMessage: 'Note: Creating an account is required to save your progress. Your learning journey will be lost if you continue without an account.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    emailPlaceholder: 'Enter your email address',
    passwordPlaceholder: 'Enter your password',
    loginButton: 'Log In',
    createAccountButton: 'Create Account',
    needAccount: 'Need an account? Sign up',
    alreadyHaveAccount: 'Already have an account? Log in',
    skipButton: 'Skip for now',
    invalidEmail: 'Please enter a valid email address',
    emailVerification: 'Email verification has been temporarily disabled. Please try logging in again.',
    errorOccurred: 'An error occurred'
  },
  ru: {
    welcomeBack: 'С возвращением!',
    saveProgress: 'Сохранить ваш прогресс',
    loginMessage: 'Войдите, чтобы отслеживать свой прогресс обучения на всех устройствах.',
    signupMessage: 'Отличная работа на первом тесте! Создайте аккаунт, чтобы сохранить свой прогресс и продолжить изучение языка.',
    noteMessage: 'Примечание: Создание аккаунта необходимо для сохранения вашего прогресса. Ваш прогресс будет потерян, если вы продолжите без аккаунта.',
    emailLabel: 'Электронная почта',
    passwordLabel: 'Пароль',
    emailPlaceholder: 'Введите адрес электронной почты',
    passwordPlaceholder: 'Введите пароль',
    loginButton: 'Войти',
    createAccountButton: 'Создать аккаунт',
    needAccount: 'Нужен аккаунт? Зарегистрироваться',
    alreadyHaveAccount: 'Уже есть аккаунт? Войти',
    skipButton: 'Пропустить сейчас',
    invalidEmail: 'Пожалуйста, введите действительный адрес электронной почты',
    emailVerification: 'Подтверждение по электронной почте временно отключено. Пожалуйста, попробуйте войти снова.',
    errorOccurred: 'Произошла ошибка'
  },
  es: {
    welcomeBack: '¡Bienvenido de nuevo!',
    saveProgress: 'Guarda tu progreso',
    loginMessage: 'Inicia sesión para seguir tu progreso de aprendizaje en todos tus dispositivos.',
    signupMessage: '¡Excelente trabajo en tu primer cuestionario! Crea una cuenta para guardar tu progreso y continuar tu viaje de aprendizaje de idiomas.',
    noteMessage: 'Nota: Es necesario crear una cuenta para guardar tu progreso. Tu avance en el aprendizaje se perderá si continúas sin una cuenta.',
    emailLabel: 'Correo electrónico',
    passwordLabel: 'Contraseña',
    emailPlaceholder: 'Introduce tu correo electrónico',
    passwordPlaceholder: 'Introduce tu contraseña',
    loginButton: 'Iniciar sesión',
    createAccountButton: 'Crear cuenta',
    needAccount: '¿Necesitas una cuenta? Regístrate',
    alreadyHaveAccount: '¿Ya tienes una cuenta? Inicia sesión',
    skipButton: 'Omitir por ahora',
    invalidEmail: 'Por favor, introduce un correo electrónico válido',
    emailVerification: 'La verificación por correo electrónico está temporalmente desactivada. Por favor, intenta iniciar sesión de nuevo.',
    errorOccurred: 'Se ha producido un error'
  },
  fr: {
    welcomeBack: 'Bon retour !',
    saveProgress: 'Sauvegardez votre progression',
    loginMessage: 'Connectez-vous pour suivre votre progression d\'apprentissage sur tous vos appareils.',
    signupMessage: 'Excellent travail pour votre premier quiz ! Créez un compte pour sauvegarder votre progression et continuer votre parcours d\'apprentissage des langues.',
    noteMessage: 'Remarque : La création d\'un compte est requise pour sauvegarder votre progression. Votre parcours d\'apprentissage sera perdu si vous continuez sans compte.',
    emailLabel: 'Email',
    passwordLabel: 'Mot de passe',
    emailPlaceholder: 'Entrez votre adresse email',
    passwordPlaceholder: 'Entrez votre mot de passe',
    loginButton: 'Se connecter',
    createAccountButton: 'Créer un compte',
    needAccount: 'Besoin d\'un compte ? Inscrivez-vous',
    alreadyHaveAccount: 'Vous avez déjà un compte ? Connectez-vous',
    skipButton: 'Passer pour l\'instant',
    invalidEmail: 'Veuillez entrer une adresse email valide',
    emailVerification: 'La vérification par email est temporairement désactivée. Veuillez réessayer de vous connecter.',
    errorOccurred: 'Une erreur s\'est produite'
  },
  de: {
    welcomeBack: 'Willkommen zurück!',
    saveProgress: 'Speichern Sie Ihren Fortschritt',
    loginMessage: 'Melden Sie sich an, um Ihren Lernfortschritt auf allen Geräten zu verfolgen.',
    signupMessage: 'Gute Arbeit bei Ihrem ersten Quiz! Erstellen Sie ein Konto, um Ihren Fortschritt zu speichern und Ihre Sprachlernreise fortzusetzen.',
    noteMessage: 'Hinweis: Das Erstellen eines Kontos ist erforderlich, um Ihren Fortschritt zu speichern. Ihr Lernfortschritt geht verloren, wenn Sie ohne Konto fortfahren.',
    emailLabel: 'E-Mail',
    passwordLabel: 'Passwort',
    emailPlaceholder: 'Geben Sie Ihre E-Mail-Adresse ein',
    passwordPlaceholder: 'Geben Sie Ihr Passwort ein',
    loginButton: 'Anmelden',
    createAccountButton: 'Konto erstellen',
    needAccount: 'Benötigen Sie ein Konto? Registrieren',
    alreadyHaveAccount: 'Haben Sie bereits ein Konto? Anmelden',
    skipButton: 'Vorerst überspringen',
    invalidEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
    emailVerification: 'Die E-Mail-Verifizierung ist vorübergehend deaktiviert. Bitte versuchen Sie erneut, sich anzumelden.',
    errorOccurred: 'Ein Fehler ist aufgetreten'
  }
  // Add more language translations as needed
};

interface SignupPromptProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onCreateAccount: (email: string, password: string) => Promise<void>;
  onClose: () => void;
  onSkip?: () => void;
}

const SignupPrompt: React.FC<SignupPromptProps> = ({ 
  onLogin, 
  onCreateAccount, 
  onClose,
  onSkip
}) => {
  const { motherLanguage } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get translations based on mother language
  const t = signupTranslations[motherLanguage as keyof typeof signupTranslations] || signupTranslations.en;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!email || !email.includes('@')) {
        throw new Error(t.invalidEmail);
      }
      
      if (isLogin) {
        await onLogin(email, password);
        logger.info('User logged in', { email });
      } else {
        await onCreateAccount(email, password);
        logger.info('User account created', { email });
      }
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : t.errorOccurred;
      
      // Check if the error is related to email confirmation
      if (errorMessage.includes('email_not_confirmed') || errorMessage.includes('email is not confirmed')) {
        errorMessage = t.emailVerification;
      }
      
      setError(errorMessage);
      logger.error('Login/signup error', { message: err instanceof Error ? err.message : 'Unknown error' });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-md p-6 shadow-2xl rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white overflow-hidden relative" style={{ pointerEvents: 'auto' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {isLogin ? t.welcomeBack : t.saveProgress}
          </h2>
          <button 
            onClick={onClose}
            className="rounded-full bg-slate-700 hover:bg-slate-600 h-8 w-8 flex items-center justify-center transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-slate-300">
            {isLogin ? t.loginMessage : t.signupMessage}
          </p>
          
          <p className="text-amber-300 mt-3 text-sm">
            {t.noteMessage}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              {t.emailLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-white"
                placeholder={t.emailPlaceholder}
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LogIn size={16} className="text-slate-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-white"
                placeholder={t.passwordPlaceholder}
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            {isLogin ? t.loginButton : t.createAccountButton}
          </button>
        </form>
        
        <div className="mt-6 text-center border-t border-slate-700 pt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            type="button"
          >
            {isLogin ? t.needAccount : t.alreadyHaveAccount}
          </button>
          
          {onSkip && (
            <button
              onClick={onSkip}
              className="mt-3 w-full py-2 border border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-300 rounded-lg transition-colors text-sm font-medium"
              type="button"
            >
              {t.skipButton}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPrompt; 
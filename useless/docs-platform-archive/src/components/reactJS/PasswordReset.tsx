import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Spinner } from '../ui/spinner';
import { PasswordStrength } from '../ui/password-strength';

// Validation des mots de passe
const validatePassword = (password: string): boolean => {
  // Au moins 8 caractères, une majuscule, un chiffre et un caractère spécial
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
  return passwordRegex.test(password);
};

// Composant pour demander la réinitialisation du mot de passe
export function RequestPasswordReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Réinitialiser les erreurs lors de la modification des champs
  useEffect(() => {
    setEmailError(null);
    setError(null);
  }, [email]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs
    let isValid = true;
    
    if (!email) {
      setEmailError("L'email est requis");
      isValid = false;
    } else {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        setEmailError("Format d'email invalide");
        isValid = false;
      }
    }
    
    if (!isValid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/docs/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      // Succès
      setSuccess(true);
    } catch (err: any) {
      setError("Une erreur s'est produite lors de l'envoi de l'email. Veuillez réessayer.");
      console.error('Password reset request error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert variant="success" className="mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <AlertTitle>Email envoyé !</AlertTitle>
        <AlertDescription>
          Un email de réinitialisation de mot de passe a été envoyé à {email}. Veuillez vérifier votre boîte de réception et suivre les instructions pour réinitialiser votre mot de passe.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleRequestReset} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            error={emailError || undefined}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            }
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Envoi en cours...
            </>
          ) : (
            'Réinitialiser le mot de passe'
          )}
        </Button>
      </form>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Vous vous souvenez de votre mot de passe ?{" "}
          <a href="/docs/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}

// Composant pour réinitialiser le mot de passe
export function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Validation en temps réel
  useEffect(() => {
    if (password && !validatePassword(password)) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial");
    } else {
      setPasswordError(null);
    }
  }, [password]);

  useEffect(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("Les mots de passe ne correspondent pas");
    } else {
      setConfirmPasswordError(null);
    }
  }, [password, confirmPassword]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs
    let isValid = true;
    
    if (!password) {
      setPasswordError("Le mot de passe est requis");
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial");
      isValid = false;
    }
    
    if (!confirmPassword) {
      setConfirmPasswordError("La confirmation du mot de passe est requise");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Les mots de passe ne correspondent pas");
      isValid = false;
    }
    
    if (!isValid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Succès
      setSuccess(true);
      
      // Redirection après 3 secondes
      setTimeout(() => {
        window.location.href = '/docs/login';
      }, 3000);
    } catch (err: any) {
      setError("Une erreur s'est produite lors de la mise à jour du mot de passe. Veuillez réessayer.");
      console.error('Password update error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert variant="success" className="mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <AlertTitle>Mot de passe mis à jour !</AlertTitle>
        <AlertDescription>
          Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError || undefined}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          
          <PasswordStrength password={password} className="mt-2" />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirmer le mot de passe
          </label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPasswordError || undefined}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            }
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Mise à jour en cours...
            </>
          ) : (
            'Mettre à jour le mot de passe'
          )}
        </Button>
      </form>
    </div>
  );
}

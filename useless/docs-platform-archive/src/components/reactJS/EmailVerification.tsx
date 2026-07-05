import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Spinner } from '../ui/spinner';

// Composant pour demander un nouvel email de vérification
export function RequestEmailVerification() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleRequestVerification = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/docs/verify-email`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Succès
      setSuccess(true);
    } catch (err: any) {
      setError("Une erreur s'est produite lors de l'envoi de l'email. Veuillez réessayer.");
      console.error('Email verification request error:', err);
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
          Un nouvel email de vérification a été envoyé à {email}. Veuillez vérifier votre boîte de réception et suivre les instructions pour activer votre compte.
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
      
      <form onSubmit={handleRequestVerification} className="space-y-4">
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
            "Renvoyer l'email de vérification"
          )}
        </Button>
      </form>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Retourner à la{" "}
          <a href="/docs/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
            page de connexion
          </a>
        </p>
      </div>
    </div>
  );
}

// Composant pour afficher le statut de vérification d'email
export function EmailVerificationStatus() {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier le statut de vérification d'email
  React.useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setVerified(true);
        } else {
          setError("La vérification de l'email a échoué ou le lien a expiré. Veuillez demander un nouvel email de vérification.");
        }
      } catch (err) {
        setError("Une erreur s'est produite lors de la vérification de l'email. Veuillez réessayer.");
        console.error('Email verification status error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkVerificationStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Spinner size="lg" className="mb-4" />
        <p className="text-gray-600">Vérification de l'email en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>
          {error}
          <div className="mt-4">
            <a href="/docs/verify-email-request" className="text-white underline">
              Demander un nouvel email de vérification
            </a>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (verified) {
    return (
      <div className="space-y-4">
        <Alert variant="success" className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <AlertTitle>Email vérifié !</AlertTitle>
          <AlertDescription>
            Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter à votre compte.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button
            onClick={() => window.location.href = '/docs/login'}
            className="px-6"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

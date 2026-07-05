import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

// Définir le type pour le contexte d'authentification
type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any | null, user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (password: string) => Promise<{ error: any | null }>;
  refreshSession: () => Promise<void>;
};

// Créer le contexte avec une valeur par défaut
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Durée d'inactivité avant déconnexion automatique (en millisecondes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activityTimer, setActivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Fonction pour réinitialiser le timer d'inactivité
  const resetActivityTimer = () => {
    if (activityTimer) clearTimeout(activityTimer);
    
    const newTimer = setTimeout(() => {
      signOut();
    }, INACTIVITY_TIMEOUT);
    
    setActivityTimer(newTimer);
  };

  // Fonction pour récupérer le profil utilisateur
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Initialiser la session au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Récupérer la session actuelle
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          setUser(session.user);
          const userProfile = await fetchUserProfile(session.user.id);
          setProfile(userProfile);
          resetActivityTimer();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    // Configurer les écouteurs d'événements pour l'activité utilisateur
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleUserActivity = () => {
      if (session) resetActivityTimer();
    };
    
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Configurer l'écouteur pour les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          setProfile(userProfile);
          resetActivityTimer();
        } else {
          setProfile(null);
          if (activityTimer) clearTimeout(activityTimer);
        }
      }
    );
    
    // Nettoyer les écouteurs d'événements
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      
      authListener.subscription.unsubscribe();
      
      if (activityTimer) clearTimeout(activityTimer);
    };
  }, []);

  // Fonction de connexion
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  // Fonction d'inscription
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) return { error, user: null };
      
      if (data?.user) {
        // Créer le profil utilisateur
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              ...userData,
            },
          ]);
          
        if (profileError) return { error: profileError, user: data.user };
      }
      
      return { error: null, user: data?.user || null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error, user: null };
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      
      if (activityTimer) clearTimeout(activityTimer);
      
      // Rediriger vers la page de connexion
      window.location.href = '/docs/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Fonction de réinitialisation de mot de passe
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/docs/reset-password`,
      });
      
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error };
    }
  };

  // Fonction de mise à jour du mot de passe
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      return { error };
    } catch (error) {
      console.error('Error updating password:', error);
      return { error };
    }
  };

  // Fonction pour rafraîchir la session
  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  // Valeur du contexte
  const value = {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

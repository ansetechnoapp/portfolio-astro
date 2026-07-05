import React from 'react';
import { AuthProvider as AuthContextProvider } from '../lib/auth-context';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}

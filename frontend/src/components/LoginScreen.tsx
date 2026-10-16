import React from 'react';
import { User } from '../types';
import { AuthScreen } from './auth/AuthScreen';

interface LoginScreenProps {
  onSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  return <AuthScreen mode="login" onSuccess={onSuccess} />;
};

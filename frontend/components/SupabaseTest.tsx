"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase connection error:', error);
          setConnectionStatus('error');
          setError(error.message);
        } else {
          console.log('Supabase connected successfully:', data);
          setConnectionStatus('connected');
        }
      } catch (err: any) {
        console.error('Network error:', err);
        setConnectionStatus('error');
        setError(err.message || 'Network error');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Supabase Connection Test</h3>
      <div className="flex items-center space-x-2">
        <div 
          className={`w-3 h-3 rounded-full ${
            connectionStatus === 'testing' ? 'bg-yellow-500' :
            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span>
          {connectionStatus === 'testing' && 'Testing connection...'}
          {connectionStatus === 'connected' && 'Connected successfully'}
          {connectionStatus === 'error' && `Connection failed: ${error}`}
        </span>
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</p>
        <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Wifi } from "lucide-react";
import { jurisAPI } from "../lib/juris-api";

export default function BackendConnectionTest() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>("");

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage("");

    try {
      const result = await jurisAPI.healthCheck();
      console.log("Health check result:", result);
      setConnectionStatus('success');
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Card className="border-legal-border rounded-2xl shadow-legal mb-6">
      <CardHeader>
        <CardTitle className="text-legal-dark-text flex items-center">
          <Wifi className="w-5 h-5 mr-2" />
          Backend Connection Test
        </CardTitle>
        <CardDescription className="text-legal-secondary">
          Test connection to the FastAPI backend server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-legal-secondary">Backend URL:</span>
            <code className="text-xs bg-legal-beige px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
            </code>
          </div>
          <Button
            onClick={testConnection}
            disabled={isTestingConnection}
            className="btn-legal-primary"
            size="sm"
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </div>

        {connectionStatus !== 'idle' && (
          <div className="flex items-center space-x-2">
            {connectionStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <Badge variant="outline" className="border-green-600 text-green-600">
                  Connected
                </Badge>
                <span className="text-sm text-legal-secondary">Backend is running and accessible</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <Badge variant="outline" className="border-red-600 text-red-600">
                  Connection Failed
                </Badge>
                <span className="text-sm text-red-600">{errorMessage}</span>
              </>
            )}
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-800 mb-2">Troubleshooting Steps:</h4>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• Ensure the backend server is running: <code>cd backend && python main.py</code></li>
              <li>• Check if port 8000 is available and not blocked by firewall</li>
              <li>• Verify the backend URL in environment variables</li>
              <li>• Check browser console for CORS errors</li>
              <li>• Ensure all backend dependencies are installed: <code>pip install -r requirements.txt</code></li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { testSmtpConnectionAction } from "@/lib/actions";
import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Code } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testSmtpConnectionAction();
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Test Error",
        description: "An unexpected error occurred during testing.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Settings"
        description="Configuration and system health."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                <CardTitle>SMTP Service Status</CardTitle>
              </div>
              <CardDescription>
                Your SMTP settings are currently managed within the application code for enhanced security and deployment consistency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted p-4 border border-dashed text-sm">
                <p className="font-medium mb-2">How to update your settings:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open the file <code>src/lib/actions.ts</code></li>
                  <li>Locate the <code>SMTP_SERVER_CONFIG</code> constant at the top.</li>
                  <li>Update the host, port, user, and password fields.</li>
                  <li>Save the file and the changes will be applied instantly.</li>
                </ol>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="default" 
                  className="w-full sm:w-auto px-8"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying Internal Config...
                    </>
                  ) : "Test Internal SMTP Connection"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Security Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p><strong>Environment Isolation:</strong> Credentials are kept in the server environment and never exposed to the client-side browser.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p><strong>Stable Delivery:</strong> Hardcoded configurations reduce runtime errors caused by missing local storage or browser cache clears.</p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p>Remember to keep your <code>src/lib/actions.ts</code> file secure and avoid committing actual passwords to public repositories.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

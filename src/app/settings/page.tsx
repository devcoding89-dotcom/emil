"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import type { SmtpConfig } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { useAuthGuard } from "@/hooks/use-auth-guard";

const smtpSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().min(1, "Port is required"),
  secure: z.boolean(),
  user: z.string().min(1, "User is required"),
  pass: z.string().min(1, "Password is required"),
});

const defaultSmtpConfig: SmtpConfig = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  pass: "",
};

export default function SettingsPage() {
  useAuthGuard();
  const [smtpConfig, setSmtpConfig] = useLocalStorage<SmtpConfig>(
    "smtp-config",
    defaultSmtpConfig
  );
  const { toast } = useToast();

  const form = useForm<z.infer<typeof smtpSchema>>({
    resolver: zodResolver(smtpSchema),
    defaultValues: smtpConfig,
  });

  function onSubmit(values: z.infer<typeof smtpSchema>) {
    setSmtpConfig(values);
    toast({
      title: "Settings Saved",
      description: "Your SMTP settings have been updated.",
    });
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Settings"
        description="Configure your SMTP service to send emails."
      />
      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="587" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="your-username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password / API Key</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="your-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Use SSL/TLS</FormLabel>
                      <FormDescription>
                        Enable for ports like 465. Disable for 587 (STARTTLS).
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit">Save Settings</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

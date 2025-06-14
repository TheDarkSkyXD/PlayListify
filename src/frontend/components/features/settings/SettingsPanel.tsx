"use client";

import * as React from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@frontend/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@frontend/components/ui/form";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import { Switch } from "@frontend/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frontend/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@frontend/components/ui/card";

const settingsFormSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters.").max(50, "Username must be at most 50 characters."),
  enableDarkMode: z.boolean(),
  notificationPreference: z.enum(["all", "mentions", "none"]),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// Default values for the form
const defaultValues: Partial<SettingsFormValues> = {
  username: "",
  enableDarkMode: false,
  notificationPreference: "all",
};

export function SettingsPanel() {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: SettingsFormValues) {
    console.log("Settings submitted:", data);
    // In a real application, you would handle saving the settings here.
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your application settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="username"
              render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "username"> }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your username" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enableDarkMode"
              render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "enableDarkMode"> }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Dark Mode
                    </FormLabel>
                    <FormDescription>
                      Activate dark theme across the application.
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

            <FormField
              control={form.control}
              name="notificationPreference"
              render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "notificationPreference"> }) => (
                <FormItem>
                  <FormLabel>Notification Preference</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a notification preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Notifications</SelectItem>
                      <SelectItem value="mentions">Only Mentions</SelectItem>
                      <SelectItem value="none">No Notifications</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how you want to be notified.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CardFooter className="flex justify-end px-0">
              <Button type="submit">Save Settings</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
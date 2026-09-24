"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function ClientDetailTabs({
  profile,
  subscription,
  users,
  activity,
  permissions,
}: {
  profile: React.ReactNode;
  subscription: React.ReactNode;
  users: React.ReactNode;
  activity: React.ReactNode;
  permissions: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="profile">Business profile</TabsTrigger>
        <TabsTrigger value="subscription">Subscription & modules</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
        <TabsTrigger value="users">Users & roles</TabsTrigger>
        <TabsTrigger value="activity">Recent activity</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">{profile}</TabsContent>
      <TabsContent value="subscription">{subscription}</TabsContent>
      <TabsContent value="permissions">{permissions}</TabsContent>
      <TabsContent value="users">{users}</TabsContent>
      <TabsContent value="activity">{activity}</TabsContent>
    </Tabs>
  );
}

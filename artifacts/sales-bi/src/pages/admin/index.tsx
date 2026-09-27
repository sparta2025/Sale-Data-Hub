import React from "react";
import { AppLayout } from "@/components/layout";
import { useListUsers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Shield, Activity, Database } from "lucide-react";
import { useAuth } from "@/lib/auth";

const demoUsers = [
  { id: "1", email: "admin@demo.com", firstName: "Admin", lastName: "User", role: "admin", isActive: true, createdAt: new Date().toISOString() },
  { id: "2", email: "sales@demo.com", firstName: "Sales", lastName: "Rep", role: "user", isActive: true, createdAt: new Date().toISOString() },
  { id: "3", email: "analyst@demo.com", firstName: "Data", lastName: "Analyst", role: "user", isActive: false, createdAt: new Date().toISOString() },
];

const statsCards = [
  { label: "Total Users", value: "3", icon: Users, color: "text-blue-600 bg-blue-50" },
  { label: "Active Sessions", value: "1", icon: Activity, color: "text-green-600 bg-green-50" },
  { label: "Datasets", value: "2", icon: Database, color: "text-purple-600 bg-purple-50" },
  { label: "Admin Roles", value: "1", icon: Shield, color: "text-orange-600 bg-orange-50" },
];

export default function AdminPage() {
  const { isDemo, user } = useAuth();
  const canManageUsers = isDemo || user?.role === "admin";
  const { data: usersData } = useListUsers({}, { query: { enabled: canManageUsers && !isDemo, queryKey: ["listUsers"] } as any });
  const displayUsers = isDemo ? demoUsers : (usersData?.users ?? []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {!canManageUsers ? (
          <Card>
            <CardContent className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
              <Shield className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Недостаточно прав</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Админ-панель доступна только пользователям с ролью администратора.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">User management and system overview</p>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {statsCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <div className={`p-2 rounded-lg ${s.color}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                      {u.role}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${u.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isDemo && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Demo Mode</p>
              <p>Log in as admin to manage users, view audit logs, and configure the system.</p>
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

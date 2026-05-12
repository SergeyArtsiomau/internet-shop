"use client";

import { ProtectedGate } from "@/components/auth/protected-gate";
import {
  ProfileCard,
  ChangePasswordSection,
  NameUpdateForm,
  LogOutButton,
} from "@/components/profile/profile-widgets";

export default function ProfilePage() {
  return (
    <ProtectedGate>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <ProfileCard />
        <NameUpdateForm />
        <ChangePasswordSection />
        <LogOutButton />
      </div>
    </ProtectedGate>
  );
}

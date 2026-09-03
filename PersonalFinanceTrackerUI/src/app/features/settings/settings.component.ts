import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import { AuthService } from '../../core/authentication/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header Section -->
      <section class="header-gradient relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white shadow-lg">
        <div class="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div class="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        
        <div class="relative flex items-center gap-4">
          <div class="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
            {{ initials() }}
          </div>
          <div>
            <h2 class="text-2xl font-bold font-display tracking-tight">Settings</h2>
            <p class="mt-1 text-sm text-white/80">Manage your account and preferences</p>
          </div>
        </div>
      </section>

      <!-- Profile Section -->
      <section class="card overflow-hidden">
        <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div class="flex items-center gap-2">
            <div class="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Profile Information</h3>
              <p class="text-xs text-muted">Update your personal details</p>
            </div>
          </div>
        </div>
        <form (submit)="updateProfile($event)" class="p-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</label>
              <input class="input" [(ngModel)]="profileForm.userName" name="userName" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <input class="input" [(ngModel)]="profileForm.email" name="email" type="email" />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number</label>
            <input class="input" [(ngModel)]="profileForm.phoneNumber" name="phoneNumber" />
          </div>
          <div class="flex justify-end pt-2">
            <button type="submit" class="btn-primary shadow-md hover:shadow-lg transition-all duration-200">
              <span class="inline-flex items-center gap-2">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                Save Changes
              </span>
            </button>
          </div>
        </form>
      </section>

      <!-- Change Password Section -->
      <section class="card overflow-hidden">
        <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div class="flex items-center gap-2">
            <div class="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Change Password</h3>
              <p class="text-xs text-muted">Update your account password</p>
            </div>
          </div>
        </div>
        <form (submit)="changePassword($event)" class="p-6 space-y-4 max-w-md">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1.5 block">Current Password</label>
            <input class="input" [(ngModel)]="pwdForm.currentPassword" name="currentPassword" type="password" required />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1.5 block">New Password</label>
            <input class="input" [(ngModel)]="pwdForm.newPassword" name="newPassword" type="password" required />
          </div>
          <button type="submit" class="btn-primary shadow-md hover:shadow-lg transition-all duration-200">
            <span class="inline-flex items-center gap-2">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Update Password
            </span>
          </button>
        </form>
      </section>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  auth = inject(AuthService);
  toast = inject(ToastService);
  profileForm = { userName: '', email: '', phoneNumber: '' };
  pwdForm = { currentPassword: '', newPassword: '' };

  initials() {
    const name = this.auth.user()?.userName ?? 'User';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.profileForm.userName = user.userName;
      this.profileForm.email = user.email;
      this.profileForm.phoneNumber = user.phoneNumber || '';
    }
  }

  updateProfile(e: Event) {
    e.preventDefault();
    this.auth.updateProfile(this.profileForm).subscribe({
      next: () => this.toast.success('Profile updated', 'Your profile has been updated successfully'),
      error: () => this.toast.error('Error', 'Failed to update profile'),
    });
  }

  changePassword(e: Event) {
    e.preventDefault();
    this.auth.changePassword(this.pwdForm).subscribe({
      next: () => {
        this.toast.success('Password changed', 'Your password has been updated');
        this.pwdForm = { currentPassword: '', newPassword: '' };
      },
      error: (err) => this.toast.error('Error', err?.error?.message || 'Failed to change password'),
    });
  }
}
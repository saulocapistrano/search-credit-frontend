import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserRoleService, UserRole } from '../../../core/services/user-role.service';

@Component({
  selector: 'app-user-profile-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile-selector.component.html',
  styleUrl: './user-profile-selector.component.scss'
})
export class UserProfileSelectorComponent implements OnInit, OnDestroy {
  private readonly userRoleService = inject(UserRoleService);
  private roleSubscription?: Subscription;

  selectedRole: UserRole = this.userRoleService.getRole();
  roles: { value: UserRole; label: string }[] = [
    { value: 'admin-full', label: 'Admin Full' },
    { value: 'admin-consulta', label: 'Admin Consulta' },
    { value: 'admin-solicitacao', label: 'Admin Solicitação' }
  ];

  ngOnInit(): void {
    this.roleSubscription = this.userRoleService.role$.subscribe(role => {
      this.selectedRole = role;
    });
  }

  ngOnDestroy(): void {
    this.roleSubscription?.unsubscribe();
  }

  onRoleChange(): void {
    this.userRoleService.setRole(this.selectedRole);
  }
}


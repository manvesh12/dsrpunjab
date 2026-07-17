import React from 'react';
import { UserList } from '../../features/users/components/UserList';

export default function UsersPage() {
  return (
    <div style={{ padding: '24px', height: '100%', boxSizing: 'border-box', backgroundColor: '#f3f4f6' }}>
      <UserList />
    </div>
  );
}

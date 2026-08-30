import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../store/authStore';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => useAuthStore.setState({ user: null, token: null, _hasHydrated: true }));
  it('redirects anonymous users to login', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><Routes><Route path="/login" element={<div>Login page</div>}/><Route path="/dashboard" element={<ProtectedRoute><div>Private</div></ProtectedRoute>}/></Routes></MemoryRouter>);
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
  it('allows a user with an accepted role', () => {
    useAuthStore.setState({ token: 'token', user: { id:'1',email:'admin@test.tn',firstName:'Admin',lastName:'Test',role:'ADMIN' } });
    render(<MemoryRouter><ProtectedRoute allowedRoles={['ADMIN']}><div>Dashboard</div></ProtectedRoute></MemoryRouter>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});

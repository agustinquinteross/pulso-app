'use server';

import { cookies } from 'next/headers';

export async function loginAction(formData) {
  'use server';

  const token = formData.get('token');
  const actualToken = process.env.ADMIN_TOKEN;

  if (token === actualToken) {
    const cookieStore = await cookies();
    cookieStore.set('admin_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return { success: true };
  } else {
    return { success: false, error: 'Token incorrecto.' };
  }
}

export async function logoutAction() {
  'use server';
  
  const cookieStore = await cookies();
  cookieStore.delete('admin_auth');
  return { success: true };
}

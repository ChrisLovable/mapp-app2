# Authentication Setup Guide

This guide will help you set up email authentication for your myAIpartner application.

## Prerequisites

- A Supabase project
- Access to your Supabase dashboard

## Step 1: Enable Email Authentication

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** → **Providers**

2. **Enable Email Provider**
   - Find the **Email** provider in the list
   - Toggle it **ON**
   - Configure the following settings:
     - **Enable email confirmations**: `ON` (recommended)
     - **Enable secure email change**: `ON`
     - **Enable double confirm changes**: `ON` (recommended)

## Step 2: Configure Email Templates

1. **Go to Authentication → Email Templates**
2. **Customize the following templates**:

### Confirmation Email
```
Subject: Confirm your email address

Hi there,

Please confirm your email address by clicking the link below:

[Confirm Email Address]

If you didn't create an account, you can safely ignore this email.

Thanks,
myAIpartner Team
```

### Magic Link Email
```
Subject: Sign in to myAIpartner

Hi there,

Click the link below to sign in to your account:

[Sign In]

This link will expire in 24 hours.

Thanks,
myAIpartner Team
```

### Change Email Address
```
Subject: Confirm your new email address

Hi there,

Please confirm your new email address by clicking the link below:

[Confirm New Email Address]

If you didn't request this change, you can safely ignore this email.

Thanks,
myAIpartner Team
```

## Step 3: Configure Site URL

1. **Go to Authentication → Settings**
2. **Set your site URL**:
   - **Development**: `http://localhost:5173`
   - **Production**: `https://yourdomain.com`
3. **Add redirect URLs**:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/auth/reset-password`
   - `https://yourdomain.com/auth/callback` (for production)
   - `https://yourdomain.com/auth/reset-password` (for production)

## Step 4: Test Authentication

1. **Start your development servers**:
   ```bash
   # Frontend
   npm run dev
   
   # Backend
   cd backend
   npm run dev
   ```

2. **Test the sign-up flow**:
   - Open your app in the browser
   - Click "Sign In / Sign Up"
   - Create a new account with your email
   - Check your email for the confirmation link
   - Click the link to verify your account

3. **Test the sign-in flow**:
   - Sign out
   - Sign in with your credentials
   - Verify you can access the app features

## Step 5: Database Security

1. **Run the secure RLS policies**:
   - Go to your Supabase SQL Editor
   - Run the `secure_rls_policies.sql` script
   - This ensures users can only access their own data

2. **Verify the policies**:
   ```sql
   -- Check that RLS is enabled on all tables
   SELECT 
       schemaname,
       tablename,
       rowsecurity
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN (
       'expense_tracker',
       'todos', 
       'shopping_items',
       'info_vault',
       'calendar_events',
       'user_comments',
       'diary_entries',
       'meeting_recordings'
   );
   ```

## Step 6: Production Setup

### Environment Variables

Ensure your production environment has these variables:

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Backend (.env)
DATABASE_URL=your_database_url_here
JWT_SECRET=your_jwt_secret_here
```

### Update Site URL

1. **Go to Authentication → Settings**
2. **Update the site URL** to your production domain
3. **Add production redirect URLs**

### Email Provider (Optional)

For production, consider using a custom email provider:

1. **Go to Authentication → Email Templates**
2. **Configure SMTP settings**:
   - **SMTP Host**: Your email provider's SMTP server
   - **SMTP Port**: Usually 587 or 465
   - **SMTP User**: Your email username
   - **SMTP Pass**: Your email password
   - **Sender Name**: "myAIpartner"
   - **Sender Email**: "noreply@yourdomain.com"

## Troubleshooting

### Common Issues

1. **"User not authenticated" errors**:
   - Check that the user is signed in
   - Verify the user has confirmed their email
   - Check the browser console for auth errors

2. **Database permission errors**:
   - Ensure RLS policies are correctly applied
   - Check that the user_id column exists in all tables
   - Verify the user is authenticated before database operations

3. **Email not received**:
   - Check spam folder
   - Verify email templates are configured
   - Check SMTP settings if using custom provider

4. **Redirect errors**:
   - Verify redirect URLs are correctly configured
   - Check that the site URL matches your domain
   - Ensure HTTPS is used in production

### Debug Commands

```sql
-- Check user authentication status
SELECT auth.uid();

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if user can access their data
SELECT * FROM expense_tracker WHERE user_id = auth.uid();
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Enable email confirmation for new accounts**
3. **Use strong passwords** (enforce minimum requirements)
4. **Regularly rotate API keys**
5. **Monitor authentication logs** in Supabase dashboard
6. **Implement rate limiting** for auth endpoints
7. **Use environment variables** for all secrets

## Next Steps

After setting up authentication:

1. **Test all features** with authenticated users
2. **Set up Google OAuth** (optional)
3. **Configure user profiles** (optional)
4. **Implement role-based access** (if needed)
5. **Set up monitoring** for auth events

## Support

If you encounter issues:

1. Check the Supabase documentation
2. Review the authentication logs in your dashboard
3. Test with a fresh browser session
4. Verify all environment variables are set correctly
5. Check the browser console for error messages 
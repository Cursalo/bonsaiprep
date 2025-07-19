import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'next_auth',
    },
  }
)

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: Number(process.env.EMAIL_SERVER_PORT!),
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM!,
      maxAge: 24 * 60 * 60, // 24 hours
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    encode: async ({ secret, token }) => {
      const encodedToken = jwt.sign(token!, secret, {
        algorithm: 'HS256',
      })
      return encodedToken
    },
    decode: async ({ secret, token }) => {
      try {
        const decodedToken = jwt.verify(token!, secret, {
          algorithms: ['HS256'],
        })
        return decodedToken as any
      } catch (error) {
        console.error('JWT decode error:', error)
        return null
      }
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding',
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Allow all sign-ins for now, but you can add custom logic here
      if (account?.provider === 'email') {
        return true
      }
      
      if (account?.provider === 'google' || account?.provider === 'github') {
        // Check if user exists in our system
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email!)
          .single()

        if (!existingUser) {
          // Create user profile in our public.users table
          const { error } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.name || profile?.name,
              avatar_url: user.image || profile?.image,
            })

          if (error) {
            console.error('Error creating user profile:', error)
            return false
          }

          // Initialize user credits
          await supabase
            .from('user_credits')
            .insert({
              user_id: user.id,
              total_earned: 100,
              current_balance: 100,
            })

          // Initialize user preferences
          await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
            })

          // Initialize user streaks
          await supabase
            .from('user_streaks')
            .insert({
              user_id: user.id,
            })
        }
        return true
      }

      return true
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
      }

      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }

      // Fetch additional user data from our database
      if (token.email) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select(`
              *,
              user_credits (
                current_balance,
                level
              ),
              user_preferences (
                theme,
                language,
                mentor_personality
              )
            `)
            .eq('email', token.email)
            .single()

          if (userData) {
            token.user = {
              id: userData.id,
              email: userData.email,
              full_name: userData.full_name,
              avatar_url: userData.avatar_url,
              credits: userData.user_credits?.current_balance || 0,
              level: userData.user_credits?.level || 1,
              theme: userData.user_preferences?.theme || 'auto',
              language: userData.user_preferences?.language || 'es',
              mentor_personality: userData.user_preferences?.mentor_personality || 'friendly',
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token.user) {
        session.user = {
          ...session.user,
          ...token.user,
        }
      }

      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl + '/dashboard'
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', { user: user.email, provider: account?.provider, isNewUser })
      
      if (isNewUser) {
        // Send welcome notification
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              title: '¡Bienvenido a AIClases! 🎉',
              message: 'Has recibido 100 créditos de bienvenida para comenzar tu viaje de aprendizaje en IA.',
              type: 'credit',
              action_url: '/dashboard',
              metadata: {
                credits_awarded: 100,
                welcome_bonus: true,
              },
            })
        } catch (error) {
          console.error('Error sending welcome notification:', error)
        }
      }
    },
    async signOut({ session, token }) {
      console.log('User signed out:', session?.user?.email)
    },
    async createUser({ user }) {
      console.log('New user created:', user.email)
    },
    async updateUser({ user }) {
      console.log('User updated:', user.email)
    },
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('Auth Error:', code, metadata)
    },
    warn(code) {
      console.warn('Auth Warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Auth Debug:', code, metadata)
      }
    },
  },
}
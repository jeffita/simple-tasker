
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events"
          ].join(" ")
        }
      }
    }),
  ],
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      const extendedToken = token;
      if (account) {
        // Persist the access_token and refresh_token to the token right after signin
        extendedToken.accessToken = account.access_token;
        extendedToken.refreshToken = account.refresh_token;
      }
      return extendedToken;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      const extendedSession = session;
      const extendedToken = token;
      extendedSession.accessToken = extendedToken.accessToken;
      return extendedSession;
    }
  }
};

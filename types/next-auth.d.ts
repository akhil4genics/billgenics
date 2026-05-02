import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    firstName: string;
    adminUser?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      firstName: string;
      adminUser?: boolean;
    };
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    firstName: string;
    adminUser?: boolean;
    accessToken: string;
  }
}

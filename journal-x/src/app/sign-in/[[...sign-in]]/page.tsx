import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <SignIn appearance={{
        elements: {
          rootBox: 'mx-auto',
          card: 'bg-[#12121a] border border-[#2a2a3e]',
        }
      }} />
    </div>
  );
}

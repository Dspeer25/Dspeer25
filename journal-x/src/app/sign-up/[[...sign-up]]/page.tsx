import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <SignUp appearance={{
        elements: {
          rootBox: 'mx-auto',
          card: 'bg-[#12121a] border border-[#2a2a3e]',
        }
      }} />
    </div>
  );
}
